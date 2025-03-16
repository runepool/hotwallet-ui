import React, { useState, useMemo, useEffect } from 'react';
import { useMain } from '../context/MainContext';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { SplitUtxoModal } from './SplitUtxoModal';
import { AutoSplitConfigModal } from './AutoSplitConfigModal';
import { ArrowUpDown, Loader2, RotateCw, SplitSquareHorizontal, Settings, AlertTriangle } from 'lucide-react';
import { OutputHealth } from '../types/api';

export function LiquidityList() {
  const { outputsHealth, apiClient, refreshBalances, balances, warnings, addWarning } = useMain();
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedOutputs, setSelectedOutputs] = useState<OutputHealth[]>([]);
  const [isAutoSplitModalOpen, setIsAutoSplitModalOpen] = useState(false);
  const [selectedAutoSplitAsset, setSelectedAutoSplitAsset] = useState<string>('');
  const [autoSplitConfigs, setAutoSplitConfigs] = useState<Record<string, boolean>>({});

  const fetchAutoSplitConfigs = async () => {
    try {
      const configs = await apiClient.getAllAutoSplitConfigs();
      const configMap = configs.reduce((acc, config) => ({
        ...acc,
        [config.asset_name]: config.enabled
      }), {});
      setAutoSplitConfigs(configMap);
    } catch (error) {
      console.error('Failed to fetch auto-split configs:', error);
    }
  };

  useEffect(() => {
    fetchAutoSplitConfigs();
  }, []);

  if (!outputsHealth) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading liquidity information...
      </div>
    );
  }

  const handleSplitClick = (asset: string, outputs: OutputHealth[]) => {
    setSelectedAsset(asset);
    setSelectedOutputs(outputs);
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
      console.error('Error formatting balance:', error);
      return '0.00';
    }
  };

  const handleOpenAutoSplitConfig = (token: string) => {
    setSelectedAutoSplitAsset(token);
    setIsAutoSplitModalOpen(true);
  };

  // Filter and sort supported assets
  const supportedAssets = useMemo(() => {
    if (!outputsHealth) {
      console.log('No outputsHealth data');
      return [];
    }

    console.log('OutputsHealth:', outputsHealth);

    const entries = Object.entries(outputsHealth).filter(([asset]) =>
      asset === 'BTC' || AVAILABLE_TOKENS.some(t => t.name === asset)
    );

    console.log('Filtered entries:', entries);

    return entries.sort((a, b) => {
      if (a[0] === 'BTC') return -1;
      if (b[0] === 'BTC') return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [outputsHealth]);

  const hasLowLiquidityAssets = useMemo(() => {
    return supportedAssets.some(([_, outputs]) => outputs.length < 5);
  }, [supportedAssets]);

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
            {supportedAssets.map(([token, outputs]) => {
              const balance = balances.find(b => b.token === token);
              const tokenInfo = token === 'BTC'
                ? {
                  name: 'Bitcoin',
                  symbol: 'BTC',
                  decimals: 8,
                  icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
                }
                : AVAILABLE_TOKENS.find(t => t.name === token);

              if (!tokenInfo) return null;

              const outputCount = Array.isArray(outputs) ? outputs.length : 0;
              const hasLowLiquidity = outputCount < 5;
              const isProcessing = processing[token];

              return (
                <tr key={token} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <img src={tokenInfo.icon} alt={tokenInfo.symbol} className="w-5 h-5 rounded-full" />
                      <span className="font-medium text-gray-900">{tokenInfo.symbol}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                    {formatBalance(balance?.balance, tokenInfo.decimals)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                    {outputCount}
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSplitClick(token, outputs)}
                        disabled={isProcessing}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${hasLowLiquidity
                            ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                            : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                          }`}
                      >
                        {hasLowLiquidity && <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />}
                        <SplitSquareHorizontal className="w-4 h-4 mr-1" />
                        Split
                      </button>
                      {/* <button
                        disabled
                        onClick={() => handleOpenAutoSplitConfig(token)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${autoSplitConfigs[token]
                            ? 'text-green-700 bg-green-100 hover:bg-green-200'
                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          }`}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        {autoSplitConfigs[token] ? 'Auto-Split On' : 'Auto-Split Off'}
                      </button> */}
                    </div>
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
        totalBalance={balances.find(b => b.token === selectedAsset)?.balance ? Number(balances.find(b => b.token === selectedAsset)?.balance) : 0}
      />

      <AutoSplitConfigModal
        isOpen={isAutoSplitModalOpen}
        onClose={() => setIsAutoSplitModalOpen(false)}
        assetName={selectedAutoSplitAsset}
        onConfigSaved={fetchAutoSplitConfigs}
      />
    </div>
  );
}
