import React, { useState } from 'react';
import { AlertCircle, ArrowUpDown, ArrowUpCircle, ArrowDownCircle, Search, Trash2, X } from 'lucide-react';
import { useMain } from '../context/MainContext';
import { RuneOrder } from '../types/api';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { deleteOrder } from '../api/orders';
import { TransactionList } from './TransactionList';
import { LiquidityList } from './LiquidityList';

interface OrderTableProps {
  orders: RuneOrder[];
  title: string;
  type: 'ask' | 'bid';
  searchTerm: string;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

function OrderTable({ orders, title, type, searchTerm, onDeleteOrder }: OrderTableProps) {
  const { balances } = useMain();

  const hasEnoughBalance = (order: RuneOrder) => {
    if (type === 'bid') return true;
    const balance = balances.find(b => b.token === order.rune);
    if (!balance) return false;
    return +balance.amount >= +order.quantity;
  };

  const formatQuantity = (order: RuneOrder) => {
    const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
    if (!token) return order.quantity;
    return (+order.quantity / 10 ** token.decimals).toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-20rem)]">
      <div className="px-3 py-2 border-b border-gray-200 flex justify-between items-center shrink-0">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">{orders.length} orders</span>
      </div>

      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 bg-gray-50">Token</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 bg-gray-50">Qty</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 bg-gray-50">Price</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 bg-gray-50">Filled</th>
              <th className="w-8 px-2 py-1.5 bg-gray-50"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {orders.map((order) => {
              const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
              const progress = order.filledQuantity ? (+order.filledQuantity / +order.quantity) * 100 : 0;
              return (
                <tr key={order.id} className="hover:bg-gray-50 relative">
                  <td className="px-2 py-1.5 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1.5">
                      <img src={token?.icon} alt={token?.symbol} className="w-4 h-4 rounded-full" />
                      <span className="font-medium">{token?.symbol}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap text-sm">
                    {formatQuantity(order)}
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap text-sm">
                    {order.price}
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap text-sm">
                    <span className="text-xs text-gray-500">{progress.toFixed(2)}%</span>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                  {/* Progress background */}
                  {progress > 0 && (
                    <td
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, ${type === 'bid' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'} ${progress}%, transparent ${progress}%)`
                      }}
                    />
                  )}
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-3 text-center text-sm text-gray-500">
                  No {type} orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OrderList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'orders' | 'transactions' | 'liquidity'>('orders');
  const { orders, deleteOrder, refreshOrders, warnings } = useMain();
  const [loading, setLoading] = useState(false);

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      await deleteOrder(orderId);
      await refreshOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.rune.toLowerCase().includes(searchLower) ||
      order.type.toLowerCase().includes(searchLower) ||
      order.quantity.toString().includes(searchLower) ||
      order.price.toString().includes(searchLower)
    );
  });

  const askOrders = filteredOrders
    .filter(order => order.type === 'ask')
    .sort((a, b) => +a.price - +b.price); // ascending

  const bidOrders = filteredOrders
    .filter(order => order.type === 'bid')
    .sort((a, b) => +b.price - +a.price); // descending

  const hasLiquidityWarnings = warnings.some(w => w.type === 'LOW_LIQUIDITY');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveView('orders')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeView === 'orders'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveView('transactions')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeView === 'transactions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveView('liquidity')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all relative ${
              activeView === 'liquidity'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Liquidity
            {hasLiquidityWarnings && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        </div>

        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Search ${activeView} by token, quantity, or price...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {activeView === 'orders' && (
        <div className="grid grid-cols-2 gap-4">
          <OrderTable
            orders={askOrders}
            title="Ask Orders"
            type="ask"
            searchTerm={searchTerm}
            onDeleteOrder={handleDeleteOrder}
          />
          <OrderTable
            orders={bidOrders}
            title="Bid Orders"
            type="bid"
            searchTerm={searchTerm}
            onDeleteOrder={handleDeleteOrder}
          />
        </div>
      )}
      {activeView === 'transactions' && <TransactionList searchTerm={searchTerm} />}
      {activeView === 'liquidity' && <LiquidityList />}
    </div>
  );
}