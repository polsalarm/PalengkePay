import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, Users, Clock, ExternalLink, UserPlus,
  RefreshCw, ShieldCheck, PowerOff, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../lib/hooks/useWallet';
import { usePendingVendors, useAllVendors, useAdminActions } from '../../lib/hooks/useVendor';
import type { VendorProfile, VendorApplication } from '../../lib/hooks/useVendor';
import { useToast } from '../../components/Toast';
import { truncateAddress } from '../../lib/stellar';

const PRODUCT_COLORS: Record<string, string> = {
  fish:            'bg-blue-100 text-blue-700',
  meat:            'bg-red-100 text-red-700',
  vegetables:      'bg-green-100 text-green-700',
  fruits:          'bg-orange-100 text-orange-700',
  'rice & grains': 'bg-yellow-100 text-yellow-700',
  spices:          'bg-purple-100 text-purple-700',
  other:           'bg-slate-100 text-slate-600',
};

const PRODUCT_EMOJIS: Record<string, string> = {
  fish: '🐟', meat: '🥩', vegetables: '🥦', fruits: '🍎',
  'rice & grains': '🌾', spices: '🌶️', other: '🛒',
};

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-teal-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>
      {initials || '?'}
    </div>
  );
}

type Tab = 'pending' | 'vendors';

// ── Application card ──────────────────────────────────────────────────────────

