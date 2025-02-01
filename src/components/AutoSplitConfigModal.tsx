import React, { useState, useEffect } from 'react';
import { X, Settings, Loader2, AlertCircle, Toggle } from 'lucide-react';
import { AutoSplitConfig } from '../types/api';
import { useMain } from '../context/MainContext';
import { AVAILABLE_TOKENS } from '../constants/runes';

interface AutoSplitConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetName: string;
  onConfigSaved?: () => void;
}

export function AutoSplitConfigModal({ isOpen, onClose, assetName, onConfigSaved }: AutoSplitConfigModalProps) {
  const { apiClient } = useMain();
  const [configs, setConfigs] = useState<AutoSplitConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newConfig, setNewConfig] = useState<AutoSplitConfig>({
    asset_name: assetName,
    enabled: false,
    max_cost: 1000,
    split_size: 10000,
  });

  const fetchConfigs = async () => {
    try {
      const data = await apiClient.getAllAutoSplitConfigs();
      setConfigs(data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch configurations');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfigs();
    }
    // Reset error/success messages when modal closes
    if (!isOpen) {
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, assetName]);

  // Set default config when asset changes
  useEffect(() => {
    const existingConfig = configs.find(config => config.asset_name === assetName);
    if (existingConfig) {
      setNewConfig(existingConfig);
    } else {
      setNewConfig({
        asset_name: assetName,
        enabled: false,
        max_cost: 1000,
        split_size: 10000,
      });
    }
  }, [assetName, configs]);

  const showNotification = (message: string, isError: boolean) => {
    if (isError) {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      if (isError) {
        setError(null);
      } else {
        setSuccess(null);
      }
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.setAutoSplitConfig(newConfig);
      showNotification('Configuration saved successfully', false);
      fetchConfigs();
      onConfigSaved?.();
      onClose();  // Close the modal after successful save
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to save configuration',
        true
      );
    }
  };

  const token = assetName === 'BTC' 
    ? { 
        name: 'Bitcoin', 
        symbol: 'BTC', 
        decimals: 8, 
        icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
      } 
    : AVAILABLE_TOKENS.find(t => t.name === assetName);

  if (!isOpen || !token) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Auto-Split Configuration</h2>
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
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-700">{success}</span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={token.icon} alt={token.symbol} className="w-6 h-6 rounded-full" />
                <h3 className="text-lg font-medium text-gray-900">{token.symbol} Auto-Split</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Enable Auto-Split</label>
                  <button
                    type="button"
                    onClick={() => setNewConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                      newConfig.enabled ? 'bg-yellow-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        newConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Split Size ({token.symbol === 'BTC' ? 'sats' : token.symbol})
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      value={newConfig.split_size / Math.pow(10, token.decimals)}
                      onChange={(e) => setNewConfig(prev => ({ 
                        ...prev, 
                        split_size: Math.floor((parseFloat(e.target.value) || 0) * Math.pow(10, token.decimals))
                      }))}
                      className="block w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-yellow-500 focus:ring focus:ring-yellow-200 focus:ring-opacity-50 transition-all duration-200 bg-white shadow-sm"
                      min={1 / Math.pow(10, token.decimals)}
                      step={1 / Math.pow(10, token.decimals)}
                    />
                    <div className="mt-1.5 text-sm text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      Target size for each UTXO
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Cost (sats)
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      value={newConfig.max_cost}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, max_cost: parseInt(e.target.value) || 0 }))}
                      className="block w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-yellow-500 focus:ring focus:ring-yellow-200 focus:ring-opacity-50 transition-all duration-200 bg-white shadow-sm"
                      min="1"
                    />
                    <div className="mt-1.5 text-sm text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      Maximum transaction fee in satoshis
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-md">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">How it works</h4>
                  <p className="text-sm text-yellow-700">
                    When enabled, your {token.symbol === 'BTC' ? 'BTC' : token.symbol} UTXOs will be automatically split into at least {token.symbol === 'BTC' ? 'sats' : token.symbol} split size. 
                    The system will ensure the transaction fee doesn't exceed the maximum cost.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 text-sm font-medium text-yellow-900 bg-yellow-100 border-2 border-yellow-200 rounded-lg hover:bg-yellow-200 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
