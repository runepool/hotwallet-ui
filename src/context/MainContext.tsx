import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { RuneOrder, TokenBalance } from '../types/api';
import { getOrders, getTokenBalances } from '../api/orders';
import { AVAILABLE_TOKENS } from '../constants/runes';

interface MainContextType {
  orders: RuneOrder[];
  refreshOrders: () => Promise<void>;
  addOrder: (order: RuneOrder) => void;
  loading: boolean;
  balances: TokenBalance[];
  fetchBalances: () => Promise<void>;
  error: string | null;
}

const MainContext = createContext<MainContextType | undefined>(undefined);

export function MainProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<RuneOrder[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const newOrders = await getOrders();
      setOrders(newOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setError('Unable to connect to server. Please ensure the API is running at http://localhost:3000');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalances = useCallback(async () => {
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
      setError(null);
    } catch (err) {
      setError('Unable to connect to server. Please ensure the API is running at http://localhost:3000');
      console.error('Failed to fetch balances:', err);
    } finally {
      setIsFetchingBalances(false);
    }
  }, [isFetchingBalances]);

  const addOrder = useCallback((order: RuneOrder) => {
    setOrders(prevOrders => [...prevOrders, order]);
  }, []);

  return (
    <MainContext.Provider value={{
      orders,
      refreshOrders,
      addOrder,
      loading,
      balances,
      fetchBalances,
      error
    }}>
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