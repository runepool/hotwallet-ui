import React, { useState, useEffect } from 'react';
import { BatchOrderForm } from './components/BatchOrderForm';
import { OrderList } from './components/OrderList';
import { TransactionList } from './components/TransactionList';
import { ConfigurationPage } from './components/ConfigurationPage';
import { getTokenBalances } from './api/orders';
import { Wallet, AlertCircle, Settings, Key } from 'lucide-react';
import { OrderProvider } from './context/OrderContext';
import { TokenBalance } from './types/api';
import { shortenAddress } from './utils/format';
import { getPublicKey, formatPublicKey } from './utils/nostr';
import { getApiClient } from './services/api-provider';

function App() {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [nostrPublicKey, setNostrPublicKey] = useState<string>('');
  const [hasKeys, setHasKeys] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const checkKeys = React.useMemo(() => async () => {
    try {
      const settings = await getApiClient().getSettings();
      const hasRequiredKeys = !!settings.bitcoinPrivateKey;
      setHasKeys(hasRequiredKeys);
      setShowConfig(!hasRequiredKeys);
      setNostrPublicKey(settings.nostrPublicKey!);
    } catch (error) {
      console.error('Failed to check keys:', error);
    }
  }, []);

  const fetchBalances = React.useMemo(() => async () => {
    if (isFetching) return;

    setIsFetching(true);
    try {
      const data = await getTokenBalances();
      setBalances(data);
      setError(null);
    } catch (err) {
      setError('Unable to connect to server. Please ensure the API is running at http://localhost:3000');
      console.error('Failed to fetch balances:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    checkKeys();
  }, []);

  useEffect(() => {
    if (!hasKeys) return;
    fetchBalances();
    const interval = setInterval(fetchBalances, 5000);
    return () => clearInterval(interval);
  }, [hasKeys]);

  useEffect(() => {
    const handleSettingsUpdate = async () => {
      try {
        const settings = await getApiClient().getSettings();
        if (settings.nostrPrivateKey) {
          const pubKey = await getPublicKey(settings.nostrPrivateKey);
          setNostrPublicKey(pubKey);
        }
        setHasKeys(!!settings.bitcoinPrivateKey);
      } catch (error) {
        console.error('Failed to load Nostr public key:', error);
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const handleCloseConfig = () => {
    setShowConfig(false);
    checkKeys();
    fetchBalances();
  };

  return (
    <OrderProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">RunePool</h1>
                  {nostrPublicKey && (
                    <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-md">
                      <Key className="w-4 h-4 text-purple-500" />
                      <span className="text-purple-700 font-medium text-sm">
                        npub: {formatPublicKey(nostrPublicKey)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {error ? (
                    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-md">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-700 font-medium">API Unavailable</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-md min-w-0">
                          <Wallet className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <span className="text-blue-700 font-medium truncate">
                            {shortenAddress(balances.find(b => b.token === 'BTC')?.address || '')}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowConfig(!showConfig)}
                          className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          <Settings className="w-5 h-5 text-gray-600" />
                          <span className="text-gray-700 font-medium">Settings</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {balances.map(balance => (
                          <div
                            key={balance.token}
                            className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-md text-sm"
                          >
                            <span className="font-medium text-gray-700">{balance.token}:</span>
                            <span className="text-gray-600">{+balance.balance / 10 ** balance.decimals}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {showConfig ? (
              <ConfigurationPage
                autoGenerateNostr={!hasKeys}
                onClose={handleCloseConfig}
              />
            ) : (
              <>
                <BatchOrderForm />
                <OrderList />
                <TransactionList />
              </>
            )}
          </div>
        </main>
      </div>
    </OrderProvider>
  );
}

export default App;