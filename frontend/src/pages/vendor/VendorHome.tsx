import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, HandCoins, ExternalLink, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useBalance } from '../../lib/hooks/useBalance';
import { useVendor } from '../../lib/hooks/useVendor';
import { useVendorTransactions, relativeTime } from '../../lib/hooks/useTransactions';
import type { TxRecord } from '../../lib/hooks/useTransactions';
import { useToast } from '../../components/Toast';
import { truncateAddress, stellarExpertUrl, getServer } from '../../lib/stellar';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

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
  const recent = transactions.slice(0, 10);
  const groups = groupByDate(recent);

  return (
    <div className="space-y-4">

      {/* Hero card */}
      <div className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 rounded-2xl p-6 text-white shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500 opacity-15 rounded-full -translate-y-16 translate-x-16 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-800 opacity-20 rounded-full translate-y-8 -translate-x-8 blur-xl pointer-events-none" />

        <p className="relative text-xs font-bold opacity-60 uppercase tracking-widest mb-4">
          {greeting()}, {firstName} 👋
        </p>

        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-xs opacity-60 mb-1">Today's Earnings</p>
            {isLoading
              ? <div className="h-10 w-36 bg-white/10 animate-pulse rounded-lg" />
              : <p className="text-4xl font-black tracking-tight">{earnings.toFixed(2)}<span className="text-lg font-semibold opacity-50 ml-1.5">XLM</span></p>
            }
            <div className="flex items-center gap-1.5 mt-1">
              <Zap size={11} className="text-yellow-300 opacity-70" />
              <p className="text-xs opacity-50">{count} payment{count !== 1 ? 's' : ''} today</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-50 mb-0.5">Wallet</p>
            <p className="text-xl font-black">{balance ? parseFloat(balance).toFixed(2) : '—'}</p>
            <p className="text-xs opacity-40">XLM</p>
          </div>
        </div>

        {/* Total stats */}
        <div className="relative mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs opacity-50 mb-0.5">All-time earnings</p>
            <p className="text-sm font-bold">
              {transactions.reduce((s, t) => s + t.amountXlm, 0).toFixed(2)} XLM
            </p>
          </div>
          <div>
            <p className="text-xs opacity-50 mb-0.5">Total payments</p>
            <p className="text-sm font-bold">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/vendor/qr')}
          className="flex flex-col items-center justify-center gap-3 bg-white border-2 border-teal-200 hover:bg-teal-50 hover:border-teal-400 active:scale-95 py-6 rounded-2xl transition-all shadow-sm group"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center transition-colors">
            <QrCode size={24} className="text-teal-700" />
          </div>
          <div className="text-center">
            <span className="text-sm font-bold text-slate-800 block">Show QR</span>
            <span className="text-xs text-slate-400">Accept payments</span>
          </div>
        </button>
        <button
          onClick={() => navigate('/vendor/utang')}
          className="flex flex-col items-center justify-center gap-3 bg-white border-2 border-amber-200 hover:bg-amber-50 hover:border-amber-400 active:scale-95 py-6 rounded-2xl transition-all shadow-sm group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
            <HandCoins size={24} className="text-amber-600" />
          </div>
          <div className="text-center">
            <span className="text-sm font-bold text-slate-800 block">Utang</span>
            <span className="text-xs text-slate-400">Installment credit</span>
          </div>
        </button>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Recent Payments</h2>
          <button
            onClick={() => navigate('/vendor/transactions')}
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

          {!isLoading && transactions.length === 0 && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3 border border-teal-100">
                <TrendingUp size={24} className="text-teal-400" />
              </div>
              <p className="text-sm font-semibold text-slate-400 mb-1">No payments yet</p>
              <p className="text-xs text-slate-300 mb-4">Share your QR code so customers can pay you</p>
              <button
                onClick={() => navigate('/vendor/qr')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-full transition-colors"
              >
                <QrCode size={12} /> Show my QR
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
                      <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
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
                          <a href={stellarExpertUrl(tx.id)} target="_blank" rel="noopener noreferrer"
                            className="text-slate-200 hover:text-teal-500 transition-colors">
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
    </div>
  );
}
