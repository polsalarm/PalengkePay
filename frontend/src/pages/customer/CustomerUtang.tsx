import { useRef, useState } from 'react';
import { HandCoins, CheckCircle, Loader2, X, ExternalLink, AlertTriangle, ScanLine, ImageUp } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useWallet } from '../../lib/hooks/useWallet';
import { useCustomerUtangs, usePayInstallment, useCreateUtang } from '../../lib/hooks/useUtang';
import type { UtangRecord } from '../../lib/hooks/useUtang';
import type { UtangOfferPayload } from '../vendor/VendorUtang';
import { UtangCard } from '../../components/UtangCard';
import { stellarExpertUrl } from '../../lib/stellar';

const STROOPS = 10_000_000;
const INTERVAL_LABELS: Record<number, string> = { 604800: 'weekly', 1209600: 'biweekly', 2592000: 'monthly' };
function intervalLabel(secs: number) { return INTERVAL_LABELS[secs] ?? `every ${Math.round(secs / 86400)}d`; }
const UTANG_FILE_DIV = 'qr-utang-file-scanner';

export function CustomerUtang() {
  const { address } = useWallet();
  const { utangs, isLoading, refetch } = useCustomerUtangs(address);
  const { status, txHash, error, payInstallment, reset } = usePayInstallment();
  const { createUtang, isCreating } = useCreateUtang();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paying, setPaying] = useState<UtangRecord | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [uploadedOffer, setUploadedOffer] = useState<UtangOfferPayload | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [offerAcceptStatus, setOfferAcceptStatus] = useState<'idle' | 'signing' | 'confirmed' | 'failed'>('idle');
  const [offerTxHash, setOfferTxHash] = useState<string | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  const handleUploadQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadLoading(true);
    setUploadError(null);

    let div = document.getElementById(UTANG_FILE_DIV);
    if (!div) {
      div = document.createElement('div');
      div.id = UTANG_FILE_DIV;
      div.style.display = 'none';
      document.body.appendChild(div);
    }

    const scanner = new Html5Qrcode(UTANG_FILE_DIV);
    try {
      const raw = (await scanner.scanFile(file, false)).trim();
      const parsed = JSON.parse(raw) as UtangOfferPayload;
      if (parsed.t === 'u' && parsed.v && parsed.a && parsed.n && parsed.i) {
        setUploadedOffer(parsed);
        setOfferAcceptStatus('idle');
        setOfferTxHash(null);
        setOfferError(null);
      } else {
        setUploadError('This QR is not an installment offer. Use Scan to Pay for payment QRs.');
        setTimeout(() => setUploadError(null), 5000);
      }
    } catch {
      setUploadError('Could not read QR from image. Try a clearer photo.');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploadLoading(false);
      try { await scanner.clear(); } catch {}
    }
  };

  const handleAcceptOffer = async () => {
    if (!uploadedOffer || !address) return;
    setOfferAcceptStatus('signing');
    setOfferError(null);
    const hash = await createUtang(
      {
        vendorWallet: uploadedOffer.v,
        customerWallet: address,
        totalAmountXlm: uploadedOffer.a / STROOPS,
        installmentsTotal: uploadedOffer.n,
        intervalDays: Math.round(uploadedOffer.i / 86400),
        description: uploadedOffer.d ?? '',
      },
      address
    );
    if (hash) {
      setOfferTxHash(hash);
      setOfferAcceptStatus('confirmed');
      refetch();
    } else {
      setOfferError('Transaction failed — check wallet and try again');
      setOfferAcceptStatus('failed');
    }
  };

  const active = utangs.filter((u) => u.status === 'active');
  const filtered = filter === 'all' ? utangs : utangs.filter((u) => u.status === filter);
  const totalDue = active.reduce((sum, u) => sum + u.installmentAmountXlm, 0);

  function handlePayClick(utang: UtangRecord) {
    if (!address) return;
    setPaying(utang);
    reset();
  }

  async function confirmPay() {
    if (!paying || !address) return;
    await payInstallment(paying, address);
    refetch();
  }

  function handleClosePayModal() {
    if (status === 'building' || status === 'signing' || status === 'submitting') return;
    setPaying(null);
    reset();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Utang</h1>
          <p className="text-sm text-slate-400">Your installment plans</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <ImageUp size={14} />
          {uploadLoading ? 'Reading…' : 'Upload QR'}
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadQR} />

      {uploadError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          {uploadError}
        </div>
      )}

      {/* Due summary */}
      {active.length > 0 && (
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-md">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">Total Due (Next Installments)</p>
          <p className="text-3xl font-bold">
            {totalDue.toFixed(2)}
            <span className="text-base font-medium opacity-70 ml-2">XLM</span>
          </p>
          <p className="text-xs opacity-60 mt-1">{active.length} active plan{active.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Filter tabs */}
      {utangs.length > 0 && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg capitalize transition-all ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="h-4 w-32 skeleton rounded" />
              <div className="h-3 w-48 skeleton rounded" />
              <div className="h-2 w-full skeleton rounded-full" />
              <div className="flex justify-between">
                <div className="h-3 w-20 skeleton rounded" />
                <div className="h-3 w-16 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <HandCoins size={28} className="text-teal-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {filter === 'active' ? 'No active plans' : `No ${filter} plans`}
          </p>
          <p className="text-xs text-slate-400 mb-5">
            Ask your vendor for an installment QR, then scan or upload it below to accept.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
              <ScanLine size={14} />
              Scan QR ↓
            </div>
            <span className="text-slate-300">or</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-teal-600 font-medium hover:text-teal-700"
            >
              <ImageUp size={14} />
              Upload QR image
            </button>
          </div>
        </div>
      )}

      {/* Utang cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((u) => (
            <UtangCard
              key={String(u.id)}
              utang={u}
              perspective="customer"
              onPayInstallment={handlePayClick}
              txHash={paying?.id === u.id && txHash ? txHash : null}
            />
          ))}
        </div>
      )}

      {/* Uploaded utang offer modal */}
      {uploadedOffer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Installment Credit Offer</p>
              {offerAcceptStatus !== 'signing' && !isCreating && (
                <button onClick={() => setUploadedOffer(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                {uploadedOffer.d && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Items</p>
                    <p className="text-sm font-semibold text-slate-800">{uploadedOffer.d}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <p className="text-base font-bold text-slate-900">{(uploadedOffer.a / STROOPS).toFixed(2)}</p>
                    <p className="text-xs text-slate-400">XLM total</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <p className="text-base font-bold text-slate-900">{uploadedOffer.n}×</p>
                    <p className="text-xs text-slate-400">{(uploadedOffer.a / STROOPS / uploadedOffer.n).toFixed(2)} XLM</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <p className="text-sm font-bold text-slate-900 capitalize">{intervalLabel(uploadedOffer.i)}</p>
                    <p className="text-xs text-slate-400">interval</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate">
                  Vendor: {uploadedOffer.v.slice(0, 12)}…{uploadedOffer.v.slice(-6)}
                </p>
              </div>

              {offerAcceptStatus === 'idle' && (
                <button
                  onClick={handleAcceptOffer}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Accept &amp; Sign
                </button>
              )}
              {(offerAcceptStatus === 'signing' || isCreating) && (
                <div className="text-center py-3 space-y-2">
                  <Loader2 className="animate-spin mx-auto text-teal-600" size={24} />
                  <p className="text-sm text-slate-500">Confirm in your wallet…</p>
                  <p className="text-xs text-slate-400">On mobile: open LOBSTR app and approve.</p>
                </div>
              )}
              {offerAcceptStatus === 'confirmed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center text-green-600">
                    <CheckCircle size={20} />
                    <span className="text-sm font-semibold">Agreement accepted!</span>
                  </div>
                  {offerTxHash && (
                    <a href={stellarExpertUrl(offerTxHash)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-teal-600 hover:underline">
                      View on Stellar Expert <ExternalLink size={11} />
                    </a>
                  )}
                  <button onClick={() => setUploadedOffer(null)}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-all">
                    Close
                  </button>
                </div>
              )}
              {offerAcceptStatus === 'failed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center text-rose-600">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-semibold">Failed</span>
                  </div>
                  <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 text-center">{offerError}</p>
                  <button onClick={handleAcceptOffer}
                    className="w-full bg-teal-700 hover:bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold">
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pay installment modal */}
      {paying && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Pay Installment</h2>
              {status !== 'building' && status !== 'signing' && status !== 'submitting' && (
                <button onClick={handleClosePayModal} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {paying.description && (
                <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 font-medium">{paying.description}</p>
              )}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Installment</span>
                  <span className="font-semibold text-slate-800">{paying.installmentsPaid + 1} of {paying.installmentsTotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-teal-700">
                    {(() => {
                      const remaining = paying.installmentsTotal - paying.installmentsPaid;
                      const rest = paying.totalAmountXlm - paying.installmentAmountXlm * paying.installmentsPaid;
                      return (remaining === 1 ? rest : paying.installmentAmountXlm).toFixed(2);
                    })()} XLM
                  </span>
                </div>
              </div>

              {status === 'idle' && (
                <button onClick={confirmPay}
                  className="w-full bg-teal-700 hover:bg-teal-800 active:scale-95 text-white py-3 rounded-xl text-sm font-semibold transition-all">
                  Confirm Payment
                </button>
              )}
              {(status === 'building' || status === 'signing' || status === 'submitting') && (
                <div className="text-center py-2 space-y-2">
                  <Loader2 className="animate-spin mx-auto text-teal-600" size={24} />
                  <p className="text-sm text-slate-500">
                    {status === 'building' ? 'Preparing…' : status === 'signing' ? 'Confirm in wallet…' : 'Processing…'}
                  </p>
                </div>
              )}
              {status === 'confirmed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center text-green-600">
                    <CheckCircle size={20} />
                    <span className="text-sm font-semibold">Payment confirmed!</span>
                  </div>
                  {txHash && (
                    <a href={stellarExpertUrl(txHash)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-teal-600 hover:underline">
                      View on Stellar Expert <ExternalLink size={11} />
                    </a>
                  )}
                  <button onClick={handleClosePayModal}
                    className="w-full border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-all">
                    Close
                  </button>
                </div>
              )}
              {status === 'failed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center text-rose-600">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-semibold">Failed</span>
                  </div>
                  <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 text-center">{error}</p>
                  <button onClick={confirmPay}
                    className="w-full bg-teal-700 hover:bg-teal-600 active:scale-95 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
