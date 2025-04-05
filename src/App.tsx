import { AlertCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfigurationPage } from './components/ConfigurationPage';
import { Header } from './components/Header';
import { OrderList } from './components/OrderList';
import { MainProvider, useMain } from './context/MainContext';
import { getApiClient } from './services/api-provider';

function AppContent() {
  const [showConfig, setShowConfig] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const { 
    balances, 
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
        setHasKeys(!!settings.bitcoinPrivateKey);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    if (!hasKeys) return;
    refreshBalances();
  }, [hasKeys, refreshBalances]);

  const handleCloseConfig = () => {
    setShowConfig(false);
    checkKeys();
    refreshBalances();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
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
              <div className="flex-1">
                <div className="font-medium text-red-800">{warning.message}</div>
                {warning.data && (
                  <div className="mt-1 text-sm text-red-700">
                    {typeof warning.data === 'string' 
                      ? warning.data 
                      : JSON.stringify(warning.data, null, 2)}
                  </div>
                )}
              </div>
              <button 
                onClick={() => clearWarning(warning.id)}
                className="text-red-400 hover:text-red-600"
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

      <div className="container mx-auto px-4 py-8">
        {showConfig ? (
          <ConfigurationPage onClose={handleCloseConfig} />
        ) : (
          <div className="space-y-8">
            <OrderList />
          </div>
        )}
      </div>
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