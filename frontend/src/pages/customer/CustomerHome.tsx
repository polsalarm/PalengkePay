import { useNavigate } from 'react-router-dom';
import { ScanLine, ExternalLink, AlertTriangle, HandCoins, Store, ShoppingBag, ArrowRight, TrendingDown } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useBalance } from '../../lib/hooks/useBalance';
import { useCustomerTransactions, relativeTime } from '../../lib/hooks/useTransactions';
import type { TxRecord } from '../../lib/hooks/useTransactions';
import { useCustomerUtangs, isOverdue } from '../../lib/hooks/useUtang';
import { truncateAddress, stellarExpertUrl } from '../../lib/stellar';
import { useVendorName } from '../../lib/hooks/useVendor';

function groupByDate(txs: TxRecord[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups: { label: string; txs: TxRecord[] }[] = [];
  const buckets: Record<string, TxRecord[]> = {};
  for (const tx of txs) {
    const d = new Date(tx.createdAt); d.setHours(0, 0, 0, 0);
    const key = d.getTime() === today.getTime() ? 'Today'
      : d.getTime() === yesterday.getTime() ? 'Yesterday'
      : d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(tx);
  }
  for (const [label, list] of Object.entries(buckets)) groups.push({ label, txs: list });
  return groups;
}

function RecentTxRow({ tx }: { tx: TxRecord }) {
  const vendorName = useVendorName(tx.to);
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
          <TrendingDown size={14} className="text-rose-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {vendorName || truncateAddress(tx.to)}
          </p>
          {tx.memo && (
            <p className="text-xs text-teal-600 font-medium truncate">{tx.memo}</p>
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
          className="text-slate-200 hover:text-teal-500 transition-colors"
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

export function CustomerHome() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { balance } = useBalance(address);
  const { transactions, isLoading } = useCustomerTransactions(address);
  const { utangs } = useCustomerUtangs(address);

  const activeUtangs = utangs.filter((u) => u.status === 'active');
  const totalOwed = activeUtangs.reduce((sum, u) => {
    const paid = u.installmentAmountXlm * u.installmentsPaid;
    return sum + Math.max(0, u.totalAmountXlm - paid);
  }, 0);
  const overdueCount = activeUtangs.filter((u) => isOverdue(u.nextDueSecs)).length;
  const recent = transactions.slice(0, 10);
  const groups = groupByDate(recent);

  const totalSpent = transactions.reduce((s, t) => s + t.amountXlm, 0);

  return (
    <div className="space-y-4">

      {/* Balance hero */}
      <div className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 rounded-2xl p-6 text-white shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500 opacity-20 rounded-full -translate-y-10 translate-x-10 blur-2xl pointer-events-none" />
        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Wallet Balance</p>
        <p className="text-4xl font-black tracking-tight truncate">
          {balance ? parseFloat(balance).toFixed(2) : '—'}
          <span className="text-lg font-semibold opacity-50 ml-2">XLM</span>
        </p>
        <p className="text-xs opacity-40 mt-2 font-mono truncate">{address ?? 'Not connected'}</p>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs opacity-50 mb-0.5">Total spent</p>
            <p className="text-sm font-bold">{totalSpent.toFixed(2)} XLM</p>
          </div>
          <div>
            <p className="text-xs opacity-50 mb-0.5">Transactions</p>
            <p className="text-sm font-bold">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Utang summary */}
      {activeUtangs.length > 0 && (
        <button onClick={() => navigate('/customer/utang')} className="w-full text-left">
          <div className={`rounded-2xl p-4 border-2 transition-all ${
            overdueCount > 0
              ? 'bg-rose-50 border-rose-300 shadow-rose-100 shadow-md'
              : 'bg-amber-50 border-amber-200 hover:border-amber-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${overdueCount > 0 ? 'bg-rose-100' : 'bg-amber-100'}`}>
                  <HandCoins size={16} className={overdueCount > 0 ? 'text-rose-500' : 'text-amber-500'} />
                </div>
                <span className="text-sm font-bold text-slate-800">Utang Balance</span>
                {overdueCount > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={10} />
                    {overdueCount} overdue
                  </span>
                )}
              </div>
              <ArrowRight size={14} className="text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {totalOwed.toFixed(2)}
              <span className="text-sm font-semibold text-slate-500 ml-1">XLM</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeUtangs.length} active agreement{activeUtangs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </button>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/customer/scan')}
          className="flex flex-col items-center justify-center gap-3 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-bold py-6 rounded-2xl transition-all shadow-md"
        >
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <ScanLine size={24} />
          </div>
          <span className="text-sm">Scan to Pay</span>
        </button>
        <button
          onClick={() => navigate('/market')}
          className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 hover:border-teal-200 text-slate-700 font-bold py-6 rounded-2xl transition-all shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
            <Store size={24} className="text-teal-600" />
          </div>
          <span className="text-sm">Find Vendors</span>
        </button>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Recent Payments</h2>
          <button
            onClick={() => navigate('/customer/history')}
            className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        <div className="px-5 py-4">
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

          {!isLoading && recent.length === 0 && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <ShoppingBag size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-400 mb-1">No payments yet</p>
              <p className="text-xs text-slate-300 mb-4">Scan a vendor QR to make your first payment</p>
              <button
                onClick={() => navigate('/customer/scan')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full transition-colors"
              >
                <ScanLine size={12} /> Scan now
              </button>
            </div>
          )}

          {!isLoading && groups.length > 0 && (
            <div className="space-y-4">
              {groups.map(({ label, txs }) => (
                <div key={label}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                  <div className="divide-y divide-slate-50">
                    {txs.map((tx) => (
                      <RecentTxRow key={tx.id} tx={tx} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
