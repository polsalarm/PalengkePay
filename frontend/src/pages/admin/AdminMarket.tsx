import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, Users, Clock, ExternalLink, UserPlus, RefreshCw, ShieldCheck, PowerOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../lib/hooks/useWallet';
import { usePendingVendors, useAllVendors, useAdminActions } from '../../lib/hooks/useVendor';
import { useToast } from '../../components/Toast';
import { truncateAddress } from '../../lib/stellar';

const PRODUCT_COLORS: Record<string, string> = {
  fish:           'bg-blue-100 text-blue-700',
  meat:           'bg-red-100 text-red-700',
  vegetables:     'bg-green-100 text-green-700',
  fruits:         'bg-orange-100 text-orange-700',
  'rice & grains':'bg-yellow-100 text-yellow-700',
  spices:         'bg-purple-100 text-purple-700',
  other:          'bg-slate-100 text-slate-600',
};

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-teal-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials || '?'}
    </div>
  );
}

type Tab = 'pending' | 'vendors';

export function AdminMarket() {
  const { address, isConnected, connect } = useWallet();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pending');
  const { applications, isLoading: loadingPending, error: pendingError, refetch: refetchPending } = usePendingVendors();
  const { vendors, isLoading: loadingVendors, error: vendorsError, refetch: refetchVendors } = useAllVendors();
  const { approve, reject, deactivate, loadingWallet, error: actionError } = useAdminActions();
  const { showToast } = useToast();

  const handleApprove = async (vendorWallet: string, name: string) => {
    if (!address) return;
    const ok = await approve(address, vendorWallet);
    if (ok) {
      showToast(`${name} approved!`, 'success');
      refetchPending();
      refetchVendors();
    } else {
      showToast(actionError?.slice(0, 100) ?? 'Approve failed', 'error');
    }
  };

  const handleReject = async (vendorWallet: string, name: string) => {
    if (!address) return;
    const ok = await reject(address, vendorWallet);
    if (ok) {
      showToast(`${name} rejected.`, 'success');
      refetchPending();
    } else {
      showToast(actionError?.slice(0, 100) ?? 'Reject failed', 'error');
    }
  };

  const handleDeactivate = async (vendorWallet: string, name: string) => {
    if (!address) return;
    if (!window.confirm(`Deactivate ${name}? This marks them inactive on-chain.`)) return;
    const ok = await deactivate(address, vendorWallet);
    if (ok) {
      showToast(`${name} deactivated.`, 'success');
      refetchVendors();
    } else {
      showToast(actionError?.slice(0, 100) ?? 'Deactivate failed', 'error');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="bg-teal-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Dashboard</h1>
              <p className="text-teal-200 text-xs">PalengkePay Market Management</p>
            </div>
          </div>
          <p className="text-sm text-teal-100 mb-4">Connect admin wallet to manage vendor applications and registrations.</p>
          <button
            onClick={connect}
            className="bg-white text-teal-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors"
          >
            Connect Admin Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="bg-teal-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Dashboard</h1>
              <p className="text-teal-200 text-xs font-mono">{truncateAddress(address ?? '')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/register')}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={13} />
            Direct Register
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTab('pending')}
            className={`rounded-xl p-3 text-left transition-colors ${tab === 'pending' ? 'bg-white/25' : 'bg-white/10 hover:bg-white/15'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-amber-300" />
              <span className="text-xs text-teal-200 font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold">
              {loadingPending ? '…' : applications.length}
            </p>
            {applications.length > 0 && (
              <p className="text-xs text-amber-300 mt-0.5">needs review</p>
            )}
          </button>
          <button
            onClick={() => setTab('vendors')}
            className={`rounded-xl p-3 text-left transition-colors ${tab === 'vendors' ? 'bg-white/25' : 'bg-white/10 hover:bg-white/15'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-teal-200" />
              <span className="text-xs text-teal-200 font-medium">Registered</span>
            </div>
            <p className="text-2xl font-bold">
              {loadingVendors ? '…' : vendors.length}
            </p>
            <p className="text-xs text-teal-300 mt-0.5">active vendors</p>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {(pendingError || vendorsError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-mono">
          {pendingError && <p>Pending: {pendingError}</p>}
          {vendorsError && <p>Vendors: {vendorsError}</p>}
        </div>
      )}

      {/* Tab: Pending Applications */}
      {tab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Pending Applications</h2>
              {applications.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {applications.length}
                </span>
              )}
            </div>
            <button
              onClick={refetchPending}
              className="text-slate-400 hover:text-teal-600 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {loadingPending && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-teal-500" />
            </div>
          )}

          {!loadingPending && applications.length === 0 && (
            <div className="text-center py-12 px-6">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No pending applications</p>
              <p className="text-xs text-slate-400 mt-1">New applications will appear here for review</p>
            </div>
          )}

          {!loadingPending && applications.length > 0 && (
            <div className="divide-y divide-slate-100">
              {applications.map((app) => (
                <div key={app.wallet} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar name={app.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{app.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-slate-500">Stall {app.stallNumber}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRODUCT_COLORS[app.productType] ?? PRODUCT_COLORS.other}`}>
                              {app.productType}
                            </span>
                          </div>
                          {app.phone && (
                            <p className="text-xs text-slate-400 mt-1">{app.phone}</p>
                          )}
                          <p className="text-xs font-mono text-slate-300 mt-1">{truncateAddress(app.wallet)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(app.wallet, app.name)}
                          disabled={loadingWallet === app.wallet}
                          className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-60"
                        >
                          {loadingWallet === app.wallet
                            ? <Loader2 size={12} className="animate-spin" />
                            : <CheckCircle size={12} />
                          }
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.wallet, app.name)}
                          disabled={loadingWallet === app.wallet}
                          className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 active:scale-95 text-red-500 text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-60"
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Registered Vendors */}
      {tab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Registered Vendors</h2>
            <button
              onClick={refetchVendors}
              className="text-slate-400 hover:text-teal-600 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {loadingVendors && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-teal-500" />
            </div>
          )}

          {!loadingVendors && vendors.length === 0 && (
            <div className="text-center py-12 px-6">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">No vendors registered yet</p>
              <p className="text-xs text-slate-400 mt-1">Approve applications to register vendors</p>
            </div>
          )}

          {!loadingVendors && vendors.length > 0 && (
            <div className="divide-y divide-slate-100">
              {vendors.map((v) => (
                <div key={v.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={v.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{v.name}</p>
                        {v.isActive
                          ? <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium">active</span>
                          : <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-medium">inactive</span>
                        }
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-500">Stall {v.stallNumber}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRODUCT_COLORS[v.productType] ?? PRODUCT_COLORS.other}`}>
                          {v.productType}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">{v.totalTransactions}</p>
                        <p className="text-xs text-slate-400">txns</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://stellar.expert/explorer/testnet/account/${v.marketId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-300 hover:text-teal-600 transition-colors"
                        >
                          <ExternalLink size={11} />
                        </a>
                        {v.isActive && (
                          <button
                            onClick={() => handleDeactivate(v.marketId, v.name)}
                            disabled={loadingWallet === v.marketId}
                            title="Deactivate vendor"
                            className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            {loadingWallet === v.marketId
                              ? <Loader2 size={11} className="animate-spin" />
                              : <PowerOff size={11} />
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
