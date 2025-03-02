import { CreateRuneOrderDto, RuneOrder, CreateBatchRuneOrderDto, TokenBalance, Transaction, UserSettings, OutputsHealth, SplitAssetRequest, AutoSplitConfig, AutoRebalancingSettings } from '../types/api';

export interface ApiClient {
  createOrder(order: CreateRuneOrderDto): Promise<void>;
  getOrders(): Promise<RuneOrder[]>;
  getOrderById(orderId: string): Promise<RuneOrder>;
  createBatchOrders(orders: CreateBatchRuneOrderDto): Promise<void>;
  getTokenBalances(): Promise<TokenBalance[]>;
  getTransactions(): Promise<Transaction[]>;
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: UserSettings): Promise<void>;
  getPendingTransactions(): Promise<Transaction[]>;
  getPendingTransactionById(id: string): Promise<Transaction>;
  deletePendingTransaction(id: string): Promise<void>;
  deleteOrder(orderId: string): Promise<void>;
  getLiquidityHealth(): Promise<OutputsHealth>;
  splitAsset(request: SplitAssetRequest): Promise<void>;
  setAutoSplitConfig(config: AutoSplitConfig): Promise<void>;
  getAutoSplitConfig(assetName: string): Promise<AutoSplitConfig>;
  getAllAutoSplitConfigs(): Promise<AutoSplitConfig[]>;
  deleteAutoSplitConfig(assetName: string): Promise<void>;
  updateAutoRebalancing(asset: string, settings: AutoRebalancingSettings): Promise<void>;
  getAutoRebalancing(asset: string): Promise<AutoRebalancingSettings>;
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
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse orders data');
    }
  }

  async getOrderById(orderId: string): Promise<RuneOrder> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`);
    if (!response.ok) throw new Error('Order not found');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse order data');
    }
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
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse token balances data');
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    const response = await fetch(`${this.baseUrl}/transactions`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse transactions data');
    }
  }

  async getSettings(): Promise<UserSettings> {
    const response = await fetch(`${this.baseUrl}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse settings data');
    }
  }

  async updateSettings(settings: UserSettings): Promise<void> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    const response = await fetch(`${this.baseUrl}/pending-transactions`);
    if (!response.ok) throw new Error('Failed to fetch pending transactions');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse pending transactions data');
    }
  }

  async getPendingTransactionById(id: string): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/pending-transactions/${id}`);
    if (!response.ok) throw new Error('Failed to fetch pending transaction');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse pending transaction data');
    }
  }

  async deletePendingTransaction(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/pending-transactions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete pending transaction');
  }

  async deleteOrder(orderId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete order');
  }

  async getLiquidityHealth(): Promise<OutputsHealth> {
    const response = await fetch(`${this.baseUrl}/account/liquidity-health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get liquidity health: ${response.statusText}`);
    }

    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse liquidity health data');
    }
  }

  async splitAsset(request: SplitAssetRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/account/split-asset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to split asset: ${response.statusText}`);
    }
  }

  async setAutoSplitConfig(config: AutoSplitConfig): Promise<void> {
    const response = await fetch(`${this.baseUrl}/account/auto-split`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Failed to set auto-split configuration');
  }

  async getAutoSplitConfig(assetName: string): Promise<AutoSplitConfig> {
    const response = await fetch(`${this.baseUrl}/account/auto-split/${encodeURIComponent(assetName)}`);
    if (!response.ok) throw new Error('Failed to get auto-split configuration');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse auto-split configuration data');
    }
  }

  async getAllAutoSplitConfigs(): Promise<AutoSplitConfig[]> {
    const response = await fetch(`${this.baseUrl}/account/auto-split`);
    if (!response.ok) throw new Error('Failed to get auto-split configurations');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse auto-split configurations data');
    }
  }

  async deleteAutoSplitConfig(assetName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auto-split/${assetName}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete auto-split config');
  }

  async updateAutoRebalancing(asset: string, settings: AutoRebalancingSettings): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auto-rebalancing/${asset}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update auto-rebalancing settings');
  }

  async getAutoRebalancing(asset: string): Promise<AutoRebalancingSettings> {
    const response = await fetch(`${this.baseUrl}/auto-rebalancing/${asset}`);
    if (!response.ok) throw new Error('Failed to fetch auto-rebalancing settings');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse auto-rebalancing settings data');
    }
  }
}