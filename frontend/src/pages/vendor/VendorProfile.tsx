import { useState, useEffect } from 'react';
import { User, Edit2, Check, X, Loader2 } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendor } from '../../lib/hooks/useVendor';
import { useToast } from '../../components/Toast';
import { truncateAddress, prepareContractTx, submitSorobanTx, addressToScVal, stringToScVal } from '../../lib/stellar';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';

const REGISTRY_ID = import.meta.env.VITE_VENDOR_REGISTRY_CONTRACT_ID as string | undefined;
const PRODUCT_TYPES = ['fish', 'meat', 'vegetables', 'fruits', 'rice & grains', 'spices', 'other'];

export function VendorProfile() {
  const { address } = useWallet();
  const { vendor, isLoading } = useVendor(address);
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', stallNumber: '', phone: '', productType: 'fish' });

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name,
        stallNumber: vendor.stallNumber,
        phone: vendor.phone,
        productType: vendor.productType,
      });
    }
  }, [vendor]);

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!address || !REGISTRY_ID) return;
    setSaving(true);
    try {
      const xdr = await prepareContractTx(address, REGISTRY_ID, 'update_profile', [
        addressToScVal(address),
        stringToScVal(form.name),
        stringToScVal(form.stallNumber),
        stringToScVal(form.phone),
        stringToScVal(form.productType),
      ]);
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });
      await submitSorobanTx(signedTxXdr);
      showToast('Profile updated on-chain!', 'success');
      setEditing(false);
    } catch (err: unknown) {
      showToast((err as { message?: string }).message ?? 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-bold text-slate-900">Profile</h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {/* Avatar row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
              <User size={22} className="text-teal-700" />
            </div>
            <div>
              {isLoading
                ? <div className="h-4 w-32 bg-slate-200 animate-pulse rounded mb-1" />
                : <p className="font-semibold text-slate-900">{vendor?.name || 'Vendor'}</p>
              }
              {address && <p className="text-xs font-mono text-slate-400">{truncateAddress(address)}</p>}
            </div>
          </div>
          {!editing && vendor && REGISTRY_ID && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium"
            >
              <Edit2 size={13} /> Edit
            </button>
          )}
        </div>

        {/* Profile fields */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-slate-100 animate-pulse rounded" />
            ))}
          </div>
        ) : !vendor ? (
          <p className="text-xs text-slate-400">
            {REGISTRY_ID
              ? 'Not registered as vendor. Ask admin to register your wallet.'
              : 'VendorRegistry contract not deployed yet.'}
          </p>
        ) : editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
              <input
                type="text" value={form.name} onChange={update('name')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Stall Number</label>
              <input
                type="text" value={form.stallNumber} onChange={update('stallNumber')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Product Type</label>
              <select
                value={form.productType} onChange={update('productType')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
              <input
                type="tel" value={form.phone} onChange={update('phone')}
                placeholder="+63917..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)} disabled={saving}
                className="px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-medium"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Stall</dt>
              <dd className="font-medium text-slate-800">{vendor.stallNumber || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Product</dt>
              <dd className="font-medium text-slate-800 capitalize">{vendor.productType || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Market</dt>
              <dd className="font-medium text-slate-800">{vendor.marketId || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Phone</dt>
              <dd className="font-medium text-slate-800">{vendor.phone || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Transactions</dt>
              <dd className="font-medium text-slate-800">{vendor.totalTransactions}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Volume</dt>
              <dd className="font-medium text-slate-800">
                {(Number(vendor.totalVolume) / 10_000_000).toFixed(2)} XLM
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
