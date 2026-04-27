import { useNavigate } from 'react-router-dom';
import { ScanLine, ExternalLink } from 'lucide-react';
import { BalanceDisplay } from '../../components/BalanceDisplay';
import { useWallet } from '../../lib/hooks/useWallet';
import { useCustomerTransactions, relativeTime } from '../../lib/hooks/useTransactions';
import { truncateAddress, stellarExpertUrl } from '../../lib/stellar';

export function CustomerHome() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { transactions, isLoading } = useCustomerTransactions(address);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Welcome 👋</h1>
        <p className="text-sm text-slate-500">Ready to pay at the palengke?</p>
      </div>

      {/* Balance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <BalanceDisplay />
      </div>

      {/* Scan CTA */}
      <button
        onClick={() => navigate('/customer/scan')}
        className="w-full flex items-center justify-center gap-3 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-4 rounded-xl transition-all shadow-sm text-base"
      >
        <ScanLine size={22} />
        Scan to Pay
      </button>

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Payments</h2>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="h-3.5 w-24 bg-slate-200 animate-pulse rounded mb-1" />
                  <div className="h-3 w-32 bg-slate-100 animate-pulse rounded" />
                </div>
                <div className="h-4 w-16 bg-slate-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && transactions.length === 0 && (
          <div className="text-center py-6">
            <ScanLine size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No payments yet</p>
            <p className="text-xs text-slate-300 mt-0.5">
              Scan a vendor QR to make your first payment
            </p>
          </div>
        )}

        {!isLoading && transactions.length > 0 && (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-slate-700">
                    → {truncateAddress(tx.vendorWallet)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tx.memo || 'No description'} · {relativeTime(tx.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-semibold text-slate-700">
                    -{tx.amountXlm.toFixed(2)} XLM
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
