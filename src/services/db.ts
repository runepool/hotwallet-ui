import { RuneOrder, TokenBalance } from '../types/api';
import { AVAILABLE_TOKENS } from '../constants/runes';

class InMemoryDB {
  private orders: RuneOrder[] = [
    {
      id: '1',
      rune: 'DOG',
      quantity: '1000',
      price: '100',
      type: 'ask',
      filledQuantity: 400,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      rune: 'LIQUIDIUM',
      quantity: '500',
      price: '200',
      type: 'bid',
      filledQuantity: 250,
      createdAt: new Date().toISOString()
    }
  ];

  private tokenBalances: TokenBalance[] = AVAILABLE_TOKENS.map(token => ({
    symbol: token.symbol,
    balance: (Math.random() * (token.symbol === 'BTC' ? 1 : 1000)).toFixed(token.decimals),
    usdValue: Math.random() * (token.symbol === 'BTC' ? 50000 : 1000)
  }));

  createOrder(order: RuneOrder): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOrder = {
          ...order,
          id: (this.orders.length + 1).toString(),
          filledQuantity: 0,
          createdAt: new Date().toISOString()
        };
        this.orders.push(newOrder);
        resolve();
      }, 500);
    });
  }

  getOrders(): Promise<RuneOrder[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Update filled amounts periodically
        this.orders = this.orders.map(order => ({
          ...order,
          filledQuantity: Math.min(
            (order.filledQuantity || 0) + Math.floor(Math.random() * 10),
            parseInt(order.quantity)
          )
        }));
        resolve([...this.orders]);
      }, 500);
    });
  }

  getOrderById(id: string): Promise<RuneOrder | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const order = this.orders.find(o => o.id === id);
        resolve(order || null);
      }, 500);
    });
  }

  getTokenBalances(): Promise<TokenBalance[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Randomly update balances to simulate market activity
        this.tokenBalances = this.tokenBalances.map(balance => {
          const token = AVAILABLE_TOKENS.find(t => t.symbol === balance.symbol);
          if (!token) return balance;

          const currentBalance = parseFloat(balance.balance);
          const change = (Math.random() - 0.5) * (token.symbol === 'BTC' ? 0.01 : 10);
          const newBalance = Math.max(0, currentBalance + change);

          return {
            ...balance,
            balance: newBalance.toFixed(token.decimals),
            usdValue: Math.max(0, balance.usdValue + (Math.random() - 0.5) * (token.symbol === 'BTC' ? 1000 : 100))
          };
        });
        resolve([...this.tokenBalances]);
      }, 500);
    });
  }
}

export const db = new InMemoryDB();