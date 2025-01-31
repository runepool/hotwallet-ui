import React, { useState, useEffect } from 'react';
import { Settings, Key, Link, Radio, Plus, Trash2, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { UserSettings } from '../types/api';
import { getApiClient } from '../services/api-provider';
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { AutoSplitConfigModal } from './AutoSplitConfigModal';

import { Buffer } from 'buffer';

interface ConfigurationPageProps {
  autoGenerateNostr?: boolean;
  onClose?: () => void;
}

export function ConfigurationPage({ autoGenerateNostr = false, onClose }: ConfigurationPageProps) {
  const [config, setConfig] = useState<UserSettings>({
    bitcoinPrivateKey: '',
    ordUrl: 'https://ord.runepool.io',
    nostrRelays: ['wss://relay.damus.io', 'wss://nostr.zebedee.cloud'],
    nostrPrivateKey: ''
  });
  const [newRelay, setNewRelay] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);

  // Create masked display values that show dots for private keys
  const maskedNostrKey = showGeneratedKey ? config?.nostrPrivateKey : (config?.nostrPrivateKey === 'xxx' ? '•'.repeat(64) : config?.nostrPrivateKey ? '•'.repeat(64) : '');
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
    if (autoGenerateNostr && config && !config.nostrPrivateKey) {
      generateNostrKey();
    }
  }, [autoGenerateNostr, config]);

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

  const generateNostrKey = () => {
    const newKey = generateSecretKey();
    setConfig(prev => ({ ...prev, nostrPrivateKey: Buffer.from(newKey).toString('hex') }));
    setShowGeneratedKey(true);
  };

  const handleSave = async () => {
    try {
      // Only validate Bitcoin key if it's not empty and not 'xxx'
      if (!config!.bitcoinPrivateKey || config?.bitcoinPrivateKey !== 'xxx' && !/^[0-9A-Fa-f]{64}$/.test(config?.bitcoinPrivateKey!)) {
        throw new Error('Invalid Bitcoin private key format');
      }

      // Only validate Nostr key if it's not empty and not 'xxx'
      if (!config!.nostrPrivateKey || config?.nostrPrivateKey !== 'xxx' && !/^[0-9A-Fa-f]{64}$/.test(config?.nostrPrivateKey!)) {
        throw new Error('Invalid Nostr private key format');
      }

      // Only validate non-empty relays
      config.nostrRelays.forEach(relay => {
        if (relay) {
          try {
            new URL(relay);
          } catch {
            throw new Error(`Invalid relay URL: ${relay}`);
          }
        }
      });
      // Filter out empty relays
      config.nostrRelays = config.nostrRelays.filter(relay => relay.trim() !== '');

      // Only derive public key if nostrPrivateKey is not empty and not 'xxx'
      if (config.nostrPrivateKey && config.nostrPrivateKey !== 'xxx') {
        try {
          config.nostrPublicKey = getPublicKey(Uint8Array.from(Buffer.from(config.nostrPrivateKey, 'hex')));
        } catch (err) {
          throw new Error('Invalid Nostr private key format');
        }
      } else if (!config.nostrPrivateKey) {
        // Clear public key if private key is empty
        config.nostrPublicKey = '';
      }

      await getApiClient().updateSettings(config);
      setError(null);
      setSaved(true);
      setShowGeneratedKey(false);

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  };

  const addRelay = () => {
    if (newRelay && !config.nostrRelays.includes(newRelay)) {
      setConfig(prev => ({
        ...prev,
        nostrRelays: [...prev.nostrRelays, newRelay]
      }));
      setNewRelay('');
    }
  };

  const removeRelay = (index: number) => {
    setConfig(prev => ({
      ...prev,
      nostrRelays: prev.nostrRelays.filter((_, i) => i !== index)
    }));
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Nostr Private Key
              </div>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={maskedNostrKey}
                readOnly
                placeholder="Enter your Nostr private key"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <button
                onClick={generateNostrKey}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
                title="Generate new key"
              >
                <RefreshCw className="w-5 h-5" />
                Generate
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {showGeneratedKey ? 'Click Save to store the key locally' : 'Your Nostr private key is stored locally'}
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
            <Radio className="w-5 h-5 mr-2" />
            Nostr Relays
          </h3>

          <div className="space-y-2">
            {config.nostrRelays.map((relay, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={relay}
                  onChange={(e) => {
                    const updatedRelays = [...config.nostrRelays];
                    updatedRelays[index] = e.target.value;
                    setConfig(prev => ({ ...prev, nostrRelays: updatedRelays }));
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => removeRelay(index)}
                  className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                  title="Remove relay"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newRelay}
                onChange={(e) => setNewRelay(e.target.value)}
                placeholder="wss://relay.example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRelay) {
                    e.preventDefault();
                    addRelay();
                  }
                }}
              />
              <button
                onClick={addRelay}
                className="p-2 text-blue-600 hover:text-blue-700 focus:outline-none"
                title="Add relay"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <AutoSplitConfigModal isOpen={true} onClose={() => {}} assetName="" />
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