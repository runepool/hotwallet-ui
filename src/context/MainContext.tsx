import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { RuneOrder, TokenBalance, OutputsHealth, AppWarning, WarningType } from '../types/api';
import { getOrders, getTokenBalances, deleteOrder as apiDeleteOrder } from '../api/orders';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { getApiClient } from '../services/api-provider';

interface MainContextType {
  orders: RuneOrder[];
  balances: TokenBalance[];
  loading: boolean;
  isFetchingBalances: boolean;
  error: string | null;
  deleteOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  outputsHealth: OutputsHealth | null;
  refreshHealth: () => Promise<void>;
  warnings: AppWarning[];
  clearWarning: (id: string) => void;
  clearWarningsByType: (type: WarningType) => void;
  addOrder: (order: RuneOrder) => Promise<void>;
  apiClient: ReturnType<typeof getApiClient>;
}

const MainContext = createContext<MainContextType | undefined>(undefined);

export function MainProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<RuneOrder[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputsHealth, setOutputsHealth] = useState<OutputsHealth | null>(null);
  const [warnings, setWarnings] = useState<AppWarning[]>([]);
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

  useEffect(() => {
    let mounted = true;
    const pollData = async () => {
      if (!mounted) return;
      
      try {
        await Promise.all([
          refreshOrders(),
          refreshBalances(),
          refreshHealth()
        ]);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial load
    pollData();

    // Set up polling
    const interval = setInterval(pollData, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const newOrders = await getOrders();
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
  }, []);

  const refreshBalances = useCallback(async () => {
    if (isFetchingBalances) return;

    try {
      setIsFetchingBalances(true);
      const data = await getTokenBalances();
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
      
      // Only show the error warning if it's not a JSON parsing error
      if (!(err instanceof Error && err.message.includes('parse'))) {
        addWarning(
          WarningType.BALANCE_ERROR,
          'Unable to connect to server. Please ensure the API is running.'
        );
      }
    } finally {
      setIsFetchingBalances(false);
    }
  }, [isFetchingBalances]);

  const refreshHealth = useCallback(async () => {
    // Prevent concurrent refreshes
    if (refreshingHealth.current) {
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
      
      // Only show the network error warning if it's not a JSON parsing error
      if (error instanceof Error && error.message !== 'Failed to parse liquidity health data') {
        addWarning(
          WarningType.NETWORK_ERROR,
          'Unable to connect to server. Please ensure the API is running.'
        );
      }
    } finally {
      refreshingHealth.current = false;
    }
  }, [addWarning, clearWarningsByType]);

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

  const value = {
    orders,
    balances,
    loading,
    isFetchingBalances,
    error,
    deleteOrder,
    refreshOrders,
    refreshBalances,
    outputsHealth,
    refreshHealth,
    warnings,
    clearWarning,
    clearWarningsByType,
    addOrder,
    apiClient
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