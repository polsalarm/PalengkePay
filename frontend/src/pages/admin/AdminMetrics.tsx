import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Users, Zap, TrendingUp, BarChart2,
  Clock, ShieldCheck, AlertTriangle, Loader2,
} from 'lucide-react';
import { useMetrics } from '../../lib/hooks/useMetrics';
import { useWallet } from '../../lib/hooks/useWallet';

const PRODUCT_EMOJIS: Record<string, string> = {
  fish: '🐟', meat: '🥩', vegetables: '🥦', fruits: '🍎',
  'rice & grains': '🌾', spices: '🌶️', other: '🛒',
};

const PRODUCT_COLORS: Record<string, string> = {
  fish: '#3B82F6', meat: '#EF4444', vegetables: '#22C55E',
  fruits: '#F97316', 'rice & grains': '#EAB308', spices: '#A855F7', other: '#94A3B8',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function AdminMetrics() {
  const navigate = useNavigate();
  const { isConnected, connect } = useWallet();
  const { summary, productBreakdown, topVendors, isLoading, error, refetch } = useMetrics();

  const maxVolume = topVendors.length > 0 ? topVendors[0].volumeXlm || 1 : 1;

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-teal-600 to-teal-900 rounded-2xl p-8 text-white text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-bold mb-1">Metrics Dashboard</h1>
          <p className="text-teal-200 text-sm mb-6">Connect your admin wallet to view live metrics</p>
          <button onClick={connect}
            className="bg-white text-teal-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors">
            Connect Admin Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/market')}
              className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <BarChart2 size={20} />
              </div>
              <div>
                <h1 className="text-base font-bold">Metrics Dashboard</h1>
                <p className="text-teal-300 text-xs">Live on-chain data</p>
              </div>
            </div>
          </div>
          <button
            onClick={refetch}
            className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Top stats row in header */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Vendors', value: isLoading ? '…' : String(summary.activeVendors) },
            { label: 'Pending', value: isLoading ? '…' : String(summary.pendingVendors) },
            { label: 'Total Vendors', value: isLoading ? '…' : String(summary.totalVendors) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-xl font-black" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
              <p className="text-xs text-teal-300 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Stat cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-teal-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={TrendingUp}
              label="Total XLM Processed"
              value={summary.totalVolumeXlm.toFixed(2)}
              sub="XLM on Stellar Testnet"
              color="#0F766E"
            />
            <StatCard
              icon={Zap}
              label="Total Transactions"
              value={String(summary.totalTransactions)}
              sub="all-time payments"
              color="#7C3AED"
            />
            <StatCard
              icon={Users}
              label="Active Vendors"
              value={`${summary.activeVendors} / ${summary.totalVendors}`}
              sub={`${summary.totalVendors - summary.activeVendors} inactive`}
              color="#0369A1"
            />
            <StatCard
              icon={Clock}
              label="Avg Tx Size"
              value={summary.avgTxXlm > 0 ? summary.avgTxXlm.toFixed(3) : '—'}
              sub="XLM per payment"
              color="#D97706"
            />
          </div>

          {/* Product breakdown */}
          {productBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-black text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Vendor Categories
                </h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {productBreakdown.map(({ type, count, pct }) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{PRODUCT_EMOJIS[type] ?? '🛒'}</span>
                        <span className="text-sm font-semibold text-slate-700 capitalize">{type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{count} vendor{count !== 1 ? 's' : ''}</span>
                        <span className="text-xs font-bold text-slate-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: PRODUCT_COLORS[type] ?? '#94A3B8' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top vendors by volume */}
          {topVendors.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-black text-slate-900" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Top Vendors by Volume
                </h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                {topVendors.map((v, i) => (
                  <div key={v.name + v.stallNumber} className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{ backgroundColor: i === 0 ? '#FDE68A' : '#F1F5F9', color: i === 0 ? '#92400E' : '#64748B' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{v.name}</p>
                        <span className="text-xs font-black text-teal-700 shrink-0 ml-2">
                          {v.volumeXlm.toFixed(2)} XLM
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.round((v.volumeXlm / maxVolume) * 100)}%`, backgroundColor: '#0F766E' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {productBreakdown.length === 0 && topVendors.length === 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <BarChart2 size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No vendor data yet</p>
              <p className="text-xs text-slate-400 mt-1">Approve vendors to see metrics</p>
            </div>
          )}
        </>
      )}

      <p className="text-center text-xs text-slate-400 pb-2">
        Data sourced live from Soroban smart contracts on Stellar Testnet
      </p>
    </div>
  );
}
