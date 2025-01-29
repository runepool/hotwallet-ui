import React, { useEffect, useState } from 'react';
import { ArrowUpDown, CheckCircle2, XCircle, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { getApiClient } from '../services/api-provider';
import { Transaction, TransactionStatus } from '../types/api';
import { AVAILABLE_TOKENS } from '../constants/runes';

type TransactionListProps = {
  searchTerm: string;
};

export function TransactionList({ searchTerm }: TransactionListProps) {
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
      <div className="flex justify-center items-center h-32">
        <ArrowUpDown className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const formatAmount = (transaction: Transaction) => {
    const token = AVAILABLE_TOKENS.find(t => t.name === transaction.rune);
    if (!token) return transaction.amount;
    return (+transaction.amount / 10 ** token.decimals).toString();
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case TransactionStatus.CONFIRMING:
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case TransactionStatus.ERRORED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      case TransactionStatus.PENDING:
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const token = AVAILABLE_TOKENS.find(t => t.name === transaction.rune);
    return (
      transaction.rune.toLowerCase().includes(searchLower) ||
      token?.symbol.toLowerCase().includes(searchLower) ||
      transaction.amount.toString().includes(searchLower) ||
      transaction.price.toString().includes(searchLower)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-20rem)]">
      <div className="px-3 py-2 border-b border-gray-200 flex justify-between items-center shrink-0">
        <h3 className="text-sm font-medium text-gray-900">Recent Transactions</h3>
        <span className="text-xs text-gray-500">{filteredTransactions.length} transactions</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 bg-gray-50">Token</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 bg-gray-50">Amount</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 bg-gray-50">Price</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 bg-gray-50">Total</th>
              <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 bg-gray-50">Txid</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredTransactions.map((transaction) => {
              const token = AVAILABLE_TOKENS.find(t => t.name === transaction.rune);
              const amount = formatAmount(transaction);
              const total = (+amount * +transaction.price).toFixed(2);
              return (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1.5">
                      <img src={token?.icon} alt={token?.symbol} className="w-4 h-4 rounded-full" />
                      <span className="font-medium">{token?.symbol}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        transaction.type === 'buy' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap text-sm">
                    {amount}
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap text-sm">
                    {transaction.price}
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap text-sm">
                    {total}
                  </td>
                  <td className="px-2 py-1.5 text-right whitespace-nowrap">
                    {transaction.txid && (
                      <div className="flex items-center justify-end gap-1.5">
                        {getStatusIcon(transaction.status)}
                        <span className="text-xs text-gray-500 font-mono">
                          {transaction.txid.slice(0, 6)}...{transaction.txid.slice(-4)}
                        </span>
                        <a
                          href={`https://ordiscan.com/tx/${transaction.txid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-3 text-center text-sm text-gray-500">
                  {searchTerm ? 'No matching transactions found' : 'No transactions yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}