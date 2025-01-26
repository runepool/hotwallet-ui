import React, { useState, useEffect } from 'react';
import { BatchOrderForm } from './components/BatchOrderForm';
import { OrderList } from './components/OrderList';
import { TransactionList } from './components/TransactionList';
import { getTokenBalances } from './api/orders';
import { Wallet, AlertCircle } from 'lucide-react';
import { OrderProvider } from './context/OrderContext';
import { TokenBalance } from './types/api';
import { shortenAddress } from './utils/format';

function App() {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const data = await getTokenBalances();
        setBalances(data);
        setError(null);
      } catch (err) {
        setError('Unable to connect to server. Please ensure the API is running at http://localhost:3000');
        console.error('Failed to fetch balances:', err);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 5000); // Update balances every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <OrderProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">RunePool</h1>
              <div className="flex gap-4">
                {error ? (
                  <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-md">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 font-medium">API Unavailable</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-md min-w-0">
                      <Wallet className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-blue-700 font-medium truncate">
                        {shortenAddress(balances.find(b => b.token === 'BTC')?.address || '')}
                      </span>
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
        </header>

        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <BatchOrderForm />
            <OrderList />
            <TransactionList />
          </div>
        </main>
      </div>
    </OrderProvider>
  );
}

export default App;