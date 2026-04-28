import { useNavigate } from 'react-router-dom';
import { ExternalLink, QrCode, Banknote, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendorTransactions, relativeTime } from '../../lib/hooks/useTransactions';
import type { TxRecord } from '../../lib/hooks/useTransactions';
import { truncateAddress, stellarExpertUrl } from '../../lib/stellar';

function groupByDate(txs: TxRecord[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const buckets: Record<string, TxRecord[]> = {};
  for (const tx of txs) {
    const d = new Date(tx.createdAt); d.setHours(0, 0, 0, 0);
    const key = d.getTime() === today.getTime() ? 'Today'
      : d.getTime() === yesterday.getTime() ? 'Yesterday'
      : d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(tx);
  }
  return Object.entries(buckets).map(([label, txs]) => ({ label, txs }));
}

export function VendorTransactions() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { transactions, isLoading, error, retry, todayEarnings, todayCount } = useVendorTransactions(address);

  const earnings = todayEarnings();
  const count = todayCount();
  const allTimeTotal = transactions.reduce((s, t) => s + t.amountXlm, 0);
  const groups = groupByDate(transactions);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Transaction History</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl p-4 text-white shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Banknote size={14} className="opacity-80" />
            <span className="text-xs font-medium opacity-80">Today's Earnings</span>
          </div>
          <p className="text-2xl font-black">{earnings.toFixed(2)}</p>
          <p className="text-xs opacity-60">XLM · {count} payment{count !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">All-time</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{allTimeTotal.toFixed(2)}</p>
          <p className="text-xs text-slate-400">XLM · {transactions.length} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 bg-slate-200 animate-pulse rounded" />
                  <div className="h-3 w-20 bg-slate-100 animate-pulse rounded" />
                </div>
                <div className="h-4 w-16 bg-slate-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#FFF1F2', border: '1px solid #FECDD3' }}>
              <AlertCircle size={24} style={{ color: '#F43F5E' }} />
            </div>
            <p className="text-sm font-bold text-slate-500 mb-1">Failed to load</p>
            <p className="text-xs text-slate-400 mb-4">{error}</p>
            <button onClick={retry} className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full transition-colors">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {!isLoading && !error && transactions.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3 border border-teal-100">
              <TrendingUp size={28} className="text-teal-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400 mb-1">No transactions yet</p>
            <p className="text-xs text-slate-300 mb-5">Share your QR code to receive your first payment</p>
            <button
              onClick={() => navigate('/vendor/qr')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full transition-colors"
            >
              <QrCode size={12} /> Show QR Code
            </button>
          </div>
        )}

        {!isLoading && !error && groups.length > 0 && (
          <div className="space-y-5">
            {groups.map(({ label, txs }) => (
              <div key={label}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                <div className="divide-y divide-slate-50">
                  {txs.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 -mx-5 px-5 hover:bg-slate-50 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                          <TrendingUp size={14} className="text-green-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-mono text-slate-600 truncate">{truncateAddress(tx.from)}</p>
                          {tx.memo && (
                            <p className="text-xs text-teal-600 font-medium truncate mt-0.5">{tx.memo}</p>
                          )}
                          <p className="text-xs text-slate-400">{relativeTime(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-sm font-bold text-green-600">+{tx.amountXlm.toFixed(2)}</span>
                        <span className="text-xs text-slate-400">XLM</span>
                        <a
                          href={stellarExpertUrl(tx.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-200 group-hover:text-teal-500 transition-colors"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
