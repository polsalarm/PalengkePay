import { useNavigate } from 'react-router-dom';
import { ScanLine, ExternalLink, AlertTriangle, HandCoins, Store, ShoppingBag } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useBalance } from '../../lib/hooks/useBalance';
import { useCustomerTransactions, relativeTime } from '../../lib/hooks/useTransactions';
import type { TxRecord } from '../../lib/hooks/useTransactions';
import { useCustomerUtangs, isOverdue } from '../../lib/hooks/useUtang';
import { truncateAddress, stellarExpertUrl } from '../../lib/stellar';
import { useVendorName } from '../../lib/hooks/useVendor';

function RecentTxRow({ tx }: { tx: TxRecord }) {
  const vendorName = useVendorName(tx.to);
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-700 truncate">
          {vendorName || truncateAddress(tx.to)}
        </p>
        {tx.memo && (
          <p className="text-xs text-teal-600 font-medium truncate">{tx.memo}</p>
        )}
        <p className="text-xs text-slate-400">{relativeTime(tx.createdAt)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="text-sm font-bold text-rose-500">-{tx.amountXlm.toFixed(2)} XLM</span>
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
  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Balance hero */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-5 text-white shadow-md overflow-hidden">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1">Wallet Balance</p>
        <p className="text-3xl font-bold tracking-tight truncate">
          {balance ? parseFloat(balance).toFixed(2) : '—'}
          <span className="text-base font-medium opacity-60 ml-2">XLM</span>
        </p>
        <p className="text-xs opacity-40 mt-3 font-mono truncate">{address ?? 'Not connected'}</p>
      </div>

      {/* Utang summary card */}
      {activeUtangs.length > 0 && (
        <button
          onClick={() => navigate('/customer/utang')}
          className="w-full text-left"
        >
          <div className={`rounded-xl p-4 border ${
            overdueCount > 0
              ? 'bg-rose-50 border-rose-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins size={18} className={overdueCount > 0 ? 'text-rose-500' : 'text-amber-500'} />
                <span className="text-sm font-semibold text-slate-700">Utang Balance</span>
                {overdueCount > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={10} />
                    {overdueCount} overdue
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">View →</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {totalOwed.toFixed(2)}
              <span className="text-sm font-medium text-slate-500 ml-1">XLM</span>
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
          className="flex flex-col items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-5 rounded-xl transition-all shadow-sm"
        >
          <ScanLine size={24} />
          <span className="text-sm">Scan to Pay</span>
        </button>
        <button
          onClick={() => navigate('/market')}
          className="flex flex-col items-center justify-center gap-2 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 text-slate-700 font-semibold py-5 rounded-xl transition-all shadow-sm"
        >
          <Store size={24} className="text-teal-600" />
          <span className="text-sm">Find Vendors</span>
        </button>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Recent Payments</h2>
          {transactions.length > 5 && (
            <button
              onClick={() => navigate('/customer/history')}
              className="text-xs text-teal-600 hover:underline"
            >
              View all
            </button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-3.5 w-24 bg-slate-200 animate-pulse rounded" />
                  <div className="h-3 w-32 bg-slate-100 animate-pulse rounded" />
                </div>
                <div className="h-4 w-16 bg-slate-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && recent.length === 0 && (
          <div className="text-center py-6">
            <ShoppingBag size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No payments yet</p>
            <p className="text-xs text-slate-300 mt-0.5">
              Scan a vendor QR to make your first payment
            </p>
          </div>
        )}

        {!isLoading && recent.length > 0 && (
          <div className="divide-y divide-slate-100">
            {recent.map((tx) => (
              <RecentTxRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