function ApplicationCard({
  app,
  onApprove,
  onReject,
  loading,
}: {
  app: VendorApplication;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  return (
    <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4">
      {/* Vendor info */}
      <div className="flex items-start gap-3">
        <Avatar name={app.name} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-base">{app.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-slate-500 font-medium">Stall {app.stallNumber}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PRODUCT_COLORS[app.productType] ?? PRODUCT_COLORS.other}`}>
              {PRODUCT_EMOJIS[app.productType] ?? '🛒'} {app.productType}
            </span>
          </div>
          {app.phone && (
            <p className="text-sm text-slate-500 mt-1">📞 {app.phone}</p>
          )}
          <p className="text-xs font-mono text-slate-400 mt-1">{truncateAddress(app.wallet)}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onApprove}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Approve
        </button>
        <button
          onClick={onReject}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 active:scale-95 border border-red-200 text-red-600 font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm"
        >
          <XCircle size={16} />
          Decline
        </button>
      </div>
    </div>
  );
}

// ── Vendor card ───────────────────────────────────────────────────────────────

function VendorCard({
  vendor,
  onDeactivate,
  loading,
}: {
  vendor: VendorProfile;
  onDeactivate: () => void;
  loading: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={`p-5 border rounded-2xl bg-white shadow-sm space-y-3 transition-colors ${
      !vendor.isActive ? 'opacity-60 border-slate-200' : 'border-slate-200'
    }`}>
      {/* Vendor info */}
      <div className="flex items-start gap-3">
        <Avatar name={vendor.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-900 text-base">{vendor.name}</p>
            {vendor.isActive
              ? <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">● Active</span>
              : <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">● Inactive</span>
            }
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-slate-500 font-medium">Stall {vendor.stallNumber}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PRODUCT_COLORS[vendor.productType] ?? PRODUCT_COLORS.other}`}>
              {PRODUCT_EMOJIS[vendor.productType] ?? '🛒'} {vendor.productType}
            </span>
          </div>
          {vendor.phone && (
            <p className="text-sm text-slate-500 mt-1">📞 {vendor.phone}</p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-1">
        <div>
          <p className="text-xl font-bold text-slate-900">{vendor.totalTransactions}</p>
          <p className="text-xs text-slate-400">transactions</p>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div>
          <p className="text-xl font-bold text-slate-900">
            {(Number(vendor.totalVolume) / 10_000_000).toFixed(1)}
          </p>
          <p className="text-xs text-slate-400">XLM volume</p>
        </div>
        <a
          href={`https://stellar.expert/explorer/testnet/account/${vendor.marketId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-slate-400 hover:text-teal-600 transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Deactivate button or confirmation */}
      {vendor.isActive && !confirming && (
        <button
          onClick={() => setConfirming(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 font-semibold py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
        >
          <PowerOff size={14} />
          Deactivate Vendor
        </button>
      )}

      {/* Inline confirmation */}
      {confirming && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={16} />
            <p className="text-sm font-semibold">Deactivate {vendor.name}?</p>
          </div>
          <p className="text-xs text-red-600">
            This marks the vendor as inactive on-chain. They will no longer appear as active in the market.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setConfirming(false); onDeactivate(); }}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <PowerOff size={14} />}
              Yes, Deactivate
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminMarket() {
  const { address, isConnected, connect } = useWallet();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pending');
  const { applications, isLoading: loadingPending, error: pendingError, refetch: refetchPending } = usePendingVendors();
  const { vendors, isLoading: loadingVendors, error: vendorsError, refetch: refetchVendors } = useAllVendors();
  const { approve, reject, deactivate, loadingWallet, error: actionError } = useAdminActions();
  const { showToast } = useToast();

  const activeVendors = vendors.filter((v) => v.isActive);

  const handleApprove = async (vendorWallet: string, name: string) => {
    if (!address) return;
    const ok = await approve(address, vendorWallet);
    if (ok) { showToast(`${name} approved!`, 'success'); refetchPending(); refetchVendors(); }
    else showToast(actionError?.slice(0, 100) ?? 'Approve failed', 'error');
  };

  const handleReject = async (vendorWallet: string, name: string) => {
    if (!address) return;
    const ok = await reject(address, vendorWallet);
    if (ok) { showToast(`${name} declined.`, 'success'); refetchPending(); }
    else showToast(actionError?.slice(0, 100) ?? 'Reject failed', 'error');
  };

  const handleDeactivate = async (vendorWallet: string, name: string) => {
    if (!address) return;
    const ok = await deactivate(address, vendorWallet);
    if (ok) { showToast(`${name} deactivated.`, 'success'); refetchVendors(); }
    else showToast(actionError?.slice(0, 100) ?? 'Deactivate failed', 'error');
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-teal-600 to-teal-900 rounded-2xl p-8 text-white text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-teal-200 text-sm mb-6">Connect your admin wallet to manage vendors</p>
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
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold">Admin Dashboard</h1>
              <p className="text-teal-300 text-xs font-mono">{truncateAddress(address ?? '')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/register')}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={13} /> Register
          </button>
        </div>

        {/* Tab stats */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTab('pending')}
            className={`rounded-xl p-4 text-left transition-all ${tab === 'pending' ? 'bg-white/25 ring-2 ring-white/30' : 'bg-white/10 hover:bg-white/15'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock size={15} className="text-amber-300" />
              <span className="text-xs text-teal-200 font-semibold uppercase tracking-wide">Pending</span>
            </div>
            <p className="text-3xl font-bold">{loadingPending ? '…' : applications.length}</p>
            {applications.length > 0
              ? <p className="text-xs text-amber-300 mt-1 font-medium">⚠ Needs review</p>
              : <p className="text-xs text-teal-400 mt-1">All clear</p>
            }
          </button>
          <button
            onClick={() => setTab('vendors')}
            className={`rounded-xl p-4 text-left transition-all ${tab === 'vendors' ? 'bg-white/25 ring-2 ring-white/30' : 'bg-white/10 hover:bg-white/15'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users size={15} className="text-teal-200" />
              <span className="text-xs text-teal-200 font-semibold uppercase tracking-wide">Vendors</span>
            </div>
            <p className="text-3xl font-bold">{loadingVendors ? '…' : activeVendors.length}</p>
            <p className="text-xs text-teal-400 mt-1">active in market</p>
          </button>
        </div>
      </div>

      {/* Error */}
      {(pendingError || vendorsError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          {pendingError && <p>Pending error: {pendingError}</p>}
          {vendorsError && <p>Vendors error: {vendorsError}</p>}
        </div>
      )}

      {/* ── Tab: Pending ── */}
      {tab === 'pending' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">Pending Applications</h2>
              {applications.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {applications.length} new
                </span>
              )}
            </div>
            <button onClick={refetchPending} className="text-slate-400 hover:text-teal-600 transition-colors">
              <RefreshCw size={15} />
            </button>
          </div>

          {loadingPending && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-teal-500" />
            </div>
          )}

          {!loadingPending && applications.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Clock size={28} className="text-slate-300" />
              </div>
              <p className="text-base font-semibold text-slate-600">No pending applications</p>
              <p className="text-sm text-slate-400 mt-1">New vendor applications will appear here for review</p>
            </div>
          )}

          {!loadingPending && applications.map((app) => (
            <ApplicationCard
              key={app.wallet}
              app={app}
              loading={loadingWallet === app.wallet}
              onApprove={() => handleApprove(app.wallet, app.name)}
              onReject={() => handleReject(app.wallet, app.name)}
            />
          ))}
        </div>
      )}

      {/* ── Tab: Vendors ── */}
      {tab === 'vendors' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Registered Vendors</h2>
            <button onClick={refetchVendors} className="text-slate-400 hover:text-teal-600 transition-colors">
              <RefreshCw size={15} />
            </button>
          </div>

          {loadingVendors && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-teal-500" />
            </div>
          )}

          {!loadingVendors && vendors.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Users size={28} className="text-slate-300" />
              </div>
              <p className="text-base font-semibold text-slate-600">No vendors registered yet</p>
              <p className="text-sm text-slate-400 mt-1">Approve applications to add vendors to the market</p>
            </div>
          )}

          {!loadingVendors && vendors.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              loading={loadingWallet === v.marketId}
              onDeactivate={() => handleDeactivate(v.marketId, v.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
