import { AlertCircle, ArrowUpDown, Coins, Hash, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getAutoRebalancing, updateAutoRebalancing } from '../api/autoRebalancing';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { useMain } from '../context/MainContext';
import { CreateRuneOrderDto, TokenBalance } from '../types/api';
import { AutoRebalancing } from './AutoRebalancing';

interface BatchOrderFormProps {
  balances: TokenBalance[];
  selectedToken: string | null;
  onTokenSelect: (token: string | null) => void;
}

export function BatchOrderForm({ selectedToken, onTokenSelect }: BatchOrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [autoRebalancingEnabled, setAutoRebalancingEnabled] = useState(false);
  const [autoRebalancingSpread, setAutoRebalancingSpread] = useState('0.5');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addOrder } = useMain();
  const [currentOrder, setCurrentOrder] = useState<CreateRuneOrderDto>({
    rune: '',
    quantity: '',
    price: '',
    type: 'ask',
  });

  // Formatted display values for inputs
  const [formattedQuantity, setFormattedQuantity] = useState('');
  const [formattedPrice, setFormattedPrice] = useState('');

  useEffect(() => {
    if (selectedToken) {
      setCurrentOrder(prev => ({ ...prev, rune: selectedToken }));
      // Fetch auto-rebalancing settings for the selected token
      getAutoRebalancing(selectedToken)
        .then(settings => {
          setAutoRebalancingEnabled(settings.enabled);
          setAutoRebalancingSpread(settings.spread);
        })
        .catch(err => {
          console.error('Failed to fetch auto-rebalancing settings:', err);
          setAutoRebalancingEnabled(false);
          setAutoRebalancingSpread('0.5');
        });
    }
  }, [selectedToken]);

  // Format number with thousand separators
  const formatNumber = (value: string): string => {
    if (!value) return '';

    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');

    // Split by decimal point
    const parts = numericValue.split('.');

    // Format the integer part with thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Join back with decimal part if it exists
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  };

  // Parse formatted number back to raw value
  const parseFormattedNumber = (formatted: string): string => {
    return formatted.replace(/,/g, '');
  };

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
    if (!currentOrder.quantity || !currentOrder.price || !currentOrder.rune) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedToken = AVAILABLE_TOKENS.find(t => t.name === currentOrder.rune);
      if (!selectedToken) {
        throw new Error('Token not found');
      }

      // Convert price to integer by multiplying by 10000 to support 4 decimal places
      const priceAsInteger = Math.round(parseFloat(currentOrder.price) * 10000).toString();
      
      await addOrder({
        rune: currentOrder.rune,
        quantity: (+currentOrder.quantity * 10 ** selectedToken.decimals).toFixed(0),
        price: priceAsInteger,
        type: currentOrder.type
      });

      // Don't reset form values, just clear any errors
      setError(null);
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRebalancingChange = async (enabled: boolean) => {
    try {
      if (!currentOrder.rune) {
        setError('Please select a token first');
        return;
      }
      await updateAutoRebalancing(currentOrder.rune, {
        enabled,
        spread: autoRebalancingSpread,
      });
      setAutoRebalancingEnabled(enabled);
    } catch (err) {
      console.error('Failed to update auto-rebalancing:', err);
      setError(err instanceof Error ? err.message : 'Failed to update auto-rebalancing');
    }
  };

  const handleSpreadChange = async (spread: string) => {
    try {
      if (!currentOrder.rune) {
        setError('Please select a token first');
        return;
      }
      await updateAutoRebalancing(currentOrder.rune, {
        enabled: autoRebalancingEnabled,
        spread,
      });
      setAutoRebalancingSpread(spread);
    } catch (err) {
      console.error('Failed to update auto-rebalancing:', err);
      setError(err instanceof Error ? err.message : 'Failed to update auto-rebalancing');
    }
  };

  const handleTokenSelect = async (tokenName: string) => {
    onTokenSelect(tokenName);
    setIsTokenDropdownOpen(false);
  };

  const selectableTokens = AVAILABLE_TOKENS.filter(token => token.symbol !== 'BTC');
  const selectedTokenInfo = selectableTokens.find(token => token.name === selectedToken);

  return (
    <div className="h-full flex flex-col" >
      <div className="p-3 border-b border-gray-100 flex justify-between items-center" >
        <h2 className="text-sm font-medium text-gray-900">Place Order</h2>
        <div className="inline-flex items-center gap-0.5 bg-gray-50 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setCurrentOrder(prev => ({ ...prev, type: 'ask' }))}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${currentOrder.type === 'ask'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-red-600'
              }`}
          >
            Ask
          </button>
          <button
            onClick={() => setCurrentOrder(prev => ({ ...prev, type: 'bid' }))}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${currentOrder.type === 'bid'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-green-600'
              }`}
          >
            Bid
          </button>
        </div>
      </div>

      <div className="flex-1 p-3">
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 text-red-700 rounded-md flex items-center gap-1 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Token</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                  className="w-full h-9 pl-8 pr-8 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center text-sm"
                >
                  <Coins className="h-4 w-4 text-gray-400 absolute left-2" />
                  <span>{selectedTokenInfo?.symbol || 'Select'}</span>
                  {selectedTokenInfo && (
                    <img
                      src={selectedTokenInfo.icon}
                      alt={selectedTokenInfo.symbol}
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
                          onClick={() => handleTokenSelect(token.name)}
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

            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
              <div className="relative">
                <Hash className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
                <input
                  type="text"
                  value={formattedQuantity}
                  onChange={(e) => {
                    const formatted = formatNumber(e.target.value);
                    setFormattedQuantity(formatted);
                    setCurrentOrder({ ...currentOrder, quantity: parseFormattedNumber(formatted) });
                  }}
                  placeholder="0.00"
                  className="w-full h-9 pl-8 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Price (sats)</label>
              <div className="relative">
                <Hash className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
                <input
                  type="text"
                  value={formattedPrice}
                  onChange={(e) => {
                    const formatted = formatNumber(e.target.value);
                    setFormattedPrice(formatted);
                    setCurrentOrder({ ...currentOrder, price: parseFormattedNumber(formatted) });
                  }}
                  placeholder="100,000"
                  className="w-full h-9 pl-8 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full h-9 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-1.5 text-sm font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''
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

        <div className="mt-4 border-t border-gray-100 pt-4">
          <AutoRebalancing
            enabled={autoRebalancingEnabled}
            spread={autoRebalancingSpread}
            onEnabledChange={handleAutoRebalancingChange}
            onSpreadChange={handleSpreadChange}
          />
        </div>
      </div>
    </div>
  );
}