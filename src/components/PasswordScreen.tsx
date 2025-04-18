import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useMain } from '../context/MainContext';
import './password-field.css';
import { PrivateKeySetupStep } from './PrivateKeySetupStep';
import { PasswordSetupStep } from './PasswordSetupStep';
import { StepIndicator } from './StepIndicator';
import { UnlockPasswordField } from './UnlockPasswordField';

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
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNewKey, setIsNewKey] = useState(isInitialSetup);
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [hasBackedUpKey, setHasBackedUpKey] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Step 1: Private Key, Step 2: Password
  
  // Log the current state for debugging
  useEffect(() => {
    console.log('PasswordScreen state:', { 
      isInitialSetup, 
      hasPassword, 
      isNewKey, 
      isChangingPassword,
      currentStep
    });
  }, [isInitialSetup, hasPassword, isNewKey, isChangingPassword, currentStep]);
  
  // Toggle password change mode
  const togglePasswordChangeMode = () => {
    setIsChangingPassword(prev => !prev);
    // Reset fields when toggling modes
    setOldPassword('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

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
          console.log('Checking wallet configuration status...');
          const hasConfig = await apiClient.hasWalletConfiguration();
          console.log('Has wallet configuration:', hasConfig);
          
          if (hasConfig) {
            // If we have configuration, check if password is set
            const settings = await apiClient.getSettings();
            console.log('Settings retrieved:', { hasPassword: settings.hasPassword });
            
            // Update isNewKey based on hasPassword from settings
            setIsNewKey(!settings.hasPassword);
          } else {
            // No configuration means we need to set up a new key
            console.log('No wallet configuration found, setting isNewKey to true');
            setIsNewKey(true);
          }
        }
      } catch (error) {
        console.error('Error checking password status:', error);
        // In case of error, assume we need to set up a new key
        setIsNewKey(true);
      }
    };

    checkPasswordStatus();
  }, [apiClient, isInitialSetup]);

  const generateFreshKey = async () => {
    try {
      setIsGeneratingKey(true);
      setError(null);
      
      // Generate a fresh Bitcoin private key
      const privateKey = await apiClient.generateFreshPrivateKey();
      setBitcoinPrivateKey(privateKey);
      
      // Private key is now always visible in the textarea
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate private key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      // Validate private key
      if (!bitcoinPrivateKey) {
        setError('Bitcoin private key is required');
        return;
      }
      if (bitcoinPrivateKey.length < 30) {
        setError('Invalid Bitcoin private key format');
        return;
      }
      if (!hasBackedUpKey) {
        setError('Please confirm that you have backed up your private key');
        return;
      }
      
      // Clear any errors and proceed to next step
      setError(null);
      setCurrentStep(2);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    
    // Debug the current state when submitting
    console.log('Submit state:', { 
      isInitialSetup, 
      isNewKey, 
      isChangingPassword, 
      currentStep,
      hasPassword,
      passwordLength: password.length,
      bitcoinKeyLength: bitcoinPrivateKey.length
    });
    
    try {
      // UNLOCK SCENARIO: User is unlocking an existing wallet
      if (!isInitialSetup && !isNewKey && !isChangingPassword) {
        if (!password) {
          throw new Error('Password is required');
        }
        
        console.log('Attempting to unlock with password');
        // Directly try to unlock with the password
        const success = await unlockWallet(password);
        console.log('Unlock result:', success);
        
        if (!success) {
          throw new Error('Invalid password');
        }
        
        // If successful, call onUnlock and return early
        onUnlock();
        return;
      }
      
      // SETUP SCENARIO: Initial setup with Bitcoin private key
      else if (isInitialSetup) {
        if (!bitcoinPrivateKey) {
          throw new Error('Bitcoin private key is required');
        }
        if (bitcoinPrivateKey.length < 30) {
          throw new Error('Invalid Bitcoin private key format');
        }
        if (!hasBackedUpKey) {
          throw new Error('Please confirm that you have backed up your private key');
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
      } else if (isNewKey && !isInitialSetup) {
        // Just set up password for existing key
        const success = await setupPassword(password);
        if (!success) {
          throw new Error('Failed to set up password');
        }
      }
      
      // Only reach here for non-unlock scenarios
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
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          // For unlock scenario, directly call handleSubmit
          if (!isInitialSetup && !isNewKey && !isChangingPassword) {
            handleSubmit();
          } else {
            // For setup scenarios, handle the multi-step process
            currentStep === 2 ? handleSubmit() : nextStep();
          }
        }}>
          {/* Step indicator */}
          {isInitialSetup && (
            <StepIndicator 
              currentStep={currentStep} 
              totalSteps={2} 
              stepTitles={['Set up your Bitcoin private key', 'Create a password']} 
            />
          )}
          
          {isInitialSetup && currentStep === 1 && (
            <PrivateKeySetupStep
              bitcoinPrivateKey={bitcoinPrivateKey}
              setBitcoinPrivateKey={setBitcoinPrivateKey}
              hasBackedUpKey={hasBackedUpKey}
              setHasBackedUpKey={setHasBackedUpKey}
              generateFreshKey={generateFreshKey}
              isGeneratingKey={isGeneratingKey}
            />
          )}
          {/* Regular password input for unlock scenario */}
          {!isInitialSetup && !isNewKey && !isChangingPassword && (
            <UnlockPasswordField 
              password={password}
              setPassword={setPassword}
              onSubmit={handleSubmit}
            />
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
          {isInitialSetup && currentStep === 2 && (
            <PasswordSetupStep
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
            />
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {/* Change password button removed from unlock screen */}
          
          {isChangingPassword && (
            <div className="mt-4 mb-2">
              <button
                type="button"
                onClick={togglePasswordChangeMode}
                className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
              >
                <span className="flex items-center">
                  Cancel Password Change
                </span>
              </button>
            </div>
          )}
          
          <div className="pt-4 flex gap-3">
            {(onCancel || (isInitialSetup && currentStep > 1)) && (
              <button
                type="button"
                onClick={isInitialSetup && currentStep > 1 ? prevStep : onCancel}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                {isInitialSetup && currentStep > 1 ? 'Back' : 'Cancel'}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
              disabled={loading || 
                (currentStep === 2 && (!password || !confirmPassword)) ||
                (currentStep === 1 && isInitialSetup && (!bitcoinPrivateKey || !hasBackedUpKey)) ||
                (!isInitialSetup && !isNewKey && !isChangingPassword && !password)}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : isInitialSetup && currentStep === 1 ? (
                'Continue'
              ) : isInitialSetup && currentStep === 2 ? (
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
