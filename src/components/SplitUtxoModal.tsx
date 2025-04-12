import React, { useState, useMemo, useEffect } from 'react';
import { useMain } from '../context/MainContext';
import { X, SplitSquareHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { OutputHealth } from '../types/api';

interface SplitUtxoModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: string;
  outputs: OutputHealth[];
  totalBalance: number;
}

export function SplitUtxoModal({ isOpen, onClose, asset, outputs, totalBalance }: SplitUtxoModalProps) {
  const [numOutputs, setNumOutputs] = useState(2);
  const [amountPerSplit, setAmountPerSplit] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiClient, refreshHealth } = useMain();

  const token = useMemo(() => {
    return asset === 'BTC' 
      ? { 
          name: 'Bitcoin', 
          symbol: 'BTC', 
          decimals: 8, 
          icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
        } 
      : AVAILABLE_TOKENS.find(t => t.name === asset);
  }, [asset]);

  const MIN_BTC_SPLIT = 10_000; // 10k sats minimum per split

  const maxAllowedSplits = useMemo(() => {
    if (asset === 'BTC') {
      return Math.min(100, Math.floor(totalBalance / MIN_BTC_SPLIT));
    }
    return 100;
  }, [asset, totalBalance]);

  const handleNumOutputsChange = (newValue: number) => {
    const value = Math.max(outputs.length, Math.min(maxAllowedSplits, newValue));
    setNumOutputs(value);
    if (token && totalBalance > 0) {
      const rawAmount = totalBalance / value;
      setAmountPerSplit(+rawAmount.toFixed());
    }
  };

  // Initialize numOutputs when modal opens
  useEffect(() => {
    if (isOpen) {
      if (outputs.length > numOutputs) {
        setNumOutputs(outputs.length);
      } else if (numOutputs > maxAllowedSplits) {
        setNumOutputs(maxAllowedSplits);
      }
    }
  }, [isOpen, outputs.length, maxAllowedSplits]);

  const splitError = useMemo(() => {
    if (asset === 'BTC' && amountPerSplit < MIN_BTC_SPLIT) {
      return `Cannot split below ${MIN_BTC_SPLIT} satoshis per UTXO`;
    }
    return null;
  }, [asset, amountPerSplit]);

  useEffect(() => {
    if (token && totalBalance > 0) {
      const rawAmount = totalBalance / numOutputs;
      setAmountPerSplit(+rawAmount.toFixed());
    }
  }, [totalBalance, numOutputs, token]);

  const balancePerSplit = useMemo(() => {
    if (!token) return '0';
    return (amountPerSplit / (10 ** token.decimals)).toFixed(token.decimals);
  }, [amountPerSplit, token]);

  if (!isOpen || !token) return null;

  const handleSplit = async () => {
    setError(null);
    try {
      setLoading(true);
      const result = await apiClient.splitAsset({
        asset_name: asset,
        splits: numOutputs,
        amount_per_split: amountPerSplit
      });
      
      if (result.success) {
        await refreshHealth();
        onClose();
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Failed to split UTXOs:', err);
      setError(err instanceof Error ? err.message : 'Failed to split UTXOs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SplitSquareHorizontal className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Split UTXOs</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    {error.includes('Insufficient') ? (
                      <>
                        <span className="font-medium">Insufficient Funds:</span> {error.replace('Insufficient funds: ', '').replace('Insufficient ', '')}
                      </>
                    ) : (
                      error
                    )}
                  </div>
                </div>
              </div>
            )}
            {splitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{splitError}</span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src={token.icon} alt={token.symbol} className="w-6 h-6" />
                  <label className="block text-sm font-medium text-gray-700">
                    {token.symbol}
                  </label>
                </div>
                <span className="text-sm text-gray-500">
                  Current UTXOs: {outputs.length}
                </span>
              </div>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900">Total Balance:</span>
                  <span className="font-medium">{(totalBalance / (10 ** token.decimals)).toFixed(token.decimals)} {token.symbol}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Number of Splits
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min={outputs.length}
                  max={maxAllowedSplits}
                  value={numOutputs}
                  onChange={(e) => handleNumOutputsChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <input 
                  type="number"
                  min={outputs.length}
                  max={maxAllowedSplits}
                  value={numOutputs}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      handleNumOutputsChange(val);
                    }
                  }}
                  className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <p className="text-sm text-gray-500">
                Choose how many equal-sized UTXOs to split into ({outputs.length}-{maxAllowedSplits})
              </p>
              <div className="p-4 bg-yellow-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-800">Balance per Split:</span>
                  <span className="font-medium text-yellow-900">{balancePerSplit} {token.symbol}</span>
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {Array.from({ length: Math.min(numOutputs, 20) }).map((_, i) => (
                    <div 
                      key={i}
                      className="h-2 flex-1 min-w-[20px] bg-yellow-200 rounded-full"
                    />
                  ))}
                  {numOutputs > 20 && (
                    <div className="text-xs text-yellow-800 w-full text-center mt-1">
                      + {numOutputs - 20} more splits
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSplit}
            disabled={loading || !!splitError}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
              loading || !!splitError
                ? 'bg-gray-100 text-gray-500'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Splitting...
              </>
            ) : (
              'Split UTXOs'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
