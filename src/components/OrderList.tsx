import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowUpDown, ArrowUpCircle, ArrowDownCircle, Search, Trash2 } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { RuneOrder, TokenBalance } from '../types/api';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { db } from '../services/db';
import { getTokenBalances, deleteOrder } from '../api/orders';

interface OrderTableProps {
  orders: RuneOrder[];
  title: string;
  type: 'ask' | 'bid';
  balances: TokenBalance[];
  searchTerm: string;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

function OrderTable({ orders, title, type, balances, searchTerm, onDeleteOrder }: OrderTableProps) {
  const hasEnoughBalance = (order: RuneOrder) => {
    const balance = balances.find(b => b.token === order.rune);
    if (!balance) return false;

    // Calculate remaining unfilled amount
    const remainingAmount = parseFloat(order.quantity) - (order.filledQuantity || 0);

    if (type === 'ask') {
      return parseFloat(balance.balance) >= remainingAmount;
    }

    const btcBalance = balances.find(b => b.token === 'BTC');
    if (!btcBalance) return false;

    const remainingBtcNeeded = remainingAmount * parseFloat(order.price);
    return parseFloat(btcBalance.balance) >= remainingBtcNeeded;
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.rune.toLowerCase().includes(searchLower) ||
      order.quantity.toString().includes(searchLower) ||
      order.price.toString().includes(searchLower)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
      <div className={`px-6 py-4 border-b border-gray-200 flex items-center gap-2 ${type === 'ask' ? 'bg-red-50' : 'bg-green-50'
        }`}>
        {type === 'ask' ? (
          <ArrowUpCircle className="w-5 h-5 text-red-500" />
        ) : (
          <ArrowDownCircle className="w-5 h-5 text-green-500" />
        )}
        <h2 className={`text-xl font-bold ${type === 'ask' ? 'text-red-700' : 'text-green-700'
          }`}>{title}</h2>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-16rem)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Token
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price (sats)
              </th>

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order, index) => {
              const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
              const filledAmount = order.filledQuantity! / 10 ** token!.decimals || 0;
              const sufficient = hasEnoughBalance(order);
              const progress = (filledAmount / parseInt(order.quantity)) * 100 * 10 ** token!.decimals;
              
              return (
                <tr
                  key={index}
                  className={`relative ${!sufficient ? 'opacity-50' : ''}`}
                  style={{
                    background: `linear-gradient(to right, ${type === 'ask'
                      ? 'rgba(239, 68, 68, 0.15)' // More vibrant red
                      : 'rgba(34, 197, 94, 0.15)' // More vibrant green
                      } ${progress}%, transparent ${progress}%)`
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={token?.icon} alt={token?.symbol} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {token?.symbol}
                        </div>
                        <div className="text-sm text-gray-500">
                          {token?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {filledAmount}/{+order.quantity! / 10 ** token!.decimals}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.price}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                    <button
                      onClick={() => onDeleteOrder(order.id!)}
                      className="ml-2 text-red-600 hover:text-red-900"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  {searchTerm ? 'No matching orders found' : `No ${type} orders available`}
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
  const { orders, refreshOrders } = useOrders();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      await deleteOrder(orderId);
      // Refresh the orders list after successful deletion
      await refreshOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOrders();

    const fetchBalances = async () => {
      try {
        const data = await getTokenBalances();
        setBalances(data);
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      }
    };

    fetchBalances();

    const interval = setInterval(fetchBalances, 5000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ArrowUpDown className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const askOrders = orders.filter(order => order.type === 'ask');
  const bidOrders = orders.filter(order => order.type === 'bid');

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search orders by token, quantity, or price..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-6 h-[calc(100vh-24rem)]">
        <OrderTable
          orders={askOrders}
          title="Ask Orders"
          type="ask"
          balances={balances}
          searchTerm={searchTerm}
          onDeleteOrder={handleDeleteOrder}
        />
        <OrderTable
          orders={bidOrders}
          title="Bid Orders"
          type="bid"
          balances={balances}
          searchTerm={searchTerm}
          onDeleteOrder={handleDeleteOrder}
        />
      </div>
    </div>
  );
}