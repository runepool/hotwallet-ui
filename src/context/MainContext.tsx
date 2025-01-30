import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

  const addWarning = useCallback((type: WarningType, message: string, data?: any) => {
    const warning: AppWarning = {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      data,
      timestamp: Date.now()
    };
    setWarnings(prev => [...prev, warning]);
  }, []);

  const clearWarning = useCallback((id: string) => {
    setWarnings(prev => prev.filter(w => w.id !== id));
  }, []);

  const clearWarningsByType = useCallback((type: WarningType) => {
    setWarnings(prev => prev.filter(w => w.type !== type));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders();
      refreshBalances();
      refreshHealth();
    }, 5000);
    refreshOrders();
    refreshBalances();
    refreshHealth();
    return () => clearInterval(interval);
  }, []);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const newOrders = await getOrders();
      setOrders(newOrders);
      clearWarningsByType(WarningType.ORDER_ERROR);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      addWarning(
        WarningType.ORDER_ERROR,
        'Unable to connect to server. Please ensure the API is running.'
      );
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
      addWarning(
        WarningType.BALANCE_ERROR,
        'Unable to connect to server. Please ensure the API is running.'
      );
      console.error('Failed to fetch balances:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, [isFetchingBalances]);

  const refreshHealth = useCallback(async () => {
    try {
      const health = await getApiClient().getLiquidityHealth();
      setOutputsHealth(health);

      // Clear existing liquidity warnings before checking again
      clearWarningsByType(WarningType.LOW_LIQUIDITY);

      // Check health for each balance and add warnings
      for (const [token, outputs] of Object.entries(health)) {
        if (outputs.length < 5) {
          addWarning(
            WarningType.LOW_LIQUIDITY,
            `Low liquidity for ${token}: only ${outputs.length} UTXOs available. Recommended minimum is 5 UTXOs.`,
            { token, outputCount: outputs.length }
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch liquidity health:', error);
      addWarning(
        WarningType.NETWORK_ERROR,
        'Failed to fetch liquidity health information.'
      );
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      await apiDeleteOrder(orderId);
      await refreshOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      addWarning(
        WarningType.ORDER_ERROR,
        `Failed to delete order ${orderId}`
      );
    }
  }, [refreshOrders]);

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
    clearWarningsByType
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