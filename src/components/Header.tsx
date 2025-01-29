import React from 'react';
import { Wallet, AlertCircle, Settings, Key } from 'lucide-react';
import { TokenBalance } from '../types/api';
import { shortenAddress } from '../utils/format';
import { formatPublicKey } from '../utils/nostr';

interface HeaderProps {
  nostrPublicKey: string | null;
  error: string | null;
  balances: TokenBalance[];
  showConfig: boolean;
  setShowConfig: (show: boolean) => void;
}

export function Header({ nostrPublicKey, error, balances, showConfig, setShowConfig }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">RunePool</h1>
            {nostrPublicKey && (
              <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded-md">
                <Key className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-purple-700 font-medium text-xs">
                  npub: {formatPublicKey(nostrPublicKey)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {error ? (
              <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 font-medium text-sm">API Unavailable</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md min-w-0">
                    <Wallet className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-blue-700 font-medium text-sm truncate">
                      {shortenAddress(balances.find(b => b.token === 'BTC')?.address || '')}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowConfig(!showConfig)}
                    className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 font-medium text-sm">Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
