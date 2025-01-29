import React, { useState, useRef, useEffect } from 'react';
import { createOrder } from '../api/orders';
import { CreateRuneOrderDto } from '../types/api';
import { TokenBalance } from '../types/api';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { useMain } from '../context/MainContext';
import { AlertCircle, Plus, ArrowUpDown, Coins, Hash } from 'lucide-react';

interface BatchOrderFormProps {
  balances: TokenBalance[];
}

export function BatchOrderForm({ balances }: BatchOrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addOrder } = useMain();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const selectableTokens = AVAILABLE_TOKENS.filter(token => token.symbol !== 'BTC');
  const selectedToken = selectableTokens.find(token => token.name === currentOrder.rune);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
              <button
                onClick={() => setCurrentOrder(prev => ({ ...prev, type: 'ask' }))}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${currentOrder.type === 'ask'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-red-600'
                  }`}
              >
                Ask
              </button>
              <button
                onClick={() => setCurrentOrder(prev => ({ ...prev, type: 'bid' }))}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${currentOrder.type === 'bid'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600'
                  }`}
              >
                Bid
              </button>
            </div>

            <div className="flex items-center gap-2">
              {[
                {
                  symbol: 'BTC',
                  name: 'BTC',
                  decimals: 8,
                  icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
                },
                ...AVAILABLE_TOKENS
              ].map(token => {
                const balance = balances.find(b => b.token === (token.symbol === 'BTC' ? 'BTC' : token.name));
                const amount = balance ? (+balance.balance / 10 ** balance.decimals).toFixed(token.decimals) : '0';
                return (
                  <div
                    key={token.name}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded"
                  >
                    <img src={token.icon} alt={token.symbol} className="w-4 h-4 rounded-full" />
                    <span className="text-sm font-medium">{token.symbol}</span>
                    <span className="text-sm text-gray-500">{amount}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 text-red-700 rounded-md flex items-center gap-1 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-3">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                  className="w-full h-[38px] pl-8 pr-8 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-left flex items-center text-sm"
                >
                  <Coins className="h-4 w-4 text-gray-400 absolute left-2" />
                  <span>{selectedToken?.symbol || 'Select Token'}</span>
                  {selectedToken && (
                    <img
                      src={selectedToken.icon}
                      alt={selectedToken.symbol}
                      className="w-5 h-5 rounded-full absolute right-1.5"
                    />
                  )}
                </button>

                {isTokenDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="max-h-40 overflow-auto">
                      {selectableTokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setCurrentOrder({ ...currentOrder, rune: token.name });
                            setIsTokenDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                        >
                          <img src={token.icon} alt={token.symbol} className="w-5 h-5 rounded-full" />
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={currentOrder.quantity}
                  onChange={(e) => setCurrentOrder({ ...currentOrder, quantity: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-[38px] pl-8 pr-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="col-span-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  className="w-full h-[38px] pl-8 pr-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="col-span-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full h-[38px] bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-1.5 transition-colors text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <ArrowUpDown className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}