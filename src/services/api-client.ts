import { CreateRuneOrderDto, RuneOrder, CreateBatchRuneOrderDto, TokenBalance, Transaction, UserSettings } from '../types/api';

export interface ApiClient {
  createOrder(order: CreateRuneOrderDto): Promise<void>;
  getOrders(): Promise<RuneOrder[]>;
  getOrderById(orderId: string): Promise<RuneOrder>;
  createBatchOrders(orders: CreateBatchRuneOrderDto): Promise<void>;
  getTokenBalances(): Promise<TokenBalance[]>;
  getTransactions(): Promise<Transaction[]>;
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: UserSettings): Promise<void>;
}

export class HttpApiClient implements ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async createOrder(order: CreateRuneOrderDto): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to create order');
  }

  async getOrders(): Promise<RuneOrder[]> {
    const response = await fetch(`${this.baseUrl}/orders`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  }

  async getOrderById(orderId: string): Promise<RuneOrder> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`);
    if (!response.ok) throw new Error('Order not found');
    return response.json();
  }

  async createBatchOrders(orders: CreateBatchRuneOrderDto): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders),
    });
    if (!response.ok) throw new Error('Failed to create batch orders');
  }

  async getTokenBalances(): Promise<TokenBalance[]> {
    const response = await fetch(`${this.baseUrl}/account/balance`);
    if (!response.ok) throw new Error('Failed to fetch token balances');
    return response.json();
  }

  async getTransactions(): Promise<Transaction[]> {
    const response = await fetch(`${this.baseUrl}/transactions`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  }

  async getSettings(): Promise<UserSettings> {
    const response = await fetch(`${this.baseUrl}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  }

  async updateSettings(settings: UserSettings): Promise<void> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
  }
}