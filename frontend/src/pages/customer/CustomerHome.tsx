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
    <div className="flex items-center justify-between py-2.5 px-2 rounded-xl transition-colors hover:bg-slate-50">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#FFF1F2' }}
        >
          <TrendingDown size={14} style={{ color: '#F43F5E' }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {vendorName || truncateAddress(tx.to)}
          </p>
          {tx.memo && (
            <p className="text-xs font-medium truncate mt-0.5" style={{ color: '#0F766E' }}>{tx.memo}</p>
          )}
          <p className="text-xs text-slate-400">{relativeTime(tx.createdAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="text-sm font-black" style={{ color: '#F43F5E' }}>-{tx.amountXlm.toFixed(2)}</span>
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
    <div className="space-y-4 animate-page-in">

      {/* ── BALANCE HERO ── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: '#0A3D38' }}>
        <div
          className="absolute pointer-events-none"
          style={{
            top: -50, right: -50, width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20,184,166,0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
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
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >Wallet Balance</p>
          <p
            className="font-black text-white leading-none mb-2"
            style={{ fontSize: 'clamp(2.6rem, 9vw, 4.2rem)', fontFamily: "'Syne', sans-serif" }}
          >
            {balance ? parseFloat(balance).toFixed(2) : '—'}
            <span className="text-xl font-semibold ml-2" style={{ color: 'rgba(255,255,255,0.35)' }}>XLM</span>
          </p>
          <p
            className="text-xs font-mono mb-5 truncate"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >{address ?? 'Not connected'}</p>

          <div
            className="pt-4 grid grid-cols-2 gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Total spent</p>
              <p className="text-sm font-black text-white">{totalSpent.toFixed(2)} XLM</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Transactions</p>
              <p className="text-sm font-black text-white">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── UTANG ALERT ── */}
      {activeUtangs.length > 0 && (
        <button onClick={() => navigate('/customer/utang')} className="w-full text-left">
          <div
            className="rounded-2xl p-4 transition-all"
            style={overdueCount > 0
              ? { backgroundColor: '#FFF1F2', border: '2px solid #FECDD3' }
              : { backgroundColor: '#FFFBEB', border: '2px solid #FDE68A' }
            }
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={overdueCount > 0 ? { backgroundColor: '#FFE4E6' } : { backgroundColor: '#FEF3C7' }}
                >
                  {overdueCount > 0
                    ? <AlertTriangle size={17} style={{ color: '#F43F5E' }} className="animate-pulse" />
                    : <HandCoins size={17} style={{ color: '#D97706' }} />
                  }
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">Utang Balance</p>
                  {overdueCount > 0 && (
                    <span className="text-xs font-bold" style={{ color: '#F43F5E' }}>
                      {overdueCount} overdue
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight size={15} className="text-slate-400" />
            </div>
            <p
              className="font-black text-slate-900 leading-none"
              style={{ fontSize: '2rem', fontFamily: "'Syne', sans-serif" }}
            >
              {totalOwed.toFixed(2)}
              <span className="text-sm font-semibold text-slate-500 ml-1.5">XLM</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeUtangs.length} active agreement{activeUtangs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </button>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div className="space-y-3">
        {/* Primary: Scan to Pay */}
        <button
          onClick={() => navigate('/customer/scan')}
          className="w-full relative overflow-hidden flex items-center gap-4 text-white py-5 px-6 rounded-2xl transition-all active:scale-95 shadow-lg hover:opacity-95"
          style={{ backgroundColor: '#0F766E' }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgba(20,184,166,0.35), transparent)' }}
          />
          <div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <ScanLine size={24} />
          </div>
          <div className="relative text-left">
            <p className="font-black text-lg leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Scan to Pay</p>
            <p className="text-xs opacity-55 mt-0.5">Aim at any PalengkePay QR</p>
          </div>
        </button>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/market')}
            className="flex flex-col items-center justify-center gap-2.5 bg-white border border-slate-200 active:scale-95 py-5 rounded-2xl transition-all"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#0F766E';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F0FDFA';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F0FDFA' }}>
              <Store size={20} style={{ color: '#0F766E' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>Find Vendors</p>
              <p className="text-xs text-slate-400 mt-0.5">Browse palengke</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/customer/history')}
            className="flex flex-col items-center justify-center gap-2.5 bg-white border border-slate-200 active:scale-95 py-5 rounded-2xl transition-all"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#F59E0B';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFBEB';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <ShoppingBag size={20} style={{ color: '#D97706' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>History</p>
              <p className="text-xs text-slate-400 mt-0.5">Past payments</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── RECENT PAYMENTS ── */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>
            Recent Payments
          </h2>
          <button
            onClick={() => navigate('/customer/history')}
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

          {!isLoading && recent.length === 0 && (
            <div className="text-center py-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <ShoppingBag size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500 mb-1">Wala pang payments</p>
              <p className="text-xs text-slate-400 mb-4">I-scan ang QR ng vendor para magbayad</p>
              <button
                onClick={() => navigate('/customer/scan')}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-colors"
                style={{ color: '#0F766E', backgroundColor: '#F0FDFA' }}
              >
                <ScanLine size={12} /> Scan now
              </button>
            </div>
          )}

          {!isLoading && groups.length > 0 && (
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
                    {txs.map(tx => (
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
