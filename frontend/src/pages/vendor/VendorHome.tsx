import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, HandCoins, ExternalLink, TrendingUp, ArrowRight, Zap, AlertCircle, RefreshCw } from 'lucide-react';
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

const AVATAR_COLORS = ['#14B8A6', '#0F766E', '#A78BFA', '#FB923C', '#F472B6', '#34D399', '#60A5FA'];

export function VendorHome() {
  const { address } = useWallet();
  const navigate = useNavigate();
  const { vendor, notFound } = useVendor(address);
  const { balance } = useBalance(address);
  const { transactions, isLoading, error, retry, todayEarnings, todayCount } = useVendorTransactions(address);
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
    <div className="space-y-4 animate-page-in">

      {/* ── EARNINGS HERO ── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: '#0A3D38' }}>
        {/* Ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -50, right: -50, width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20,184,166,0.32) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* ₱ watermark */}
        <div
          className="absolute select-none pointer-events-none font-black"
          style={{
            fontSize: '13rem', lineHeight: 1,
            color: 'rgba(255,255,255,0.03)',
            bottom: -20, right: -8,
            fontFamily: "'Syne', sans-serif",
          }}
        >₱</div>

        <div className="relative p-6">
          {/* Greeting pill */}
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#4ADE80' }} />
            {greeting()}, {firstName}
          </div>

          {/* Earnings + balance */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >Today's Earnings</p>
              {isLoading
                ? <div className="h-14 w-44 skeleton rounded-xl mb-2" />
                : (
                  <p
                    className="font-black text-white leading-none mb-2"
                    style={{ fontSize: 'clamp(2.6rem, 9vw, 4.2rem)', fontFamily: "'Syne', sans-serif" }}
                  >
                    {earnings.toFixed(2)}
                    <span className="text-xl font-semibold ml-2" style={{ color: 'rgba(255,255,255,0.35)' }}>XLM</span>
                  </p>
                )
              }
              <div className="flex items-center gap-1.5">
                <Zap size={12} style={{ color: '#FDE68A' }} />
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {count} payment{count !== 1 ? 's' : ''} today
                </span>
              </div>
            </div>

            <div
              className="shrink-0 rounded-2xl px-4 py-3 text-right"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Wallet</p>
              <p
                className="font-black text-white"
                style={{ fontSize: '1.6rem', fontFamily: "'Syne', sans-serif" }}
              >
                {balance ? parseFloat(balance).toFixed(2) : '—'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>XLM</p>
            </div>
          </div>

          {/* All-time stats */}
          <div
            className="mt-5 pt-4 grid grid-cols-2 gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>All-time earnings</p>
              <p className="text-sm font-black text-white">
                {transactions.reduce((s, t) => s + t.amountXlm, 0).toFixed(2)} XLM
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Total payments</p>
              <p className="text-sm font-black text-white">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/vendor/qr')}
          className="group relative overflow-hidden flex flex-col items-center justify-center gap-3 bg-white active:scale-95 py-7 rounded-2xl transition-all border"
          style={{ borderColor: '#E2E8F0' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#0F766E';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F0FDFA';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: '#0F766E' }} />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#F0FDFA' }}>
            <QrCode size={24} style={{ color: '#0F766E' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>Show QR</p>
            <p className="text-xs text-slate-400 mt-0.5">Accept payments</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/vendor/utang')}
          className="group relative overflow-hidden flex flex-col items-center justify-center gap-3 bg-white active:scale-95 py-7 rounded-2xl transition-all border"
          style={{ borderColor: '#E2E8F0' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#F59E0B';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFBEB';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: '#F59E0B' }} />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FFFBEB' }}>
            <HandCoins size={24} style={{ color: '#D97706' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>Utang</p>
            <p className="text-xs text-slate-400 mt-0.5">Installment credit</p>
          </div>
        </button>
      </div>

      {/* ── RECENT PAYMENTS ── */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Recent Payments
          </h2>
          <button
            onClick={() => navigate('/vendor/transactions')}
            className="flex items-center gap-1 text-xs font-bold hover:underline transition-colors"
            style={{ color: '#0F766E' }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        <div className="px-5 py-4">
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full skeleton shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 skeleton rounded" />
                    <div className="h-2.5 w-20 skeleton rounded" />
                  </div>
                  <div className="h-4 w-16 skeleton rounded" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#FFF1F2', border: '1px solid #FECDD3' }}>
                <AlertCircle size={20} style={{ color: '#F43F5E' }} />
              </div>
              <p className="text-sm font-bold text-slate-500 mb-1">Failed to load</p>
              <p className="text-xs text-slate-400 mb-3">{error}</p>
              <button onClick={retry} className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-colors" style={{ color: '#0F766E', backgroundColor: '#F0FDFA' }}>
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}

          {!isLoading && !error && transactions.length === 0 && (
            <div className="text-center py-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: '#F0FDFA', border: '1px solid #CCFBF1' }}
              >
                <TrendingUp size={22} style={{ color: '#14B8A6' }} />
              </div>
              <p className="text-sm font-bold text-slate-500 mb-1">Wala pang payments</p>
              <p className="text-xs text-slate-400 mb-4">I-share ang iyong QR para makatanggap ng bayad</p>
              <button
                onClick={() => navigate('/vendor/qr')}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-colors"
                style={{ color: '#0F766E', backgroundColor: '#F0FDFA' }}
              >
                <QrCode size={12} /> Show my QR
              </button>
            </div>
          )}

          {!isLoading && !error && groups.length > 0 && (
            <div className="space-y-5">
              {groups.map(({ label, txs }) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex-1 h-px bg-slate-100" />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                      {label}
                    </span>
                    <span className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="space-y-0.5">
                    {txs.map(tx => {
                      const color = AVATAR_COLORS[tx.from.charCodeAt(0) % AVATAR_COLORS.length];
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between py-2.5 px-2 rounded-xl transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0"
                              style={{ backgroundColor: color + '22', color }}
                            >
                              {tx.from[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-mono text-slate-600 truncate">{truncateAddress(tx.from)}</p>
                              {tx.memo && (
                                <p className="text-xs font-medium truncate mt-0.5" style={{ color: '#0F766E' }}>{tx.memo}</p>
                              )}
                              <p className="text-xs text-slate-400">{relativeTime(tx.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-sm font-black" style={{ color: '#059669' }}>+{tx.amountXlm.toFixed(2)}</span>
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
                    })}
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
