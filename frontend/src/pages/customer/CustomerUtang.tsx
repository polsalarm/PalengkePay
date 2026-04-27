import { useState, useEffect, useRef } from 'react';
import { HandCoins, CheckCircle, Loader2, X, ExternalLink, ScanLine, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useCustomerUtangs, usePayInstallment, useCreateUtang } from '../../lib/hooks/useUtang';
import type { UtangRecord } from '../../lib/hooks/useUtang';
import type { UtangOfferPayload } from '../vendor/VendorUtang';
import { UtangCard } from '../../components/UtangCard';
import { QRScanner } from '../../components/QRScanner';
import { stellarExpertUrl } from '../../lib/stellar';

const STROOPS = 10_000_000;

const INTERVAL_LABELS: Record<number, string> = {
  604800: 'weekly',
  1209600: 'biweekly',
  2592000: 'monthly',
};

function intervalLabel(secs: number): string {
  return INTERVAL_LABELS[secs] ?? `every ${Math.round(secs / 86400)}d`;
}

export function CustomerUtang() {
  const { address } = useWallet();
  const { utangs, isLoading, refetch } = useCustomerUtangs(address);
  const { status, txHash, error, payInstallment, reset } = usePayInstallment();
  const { createUtang, isCreating, error: createError } = useCreateUtang();

  const [paying, setPaying] = useState<UtangRecord | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Utang QR scan flow
  const [showScanner, setShowScanner] = useState(false);
  const [offer, setOffer] = useState<UtangOfferPayload | null>(null);
  const [acceptStatus, setAcceptStatus] = useState<'idle' | 'signing' | 'confirmed' | 'failed'>('idle');
  const [acceptTxHash, setAcceptTxHash] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const active = utangs.filter((u) => u.status === 'active');
  const filtered = filter === 'all' ? utangs : utangs.filter((u) => u.status === filter);
  const totalDue = active.reduce((sum, u) => sum + u.installmentAmountXlm, 0);

  function handleRawScan(rawText: string) {
    try {
      const parsed = JSON.parse(rawText) as UtangOfferPayload;
      if (parsed.t === 'u' && parsed.v && parsed.a && parsed.n && parsed.i) {
        setOffer(parsed);
        setShowScanner(false);
        setAcceptStatus('idle');
        setAcceptTxHash(null);
        setAcceptError(null);
      } else {
        // Not a utang offer QR — ignore or show error
      }
    } catch {
      // Plain address or other QR — not a utang offer
    }
  }

  async function handleAccept() {
    if (!offer || !address) return;
    setAcceptStatus('signing');
    setAcceptError(null);
    const hash = await createUtang(
      {
        vendorWallet: offer.v,
        customerWallet: address,
        totalAmountXlm: offer.a / STROOPS,
        installmentsTotal: offer.n,
        intervalDays: Math.round(offer.i / 86400),
        description: offer.d,
      },
      address
    );
    if (hash) {
      setAcceptTxHash(hash);
      setAcceptStatus('confirmed');
      refetch();
    } else {
      setAcceptError(createError ?? 'Transaction failed');
      setAcceptStatus('failed');
    }
  }

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

  function handleCloseOffer() {
    setOffer(null);
    setAcceptStatus('idle');
    setAcceptTxHash(null);
    setAcceptError(null);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Utang</h1>
          <p className="text-sm text-slate-400">Installment plans and upcoming payments</p>
        </div>
        <button
          onClick={() => { setShowScanner(true); setOffer(null); }}
          className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <ScanLine size={15} /> Scan
        </button>
      </div>

      {active.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-0.5">Next installments due</p>
          <p className="text-2xl font-bold text-amber-800">
            {totalDue.toFixed(2)} <span className="text-base font-medium text-amber-500">XLM</span>
          </p>
          <p className="text-xs text-amber-600 mt-0.5">{active.length} active plan{active.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {utangs.length > 0 && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md capitalize transition-colors ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-xl border border-slate-200 h-36 animate-pulse" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <HandCoins size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-400">
            {filter === 'active' ? 'No active installment plans' : `No ${filter} plans`}
          </p>
          <p className="text-xs text-slate-300 mt-0.5">
            Scan your vendor's QR code to accept an installment plan
          </p>
        </div>
      )}

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

      {/* ── QR Scanner modal ────────────────────────────────────────────── */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col z-50">
          <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Scan Vendor Utang QR</h2>
            <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-slate-600">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
            <p className="text-xs text-slate-500 text-center mb-3">
              Ask your vendor to show their utang QR code
            </p>
            {/* Custom scanner that intercepts raw text before JSON parsing */}
            <RawQRScanner onRawScan={handleRawScan} />
          </div>
        </div>
      )}

      {/* ── Utang offer confirmation modal ───────────────────────────────── */}
      {offer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Installment Offer</h2>
              {acceptStatus !== 'signing' && (
                <button onClick={handleCloseOffer} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Offer details */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Items</p>
                  <p className="text-sm font-semibold text-slate-800">{offer.d}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <p className="text-base font-bold text-slate-900">{(offer.a / STROOPS).toFixed(2)}</p>
                    <p className="text-xs text-slate-400">XLM total</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <p className="text-base font-bold text-slate-900">{offer.n}×</p>
                    <p className="text-xs text-slate-400">{(offer.a / STROOPS / offer.n).toFixed(2)} XLM</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200">
                    <p className="text-base font-bold text-slate-900 capitalize">{intervalLabel(offer.i)}</p>
                    <p className="text-xs text-slate-400">interval</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate">Vendor: {offer.v.slice(0, 12)}…{offer.v.slice(-6)}</p>
              </div>

              {acceptStatus === 'idle' && (
                <button onClick={handleAccept}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Accept & Sign
                </button>
              )}

              {acceptStatus === 'signing' && (
                <div className="text-center py-2 space-y-2">
                  <Loader2 className="animate-spin mx-auto text-teal-600" size={24} />
                  <p className="text-sm text-slate-500">Confirm in your wallet…</p>
                </div>
              )}

              {acceptStatus === 'confirmed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center text-green-600">
                    <CheckCircle size={20} />
                    <span className="text-sm font-semibold">Agreement accepted!</span>
                  </div>
                  {acceptTxHash && (
                    <a href={stellarExpertUrl(acceptTxHash)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-teal-600 hover:underline"
                    >
                      View on Stellar Expert <ExternalLink size={11} />
                    </a>
                  )}
                  <button onClick={handleCloseOffer}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {acceptStatus === 'failed' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center text-red-600">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-semibold">Failed</span>
                  </div>
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">{acceptError}</p>
                  <button onClick={handleAccept}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pay installment modal ─────────────────────────────────────────── */}
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
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Confirm Payment
                </button>
              )}

              {(status === 'building' || status === 'signing' || status === 'submitting') && (
                <div className="text-center py-2 space-y-2">
                  <Loader2 className="animate-spin mx-auto text-teal-600" size={24} />
                  <p className="text-sm text-slate-500">
                    {status === 'building' && 'Preparing…'}
                    {status === 'signing' && 'Confirm in your wallet…'}
                    {status === 'submitting' && 'Processing…'}
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
                      className="flex items-center justify-center gap-1.5 text-xs text-teal-600 hover:underline"
                    >
                      View on Stellar Expert <ExternalLink size={11} />
                    </a>
                  )}
                  <button onClick={handleClosePayModal}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {status === 'failed' && (
                <div className="space-y-3">
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>
                  <button onClick={confirmPay}
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
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

// ── Raw QR scanner that exposes full decoded text (not just address) ───────────

function RawQRScanner({ onRawScan }: { onRawScan: (text: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const containerId = useRef(`qr-utang-${Math.random().toString(36).slice(2)}`).current;
  const onRawScanRef = useRef(onRawScan);
  onRawScanRef.current = onRawScan;

  useEffect(() => {
    let scanner: import('html5-qrcode').Html5Qrcode | null = null;
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode(containerId);
      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => onRawScanRef.current(text.trim()),
        () => {}
      )
        .then(() => setStarted(true))
        .catch((e: Error) => setError(`Camera error: ${e.message ?? 'permission denied'}`));
    });
    return () => { if (scanner?.isScanning) scanner.stop().catch(() => {}); };
  }, [containerId]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black">
        <div id={containerId} className="w-full" style={{ minHeight: 300 }} />
        {!started && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3 text-white">
              <ScanLine size={40} className="animate-pulse text-teal-400" />
              <p className="text-sm">Starting camera…</p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
}
