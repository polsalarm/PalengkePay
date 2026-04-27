import { ExternalLink, List, Banknote, TrendingUp } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendorTransactions, relativeTime } from '../../lib/hooks/useTransactions';
import { truncateAddress, stellarExpertUrl } from '../../lib/stellar';

export function VendorTransactions() {
  const { address } = useWallet();
  const { transactions, isLoading, todayEarnings, todayCount } = useVendorTransactions(address);

  const earnings = todayEarnings();
  const count = todayCount();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Transaction History</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-4 text-white shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Banknote size={14} className="opacity-80" />
            <span className="text-xs font-medium opacity-80">Today's Earnings</span>
          </div>
          <p className="text-2xl font-bold">{earnings.toFixed(2)}</p>
          <p className="text-xs opacity-60">XLM</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Today's Txns</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{count}</p>
          <p className="text-xs text-slate-400">payments</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="h-3.5 w-28 bg-slate-200 animate-pulse rounded mb-1" />
                  <div className="h-3 w-20 bg-slate-100 animate-pulse rounded" />
                </div>
                <div className="h-4 w-16 bg-slate-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && transactions.length === 0 && (
          <div className="text-center py-8">
            <List size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">No transactions yet</p>
            <p className="text-xs text-slate-300 mt-0.5">Payments you receive will appear here</p>
          </div>
        )}

        {!isLoading && transactions.length > 0 && (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono text-slate-600 truncate">{truncateAddress(tx.from)}</p>
                  {tx.memo && (
                    <p className="text-xs text-teal-600 font-medium truncate mt-0.5">{tx.memo}</p>
                  )}
                  <p className="text-xs text-slate-400">{relativeTime(tx.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-bold text-green-600">
                    +{tx.amountXlm.toFixed(2)} XLM
                  </span>
                  <a
                    href={stellarExpertUrl(tx.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-teal-600 transition-colors"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
