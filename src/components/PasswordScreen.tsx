import { useState, useEffect } from 'react';
import { Key, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useMain } from '../context/MainContext';

interface PasswordScreenProps {
  onUnlock: () => void;
  onCancel?: () => void;
  isInitialSetup?: boolean;
}

export function PasswordScreen({ onUnlock, onCancel, isInitialSetup = false }: PasswordScreenProps) {
  const { hasPassword, unlockWallet, setupPassword, apiClient } = useMain();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNewKey, setIsNewKey] = useState(isInitialSetup);
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Log the current state for debugging
  useEffect(() => {
    console.log('PasswordScreen state:', { isInitialSetup, hasPassword, isNewKey, isChangingPassword });
  }, [isInitialSetup, hasPassword, isNewKey, isChangingPassword]);

  // Use the hasPassword state from context instead of checking separately
  // Or use isInitialSetup if provided
  useEffect(() => {
    setIsNewKey(isInitialSetup || !hasPassword);
  }, [hasPassword, isInitialSetup]);
  
  // Check settings directly to determine if password is set
  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        // Only check if not in initial setup mode
        if (!isInitialSetup) {
          const hasConfig = await apiClient.hasWalletConfiguration();
          if (hasConfig) {
            // If we have configuration, check if password is set
            const settings = await apiClient.getSettings();
            console.log('Settings retrieved:', { hasPassword: settings.hasPassword });
            
            // Update isNewKey based on hasPassword from settings
            setIsNewKey(!settings.hasPassword);
          }
        }
      } catch (error) {
        console.error('Error checking password status:', error);
      }
    };

    checkPasswordStatus();
  }, [apiClient, isInitialSetup]);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Validate inputs
      if (isInitialSetup) {
        if (!bitcoinPrivateKey) {
          throw new Error('Bitcoin private key is required');
        }
        if (bitcoinPrivateKey.length < 30) {
          throw new Error('Invalid Bitcoin private key format');
        }
      }

      // Handle password change mode
      if (isChangingPassword) {
        // Validate passwords for changing password
        if (!oldPassword) {
          throw new Error('Current password is required');
        }
        if (password.length < 8) {
          throw new Error('New password must be at least 8 characters');
        }
        if (password !== confirmPassword) {
          throw new Error('New passwords do not match');
        }

        // Change password using the old password
        console.log('Changing password with old password');
        const success = await setupPassword(password, undefined, oldPassword);
        if (!success) {
          throw new Error('Failed to change password');
        }
      }
      // Handle new key setup
      else if (isNewKey) {
        // Validate passwords match for new key setup
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        // For initial setup, we need to set both the Bitcoin private key and password
        if (isInitialSetup) {
          try {
            console.log('Setting up password and Bitcoin private key in a single call');
            
            // Set up the password and Bitcoin private key in a single call
            const success = await setupPassword(password, bitcoinPrivateKey);
            if (!success) {
              throw new Error('Failed to set up password and Bitcoin private key');
            }
          } catch (error) {
            console.error('Setup error:', error);
            throw error;
          }
        } else {
          // Just set up password for existing key
          const success = await setupPassword(password);
          if (!success) {
            throw new Error('Failed to set up password');
          }
        }
      } else {
        // Unlock with existing password
        const success = await unlockWallet(password);
        if (!success) {
          throw new Error('Invalid password');
        }
      }
      setLoading(false);
      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {isInitialSetup ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
              Welcome to RunePool Hot Wallet
            </h2>
            <div className="mb-6 text-center">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-gray-600 mb-4">
                To get started, please enter your Bitcoin private key and set up a password to secure your wallet.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isNewKey ? 'Set Up Password' : (isChangingPassword ? 'Change Password' : 'Unlock Wallet')}
            </h2>
            <p className="text-gray-600 mt-1">
              {isNewKey 
                ? 'Create a password to encrypt your Bitcoin private key' 
                : (isChangingPassword 
                  ? 'Enter your old password and create a new one' 
                  : 'Enter your password to unlock your Bitcoin private key')}
            </p>
        
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {isInitialSetup && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Key className="w-5 h-5 text-gray-500 mr-2" />
                <label htmlFor="bitcoinPrivateKey" className="text-sm font-medium text-gray-700">
                  Bitcoin Private Key
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Your private key will be encrypted and stored locally
              </p>
              <div className="relative">
                <input
                  type={showPrivateKey ? 'text' : 'password'}
                  id="bitcoinPrivateKey"
                  value={bitcoinPrivateKey}
                  onChange={(e) => setBitcoinPrivateKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Bitcoin private key"
                />
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPrivateKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
          
          {isChangingPassword && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Lock className="w-5 h-5 text-gray-500 mr-2" />
                <label htmlFor="oldPassword" className="text-sm font-medium text-gray-700">
                  Current Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <Lock className="w-5 h-5 text-gray-500 mr-2" />
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                {isNewKey ? 'Create Password' : 'Password'}
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isNewKey && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Lock className="w-5 h-5 text-gray-500 mr-2" />
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <div className="pt-4 flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
              disabled={loading || 
                (!isNewKey && !password) || 
                (isNewKey && (!password || !confirmPassword)) ||
                (isInitialSetup && !bitcoinPrivateKey)}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : isInitialSetup ? (
                'Set Up Wallet'
              ) : isNewKey ? (
                'Create Password'
              ) : (
                'Unlock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
