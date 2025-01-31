import React from 'react';
import { Hash } from 'lucide-react';

interface AutoRebalancingProps {
  enabled: boolean;
  spread: string;
  onEnabledChange: (enabled: boolean) => void;
  onSpreadChange: (spread: string) => void;
}

export function AutoRebalancing({ enabled, spread, onEnabledChange, onSpreadChange }: AutoRebalancingProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900">Auto Rebalancing</label>
        <button
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="relative">
        <label className="block text-xs text-gray-500 mb-1">Spread (%)</label>
        <div className="relative">
          <Hash className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
          <input
            type="text"
            value={spread}
            onChange={(e) => onSpreadChange(e.target.value)}
            placeholder="0.5"
            disabled={!enabled}
            className={`w-full h-9 pl-8 pr-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              !enabled && 'opacity-50 cursor-not-allowed'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
