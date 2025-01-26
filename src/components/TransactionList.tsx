import React, { useEffect, useState } from 'react';
import { Transaction } from '../types/api';
import { getApiClient } from '../services/api-provider';
import { AVAILABLE_TOKENS } from '../constants/runes';
import { ArrowUpDown, CheckCircle2, XCircle, Clock, ArrowUpCircle, ArrowDownCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from '../utils/format';

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getApiClient().getTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ArrowUpDown className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
      </div>
      
      <div className="overflow-auto max-h-[calc(100vh-24rem)]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Token
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price (sats)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Explorer
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => {
              const token = AVAILABLE_TOKENS.find(t => t.name === tx.rune);
              
              return (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <img className="h-8 w-8 rounded-full" src={token?.icon} alt={token?.name} />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {token?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {tx.type === 'ask' ? (
                        <>
                          <ArrowUpCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600 font-medium">Ask</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">Bid</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {+tx.amount / 10 ** token!.decimals}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {tx.status === 'confirmed' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            Completed
                          </span>
                        </>
                      ) : tx.status === 'errored' ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600">
                            Failed
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
                          <span className="text-sm font-medium text-yellow-600">
                            Confirming
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(tx.createdAt))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tx.txid && (
                      <a
                        href={`https://ordiscan.com/tx/${tx.txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View</span>
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No transactions available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}