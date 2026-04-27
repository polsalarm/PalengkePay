import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, HandCoins, ExternalLink, TrendingUp } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useBalance } from '../../lib/hooks/useBalance';
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
  const navigate = useNavigate();
  const { vendor, notFound } = useVendor(address);
  const { balance } = useBalance(address);
  const { transactions, isLoading, todayEarnings, todayCount } = useVendorTransactions(address);
  const { showToast } = useToast();
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (address && notFound) navigate('/vendor/apply', { replace: true });
  }, [address, notFound, navigate]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!address) return;
    const server = getServer();
    const close = server.effects().forAccount(address).cursor('now').stream({
      onmessage: (effect: { type: string; amount?: string }) => {
        if (effect.type === 'account_credited') {
          const amt = parseFloat(effect.amount ?? '0').toFixed(2);
          showToast(`Payment received! +${amt} XLM`, 'success');
          if ('Notification' in window && Notification.permission === 'granted') {
            server.transactions().forAccount(address).order('desc').limit(1).call()
              .then(({ records }) => {
                const memo = records[0]?.memo ?? '';
                new Notification('PalengkePay — Payment received!', {
                  body: memo ? `+${amt} XLM · ${memo}` : `+${amt} XLM`,
                  icon: '/favicon.svg',
                  tag: 'payment-received',
                });
              })
              .catch(() => {
                new Notification('PalengkePay — Payment received!', {
                  body: `+${amt} XLM`,
                  icon: '/favicon.svg',
                  tag: 'payment-received',
                });
              });
          }
        }
      },
      onerror: () => {},
    });
    return () => { if (typeof close === 'function') close(); };
  }, [address, showToast]);

  useEffect(() => {
    if (prevCountRef.current === null) { prevCountRef.current = transactions.length; return; }
    if (transactions.length > prevCountRef.current) {
      const newest = transactions[0];
      showToast(`+${newest.amountXlm.toFixed(2)} XLM from ${newest.from.slice(0, 8)}…`, 'success');
    }
    prevCountRef.current = transactions.length;
  }, [transactions, showToast]);

  const firstName = vendor?.name?.split(' ')[0] ?? 'Vendor';
  const earnings = todayEarnings();
  const count = todayCount();

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-900 rounded-2xl p-5 text-white shadow-md">
        <p className="text-xs font-semibold opacity-60 uppercase tracking-widest mb-3">
          {greeting()}, {firstName} 👋
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs opacity-60 mb-0.5">Today's Earnings</p>
            {isLoading
              ? <div className="h-9 w-32 bg-teal-700 animate-pulse rounded" />
              : <p className="text-3xl font-bold">{earnings.toFixed(2)} <span className="text-lg opacity-60">XLM</span></p>
            }
            <p className="text-xs opacity-50 mt-1">{count} payment{count !== 1 ? 's' : ''} today</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-50 mb-0.5">Wallet</p>
            <p className="text-lg font-bold">{balance ? parseFloat(balance).toFixed(2) : '—'}</p>
            <p className="text-xs opacity-40">XLM</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/vendor/qr')}
          className="flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50 active:scale-95 py-5 rounded-xl transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <QrCode size={20} className="text-teal-700" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Show QR</span>
        </button>
        <button
          onClick={() => navigate('/vendor/utang')}
          className="flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 active:scale-95 py-5 rounded-xl transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <HandCoins size={20} className="text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Utang</span>
        </button>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Recent Payments</h2>
          {transactions.length > 5 && (
            <button onClick={() => navigate('/vendor/transactions')}
              className="text-xs text-teal-600 hover:underline">
              View all
            </button>
          )}
        </div>

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
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-400">No payments yet</p>
            <p className="text-xs text-slate-300 mt-0.5">Share your QR so customers can pay</p>
          </div>
        )}

        {!isLoading && transactions.length > 0 && (
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono text-slate-600 truncate">{truncateAddress(tx.from)}</p>
                  {tx.memo && (
                    <p className="text-xs text-teal-600 font-medium truncate mt-0.5">{tx.memo}</p>
                  )}
                  <p className="text-xs text-slate-400">{relativeTime(tx.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-bold text-green-600">+{tx.amountXlm.toFixed(2)} XLM</span>
                  <a href={stellarExpertUrl(tx.id)} target="_blank" rel="noopener noreferrer"
                    className="text-slate-300 hover:text-teal-600 transition-colors">
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
