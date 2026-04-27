import { ExternalLink, List } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useCustomerTransactions, relativeTime } from '../../lib/hooks/useTransactions';
import type { TxRecord } from '../../lib/hooks/useTransactions';
import { truncateAddress, stellarExpertUrl } from '../../lib/stellar';
import { useVendorName } from '../../lib/hooks/useVendor';

function TxRow({ tx }: { tx: TxRecord }) {
  const vendorName = useVendorName(tx.to);
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-700 truncate">
          {vendorName || truncateAddress(tx.to)}
        </p>
        {tx.memo && (
          <p className="text-xs text-teal-600 font-medium truncate mt-0.5">{tx.memo}</p>
        )}
        <p className="text-xs text-slate-400">{relativeTime(tx.createdAt)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="text-sm font-bold text-rose-500">
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
  );
}

export function CustomerHistory() {
  const { address } = useWallet();
  const { transactions, isLoading } = useCustomerTransactions(address);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Payment History</h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
            <p className="text-sm font-medium text-slate-400">No payments yet</p>
            <p className="text-xs text-slate-300 mt-0.5">Your payment history will appear here</p>
          </div>
        )}

        {!isLoading && transactions.length > 0 && (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
