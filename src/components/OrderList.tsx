import React, { useState, useMemo } from 'react';
import { AlertCircle, ArrowUpDown, ArrowUpCircle, ArrowDownCircle, Search, Trash2, X } from 'lucide-react';
import { useMain } from '../context/MainContext';
import { RuneOrder } from '../types/api';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { deleteOrder } from '../api/orders';
import { TransactionList } from './TransactionList';
import { LiquidityList } from './LiquidityList';
import { BatchOrderForm } from './BatchOrderForm';
import { TokenBalances } from './TokenBalances';

interface OrderTableProps {
  orders: RuneOrder[];
  searchTerm: string;
  onDeleteOrder: (orderId: string) => Promise<void>;
  className?: string;
}

function OrderTable({ orders, title, type, searchTerm, onDeleteOrder, className, headerPosition = 'top', showColumnHeaders = false }: OrderTableProps & { headerPosition?: 'top' | 'bottom', title: string, type: 'ask' | 'bid', showColumnHeaders?: boolean }) {
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

  const header = (
    <div className="px-3 py-1.5 border-b border-gray-100 flex items-center bg-white">
      <div className="w-[35%] flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">{orders.length} orders</span>
      </div>
      {showColumnHeaders && (
        <>
          <div className="w-[20%] text-right">
            <span className="text-xs font-medium text-gray-500">Qty</span>
          </div>
          <div className="w-[20%] text-right">
            <span className="text-xs font-medium text-gray-500">Price</span>
          </div>
          <div className="w-[15%] text-right">
            <span className="text-xs font-medium text-gray-500">Filled</span>
          </div>
          <div className="w-[10%]"></div>
        </>
      )}
    </div>
  );

  const ordersToDisplay = type === 'ask' ? [...orders].reverse() : orders;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${className}`}>
      {headerPosition === 'top' && header}
      <div className={`overflow-auto flex-1 ${type === 'ask' ? 'flex flex-col justify-end' : ''}`}>
        <table className="min-w-full">
          <tbody className={`divide-y divide-gray-100 ${type === 'ask' ? 'flex flex-col' : ''}`}>
            {ordersToDisplay.map((order) => {
              const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
              const progress = order.filledQuantity ? (+order.filledQuantity / +order.quantity) * 100 : 0;
              return (
                <tr key={order.id} className={`hover:bg-gray-50 relative ${type === 'ask' ? 'flex' : ''}`}>
                  <td className="w-[35%] px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <img src={token?.icon} alt={token?.symbol} className="w-5 h-5 rounded-full" />
                      <span className="font-medium text-sm text-gray-900">{token?.symbol}</span>
                    </div>
                  </td>
                  <td className="w-[20%] px-3 py-2 text-right whitespace-nowrap text-sm text-gray-900">
                    {formatQuantity(order)}
                  </td>
                  <td className={`w-[20%] px-3 py-2 text-right whitespace-nowrap text-sm font-medium ${type === 'ask' ? 'text-red-500' : 'text-green-500'}`}>
                    {order.price}
                  </td>
                  <td className="w-[15%] px-3 py-2 text-right whitespace-nowrap">
                    <span className="text-xs font-medium text-gray-500">{progress.toFixed(2)}%</span>
                  </td>
                  <td className="w-[10%] px-3 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                  {/* Progress background */}
                  {progress > 0 && (
                    <td
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, ${type === 'ask' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)'} ${progress}%, transparent ${progress}%)`
                      }}
                    />
                  )}
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr className={type === 'ask' ? 'flex' : ''}>
                <td colSpan={5} className="px-3 py-4 text-center">
                  <span className="text-sm text-gray-500">No {type} orders</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {headerPosition === 'bottom' && header}
    </div>
  );
}

export function OrderList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'orders' | 'transactions' | 'liquidity'>('orders');
  const { orders, deleteOrder, refreshOrders, warnings, outputsHealth, balances } = useMain();
  const [loading, setLoading] = useState(false);
  const defaultToken = AVAILABLE_TOKENS.find(token => token.symbol !== 'BTC')?.name || null;
  const [selectedToken, setSelectedToken] = useState<string | null>(defaultToken);

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
    if (selectedToken && order.rune !== selectedToken) return false;
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

  const hasLowLiquidityAssets = useMemo(() => {
    if (!outputsHealth) return false;
    return Object.values(outputsHealth).some(outputs => outputs.length < 5);
  }, [outputsHealth]);

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
            {hasLowLiquidityAssets && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
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
        <div className="flex gap-4">
          <div className="flex flex-col flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex flex-col h-[calc(100vh-10rem)]">
              <OrderTable
                orders={askOrders}
                title="Ask Orders"
                type="ask"
                searchTerm={searchTerm}
                onDeleteOrder={handleDeleteOrder}
                className="flex-1 rounded-none border-0 flex flex-col justify-end"
                headerPosition="top"
                showColumnHeaders={true}
              />
              
              {/* Spread indicator */}
              {askOrders.length > 0 && bidOrders.length > 0 && (
                <div className="px-3 py-1.5 border-y border-gray-100 bg-gray-50/75">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Spread</span>
                    <span className="text-xs font-medium text-gray-900">
                      {((+askOrders[0].price - +bidOrders[0].price) / +askOrders[0].price * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}

              <OrderTable
                orders={bidOrders}
                title="Bid Orders"
                type="bid"
                searchTerm={searchTerm}
                onDeleteOrder={handleDeleteOrder}
                className="flex-1 rounded-none border-0"
                headerPosition="bottom"
                showColumnHeaders={false}
              />
            </div>
          </div>
          
          <div className="w-[400px] h-[calc(100vh-10rem)] flex flex-col gap-3">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200">
              <BatchOrderForm 
                balances={balances} 
                selectedToken={selectedToken}
                onTokenSelect={setSelectedToken}
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
              <h2 className="text-sm font-medium text-gray-900 mb-3">Token Balances</h2>
              <TokenBalances balances={balances} />
            </div>
          </div>
        </div>
      )}
      {activeView === 'transactions' && <TransactionList searchTerm={searchTerm} />}
      {activeView === 'liquidity' && <LiquidityList />}
    </div>
  );
}