import { useState } from 'react';
import { Send, Store } from 'lucide-react';
import type { VendorProfile } from '../lib/hooks/useVendor';

interface Props {
  vendorAddress: string;
  vendor: VendorProfile | null;
  isLoading: boolean;
  onSubmit: (amount: string, memo: string) => void;
  disabled?: boolean;
}

export function PaymentForm({ vendorAddress, vendor, isLoading, onSubmit, disabled }: Props) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter amount greater than 0');
      return;
    }
    onSubmit(amount, memo);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Vendor info */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center shrink-0">
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            {isLoading ? (
              <>
                <div className="h-4 w-32 bg-teal-200 animate-pulse rounded mb-1" />
                <div className="h-3 w-24 bg-teal-100 animate-pulse rounded" />
              </>
            ) : vendor ? (
              <>
                <p className="font-semibold text-slate-900">Paying: {vendor.name}</p>
                <p className="text-xs text-slate-500">
                  Stall {vendor.stallNumber} · {vendor.productType}
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-900">Paying vendor</p>
                <p className="text-xs font-mono text-slate-400 truncate">{vendorAddress}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Amount (XLM)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.01"
          className="w-full border border-slate-200 rounded-lg px-4 py-3 text-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-200"
          autoFocus
        />
      </div>

      {/* Memo */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          What did you buy? <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="e.g. 2kg tilapia"
          maxLength={28}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-300"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-4 rounded-xl text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <Send size={18} />
        Pay Now
      </button>
    </form>
  );
}
