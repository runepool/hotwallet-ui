import React, { useEffect, useState, useMemo } from 'react';
import { OrderList } from './components/OrderList';
import { BatchOrderForm } from './components/BatchOrderForm';
import { TransactionList } from './components/TransactionList';
import { ConfigurationPage } from './components/ConfigurationPage';
import { AlertCircle } from 'lucide-react';
import { MainProvider, useMain } from './context/MainContext';
import { getPublicKey } from './utils/nostr';
import { Header } from './components/Header';
import { getApiClient } from './services/api-provider';

function AppContent() {
  const [showConfig, setShowConfig] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [nostrPublicKey, setNostrPublicKey] = useState<string | null>(null);
  const { balances, fetchBalances, error } = useMain();

  const checkKeys = useMemo(() => async () => {
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

  useEffect(() => {
    checkKeys();
  }, [checkKeys]);

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

  useEffect(() => {
    if (!hasKeys) return;
    fetchBalances();
  }, [hasKeys]);

  const handleCloseConfig = () => {
    setShowConfig(false);
    checkKeys();
    fetchBalances();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        nostrPublicKey={nostrPublicKey}
        error={error}
        balances={balances}
        showConfig={showConfig}
        setShowConfig={setShowConfig}
      />

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
  );
}

function App() {
  return (
    <MainProvider>
      <AppContent />
    </MainProvider>
  );
}

export default App;