// No imports needed for React with JSX transform
import { Key, RefreshCw } from 'lucide-react';

interface PrivateKeySetupStepProps {
  bitcoinPrivateKey: string;
  setBitcoinPrivateKey: (key: string) => void;
  hasBackedUpKey: boolean;
  setHasBackedUpKey: (checked: boolean) => void;
  generateFreshKey: () => Promise<void>;
  isGeneratingKey: boolean;
}

export function PrivateKeySetupStep({
  bitcoinPrivateKey,
  setBitcoinPrivateKey,
  hasBackedUpKey,
  setHasBackedUpKey,
  generateFreshKey,
  isGeneratingKey
}: PrivateKeySetupStepProps) {
  return (
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
      <div>
        {/* Using textarea for better text wrapping of long private keys */}
        <textarea
          id="bitcoinPrivateKey"
          value={bitcoinPrivateKey}
          onChange={(e) => setBitcoinPrivateKey(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-wrap overflow-auto resize-none font-mono"
          placeholder="Enter your Bitcoin private key"
          rows={3}
          style={{ wordBreak: 'break-all' }}
        />
      </div>
      
      <div className="mt-4">
        <button
          type="button"
          className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
          onClick={generateFreshKey}
          disabled={isGeneratingKey}
        >
          {isGeneratingKey ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            <span className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Fresh Private Key
            </span>
          )}
        </button>
      </div>
      
      {bitcoinPrivateKey && (
        <div className="mt-4 flex items-start">
          <div className="flex items-center h-5">
            <input
              id="backup-confirmation"
              name="backup-confirmation"
              type="checkbox"
              checked={hasBackedUpKey}
              onChange={(e) => setHasBackedUpKey(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="backup-confirmation" className="font-medium text-gray-700">
              I've backed up my private key and stored it safely
            </label>
            <p className="text-gray-500">This is important for recovery purposes. Never share your private key with anyone.</p>
          </div>
        </div>
      )}
    </div>
  );
}
