import { useState } from 'react';
import { CheckCircle, Loader2, Send } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useApplyVendor } from '../../lib/hooks/useVendor';
import { useToast } from '../../components/Toast';

const PRODUCT_TYPES = ['fish', 'meat', 'vegetables', 'fruits', 'rice & grains', 'spices', 'other'];

export function VendorApply() {
  const { address, isConnected, connect } = useWallet();
  const { apply, isSubmitting, error, txHash } = useApplyVendor();
  const { showToast } = useToast();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: '',
    stallNumber: '',
    productType: 'fish',
    phone: '',
  });

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) { connect(); return; }
    if (!address) return;

    const ok = await apply(address, form.name, form.stallNumber, form.phone, form.productType);
    if (ok) {
      showToast('Application submitted! Waiting for admin approval.', 'success');
      setDone(true);
    } else if (error) {
      showToast(error.slice(0, 100), 'error');
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-teal-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Application Submitted!</h2>
          <p className="text-sm text-slate-500 mb-4">
            Your application is pending admin review. You'll be registered once approved.
          </p>
          {txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-600 hover:underline block mb-6"
            >
              View on Stellar Expert →
            </a>
          )}
          <div className="bg-slate-50 rounded-lg p-4 text-left space-y-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Your Details</p>
            <p className="text-sm text-slate-700"><span className="font-medium">Name:</span> {form.name}</p>
            <p className="text-sm text-slate-700"><span className="font-medium">Stall:</span> {form.stallNumber}</p>
            <p className="text-sm text-slate-700"><span className="font-medium">Type:</span> {form.productType}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Apply as Vendor</h1>
        <p className="text-sm text-slate-500">Submit your stall info. Admin will approve your registration.</p>
      </div>

      {!isConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 mb-2">Connect your Stellar wallet to apply.</p>
          <button
            onClick={connect}
            className="text-sm font-medium bg-teal-700 text-white px-4 py-2 rounded-lg"
          >
            Connect Wallet
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your Name / Stall Name</label>
          <input
            type="text" required value={form.name} onChange={update('name')}
            placeholder="e.g. Aling Nena"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stall Number</label>
            <input
              type="text" required value={form.stallNumber} onChange={update('stallNumber')}
              placeholder="e.g. B-14"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Product Type</label>
            <select
              value={form.productType} onChange={update('productType')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="tel" value={form.phone} onChange={update('phone')}
            placeholder="+63917..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
          />
        </div>

        {isConnected && address && (
          <div className="bg-slate-50 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-400 mb-0.5">Your wallet (will be your payment address)</p>
            <p className="text-xs font-mono text-slate-600 break-all">{address}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !isConnected}
          className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
        >
          {isSubmitting
            ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
            : <><Send size={16} /> Submit Application</>
          }
        </button>
      </form>
    </div>
  );
}
