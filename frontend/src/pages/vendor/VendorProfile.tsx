import { useState, useEffect } from 'react';
import { Edit2, Check, X, Loader2, MapPin, Tag, Phone, BarChart2, Coins } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendor } from '../../lib/hooks/useVendor';
import { useToast } from '../../components/Toast';
import { truncateAddress, prepareContractTx, submitSorobanTx, addressToScVal, stringToScVal } from '../../lib/stellar';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';

const REGISTRY_ID = import.meta.env.VITE_VENDOR_REGISTRY_CONTRACT_ID as string | undefined;
const PRODUCT_TYPES = ['fish', 'meat', 'vegetables', 'fruits', 'rice & grains', 'spices', 'other'];

const PRODUCT_EMOJIS: Record<string, string> = {
  fish: '🐟', meat: '🥩', vegetables: '🥦', fruits: '🍎',
  'rice & grains': '🌾', spices: '🌶️', other: '🛒',
};

export function VendorProfile() {
  const { address } = useWallet();
  const { vendor, isLoading } = useVendor(address);
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', stallNumber: '', phone: '', productType: 'fish' });

  useEffect(() => {
    if (vendor) setForm({ name: vendor.name, stallNumber: vendor.stallNumber, phone: vendor.phone, productType: vendor.productType });
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
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, { networkPassphrase: Networks.TESTNET, address });
      await submitSorobanTx(signedTxXdr);
      showToast('Profile updated!', 'success');
      setEditing(false);
    } catch (err: unknown) {
      showToast((err as { message?: string }).message ?? 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const emoji = vendor ? (PRODUCT_EMOJIS[vendor.productType] ?? '🛒') : '🛒';

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-bold text-slate-900">Profile</h1>

      {/* Profile hero */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-5 text-white shadow-md">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-5 w-36 bg-teal-700 animate-pulse rounded" />
            <div className="h-3 w-24 bg-teal-700/60 animate-pulse rounded" />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
              {emoji}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-lg leading-tight truncate">{vendor?.name || 'Vendor'}</p>
              <p className="text-xs opacity-60 capitalize mt-0.5">{vendor?.productType || ''}</p>
              {address && <p className="text-xs opacity-40 font-mono mt-1">{truncateAddress(address)}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {vendor && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart2 size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">Transactions</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{vendor.totalTransactions}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Coins size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">Volume</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {(Number(vendor.totalVolume) / 10_000_000).toFixed(1)}
            </p>
            <p className="text-xs text-slate-400">XLM</p>
          </div>
        </div>
      )}

      {/* Details card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Stall Details</p>
          {!editing && vendor && REGISTRY_ID && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium">
              <Edit2 size={12} /> Edit
            </button>
          )}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-slate-100 animate-pulse rounded" />)}
            </div>
          ) : !vendor ? (
            <p className="text-sm text-slate-400">
              {REGISTRY_ID ? 'Not registered as vendor.' : 'VendorRegistry contract not deployed.'}
            </p>
          ) : editing ? (
            <div className="space-y-3">
              {[
                { label: 'Name', key: 'name' as const, type: 'text' },
                { label: 'Stall Number', key: 'stallNumber' as const, type: 'text' },
                { label: 'Phone', key: 'phone' as const, type: 'tel' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={update(key)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Product Type</label>
                <select value={form.productType} onChange={update('productType')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} disabled={saving}
                  className="px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin size={15} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Stall</p>
                  <p className="text-sm font-medium text-slate-800">{vendor.stallNumber || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tag size={15} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Product</p>
                  <p className="text-sm font-medium text-slate-800 capitalize">{vendor.productType || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={15} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-sm font-medium text-slate-800">{vendor.phone || '—'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400">Status</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                  vendor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${vendor.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
