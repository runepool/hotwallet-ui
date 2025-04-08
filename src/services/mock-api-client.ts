import { ApiClient } from './api-client';
import { CreateRuneOrderDto, RuneOrder, CreateBatchRuneOrderDto, TokenBalance, Transaction, TransactionStatus } from '../types/api';
import { AVAILABLE_TOKENS } from '../constants/runes';

export class MockApiClient implements ApiClient {
  private hasPassword = false;
  private bitcoinPrivateKey: string | null = null;
  private orders: RuneOrder[] = [
    {
      id: '1',
      rune: 'DOG',
      quantity: '1000',
      price: '100',
      type: 'ask',
      filledQuantity: '400',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      rune: 'LIQUIDIUM',
      quantity: '500',
      price: '200',
      type: 'bid',
      filledQuantity: '250',
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
      type: 'sell',
      status: TransactionStatus.CONFIRMING,
      txid: '123abc',
      createdAt: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      updatedAt: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: 'tx2',
      orderId: '2',
      rune: 'LIQUIDIUM',
      amount: '50',
      price: '200',
      type: 'buy',
      status: TransactionStatus.CONFIRMED,
      txid: '456def',
      createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      updatedAt: new Date(Date.now() - 30000).toISOString()
    }
  ];

  private tokenBalances: TokenBalance[] = AVAILABLE_TOKENS.map(token => ({
    token: token.symbol,
    balance: (Math.random() * (token.symbol === 'BTC' ? 1 : 1000)).toFixed(token.decimals),
    address: `bc1${Array(40).fill(0).map(() => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`,
    decimals: token.decimals
  }));

  async createOrder(order: CreateRuneOrderDto): Promise<void> {
    await this.delay(500);
    const newOrder = {
      ...order,
      id: (this.orders.length + 1).toString(),
      filledQuantity: '0',
      createdAt: new Date().toISOString()
    };
    this.orders.push(newOrder);
  }

  async getOrders(): Promise<RuneOrder[]> {
    await this.delay(500);
    this.updatefilledQuantitys();
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
    return this.transactions.filter(tx => tx.status === TransactionStatus.CONFIRMING);
  }

  async getPendingTransactionById(id: string): Promise<Transaction> {
    await this.delay(500);
    const transaction = this.transactions.find(tx => tx.id === id && tx.status === TransactionStatus.CONFIRMING);
    if (!transaction) throw new Error('Pending transaction not found');
    return transaction;
  }

  async deletePendingTransaction(id: string): Promise<void> {
    await this.delay(500);
    const index = this.transactions.findIndex(tx => tx.id === id && tx.status === TransactionStatus.CONFIRMING);
    if (index !== -1) {
      this.transactions.splice(index, 1);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updatefilledQuantitys(): void {
    this.orders = this.orders.map(order => ({
      ...order,
      filledQuantity: (parseInt(order.filledQuantity || '0') + Math.floor(Math.random() * 10)).toString(),
    }));
  }

  private updateBalances(): void {
    this.tokenBalances = this.tokenBalances.map(balance => {
      const token = AVAILABLE_TOKENS.find(t => t.symbol === balance.token);
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
      if (tx.status === TransactionStatus.CONFIRMING && Math.random() < 0.2) {
        return {
          ...tx,
          status: Math.random() < 0.9 ? TransactionStatus.CONFIRMED : TransactionStatus.ERRORED,
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
          type: order.type === 'ask' ? 'sell' : 'buy',
          status: TransactionStatus.CONFIRMING,
          txid: `txid${this.transactions.length + 1}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.transactions.unshift(newTx);
      }
    });

    // Keep only the last 10 transactions
    this.transactions = this.transactions.slice(0, 10);
  }

  // Password management methods
  async getWalletAddress(): Promise<string> {
    await this.delay(300);
    return 'bc1qmockwalletaddress123456789abcdefg';
  }

  async setupPassword(password: string, bitcoinPrivateKey?: string, oldPassword?: string): Promise<void> {
    await this.delay(500);
    
    // If we have a password set and we're changing it, validate old password
    if (this.hasPassword && !oldPassword) {
      throw new Error('Old password is required when changing password');
    }
    
    // In a real implementation, we would use the password to encrypt the private key
    // For the mock, we just validate it's not empty
    if (!password) {
      throw new Error('Password cannot be empty');
    }
    
    // Store the bitcoin private key if provided
    if (bitcoinPrivateKey) {
      this.bitcoinPrivateKey = bitcoinPrivateKey;
    }
    
    // Set the password flag
    this.hasPassword = true;
    
    console.log('Password setup successful with password:', password.substring(0, 1) + '*'.repeat(password.length - 1));
  }

  async unlockWallet(password: string): Promise<boolean> {
    await this.delay(300);
    
    // In mock implementation, always return true unless empty password
    if (!password) {
      return false;
    }
    
    return true;
  }
  
  async isLoggedIn(): Promise<boolean> {
    await this.delay(200);
    // In mock implementation, return the hasPassword flag
    return this.hasPassword;
  }
  
  async logout(): Promise<boolean> {
    await this.delay(200);
    // In mock implementation, reset the password state
    this.hasPassword = false;
    return true;
  }

  async hasWalletConfiguration(): Promise<boolean> {
    await this.delay(200);
    return this.bitcoinPrivateKey !== null;
  }
  
  async getSettings(): Promise<any> {
    await this.delay(300);
    return {
      bitcoinPrivateKey: this.bitcoinPrivateKey ? 'xxx' : '',
      ordUrl: 'http://localhost:8080',
      websocketUrl: 'wss://ws.runepool.org',
      hasPassword: this.hasPassword
    };
  }
  
  async updateSettings(settings: any): Promise<void> {
    await this.delay(300);
    // Mock implementation - just log the settings update
    console.log('Settings updated:', settings);
  }
  
  async deleteOrder(orderId: string): Promise<void> {
    await this.delay(300);
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this.orders.splice(index, 1);
    }
  }
  
  async getLiquidityHealth(): Promise<any> {
    await this.delay(300);
    return {
      totalOutputs: 25,
      availableOutputs: 18,
      reservedOutputs: 7,
      status: 'healthy'
    };
  }
  
  async splitAsset(): Promise<void> {
    await this.delay(500);
    console.log('Asset split requested');
  }
  
  async setAutoSplitConfig(): Promise<void> {
    await this.delay(300);
    console.log('Auto split config set');
  }
  
  async getAutoSplitConfig(): Promise<any> {
    await this.delay(300);
    return {
      assetName: 'DOG',
      enabled: true,
      threshold: 5,
      targetCount: 10
    };
  }
  
  async getAllAutoSplitConfigs(): Promise<any[]> {
    await this.delay(300);
    return [
      {
        assetName: 'DOG',
        enabled: true,
        threshold: 5,
        targetCount: 10
      },
      {
        assetName: 'LIQUIDIUM',
        enabled: false,
        threshold: 3,
        targetCount: 8
      }
    ];
  }
  
  async deleteAutoSplitConfig(): Promise<void> {
    await this.delay(300);
    console.log('Auto split config deleted');
  }
  
  async updateAutoRebalancing(): Promise<void> {
    await this.delay(300);
    console.log('Auto rebalancing updated');
  }
  
  async getAutoRebalancing(): Promise<any> {
    await this.delay(300);
    return {
      enabled: true,
      spread: '0.5'
    };
  }
  
  async getActiveOrders(asset?: string): Promise<RuneOrder[]> {
    await this.delay(300);
    if (asset) {
      return this.orders.filter(o => o.rune === asset);
    }
    return [...this.orders];
  }
}