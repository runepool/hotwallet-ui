import { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Plus, Coins, AlertCircle, ArrowUpDown, Hash } from 'lucide-react';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { useMain } from '../context/MainContext';
import { RuneOrder, TokenBalance } from '../types/api';
import { getAutoRebalancing, updateAutoRebalancing } from '../api/autoRebalancing';
import { AutoRebalancing } from './AutoRebalancing';

interface MarketMakerToolProps {
  selectedToken: string | null;
  balances: TokenBalance[];
  onTokenSelect: (token: string | null) => void;
  orderType: 'ask' | 'bid';
  onOrderTypeChange: (type: 'ask' | 'bid') => void;
}

export function MarketMakerTool({ selectedToken, balances, onTokenSelect, orderType, onOrderTypeChange }: MarketMakerToolProps) {
  const { addOrder } = useMain();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Auto rebalancing settings
  const [autoRebalancingEnabled, setAutoRebalancingEnabled] = useState(false);
  const [autoRebalancingSpread, setAutoRebalancingSpread] = useState('0.5');
  
  // Market maker settings
  const [numberOfOrders, setNumberOfOrders] = useState(5); // Default 5 orders
  const [customDistributionAmount, setCustomDistributionAmount] = useState<string>('');
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 0,
    current: 0,
    inputValue: ''
  });
  // Update local state when orderType prop changes
  useEffect(() => {
    // Update any local state that depends on order type
  }, [orderType]);
  const [spreadPercentage, setSpreadPercentage] = useState(2); // Default 2% spread
  
  // Get the selected token's balance and info
  const selectedTokenBalance = balances.find(b => b.token === selectedToken);
  const tokenInfo = AVAILABLE_TOKENS.find(t => t.name === selectedToken);
  
  // Handle outside clicks for token dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTokenDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle token selection
  const handleTokenSelect = (tokenName: string) => {
    onTokenSelect(tokenName);
    setIsTokenDropdownOpen(false);
  };
  
  const selectableTokens = AVAILABLE_TOKENS.filter(token => token.symbol !== 'BTC');
  const selectedTokenInfo = selectableTokens.find(token => token.name === selectedToken);
  
  // Calculate the current price based on existing orders or set a default
  // and fetch auto-rebalancing settings
  useEffect(() => {
    if (selectedToken) {
      // For a real implementation, you might want to fetch the current market price
      // from an API or calculate it based on existing orders
      // For now, we'll set a default value of 1.0
      setPriceRange(prev => ({
        ...prev,
        current: 1.0
      }));
      
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
  
  // Update min and max price based on current price and spread
  useEffect(() => {
    if (priceRange.current > 0) {
      const spread = priceRange.current * (spreadPercentage / 100);
      
      if (orderType === 'bid') {
        // For bids, price range is below current price
        setPriceRange(prev => ({
          ...prev,
          min: prev.current - spread,
          max: prev.current
        }));
      } else {
        // For asks, price range is above current price
        setPriceRange(prev => ({
          ...prev,
          min: prev.current,
          max: prev.current + spread
        }));
      }
    }
  }, [priceRange.current, spreadPercentage, orderType]);
  
  
  // Generate the orders based on settings - memoized to avoid recalculating on every render
  const previewOrders = useMemo((): RuneOrder[] => {
    if (!selectedToken || !tokenInfo || !selectedTokenBalance) return [];
    
    try {
      // Calculate the total amount to distribute (10% of balance by default)
      const decimals = tokenInfo.decimals || 0;
      const rawBalance = selectedTokenBalance.balance;
      const actualBalance = +rawBalance / (10 ** decimals);
      
      // Use custom amount if set, otherwise use 10% of balance
      let totalAmount;
      if (customDistributionAmount !== undefined && customDistributionAmount !== '') {
        totalAmount = parseFloat(customDistributionAmount);
      } else {
        totalAmount = (actualBalance * 10) / 100; // 10% of balance
      }
      
      const amountPerOrder = totalAmount / numberOfOrders;
      
      // Calculate price step based on spread percentage
      const currentPrice = priceRange.current || 1.0;
      const spreadAmount = currentPrice * (spreadPercentage / 100);
      
      let minPrice, maxPrice;
      if (orderType === 'ask') {
        minPrice = currentPrice;
        maxPrice = currentPrice + spreadAmount;
      } else {
        minPrice = currentPrice - spreadAmount;
        maxPrice = currentPrice;
      }
      
      const priceStep = (maxPrice - minPrice) / (Math.max(numberOfOrders - 1, 1));
      
      // Create preview orders
      const orders: RuneOrder[] = [];
      
      for (let i = 0; i < numberOfOrders; i++) {
        // Calculate price for this order
        const price = minPrice + (i * priceStep);
        
        // Convert to the format expected by the API
        const priceFormatted = Math.round(price * 10000).toString();
        
        // Calculate quantity for this order
        const quantityRaw = amountPerOrder * Math.pow(10, decimals);
        const quantity = Math.floor(quantityRaw).toString();
        
        // Create the preview order
        orders.push({
          id: `preview-${i}`,
          rune: selectedToken,
          quantity: quantity,
          price: priceFormatted,
          type: orderType,
          filledQuantity: '0',
          createdAt: new Date().toISOString()
        });
      }
      
      return orders;
    } catch (error) {
      console.error('Error generating preview orders:', error);
      return [];
    }
  }, [selectedToken, tokenInfo, selectedTokenBalance, numberOfOrders, spreadPercentage, priceRange, orderType, customDistributionAmount]);
  
  // Don't update preview orders in the context - we're not showing them in the order book
  
  // Handle auto-rebalancing toggle
  const handleAutoRebalancingChange = async (enabled: boolean) => {
    if (!selectedToken) return;
    
    setAutoRebalancingEnabled(enabled);
    try {
      await updateAutoRebalancing(selectedToken, {
        enabled,
        spread: autoRebalancingSpread
      });
    } catch (err) {
      console.error('Failed to update auto-rebalancing:', err);
      setError(err instanceof Error ? err.message : 'Failed to update auto-rebalancing');
    }
  };

  // Handle spread changes
  const handleSpreadChange = (value: string) => {
    setAutoRebalancingSpread(value);
  };

  // Handle spread blur (save changes)
  const handleSpreadBlur = async () => {
    if (!selectedToken) return;
    
    try {
      await updateAutoRebalancing(selectedToken, {
        enabled: autoRebalancingEnabled,
        spread: autoRebalancingSpread
      });
    } catch (err) {
      console.error('Failed to update auto-rebalancing spread:', err);
      setError(err instanceof Error ? err.message : 'Failed to update auto-rebalancing');
    }
  };
  
  // Handle form submission for creating market maker orders
  const handleSubmit = async () => {
    if (!selectedToken) {
      setError('Please select a token');
      return;
    }
    
    if (numberOfOrders <= 0) {
      setError('Number of orders must be greater than 0');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create all orders
      for (const order of previewOrders) {
        // Create a proper order DTO for the API
        const orderDto = {
          rune: order.rune,
          quantity: order.quantity,
          price: order.price,
          type: order.type
        };
        await addOrder(orderDto);
      }
      
      setSuccess(`Successfully created ${previewOrders.length} ${orderType} orders for ${selectedToken}`);
    } catch (err) {
      console.error('Failed to create market maker orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to create orders');
    } finally {
      setLoading(false);
    }
  };
  
  // Format balance for display - keeping this for potential future use
  const formatBalance = (balance: string, decimals: number): string => {
    const value = parseFloat(balance) / Math.pow(10, decimals);
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  };
  
  // Calculate the distribution amount
  const getDistributionAmount = (): string => {
    if (!selectedTokenBalance) return '0';
    
    const decimals = tokenInfo?.decimals || 0;
    const rawBalance = selectedTokenBalance.balance;
    const actualBalance = +rawBalance / (10 ** decimals);
    
    // Use custom amount if set, otherwise use 10% of balance
    if (customDistributionAmount !== undefined) {
      return customDistributionAmount;
    }
    
    // Default to 10% of balance
    const amount = (actualBalance * 10) / 100;
    return amount.toFixed(4);
  };
  
  if (!selectedToken) {
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Select a token to use the market maker tool</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 flex flex-col space-y-3">
        
        <div className="flex items-center gap-3">
          <div className="flex-1">
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
          
          <div className="flex-1">
            <div className="h-9 pl-8 pr-3 bg-white border border-gray-200 rounded-lg flex items-center text-sm relative">
              <Coins className="h-4 w-4 text-gray-400 absolute left-2" />
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={customDistributionAmount !== undefined ? customDistributionAmount : getDistributionAmount()}
                  onChange={(e) => setCustomDistributionAmount(e.target.value === '' ? '0' : e.target.value)}
                  className="w-24 border-none focus:outline-none focus:ring-0 bg-transparent text-sm text-right"
                />
                <span className="ml-1">{tokenInfo?.symbol || 'tokens'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-3">
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-50 text-red-700 rounded-md flex items-center gap-1 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-3 px-3 py-2 bg-green-50 text-green-700 rounded-md flex items-center gap-1 text-sm">
            <BookOpen className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}
        
        <div className="space-y-2">
      
          <div>
            <label htmlFor="currentPrice" className="block text-xs text-gray-500 mb-1">Current Price (sats)</label>
            <div>
              <input
                id="currentPrice"
                type="text"
                inputMode="decimal"
                value={priceRange.inputValue}
                onChange={(e) => {
                  // Allow empty input or valid numbers (including starting with a decimal)
                  const value = e.target.value;
                  
                  // Accept empty, decimal point, or valid number patterns
                  if (value === '' || value === '.' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                    // Calculate the numeric value
                    let numValue = 0;
                    if (value !== '' && value !== '.') {
                      numValue = parseFloat(value);
                    }
                    
                    setPriceRange(prev => ({
                      ...prev,
                      current: numValue,
                      inputValue: value
                    }));
                  }
                }}
                placeholder="100.000"
                className="w-full h-9 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
      
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <label className="block text-xs text-gray-500">Distribution Amount</label>
              <span className="text-xs text-gray-500">
                {getDistributionAmount()} {tokenInfo?.symbol || 'tokens'} will be distributed
              </span>
            </div>
          </div>
      
          <div>
            <div className="flex justify-between items-center mb-0.5">
              <label className="block text-xs text-gray-500">Number of Orders</label>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 truncate">
                  {(parseFloat(getDistributionAmount()) / numberOfOrders).toFixed(4)}
                </span>
                <span className="text-xs text-gray-500 ml-1">{tokenInfo?.symbol || 'tokens'}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center">
                <input
                  id="numberOfOrders"
                  type="range"
                  min="1"
                  max="20"
                  value={numberOfOrders}
                  onChange={(e) => setNumberOfOrders(parseInt(e.target.value))}
                  className="w-full h-9 px-3 text-sm"
                />
                <span className="text-sm font-medium ml-2 w-10 text-right">{numberOfOrders}</span>
              </div>
            </div>
          </div>
      
          <div>
            <label className="block text-xs text-gray-500 mb-1">Price Spread (%)</label>
            <div>
              <div className="flex items-center">
                <input
                  id="spreadPercentage"
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={spreadPercentage}
                  onChange={(e) => setSpreadPercentage(parseFloat(e.target.value))}
                  className="w-full h-9 px-3 text-sm"
                />
                <span className="text-sm font-medium ml-2 w-10 text-right">{spreadPercentage}%</span>
              </div>

            </div>
          </div>
      

      

      
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedToken}
              className={`w-full h-9 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-1.5 text-sm font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <ArrowUpDown className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create {numberOfOrders} {orderType} Orders</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Auto Rebalancing Section */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <AutoRebalancing
            enabled={autoRebalancingEnabled}
            spread={autoRebalancingSpread}
            onEnabledChange={handleAutoRebalancingChange}
            onSpreadChange={handleSpreadChange}
            onSpreadBlur={handleSpreadBlur}
          />
        </div>
      </div>
    </div>
  );
}
