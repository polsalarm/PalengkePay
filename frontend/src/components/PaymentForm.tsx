import { useState, useEffect } from 'react';
import { Send, Store, Zap } from 'lucide-react';
import type { VendorProfile } from '../lib/hooks/useVendor';

const MEMO_MAX = 28;
// Approximate XLM/PHP rate — cosmetic display only
const XLM_TO_PHP = 8.5;

interface Props {
  vendorAddress: string;
  vendor: VendorProfile | null;
  isLoading: boolean;
  preloadedVendorName?: string;
  preloadedStallInfo?: string;
  onSubmit: (amount: string, memo: string) => void;
  disabled?: boolean;
}

export function PaymentForm({ vendorAddress, vendor, isLoading, preloadedVendorName, preloadedStallInfo, onSubmit, disabled }: Props) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [phpRate, setPhpRate] = useState<number>(XLM_TO_PHP);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=php')
      .then((r) => r.json())
      .then((d) => { if (d?.stellar?.php) setPhpRate(d.stellar.php); })
      .catch(() => { /* keep fallback */ });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter amount greater than 0');
      return;
    }
    onSubmit(amount, memo);
  };

  const displayName = vendor?.name ?? preloadedVendorName ?? null;
  const displayStall = vendor
    ? `Stall ${vendor.stallNumber} · ${vendor.productType}`
    : preloadedStallInfo ?? null;

  const xlmAmt = parseFloat(amount);
  const phpEst = !isNaN(xlmAmt) && xlmAmt > 0 ? (xlmAmt * phpRate).toFixed(2) : null;
  const memoLeft = MEMO_MAX - memo.length;
  const memoNearLimit = memoLeft <= 8;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Vendor info */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center shrink-0">
            <Store size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            {isLoading && !preloadedVendorName ? (
              <>
                <div className="h-4 w-32 skeleton rounded mb-1" />
                <div className="h-3 w-24 skeleton rounded" />
              </>
            ) : displayName ? (
              <>
                <p className="font-semibold text-slate-900">Paying: {displayName}</p>
                {displayStall && <p className="text-xs text-slate-500">{displayStall}</p>}
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
        {phpEst && (
          <p className="text-xs text-slate-400 mt-1.5 text-right">
            ≈ <span className="text-slate-600 font-semibold">₱{phpEst}</span>
            <span className="text-slate-300 ml-1">(approx)</span>
          </p>
        )}
      </div>

      {/* Memo */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-600">
            What did you buy? <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <span className={`text-xs font-medium tabular-nums ${memoNearLimit ? 'text-amber-500' : 'text-slate-300'}`}>
            {memo.length}/{MEMO_MAX}
          </span>
        </div>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="e.g. 2kg tilapia"
          maxLength={MEMO_MAX}
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

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <Zap size={11} className="text-teal-500" />
        <span>Gasless — fees sponsored, zero cost to you</span>
      </div>
    </form>
  );
}
