import React, { useState } from 'react';
import { createOrder } from '../api/orders';
import { CreateRuneOrderDto } from '../types/api';
import { AlertCircle } from 'lucide-react';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { useOrders } from '../context/OrderContext';

export function OrderForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addOrder } = useOrders();
  const [order, setOrder] = useState<CreateRuneOrderDto>({
    rune: AVAILABLE_TOKENS[0].name,
    quantity: '',
    price: '',
    type: 'ask',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {

      const rune = AVAILABLE_TOKENS.find(r => r.name === order.rune);
      const decimals = rune?.decimals ? 10 ** rune.decimals : 1;
      
      await createOrder({
        price: order.price,
        quantity: (+order.quantity * decimals).toFixed(0),
        rune: rune?.name || '',
        type: order.type
      });

      addOrder(order);
      setOrder({ rune: AVAILABLE_TOKENS[0].name, quantity: '', price: '', type: 'ask' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Order</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Rune</label>
          <select
            value={order.rune}
            onChange={(e) => setOrder({ ...order, rune: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            {AVAILABLE_TOKENS.map((rune) => (
              <option key={rune} value={rune}>{rune}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="text"
            value={order.quantity}
            onChange={(e) => setOrder({ ...order, quantity: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <input
            type="text"
            value={order.price}
            onChange={(e) => setOrder({ ...order, price: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={order.type}
            onChange={(e) => setOrder({ ...order, type: e.target.value as 'ask' | 'bid' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ask">Ask</option>
            <option value="bid">Bid</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          {loading ? 'Creating...' : 'Create Order'}
        </button>
      </form>
    </div>
  );
}