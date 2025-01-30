import React, { useState, useMemo } from 'react';
import { useMain } from '../context/MainContext';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { SplitUtxoModal } from './SplitUtxoModal';
import { ArrowUpDown, Loader2, RotateCw, SplitSquareHorizontal } from 'lucide-react';

export function LiquidityList() {
  const { outputsHealth, apiClient, refreshBalances, balances, warnings } = useMain();
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedOutputs, setSelectedOutputs] = useState<any[]>([]);

  if (!outputsHealth) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading liquidity information...
      </div>
    );
  }

  const handleSplitAsset = async (token: string) => {
    try {
      setProcessing(prev => ({ ...prev, [token]: true }));
      await apiClient.splitAsset({ token });
      await refreshBalances();
    } catch (error) {
      console.error('Failed to split asset:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [token]: false }));
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshBalances();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatBalance = (amount: string | undefined, decimals: number) => {
    if (!amount) return '0.00';
    try {
      const value = Number(amount) / Math.pow(10, decimals);
      if (isNaN(value)) return '0.00';
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      });
    } catch (error) {
      return '0.00';
    }
  };

  // Filter and sort supported assets
  const supportedAssets = [
    ['BTC', outputsHealth['BTC'] || []],
    ...Object.entries(outputsHealth)
      .filter(([asset]) => AVAILABLE_TOKENS.some(t => t.name === asset))
  ].sort((a, b) => {
    if (a[0] === 'btc') return -1;
    if (b[0] === 'btc') return 1;
    const tokenA = AVAILABLE_TOKENS.find(t => t.name === a[0]);
    const tokenB = AVAILABLE_TOKENS.find(t => t.name === b[0]);
    return (tokenA?.symbol || '').localeCompare(tokenB?.symbol || '');
  });

  const hasLowLiquidityAssets = useMemo(() => {
    return supportedAssets.some(([_, outputs]) => outputs.length < 5);
  }, [supportedAssets]);

  const handleSplitClick = (asset: string, outputs: any[]) => {
    const balance = balances.find(b => b.token === asset);
    console.log('Found balance:', balance); // Debug log
    setSelectedAsset(asset);
    setSelectedOutputs(outputs);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4" />
          Asset Liquidity
          {hasLowLiquidityAssets && (
            <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full bg-yellow-100 text-yellow-800">
              Low UTXOs
            </span>
          )}
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="border-t border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-1/4 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th scope="col" className="w-1/4 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th scope="col" className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                UTXOs
              </th>
              <th scope="col" className="w-1/6 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="w-1/6 relative px-3 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {supportedAssets.map(([asset, outputs]) => {
              const token = asset === 'BTC' 
                ? { 
                    name: 'Bitcoin', 
                    symbol: 'BTC', 
                    decimals: 8, 
                    icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
                  } 
                : AVAILABLE_TOKENS.find(t => t.name === asset);
              const balance = balances.find(b => b.token === asset);
              const isProcessing = processing[asset] || false;
              const hasLowLiquidity = outputs.length < 5;
              const totalBalance = outputs.reduce((sum: number, output: any) => {
                return sum + (output.amount || 0);
              }, 0);
              
              return (
                <tr key={asset} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <img src={token?.icon} alt={token?.symbol} className="w-5 h-5 rounded-full" />
                      <span className="font-medium text-gray-900">{token?.symbol}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                    {formatBalance(balance?.balance, token?.decimals || 8)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                    {outputs.length}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {hasLowLiquidity ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Low
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full bg-green-100 text-green-800">
                        Good
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                    {hasLowLiquidity && (
                      <button
                        onClick={() => handleSplitClick(asset, outputs)}
                        disabled={isProcessing}
                        className={`
                          min-w-[80px] px-3 py-1 text-xs font-medium rounded-md
                          flex items-center justify-center gap-1.5 shadow-sm
                          ${isProcessing
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-white border border-yellow-200 text-yellow-900 hover:bg-yellow-50 hover:border-yellow-300'
                          }
                        `}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Fixing...</span>
                          </>
                        ) : (
                          <>
                            <SplitSquareHorizontal className="w-3 h-3" />
                            <span>Split UTXOs</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SplitUtxoModal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset || ''}
        outputs={selectedOutputs}
        totalBalance={balances.find(b => b.token === selectedAsset)?.balance || 0}
      />
    </div>
  );
}
