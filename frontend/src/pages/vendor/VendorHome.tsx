import { useEffect, useRef } from 'react';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { BalanceDisplay } from '../../components/BalanceDisplay';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendor } from '../../lib/hooks/useVendor';
import { useVendorTransactions, relativeTime } from '../../lib/hooks/useTransactions';
import { useToast } from '../../components/Toast';
import { truncateAddress, stellarExpertUrl, getServer } from '../../lib/stellar';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function VendorHome() {
  const { address } = useWallet();
  const { vendor } = useVendor(address);
  const { transactions, isLoading, todayEarnings, todayCount } = useVendorTransactions(address);
  const { showToast } = useToast();
  const prevCountRef = useRef<number | null>(null);

  // Horizon SSE — real-time payment notifications
  useEffect(() => {
    if (!address) return;
    const server = getServer();

    const close = server
      .effects()
      .forAccount(address)
      .cursor('now')
      .stream({
        onmessage: (effect: { type: string; amount?: string }) => {
          if (effect.type === 'account_credited') {
            showToast(
              `Payment received! +${parseFloat(effect.amount ?? '0').toFixed(2)} XLM`,
              'success'
            );
          }
        },
        onerror: () => {},
      });

    return () => {
      if (typeof close === 'function') close();
    };
  }, [address, showToast]);

  // Toast on new Firestore tx (from SSE lag)
  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = transactions.length;
      return;
    }
    if (transactions.length > prevCountRef.current) {
      const newest = transactions[0];
      showToast(
        `+${newest.amountXlm.toFixed(2)} XLM${newest.memo ? ` — ${newest.memo}` : ''}`,
        'success'
      );
    }
    prevCountRef.current = transactions.length;
  }, [transactions, showToast]);

  const name = vendor?.name?.split(' ')[0] ?? 'Vendor';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{greeting()}, {name} 👋</h1>
        <p className="text-sm text-slate-400">Here's your summary for today.</p>
      </div>

      {/* Today's earnings card */}
      <div className="bg-teal-700 rounded-xl p-5 text-white">
        <p className="text-xs font-medium text-teal-200 uppercase tracking-wide mb-1">Today's Earnings</p>
        {isLoading ? (
          <div className="h-9 w-40 bg-teal-600 animate-pulse rounded mb-1" />
        ) : (
          <p className="text-3xl font-bold mb-0.5">
            {todayEarnings().toFixed(2)} <span className="text-teal-300 text-xl">XLM</span>
          </p>
        )}
        <p className="text-sm text-teal-200">{todayCount()} transaction{todayCount() !== 1 ? 's' : ''} today</p>
      </div>

      {/* Wallet balance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <BalanceDisplay />
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Payments</h2>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
          <div className="text-center py-8">
            <TrendingUp size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">No payments yet</p>
            <p className="text-xs text-slate-300 mt-0.5">
              Share your QR code so customers can pay you
            </p>
          </div>
        )}

        {!isLoading && transactions.length > 0 && (
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-mono text-slate-700">
                    {truncateAddress(tx.customerWallet)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tx.memo || 'No description'} · {relativeTime(tx.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-semibold text-green-600">
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
