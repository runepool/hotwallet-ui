import { AlertCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfigurationPage } from './components/ConfigurationPage';
import { Header } from './components/Header';
import { OrderList } from './components/OrderList';
import { MainProvider, useMain } from './context/MainContext';
import { getApiClient } from './services/api-provider';
import { WarningType } from './types/api';
import { getPublicKey } from './utils/nostr';

function getWarningColor(type: WarningType): string {
  switch (type) {
    case WarningType.LOW_LIQUIDITY:
      return 'bg-yellow-100 border-yellow-400 text-yellow-800';
    case WarningType.NETWORK_ERROR:
    case WarningType.ORDER_ERROR:
    case WarningType.BALANCE_ERROR:
      return 'bg-red-100 border-red-400 text-red-800';
    default:
      return 'bg-gray-100 border-gray-400 text-gray-800';
  }
}

function AppContent() {
  const [showConfig, setShowConfig] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [nostrPublicKey, setNostrPublicKey] = useState<string | null>(null);
  const { 
    orders, 
    balances, 
    loading, 
    error, 
    refreshBalances, 
    warnings,
    clearWarning
  } = useMain();

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
    refreshBalances();
  }, [hasKeys]);

  const handleCloseConfig = () => {
    setShowConfig(false);
    checkKeys();
    refreshBalances();
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

      {/* Warnings */}
      {warnings.filter(w => w.type !== 'LOW_LIQUIDITY').length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.filter(w => w.type !== 'LOW_LIQUIDITY').map((warning) => (
            <div
              key={warning.id}
              className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-red-700">{warning.message}</div>
              <button
                onClick={() => clearWarning(warning.id)}
                className="shrink-0 text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

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
              {/* <BatchOrderForm balances={balances} /> */}
              <OrderList />
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