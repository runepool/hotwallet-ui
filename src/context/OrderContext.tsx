import React, { createContext, useContext, useState, useCallback } from 'react';
import { RuneOrder } from '../types/api';
import { getOrders } from '../api/orders';

interface OrderContextType {
  orders: RuneOrder[];
  refreshOrders: () => Promise<void>;
  addOrder: (order: RuneOrder) => void;
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<RuneOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const newOrders = await getOrders();
      setOrders(newOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrder = useCallback((order: RuneOrder) => {
    setOrders(prevOrders => [...prevOrders, order]);
  }, []);

  return (
    <OrderContext.Provider value={{ orders, refreshOrders, addOrder, loading }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}