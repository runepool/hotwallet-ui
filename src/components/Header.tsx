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
  );
}
