import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { RuneOrder, TokenBalance, OutputsHealth, AppWarning, WarningType } from '../types/api';
import { getActiveOrders, deleteOrder as apiDeleteOrder } from '../api/orders';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { getApiClient } from '../services/api-provider';

interface MainContextType {
  orders: RuneOrder[];
  balances: TokenBalance[];
  loading: boolean;
  isFetchingBalances: boolean;
  error: string | null;
  deleteOrder: (orderId: string) => Promise<void>;
  deleteBatchOrders: (orderIds: string[]) => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  outputsHealth: OutputsHealth | null;
  refreshHealth: () => Promise<void>;
  warnings: AppWarning[];
  clearWarning: (id: string) => void;
  clearWarningsByType: (type: WarningType) => void;
  addOrder: (order: RuneOrder) => Promise<void>;
  apiClient: ReturnType<typeof getApiClient>;
  // Password and wallet locking functionality
  isWalletLocked: boolean;
  lockWallet: () => void;
  unlockWallet: (password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  setupPassword: (password: string, bitcoinPrivateKey?: string, oldPassword?: string) => Promise<boolean>;
  hasPassword: boolean;
}

const MainContext = createContext<MainContextType | undefined>(undefined);

export function MainProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<RuneOrder[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [error] = useState<string | null>(null);
  const [outputsHealth, setOutputsHealth] = useState<OutputsHealth | null>(null);
  const [warnings, setWarnings] = useState<AppWarning[]>([]);
  const [isWalletLocked, setIsWalletLocked] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const refreshingHealth = useRef(false);
  const apiClient = getApiClient();

  const addWarning = useCallback((type: WarningType, message: string, data?: any) => {
    setWarnings(prev => {
      // Check if we already have a similar warning
      const hasExistingWarning = prev.some(w => 
        w.type === type && 
        w.message === message
      );
      
      if (hasExistingWarning) {
        return prev;
      }

      const warning: AppWarning = {
        id: Math.random().toString(36).substring(7),
        type,
        message,
        data,
        timestamp: Date.now()
      };
      return [...prev, warning];
    });
  }, []);

  const clearWarning = useCallback((id: string) => {
    setWarnings(prev => prev.filter(w => w.id !== id));
  }, []);

  const clearWarningsByType = useCallback((type: WarningType) => {
    setWarnings(prev => prev.filter(w => w.type !== type));
  }, []);

  // Cleanup stale warnings
  useEffect(() => {
    return () => {
      // Clear all warnings when component unmounts
      setWarnings([]);
    };
  }, []);

  // Check if wallet has a password set and if user is logged in
  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        // First check if user is already logged in
        const isLoggedIn = await apiClient.isLoggedIn();
        if (isLoggedIn) {
          console.log('User is already logged in');
          setIsWalletLocked(false);
          setHasPassword(true);
          return;
        }
        
        // If not logged in, check if there's a wallet configuration
        const hasConfig = await apiClient.hasWalletConfiguration();
        if (!hasConfig) {
          // No configuration at all - needs initial setup
          console.log('No wallet configuration found - needs initial setup');
          setHasPassword(false);
          setIsWalletLocked(false); // Don't lock the wallet for initial setup
          return;
        }
        
        // If there is configuration, check if it has an encrypted key and password
        const settings = await apiClient.getSettings();
        console.log('Wallet settings:', { 
          hasKey: !!settings.bitcoinPrivateKey, 
          hasPassword: settings.hasPassword 
        });
        
        // Use the hasPassword field from settings
        setHasPassword(!!settings.hasPassword);
        
        // If we have a password, the wallet is locked until unlocked
        if (settings.hasPassword) {
          console.log('Wallet has password - locked until unlocked');
          setIsWalletLocked(true);
        } else {
          // We have configuration but no password - needs password setup
          console.log('Wallet has configuration but no password - needs setup');
          setIsWalletLocked(false);
        }
      } catch (error) {
        // If we get a password required error, it means the key is encrypted
        if (error instanceof Error && error.message.includes('Password required')) {
          console.log('Password required error - wallet is locked');
          setHasPassword(true);
          setIsWalletLocked(true);
        } else {
          console.error('Failed to check password status:', error);
          // For other errors, assume we need initial setup
          setHasPassword(false);
          setIsWalletLocked(false);
        }
      }
    };
    
    checkPasswordStatus();
  }, [apiClient]);

  useEffect(() => {
    let mounted = true;
    const pollData = async () => {
      if (!mounted || isWalletLocked) return;
      
      try {
        await Promise.all([
          refreshOrders(),
          refreshBalances(),
          refreshHealth()
        ]);
      } catch (error) {
        console.error('Polling error:', error);
        
        // If we get a password required error, lock the wallet
        if (error instanceof Error && error.message.includes('Password required')) {
          setIsWalletLocked(true);
        }
      }
    };

    // Only start polling if wallet is unlocked
    if (!isWalletLocked) {
      // Initial load
      pollData();

      // Set up polling
      const interval = setInterval(pollData, 5000);

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }
  }, [isWalletLocked]);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const newOrders = await getActiveOrders();
      setOrders(newOrders);
      clearWarningsByType(WarningType.ORDER_ERROR);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      
      // Only show the error warning if it's not a JSON parsing error
      if (!(error instanceof Error && error.message.includes('parse'))) {
        addWarning(
          WarningType.ORDER_ERROR,
          'Unable to connect to server. Please ensure the API is running.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [clearWarningsByType, addWarning]);

  const refreshBalances = useCallback(async () => {
    if (isFetchingBalances || isWalletLocked) return;

    try {
      setIsFetchingBalances(true);
      const data = await apiClient.getTokenBalances();
      const scaledBalances = data
        .map(balance => {
          let token = AVAILABLE_TOKENS.find(t => t.name === balance.token);
          if (!token && balance.token !== 'BTC') return null;
          if (!token && balance.token === 'BTC') { token = { name: 'BTC', decimals: 8 } as any };

          return {
            ...balance,
            decimals: token!.decimals,
            balance: (+balance.balance * (10 ** token!.decimals)).toString()
          };
        })
        .filter((balance): balance is TokenBalance => balance !== null);

      setBalances(scaledBalances);
      clearWarningsByType(WarningType.BALANCE_ERROR);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      
      // Check if this is a password error
      if (err instanceof Error && err.message.includes('Invalid password')) {
        setIsWalletLocked(true);
        addWarning(
          WarningType.BALANCE_ERROR,
          'Invalid password. Please unlock your wallet.'
        );
      }
      // Only show the error warning if it's not a JSON parsing error
      else if (!(err instanceof Error && err.message.includes('parse'))) {
        addWarning(
          WarningType.BALANCE_ERROR,
          'Unable to connect to server. Please ensure the API is running.'
        );
      }
    } finally {
      setIsFetchingBalances(false);
    }
  }, [isFetchingBalances, isWalletLocked]);

  const refreshHealth = useCallback(async () => {
    // Prevent concurrent refreshes or if wallet is locked
    if (refreshingHealth.current || isWalletLocked) {
      return;
    }
    
    refreshingHealth.current = true;
    try {
      const health = await apiClient.getLiquidityHealth();
      setOutputsHealth(health);
      // Clear network errors only if we successfully got health data
      if (health) {
        clearWarningsByType(WarningType.NETWORK_ERROR);
      }
    } catch (error) {
      console.error('Failed to fetch liquidity health:', error);
      
      // Check if this is a password error
      if (error instanceof Error && error.message.includes('Invalid password')) {
        setIsWalletLocked(true);
        addWarning(
          WarningType.NETWORK_ERROR,
          'Invalid password. Please unlock your wallet.'
        );
      }
      // Only show the network error warning if it's not a JSON parsing error
      else if (error instanceof Error && error.message !== 'Failed to parse liquidity health data') {
        addWarning(
          WarningType.NETWORK_ERROR,
          'Unable to connect to server. Please ensure the API is running.'
        );
      }
    } finally {
      refreshingHealth.current = false;
    }
  }, [addWarning, clearWarningsByType, isWalletLocked]);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      await apiDeleteOrder(orderId);
      await refreshOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      
      // Only show the error warning if it's not a JSON parsing error
      if (!(error instanceof Error && error.message.includes('parse'))) {
        addWarning(
          WarningType.ORDER_ERROR,
          `Failed to delete order ${orderId}`
        );
      }
    }
  }, [refreshOrders]);
  
  const deleteBatchOrders = useCallback(async (orderIds: string[]) => {
    if (!orderIds || orderIds.length === 0) return;
    
    try {
      await apiClient.deleteBatchOrders(orderIds);
      await refreshOrders();
    } catch (error) {
      console.error('Failed to delete orders in batch:', error);
      addWarning(
        WarningType.ORDER_ERROR,
        `Failed to delete ${orderIds.length} orders`
      );
    }
  }, [apiClient, refreshOrders]);

  const addOrder = useCallback(async (order: RuneOrder) => {
    try {
      const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
      if (!token) {
        throw new Error('Token not found');
      }

      await apiClient.createOrder({ 
        rune: order.rune, 
        quantity: order.quantity, 
        price: order.price, 
        type: order.type 
      });
      await refreshOrders();
      clearWarningsByType(WarningType.ORDER_ERROR);
    } catch (error) {
      console.error('Failed to add order:', error);
      
      // Only show the error warning if it's not a JSON parsing error
      if (!(error instanceof Error && error.message.includes('parse'))) {
        addWarning(
          WarningType.ORDER_ERROR,
          'Failed to add order. Please try again.'
        );
      }
      throw error;
    }
  }, [apiClient, refreshOrders, clearWarningsByType, addWarning]);

  // Wallet locking and unlocking functions
  const lockWallet = useCallback(() => {
    setIsWalletLocked(true);
  }, []);

  const unlockWallet = useCallback(async (password: string): Promise<boolean> => {
    try {
      await apiClient.unlockWallet(password);
      // Test the password by trying to get the wallet address
      await apiClient.getWalletAddress();
      setIsWalletLocked(false);
      return true;
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
      return false;
    }
  }, [apiClient]);
  
  // Logout function
  const logout = useCallback(async (): Promise<boolean> => {
    try {
      const success = await apiClient.logout();
      if (success) {
        setIsWalletLocked(true);
        // Clear any sensitive data from the context
        setOrders([]);
        setBalances([]);
        setOutputsHealth(null);
      }
      return success;
    } catch (error) {
      console.error('Failed to logout:', error);
      return false;
    }
  }, [apiClient]);

  // Setup or change password
  const setupPassword = useCallback(async (password: string, bitcoinPrivateKey?: string, oldPassword?: string): Promise<boolean> => {
    try {
      await apiClient.setupPassword(password, bitcoinPrivateKey, oldPassword);
      setHasPassword(true);
      setIsWalletLocked(false);
      return true;
    } catch (error) {
      console.error('Failed to set up password:', error);
      return false;
    }
  }, [apiClient]);

  const value = {
    orders,
    balances,
    loading,
    isFetchingBalances,
    error,
    deleteOrder,
    deleteBatchOrders,
    refreshOrders,
    refreshBalances,
    outputsHealth,
    refreshHealth,
    warnings,
    clearWarning,
    clearWarningsByType,
    addOrder,
    apiClient,
    // Password and wallet locking functionality
    isWalletLocked,
    lockWallet,
    unlockWallet,
    logout,
    setupPassword,
    hasPassword
  };

  return (
    <MainContext.Provider value={value}>
      {children}
    </MainContext.Provider>
  );
}

export function useMain() {
  const context = useContext(MainContext);
  if (context === undefined) {
    throw new Error('useMain must be used within a MainProvider');
  }
  return context;
}