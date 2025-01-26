import { ApiClient } from './api-client';
import { CreateRuneOrderDto, RuneOrder, CreateBatchRuneOrderDto, TokenBalance, Transaction } from '../types/api';
import { AVAILABLE_TOKENS } from '../constants/runes';

export class MockApiClient implements ApiClient {
  private orders: RuneOrder[] = [
    {
      id: '1',
      rune: 'DOG',
      quantity: '1000',
      price: '100',
      type: 'ask',
      filledAmount: 400,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      rune: 'LIQUIDIUM',
      quantity: '500',
      price: '200',
      type: 'bid',
      filledAmount: 250,
      createdAt: new Date().toISOString()
    }
  ];

  private transactions: Transaction[] = [
    {
      id: 'tx1',
      orderId: '1',
      rune: 'DOG',
      amount: '100',
      price: '100',
      type: 'ask',
      status: 'pending',
      createdAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      updatedAt: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: 'tx2',
      orderId: '2',
      rune: 'LIQUIDIUM',
      amount: '50',
      price: '200',
      type: 'bid',
      status: 'pending',
      createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      updatedAt: new Date(Date.now() - 30000).toISOString()
    }
  ];

  private tokenBalances: TokenBalance[] = AVAILABLE_TOKENS.map(token => ({
    symbol: token.symbol,
    balance: (Math.random() * (token.symbol === 'BTC' ? 1 : 1000)).toFixed(token.decimals),
    walletAddress: `bc1${Array(40).fill(0).map(() => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`
  }));

  async createOrder(order: CreateRuneOrderDto): Promise<void> {
    await this.delay(500);
    const newOrder = {
      ...order,
      id: (this.orders.length + 1).toString(),
      filledAmount: 0,
      createdAt: new Date().toISOString()
    };
    this.orders.push(newOrder);
  }

  async getOrders(): Promise<RuneOrder[]> {
    await this.delay(500);
    this.updateFilledAmounts();
    return [...this.orders];
  }

  async getOrderById(orderId: string): Promise<RuneOrder> {
    await this.delay(500);
    const order = this.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async createBatchOrders(batchOrders: CreateBatchRuneOrderDto): Promise<void> {
    for (const order of batchOrders.orders) {
      await this.createOrder(order);
    }
  }

  async getTokenBalances(): Promise<TokenBalance[]> {
    await this.delay(500);
    this.updateBalances();
    return [...this.tokenBalances];
  }

  async getTransactions(): Promise<Transaction[]> {
    await this.delay(500);
    this.updateTransactions();
    return [...this.transactions];
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    await this.delay(500);
    return this.transactions.filter(tx => tx.status === 'pending');
  }

  async getPendingTransactionById(id: string): Promise<Transaction> {
    await this.delay(500);
    const transaction = this.transactions.find(tx => tx.id === id && tx.status === 'pending');
    if (!transaction) throw new Error('Pending transaction not found');
    return transaction;
  }

  async deletePendingTransaction(id: string): Promise<void> {
    await this.delay(500);
    const index = this.transactions.findIndex(tx => tx.id === id && tx.status === 'pending');
    if (index !== -1) {
      this.transactions.splice(index, 1);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateFilledAmounts(): void {
    this.orders = this.orders.map(order => ({
      ...order,
      filledAmount: Math.min(
        (order.filledAmount || 0) + Math.floor(Math.random() * 10),
        parseInt(order.quantity)
      )
    }));
  }

  private updateBalances(): void {
    this.tokenBalances = this.tokenBalances.map(balance => {
      const token = AVAILABLE_TOKENS.find(t => t.symbol === balance.symbol);
      if (!token) return balance;

      const currentBalance = parseFloat(balance.balance);
      const change = (Math.random() - 0.5) * (token.symbol === 'BTC' ? 0.01 : 10);
      const newBalance = Math.max(0, currentBalance + change);

      return {
        ...balance,
        balance: newBalance.toFixed(token.decimals)
      };
    });
  }

  private updateTransactions(): void {
    // Randomly update transaction statuses
    this.transactions = this.transactions.map(tx => {
      if (tx.status === 'pending' && Math.random() < 0.2) {
        return {
          ...tx,
          status: Math.random() < 0.9 ? 'completed' : 'failed',
          updatedAt: new Date().toISOString()
        };
      }
      return tx;
    });

    // Add new transactions for orders being filled
    this.orders.forEach(order => {
      if (Math.random() < 0.3) { // 30% chance to create a new transaction
        const amount = Math.floor(Math.random() * 100).toString();
        const newTx: Transaction = {
          id: `tx${this.transactions.length + 1}`,
          orderId: order.id!,
          rune: order.rune,
          amount,
          price: order.price,
          type: order.type,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.transactions.unshift(newTx);
      }
    });

    // Keep only the last 10 transactions
    this.transactions = this.transactions.slice(0, 10);
  }
}