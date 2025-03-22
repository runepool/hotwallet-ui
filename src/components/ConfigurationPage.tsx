import { useState, useEffect } from 'react';
import { Settings, Key, Link, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { UserSettings } from '../types/api';
import { getApiClient } from '../services/api-provider';

interface ConfigurationPageProps {
  onClose?: () => void;
}

export function ConfigurationPage({ onClose }: ConfigurationPageProps) {
  const [config, setConfig] = useState<UserSettings>({
    bitcoinPrivateKey: '',
    ordUrl: 'https://ord.runepool.io',
    websocketUrl: 'wss://ws.runepool.io'
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create masked display values that show dots for private keys
  const maskedBitcoinKey = config?.bitcoinPrivateKey === 'xxx' ? '•'.repeat(64) : config?.bitcoinPrivateKey ? '•'.repeat(64) : '';

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getApiClient().getSettings();
        setConfig(settings);
        setError(null);
      } catch (err) {
        setError('Failed to load settings');
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => {
        setSaved(false);
        if (onClose) {
          onClose();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [saved, onClose]);

  const handleSave = async () => {
    try {
      // Only validate Bitcoin key if it's not empty and not 'xxx'
      if (!config!.bitcoinPrivateKey || config?.bitcoinPrivateKey !== 'xxx' && !/^[0-9A-Fa-f]{64}$/.test(config?.bitcoinPrivateKey!)) {
        throw new Error('Invalid Bitcoin private key format');
      }

      // Validate WebSocket URL
      if (config.websocketUrl) {
        try {
          new URL(config.websocketUrl);
        } catch {
          throw new Error(`Invalid WebSocket URL: ${config.websocketUrl}`);
        }
      }

      await getApiClient().updateSettings(config);
      setError(null);
      setSaved(true);

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          <h2 className="text-xl font-semibold">Configuration</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded flex items-center">
          <Save className="w-5 h-5 mr-2" />
          Settings saved successfully!
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Keys
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Bitcoin Private Key
              </div>
            </label>
            <input
              type="text"
              value={maskedBitcoinKey}
              onChange={(e) => setConfig(prev => ({ ...prev, bitcoinPrivateKey: e.target.value }))}
              placeholder="Enter your Bitcoin private key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Your Bitcoin private key is stored locally
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Link className="w-5 h-5 mr-2" />
            Ord URL
          </h3>
          <input
            type="url"
            value={config.ordUrl}
            onChange={(e) => setConfig(prev => ({ ...prev, ordUrl: e.target.value }))}
            placeholder="https://ord.runepool.io"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Link className="w-5 h-5 mr-2" />
            WebSocket URL
          </h3>
          <input
            type="url"
            value={config.websocketUrl}
            onChange={(e) => setConfig(prev => ({ ...prev, websocketUrl: e.target.value }))}
            placeholder="wss://ws.runepool.io"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSave}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}