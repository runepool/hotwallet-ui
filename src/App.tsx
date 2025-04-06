import { AlertCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConfigurationPage } from './components/ConfigurationPage';
import { Header } from './components/Header';
import { OrderList } from './components/OrderList';
import { PasswordScreen } from './components/PasswordScreen';
import { MainProvider, useMain } from './context/MainContext';
import { getApiClient } from './services/api-provider';

function AppContent() {
  const [showConfig, setShowConfig] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [initialSetup, setInitialSetup] = useState(true);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const { 
    balances, 
    error, 
    refreshBalances, 
    warnings,
    clearWarning,
    isWalletLocked,
    hasPassword,
    logout
  } = useMain();

  const checkKeys = useMemo(() => async () => {
    try {
      console.log('Checking wallet configuration...');
      // First check if we have wallet configuration at all
      const hasConfig = await getApiClient().hasWalletConfiguration();
      
      if (!hasConfig) {
        console.log('No wallet configuration - showing initial password setup');
        // No configuration at all - needs initial password setup
        setNeedsPasswordSetup(true);
        setHasKeys(false);
        setInitialSetup(false);
        return;
      }
      
      // If we have configuration, check settings
      const settings = await getApiClient().getSettings();
      const hasRequiredKeys = !!settings.bitcoinPrivateKey;
      setHasKeys(hasRequiredKeys);
      
      console.log('Wallet status:', { 
        hasConfig, 
        hasRequiredKeys, 
        hasPassword, 
        isWalletLocked 
      });
      
      // Check if we need password setup
      if (!hasPassword && !hasRequiredKeys) {
        // No password and no keys - needs initial password setup
        console.log('No password and no keys - showing password setup');
        setNeedsPasswordSetup(true);
      } else if (!hasRequiredKeys) {
        // Has password but no keys - show config screen
        console.log('Has password but no keys - showing config screen');
        setShowConfig(true);
      }
      
      // We've completed initial checks
      setInitialSetup(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Password required')) {
        // If we get a password required error, the wallet is locked
        console.log('Password required error - wallet is locked');
        setInitialSetup(false);
      } else {
        console.error('Failed to check keys:', error);
        // For other errors, we still need to move past initial setup
        setInitialSetup(false);
        // Show password setup for any other error
        setNeedsPasswordSetup(true);
      }
    }
  }, [hasPassword, isWalletLocked]);

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
    if (!hasKeys || isWalletLocked) return;
    if(refreshBalances) {
      refreshBalances();
    }
  }, [hasKeys, isWalletLocked]);

  const handleCloseConfig = () => {
    setShowConfig(false);
    checkKeys();
    refreshBalances();
  };

  const handleUnlockWallet = () => {
    // After password setup is complete, check if we need to show the config screen
    setInitialSetup(false);
    setNeedsPasswordSetup(false);
    
    // Check if we need to show the configuration screen
    if (!hasKeys) {
      setShowConfig(true);
    }
    refreshBalances();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Show password setup screen if needed */}
      {needsPasswordSetup ? (
        <PasswordScreen 
          onUnlock={handleUnlockWallet} 
          isInitialSetup={true}
        />
      ) : isWalletLocked && hasKeys ? (
        <PasswordScreen 
          onUnlock={handleUnlockWallet} 
          isInitialSetup={false}
        />
      ) : initialSetup ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <Header
            error={error}
            balances={balances}
            showConfig={showConfig}
            setShowConfig={setShowConfig}
            onLogout={async () => {
              const success = await logout();
              if (success) {
                // After logout, we need to show the password screen
                setNeedsPasswordSetup(false);
                // We don't need to reset hasKeys since the wallet data is still there
                // just locked
              }
            }}
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
        </>
      )}
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