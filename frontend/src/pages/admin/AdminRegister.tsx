import { useState } from 'react';
import { UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../components/Toast';

const PRODUCT_TYPES = ['fish', 'meat', 'vegetables', 'fruits', 'rice & grains', 'spices', 'other'];

export function AdminRegister() {
  const { address, isConnected, connect } = useWallet();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: '',
    stallNumber: '',
    productType: 'fish',
    walletAddress: '',
    phone: '',
    marketId: 'marikina-public-market',
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) { connect(); return; }
    if (!form.walletAddress.startsWith('G') || form.walletAddress.length !== 56) {
      showToast('Invalid Stellar wallet address (must start with G, 56 chars)', 'error');
      return;
    }
    if (!db) {
      showToast('Firebase not configured — add .env.local keys', 'error');
      return;
    }

    setLoading(true);
    try {
      // Save to Firestore (wallet address as document ID)
      await setDoc(doc(db, 'vendors', form.walletAddress), {
        name: form.name,
        stallNumber: form.stallNumber,
        productType: form.productType,
        marketId: form.marketId,
        phone: form.phone || null,
        isActive: true,
        registeredBy: address,
        createdAt: serverTimestamp(),
      });

      showToast(`${form.name} registered successfully!`, 'success');
      setDone(true);
    } catch (err) {
      showToast('Registration failed — check Firestore rules', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDone(false);
    setForm({ name: '', stallNumber: '', productType: 'fish', walletAddress: '', phone: '', marketId: 'marikina-public-market' });
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Vendor Registered!</h2>
          <p className="text-sm text-slate-500 mb-1">{form.name}</p>
          <p className="text-xs font-mono text-slate-400 mb-6">{form.walletAddress}</p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 bg-teal-700 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Register Vendor</h1>
        <p className="text-sm text-slate-500">Add a new vendor to PalengkePay.</p>
      </div>

      {!isConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 mb-2">Connect admin wallet to register vendors.</p>
          <button onClick={connect} className="text-sm font-medium bg-teal-700 text-white px-4 py-2 rounded-lg">
            Connect Wallet
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vendor Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={update('name')}
            placeholder="e.g. Aling Nena"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stall Number</label>
            <input
              type="text"
              required
              value={form.stallNumber}
              onChange={update('stallNumber')}
              placeholder="e.g. B-14"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Product Type</label>
            <select
              value={form.productType}
              onChange={update('productType')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vendor Wallet Address</label>
          <input
            type="text"
            required
            value={form.walletAddress}
            onChange={update('walletAddress')}
            placeholder="G... (56 characters)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={update('phone')}
            placeholder="+63917..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Registering…</>
            : <><UserPlus size={16} /> Register Vendor</>
          }
        </button>
      </form>
    </div>
  );
}
