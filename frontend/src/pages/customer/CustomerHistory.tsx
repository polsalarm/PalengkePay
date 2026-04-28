import { useNavigate } from 'react-router-dom';
import { ExternalLink, ShoppingBag, ScanLine, TrendingDown } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useCustomerTransactions, relativeTime } from '../../lib/hooks/useTransactions';
import type { TxRecord } from '../../lib/hooks/useTransactions';
import { truncateAddress, stellarExpertUrl } from '../../lib/stellar';
import { useVendorName } from '../../lib/hooks/useVendor';

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

function TxRow({ tx }: { tx: TxRecord }) {
  const vendorName = useVendorName(tx.to);
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0 -mx-5 px-5 hover:bg-slate-50 rounded-lg transition-colors group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
          <TrendingDown size={14} className="text-rose-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {vendorName || truncateAddress(tx.to)}
          </p>
          {tx.memo && (
            <p className="text-xs text-teal-600 font-medium truncate mt-0.5">{tx.memo}</p>
          )}
          <p className="text-xs text-slate-400">{relativeTime(tx.createdAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="text-sm font-bold text-rose-500">-{tx.amountXlm.toFixed(2)}</span>
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
  );
}

export function CustomerHistory() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { transactions, isLoading } = useCustomerTransactions(address);

  const totalSpent = transactions.reduce((s, t) => s + t.amountXlm, 0);
  const groups = groupByDate(transactions);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Payment History</h1>

      {/* Summary stats */}
      {!isLoading && transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">Total Spent</p>
            <p className="text-xl font-black text-rose-500">{totalSpent.toFixed(2)}</p>
            <p className="text-xs text-slate-400">XLM</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">Transactions</p>
            <p className="text-xl font-black text-slate-900">{transactions.length}</p>
            <p className="text-xs text-slate-400">total</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 bg-slate-200 animate-pulse rounded" />
                  <div className="h-3 w-20 bg-slate-100 animate-pulse rounded" />
                </div>
                <div className="h-4 w-14 bg-slate-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && transactions.length === 0 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-100">
              <ShoppingBag size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400 mb-1">No payments yet</p>
            <p className="text-xs text-slate-300 mb-5">Scan a vendor QR code to make your first payment</p>
            <button
              onClick={() => navigate('/customer/scan')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full transition-colors"
            >
              <ScanLine size={12} /> Scan to Pay
            </button>
          </div>
        )}

        {!isLoading && groups.length > 0 && (
          <div className="space-y-5">
            {groups.map(({ label, txs }) => (
              <div key={label}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                <div className="divide-y divide-slate-50">
                  {txs.map((tx) => <TxRow key={tx.id} tx={tx} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
