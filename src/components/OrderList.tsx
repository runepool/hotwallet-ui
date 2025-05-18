import { Search, Trash2, AlertTriangle } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { useMain } from '../context/MainContext';
import { RuneOrder } from '../types/api';
import { BatchOrderForm } from './BatchOrderForm';
import { LiquidityList } from './LiquidityList';
import { TokenBalances } from './TokenBalances';
import { TransactionList } from './TransactionList';

interface OrderTableProps {
  orders: RuneOrder[];
  searchTerm?: string;
  onDeleteOrder: (orderId: string) => Promise<void>;
  className?: string;
}

function OrderTable({ orders, title, type, searchTerm = '', onDeleteOrder, className, headerPosition = 'top', showColumnHeaders = false }: OrderTableProps & { headerPosition?: 'top' | 'bottom', title: string, type: 'ask' | 'bid', showColumnHeaders?: boolean }) {
  // Filter orders by search term if provided
  const filteredOrders = searchTerm
    ? orders.filter(order => {
        const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
        const searchLower = searchTerm.toLowerCase();
        return (
          order.rune.toLowerCase().includes(searchLower) ||
          order.quantity.toString().includes(searchLower) ||
          order.price.toString().includes(searchLower) ||
          (token?.symbol || '').toLowerCase().includes(searchLower)
        );
      })
    : orders;
  // Format number with thousand separators and only show decimals when necessary
  const formatNumber = (value: string | number, maxDecimals: number = 0): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    // Check if the number has decimal places
    const hasDecimals = num !== Math.floor(num);

    // Format with proper decimal places - only show if necessary
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: hasDecimals ? maxDecimals : 0
    });

    return formatted;
  };

  const formatQuantity = (order: RuneOrder) => {
    const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
    if (!token) return formatNumber(order.quantity, 0);
    const decimals = token.decimals || 0;
    return formatNumber(+order.quantity / 10 ** decimals, decimals > 0 ? Math.min(decimals, 6) : 0);
  };

  // Calculate total rune amount and BTC value
  const totalRune = filteredOrders.reduce((sum, order) => {
    const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
    const decimals = token?.decimals || 0;
    const actualQuantity = +order.quantity / (10 ** decimals);
    return sum + actualQuantity;
  }, 0);
  
  const totalBtcValue = filteredOrders.reduce((sum, order) => {
    const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
    const decimals = token?.decimals || 0;
    const actualQuantity = +order.quantity / (10 ** decimals);
    const btcPrice = parseFloat(order.price) / 10000; // Price in BTC
    return sum + (actualQuantity * btcPrice);
  }, 0);

  const header = (
    <div className="px-3 py-1.5 border-b border-gray-100 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <span className="text-xs text-gray-500">{filteredOrders.length} orders</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="font-medium text-gray-500">Total:</span>
            <span className="ml-1 font-medium text-gray-900">{formatNumber(totalRune, 4)}</span>
          </div>
          <div className="text-xs">
            <span className="font-medium text-gray-500">Value:</span>
            <span className="ml-1 font-medium text-gray-900">{formatNumber(totalBtcValue, 8)} BTC</span>
          </div>
        </div>
      </div>
      {showColumnHeaders && (
        <div className="flex mt-1.5">
          <div className="w-[35%]">
            <span className="text-xs font-medium text-gray-500">Token</span>
          </div>
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
        </div>
      )}
    </div>
  );

  const ordersToDisplay = type === 'ask' ? [...filteredOrders].reverse() : filteredOrders;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${className}`}>
      {headerPosition === 'top' && <div className="sticky top-0 z-10">{header}</div>}
      <div className={`flex-1 overflow-auto ${type === 'ask' ? 'flex flex-col justify-end' : ''}`}>
        <table className="min-w-full">
          <tbody className={`divide-y divide-gray-100 ${type === 'ask' ? 'flex flex-col' : ''}`}>
            {ordersToDisplay.map((order) => {
              const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
              const progress = order.filledQuantity ? (+order.filledQuantity / +order.quantity) * 100 : 0;

              // Order details

              return (
                <tr
                  key={order.id}
                  className={`hover:bg-gray-50 relative ${type === 'ask' ? 'flex' : ''}`}
                >
                  <td className="w-[35%] px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <img
                        src={token?.icon ?? ''}
                        alt={token?.symbol ?? ''}
                        className="w-5 h-5 rounded-full"
                      />
                      <div>
                        <span className="font-medium text-sm text-gray-900">{token?.symbol || order.rune}</span>

                      </div>
                    </div>
                  </td>
                  <td className="w-[20%] px-3 py-2 text-right whitespace-nowrap text-sm text-gray-900">
                    {formatQuantity(order)}
                  </td>
                  <td className={`w-[20%] px-3 py-2 text-right whitespace-nowrap text-sm font-medium ${type === 'ask' ? 'text-red-500' : 'text-green-500'}`}>
                    {formatNumber(parseFloat(order.price) / 10000, 4)}
                  </td>
                  <td className="w-[15%] px-3 py-2 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-gray-500">{progress.toFixed(2)}%</span>
                      {progress > 0 && (
                        <div className="w-16 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full ${type === 'ask' ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="w-[10%] px-3 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => onDeleteOrder(order.id!)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Delete order"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
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
      {headerPosition === 'bottom' && <div className="sticky bottom-0 z-10">{header}</div>}
    </div>
  );
}

export function OrderList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'orders' | 'transactions' | 'liquidity'>('orders');
  const { orders, deleteOrder, deleteBatchOrders, refreshOrders, outputsHealth, balances } = useMain();
  const defaultToken = AVAILABLE_TOKENS.find(token => token.symbol !== 'BTC')?.name || null;
  const [selectedToken, setSelectedToken] = useState<string | null>(defaultToken);
  const [showAskConfirmation, setShowAskConfirmation] = useState(false);
  const [showBidConfirmation, setShowBidConfirmation] = useState(false);

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      await refreshOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };
  
  // Format number with thousand separators and only show decimals when necessary
  const formatNumber = (value: string | number, maxDecimals: number = 0): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    
    // Check if the number has decimal places
    const hasDecimals = num !== Math.floor(num);
    
    // Format with proper decimal places - only show if necessary
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: hasDecimals ? maxDecimals : 0
    });
    
    return formatted;
  };
  
  const formatQuantity = (order: RuneOrder) => {
    const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
    if (!token) return formatNumber(order.quantity, 0);
    const decimals = token.decimals || 0;
    return formatNumber(+order.quantity / 10 ** decimals, decimals > 0 ? Math.min(decimals, 6) : 0);
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

  const handleRemoveAllAskOrders = useCallback(async () => {
    if (askOrders.length === 0) return;
    
    try {
      const orderIds = askOrders.map(order => order.id!);
      await deleteBatchOrders(orderIds);
      setShowAskConfirmation(false);
    } catch (error) {
      console.error('Failed to remove all ask orders:', error);
    }
  }, [askOrders, deleteBatchOrders]);

  const handleRemoveAllBidOrders = useCallback(async () => {
    if (bidOrders.length === 0) return;
    
    try {
      const orderIds = bidOrders.map(order => order.id!);
      await deleteBatchOrders(orderIds);
      setShowBidConfirmation(false);
    } catch (error) {
      console.error('Failed to remove all bid orders:', error);
    }
  }, [bidOrders, deleteBatchOrders]);

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
              {/* Ask Orders Section */}
              <div className="flex-1 max-h-[50%] flex flex-col">
                <div className="sticky top-0 z-10 bg-white">
                  <div className="px-3 py-1.5 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">Ask Orders</h3>
                        <span className="text-xs text-gray-500">{askOrders.length} orders</span>
                        {askOrders.length > 0 && (
                          <button
                            onClick={() => setShowAskConfirmation(true)}
                            className="ml-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove All
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs">
                          <span className="font-medium text-gray-500">Total:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {formatNumber(askOrders.reduce((sum, order) => {
                              const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
                              const decimals = token?.decimals || 0;
                              return sum + (+order.quantity / (10 ** decimals));
                            }, 0), 4)}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium text-gray-500">Value:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {formatNumber(askOrders.reduce((sum, order) => {
                              const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
                              const decimals = token?.decimals || 0;
                              const qty = +order.quantity / (10 ** decimals);
                              const price = parseFloat(order.price) / 10000;
                              return sum + (qty * price);
                            }, 0), 8)} BTC
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Column headers moved to spread bar */}
                  </div>
                </div>
                <div className="overflow-auto">
                  <div className="min-h-full">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-100">
                        {[...askOrders].reverse().map((order) => {
                          const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
                          const progress = order.filledQuantity ? (+order.filledQuantity / +order.quantity) * 100 : 0;
                          return (
                            <tr key={order.id} className="hover:bg-gray-50 relative">
                              <td className="w-[35%] px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={token?.icon ?? ''}
                                    alt={token?.symbol ?? ''}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <div>
                                    <span className="font-medium text-sm text-gray-900">{token?.symbol || order.rune}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="w-[20%] px-3 py-2 text-right whitespace-nowrap text-sm text-gray-900">
                                {formatQuantity(order)}
                              </td>
                              <td className="w-[20%] px-3 py-2 text-right whitespace-nowrap text-sm font-medium text-red-500">
                                {formatNumber(parseFloat(order.price) / 10000, 4)}
                              </td>
                              <td className="w-[15%] px-3 py-2 text-right whitespace-nowrap">
                                <div className="flex flex-col items-end">
                                  <span className="text-xs font-medium text-gray-500">{progress.toFixed(2)}%</span>
                                  {progress > 0 && (
                                    <div className="w-16 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                      <div
                                        className="h-full bg-red-500"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="w-[10%] px-3 py-2 text-right whitespace-nowrap">
                                <button
                                  onClick={() => onDeleteOrder(order.id!)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                  aria-label="Delete order"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Spread indicator with column headers - all on one row */}
              <div className="px-3 py-1.5 border-y border-gray-100 bg-gray-50/75">
                <div className="flex items-center">
                  <div className="flex items-center mr-4">
                    <span className="text-xs font-medium text-gray-500 mr-2">Spread:</span>
                    <span className="text-xs font-medium text-gray-900">
                      {askOrders.length > 0 && bidOrders.length > 0 && askOrders[0] && bidOrders[0] 
                        ? ((+askOrders[0].price - +bidOrders[0].price) / +askOrders[0].price * 100).toFixed(2) + '%' 
                        : '-'}
                    </span>
                  </div>
                  
                  <div className="w-[35%] ml-4">
                    <span className="text-xs font-medium text-gray-500">Token</span>
                  </div>
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
                </div>
              </div>

              {/* Bid Orders Section */}
              <div className="flex-1 max-h-[50%] flex flex-col">
                <div className="overflow-auto">
                  <div className="min-h-full">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-100">
                        {bidOrders.map((order) => {
                          const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
                          const progress = order.filledQuantity ? (+order.filledQuantity / +order.quantity) * 100 : 0;
                          return (
                            <tr key={order.id} className="hover:bg-gray-50 relative">
                              <td className="w-[35%] px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={token?.icon ?? ''}
                                    alt={token?.symbol ?? ''}
                                    className="w-5 h-5 rounded-full"
                                  />
                                  <div>
                                    <span className="font-medium text-sm text-gray-900">{token?.symbol || order.rune}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="w-[20%] px-3 py-2 text-right whitespace-nowrap text-sm text-gray-900">
                                {formatQuantity(order)}
                              </td>
                              <td className="w-[20%] px-3 py-2 text-right whitespace-nowrap text-sm font-medium text-green-500">
                                {formatNumber(parseFloat(order.price) / 10000, 4)}
                              </td>
                              <td className="w-[15%] px-3 py-2 text-right whitespace-nowrap">
                                <div className="flex flex-col items-end">
                                  <span className="text-xs font-medium text-gray-500">{progress.toFixed(2)}%</span>
                                  {progress > 0 && (
                                    <div className="w-16 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                      <div
                                        className="h-full bg-green-500"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="w-[10%] px-3 py-2 text-right whitespace-nowrap">
                                <button
                                  onClick={() => onDeleteOrder(order.id!)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                  aria-label="Delete order"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="sticky bottom-0 z-10 bg-white">
                  <div className="px-3 py-1.5 border-t border-gray-100 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">Bid Orders</h3>
                        <span className="text-xs text-gray-500">{bidOrders.length} orders</span>
                        {bidOrders.length > 0 && (
                          <button
                            onClick={() => setShowBidConfirmation(true)}
                            className="ml-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove All
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs">
                          <span className="font-medium text-gray-500">Total:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {formatNumber(bidOrders.reduce((sum, order) => {
                              const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
                              const decimals = token?.decimals || 0;
                              return sum + (+order.quantity / (10 ** decimals));
                            }, 0), 4)}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium text-gray-500">Value:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {formatNumber(bidOrders.reduce((sum, order) => {
                              const token = AVAILABLE_TOKENS.find(t => t.name === order.rune);
                              const decimals = token?.decimals || 0;
                              const qty = +order.quantity / (10 ** decimals);
                              const price = parseFloat(order.price) / 10000;
                              return sum + (qty * price);
                            }, 0), 8)} BTC
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-[400px] h-[calc(100vh-10rem)] flex flex-col gap-3">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200" style={{ maxHeight: '450px' }}>
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

      {/* Confirmation Dialogs */}
      {showAskConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4 text-amber-500">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium">Confirm Deletion</h3>
            </div>
            <p className="mb-4">Are you sure you want to remove all {askOrders.length} ask orders? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAskConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveAllAskOrders}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                Remove All
              </button>
            </div>
          </div>
        </div>
      )}

      {showBidConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4 text-amber-500">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium">Confirm Deletion</h3>
            </div>
            <p className="mb-4">Are you sure you want to remove all {bidOrders.length} bid orders? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBidConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveAllBidOrders}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                Remove All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}