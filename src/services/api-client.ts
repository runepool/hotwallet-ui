import { CreateRuneOrderDto, RuneOrder, CreateBatchRuneOrderDto, TokenBalance, Transaction, UserSettings, OutputsHealth, SplitAssetRequest, AutoSplitConfig, AutoRebalancingSettings } from '../types/api';
import ECPairFactory from 'ecpair';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from '@bitcoinerlab/secp256k1';
import { Buffer } from 'buffer';

export interface ApiClient {
  // Password management
  getWalletAddress(): Promise<string>;
  setupPassword(password: string, bitcoinPrivateKey?: string, oldPassword?: string): Promise<void>;
  unlockWallet(password: string): Promise<boolean>;
  isLoggedIn(): Promise<boolean>;
  logout(): Promise<boolean>;
  hasWalletConfiguration(): Promise<boolean>;
  generateFreshPrivateKey(): Promise<string>;

  // Existing methods
  createOrder(order: CreateRuneOrderDto): Promise<void>;
  getOrders(): Promise<RuneOrder[]>;
  getActiveOrders(asset?: string): Promise<RuneOrder[]>;
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
  splitAsset(request: SplitAssetRequest): Promise<{ success: boolean; txid?: string; error?: string }>;
  setAutoSplitConfig(config: AutoSplitConfig): Promise<void>;
  getAutoSplitConfig(assetName: string): Promise<AutoSplitConfig>;
  getAllAutoSplitConfigs(): Promise<AutoSplitConfig[]>;
  deleteAutoSplitConfig(assetName: string): Promise<void>;
  updateAutoRebalancing(asset: string, settings: AutoRebalancingSettings): Promise<void>;
  getAutoRebalancing(asset: string): Promise<AutoRebalancingSettings>;
}

