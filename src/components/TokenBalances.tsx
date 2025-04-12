import React from 'react';
import { TokenBalance } from '../types/api';
import { AVAILABLE_TOKENS } from '../constants/runes';

interface TokenBalancesProps {
  balances: TokenBalance[];
}

export function TokenBalances({ balances }: TokenBalancesProps) {
  // Format number with thousand separators
  const formatNumber = (value: string): string => {
    if (!value) return '0';
    
    // Split by decimal point
    const parts = value.split('.');
    
    // Format the integer part with thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Join back with decimal part if it exists
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  };
  return (
    <div className="space-y-1.5">
      {[
        {
          symbol: 'BTC',
          name: 'BTC',
          decimals: 8,
          icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
        },
        ...AVAILABLE_TOKENS
      ].map(token => {
        const balance = balances.find(b => b.token === (token.symbol === 'BTC' ? 'BTC' : token.name));
        const rawAmount = balance ? (+balance.balance / 10 ** balance.decimals).toFixed(token.decimals) : '0';
        const amount = formatNumber(rawAmount);
        return (
          <div
            key={token.symbol}
            className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <img src={token.icon} alt={token.symbol} className="w-5 h-5 rounded-full" />
              <span className="text-sm font-medium text-gray-900">{token.symbol}</span>
            </div>
            <span className="text-sm text-gray-600">{amount}</span>
          </div>
        );
      })}
    </div>
  );
}
