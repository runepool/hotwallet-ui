import { useState, useEffect } from 'react';
import { Settings, Key, Link, Save, AlertCircle, RefreshCw, Eye, EyeOff, X } from 'lucide-react';
import { UserSettings } from '../types/api';
import { getApiClient } from '../services/api-provider';
import { ChangePasswordForm } from './ChangePasswordForm';

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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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

  // Show password prompt when save button is clicked
  const handleSave = () => {
    // Validate inputs before showing password prompt
    try {
      // Only validate Bitcoin key if it's not empty and not 'xxx'
      if (config?.bitcoinPrivateKey && config?.bitcoinPrivateKey !== 'xxx' && !/^[0-9A-Fa-f]{64}$/.test(config?.bitcoinPrivateKey)) {
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

      // If validation passes, show password modal
      setShowPasswordModal(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate configuration');
    }
  };

  // Handle save confirmation with password
  const handleConfirmSave = async () => {
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    try {
      // Save settings with password
      await getApiClient().updateSettings({
        ...config,
        password: password
      });

      // Reset and close modal
      setPassword('');
      setShowPasswordModal(false);
      setPasswordError('');
      setError(null);
      setSaved(true);

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (err) {
      console.error('Error saving settings:', err);
      setPasswordError('Invalid password or error saving settings');
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    }
  };

  // Handle cancel button in password modal
  const handleCancelSave = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
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
        {/* First row - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column - Change Password */}
          <ChangePasswordForm />
          
          {/* Right column - Keys and URLs */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Keys & URLs
            </h3>
            <div className="space-y-4 flex-grow">
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
                    <Link className="w-4 h-4" />
                    Ord URL
                  </div>
                </label>
                <input
                  type="url"
                  value={config.ordUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, ordUrl: e.target.value }))}
                  placeholder="https://ord.runepool.io"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
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


      </div>

      {/* Password confirmation modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Confirm Password</h3>
              <button 
                onClick={handleCancelSave}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="mb-4 text-sm text-gray-600">
              Please enter your password to save configuration changes.
            </p>
            
            <div className="mb-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
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
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelSave}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}