export class HttpApiClient implements ApiClient {
  private baseUrl: string;
  private password: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getWalletAddress(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/account/address`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to get wallet address');
    }

    try {
      const data = await response.json();
      return data.address;
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse wallet address data');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.password) {
      headers['X-Password'] = this.password;
    }

    return headers;
  }

  async createOrder(order: CreateRuneOrderDto): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(order),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to create order');
    }
  }

  async getOrders(): Promise<RuneOrder[]> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to fetch orders');
    }
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse orders data');
    }
  }

  async getActiveOrders(asset?: string): Promise<RuneOrder[]> {
    const params = asset ? `?asset=${asset}` : '';
    const response = await fetch(`${this.baseUrl}/orders/active${params}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to fetch active orders');
    }
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse active orders data');
    }
  }

  async getOrderById(orderId: string): Promise<RuneOrder> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to fetch order');
    }
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
      headers: this.getHeaders(),
      body: JSON.stringify(orders),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to create batch orders');
    }
  }

  async getTokenBalances(): Promise<TokenBalance[]> {
    const response = await fetch(`${this.baseUrl}/account/balance`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to fetch token balances');
    }
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse token balances data');
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    const response = await fetch(`${this.baseUrl}/transactions`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse transactions data');
    }
  }

  async getSettings(): Promise<UserSettings> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      headers: this.getHeaders()
    });
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
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to update settings');
    }
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    const response = await fetch(`${this.baseUrl}/pending-transactions`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch pending transactions');
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse pending transactions data');
    }
  }

  async getPendingTransactionById(id: string): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/pending-transactions/${id}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to fetch pending transaction');
    }
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
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to delete pending transaction');
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to delete order');
    }
  }

  async getLiquidityHealth(): Promise<OutputsHealth> {
    const response = await fetch(`${this.baseUrl}/account/liquidity-health`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error(`Failed to get liquidity health: ${response.statusText}`);
    }

    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse liquidity health data');
    }
  }

  async splitAsset(request: SplitAssetRequest): Promise<{ success: boolean; txid?: string; error?: string }> {
    const response = await fetch(`${this.baseUrl}/account/split-asset`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    // Parse the response JSON regardless of status code
    const data = await response.json();

    // Check for authentication errors
    if (response.status === 401) {
      throw new Error('Invalid password');
    }

    // If the API returns an error message, throw it
    if (!response.ok || data.error) {
      throw new Error(data.error || `Failed to split asset: ${response.statusText}`);
    }

    // Return the success response
    return { success: true, txid: data.txid };
  }

  async setAutoSplitConfig(config: AutoSplitConfig): Promise<void> {
    const response = await fetch(`${this.baseUrl}/account/auto-split`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to set auto-split configuration');
    }
  }

  async getAutoSplitConfig(assetName: string): Promise<AutoSplitConfig> {
    const response = await fetch(`${this.baseUrl}/account/auto-split/${assetName}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to get auto-split configuration');
    }
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse auto-split configuration data');
    }
  }

  async getAllAutoSplitConfigs(): Promise<AutoSplitConfig[]> {
    const response = await fetch(`${this.baseUrl}/account/auto-split`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to get auto-split configurations');
    }
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
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to delete auto-split config');
    }
  }

  async updateAutoRebalancing(asset: string, settings: AutoRebalancingSettings): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rebalance/${asset}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        assetName: asset,
        enabled: settings.enabled,
        spread: settings.spread
      }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to update auto-rebalancing settings');
    }
  }

  async getAutoRebalancing(asset: string): Promise<AutoRebalancingSettings> {
    const response = await fetch(`${this.baseUrl}/rebalance/${asset}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) {
      if (response.status === 404) {
        // Return default settings if configuration doesn't exist yet
        return { enabled: false, spread: '0.5' };
      }
      if (response.status === 401) {
        throw new Error('Invalid password');
      }
      throw new Error('Failed to fetch auto-rebalancing settings');
    }
    try {
      const data = await response.json();
      return {
        enabled: data.enabled,
        spread: data.spread.toString()
      };
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Failed to parse auto-rebalancing settings data');
    }
  }

  /**
   * Sets up or changes the password for the Bitcoin private key
   * @param password The new password to use
   * @param bitcoinPrivateKey Optional Bitcoin private key to set during password setup
   * @param oldPassword Optional old password, required when changing an existing password
   */
  async setupPassword(password: string, bitcoinPrivateKey?: string, oldPassword?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/settings/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password,
        bitcoinPrivateKey,
        oldPassword
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to set up password: ${errorText}`);
    }
  }

  /**
   * Validates a password by attempting to unlock the wallet
   * @param password The password to validate
   * @returns Promise resolving to true if password is valid, false otherwise
   */
  async unlockWallet(password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        // If we get a 401, it means the password is invalid
        if (response.status === 401) {
          return false;
        }
        throw new Error('Failed to validate password');
      }

      // Store the password for future authenticated requests
      this.password = password;
      return true;
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
  }

  /**
   * Checks if the user is currently logged in without requiring password entry
   * @returns Promise resolving to true if logged in, false otherwise
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/account/isLoggedIn`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isLoggedIn;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  /**
   * Logs the user out by clearing wallet data from memory
   * @returns Promise resolving to true if logout was successful
   */
  async logout(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/account/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return false;
      }

      // Clear the stored password
      this.password = null;

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  /**
   * Generates a fresh Bitcoin private key
   * @returns Promise resolving to a new Bitcoin private key
   */
  async generateFreshPrivateKey(): Promise<string> {
    try {
      // Initialize the ECPair library with secp256k1
      bitcoin.initEccLib(ecc);
      const ECPair = ECPairFactory(ecc);

      // Generate a random key pair
      const keyPair = ECPair.makeRandom();

      // Get the private key as a hex string
      const privateKeyHex = Buffer.from(keyPair.privateKey!).toString('hex');

      if (!privateKeyHex) {
        throw new Error('Failed to generate private key');
      }


      // We don't need to manually clear the private key in the browser context
      // The garbage collector will handle this

      return privateKeyHex;
    } catch (error) {
      console.error('Error generating fresh private key:', error);
      throw new Error('Failed to generate Bitcoin private key');
    }
  }

  /**
   * Checks if the wallet has been configured with a Bitcoin private key
   * @returns Promise resolving to true if wallet is configured, false otherwise
   */
  async hasWalletConfiguration(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If we get a 401, it means there's a key but it's password protected
        if (response.status === 401) {
          return true;
        }
        return false;
      }

      const settings = await response.json();
      return !!settings.bitcoinPrivateKey;
    } catch (error) {
      // If there's an error, assume no configuration
      return false;
    }
  }
}