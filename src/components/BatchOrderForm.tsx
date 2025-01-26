import React, { useState, useRef, useEffect } from 'react';
import { createOrder } from '../api/orders';
import { CreateRuneOrderDto } from '../types/api';
import { AlertCircle, Plus, ArrowUpDown, Coins, Hash, Search } from 'lucide-react';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { useOrders } from '../context/OrderContext';

export function BatchOrderForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [tokenSearch, setTokenSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addOrder } = useOrders();
  const [currentOrder, setCurrentOrder] = useState<CreateRuneOrderDto>({
    rune: AVAILABLE_TOKENS.find(token => token.symbol !== 'BTC')!.name || '',
    quantity: '',
    price: '',
    type: 'ask',
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTokenDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async () => {
    if (!currentOrder.quantity || !currentOrder.price) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createOrder(currentOrder);
      // Add the order to the context with proper formatting
      addOrder({
        id: Date.now().toString(), // Temporary ID until refresh
        rune: currentOrder.rune,
        quantity: (+currentOrder.quantity * 10 ** selectedToken!.decimals).toString(),
        price: currentOrder.price,
        type: currentOrder.type,
        filledQuantity: 0,
        createdAt: new Date().toISOString()
      });
      setError(null);
      // Reset form
      setCurrentOrder({
        rune: currentOrder.rune,
        quantity: '',
        price: '',
        type: currentOrder.type
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const selectableTokens = AVAILABLE_TOKENS.filter(token => token.symbol !== 'BTC');
  const filteredTokens = selectableTokens.filter(token =>
    token.name.toLowerCase().includes(tokenSearch.toLowerCase()) ||
    token.symbol.toLowerCase().includes(tokenSearch.toLowerCase())
  );
  const selectedToken = selectableTokens.find(token => token.name === currentOrder.rune);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quick Order</h2>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setCurrentOrder(prev => ({ ...prev, type: 'ask' }))}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentOrder.type === 'ask'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-red-600'
              }`}
          >
            Ask
          </button>
          <button
            onClick={() => setCurrentOrder(prev => ({ ...prev, type: 'bid' }))}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentOrder.type === 'bid'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-green-600'
              }`}
          >
            Bid
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
              className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center"
            >
              <Coins className="h-5 w-5 text-gray-400 absolute left-3" />
              <span>{selectedToken?.symbol}</span>
              {selectedToken && (
                <img
                  src={selectedToken.icon}
                  alt={selectedToken.symbol}
                  className="w-6 h-6 rounded-full absolute right-2"
                />
              )}
            </button>

            {isTokenDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={tokenSearch}
                      onChange={(e) => setTokenSearch(e.target.value)}
                      placeholder="Search tokens..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-auto">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        setCurrentOrder({ ...currentOrder, rune: token.name });
                        setIsTokenDropdownOpen(false);
                        setTokenSearch('');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3"
                    >
                      <img src={token.icon} alt={token.symbol} className="w-6 h-6 rounded-full" />
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-gray-500">{token.name}</div>
                      </div>
                    </button>
                  ))}
                  {filteredTokens.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">No tokens found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={currentOrder.quantity}
              onChange={(e) => setCurrentOrder({ ...currentOrder, quantity: e.target.value })}
              placeholder="0.00"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (sats)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 8H11.1667C9.97 8 9 8.97 9 10.1667C9 11.3633 9.97 12.3333 11.1667 12.3333H12.8333C14.03 12.3333 15 13.3033 15 14.5C15 15.6967 14.03 16.6667 12.8333 16.6667H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 6V8M12 16.6667V18.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <input
              type="text"
              value={currentOrder.price}
              onChange={(e) => setCurrentOrder({ ...currentOrder, price: e.target.value })}
              placeholder="100,000"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full h-[42px] bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {loading ? (
              <ArrowUpDown className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {loading ? 'Adding...' : 'Add Order'}
          </button>
        </div>
      </div>
    </div>
  );
}