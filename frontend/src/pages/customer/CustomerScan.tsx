import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Loader2, X, ExternalLink, AlertTriangle, Store, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRScanner } from '../../components/QRScanner';
import type { QRScanMeta } from '../../components/QRScanner';
import { PaymentForm } from '../../components/PaymentForm';
import { TxStatusTracker } from '../../components/TxStatusTracker';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendor } from '../../lib/hooks/useVendor';
import { usePayment } from '../../lib/hooks/usePayment';
import { useCreateUtang } from '../../lib/hooks/useUtang';
import type { UtangOfferPayload } from '../vendor/VendorUtang';
import { stellarExpertUrl, truncateAddress } from '../../lib/stellar';

const STROOPS = 10_000_000;

const INTERVAL_LABELS: Record<number, string> = {
  604800: 'weekly',
  1209600: 'biweekly',
  2592000: 'monthly',
};
function intervalLabel(secs: number) {
  return INTERVAL_LABELS[secs] ?? `every ${Math.round(secs / 86400)}d`;
}

type Step = 'scan' | 'manual' | 'pay' | 'confirm' | 'done' | 'utang_offer' | 'utang_done';

interface PendingPayment {
  amount: string;
  memo: string;
}

export function CustomerScan() {
  const navigate = useNavigate();
  const { address, isConnected, connect } = useWallet();

  const [step, setStep] = useState<Step>('scan');
  const [vendorAddress, setVendorAddress] = useState('');
  const [scannedMeta, setScannedMeta] = useState<QRScanMeta | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [utangOffer, setUtangOffer] = useState<UtangOfferPayload | null>(null);
  const [utangTxHash, setUtangTxHash] = useState<string | null>(null);
  const [utangAcceptStatus, setUtangAcceptStatus] = useState<'idle' | 'signing' | 'confirmed' | 'failed'>('idle');
  const [utangError, setUtangError] = useState<string | null>(null);

  const { vendor, isLoading: vendorLoading } = useVendor(
    step === 'pay' || step === 'confirm' || step === 'done' ? vendorAddress : null
  );
  const { status, txHash, error, sendPayment, reset } = usePayment();
  const { createUtang, isCreating } = useCreateUtang();

  // Advance to done when payment confirms
  useEffect(() => {
    if (step === 'confirm' && status === 'confirmed') setStep('done');
  }, [step, status]);

  // ── QR raw intercept: detect utang offer before payment parsing ──
  const handleRawScan = (raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as UtangOfferPayload;
      if (parsed.t === 'u' && parsed.v && parsed.a && parsed.n && parsed.i) {
        setUtangOffer(parsed);
        setUtangAcceptStatus('idle');
        setUtangTxHash(null);
        setUtangError(null);
        setStep('utang_offer');
        return true;
      }
    } catch {}
    return false;
  };

  const handlePaymentScan = (addr: string, meta?: QRScanMeta) => {
    setVendorAddress(addr);
    setScannedMeta(meta ?? null);
    setStep('pay');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = manualInput.trim();
    if (addr.startsWith('G') && addr.length === 56) {
      setVendorAddress(addr);
      setScannedMeta(null);
      setStep('pay');
    }
  };

  // PaymentForm submit → go to confirm step (don't sign yet)
  const handlePay = (amount: string, memo: string) => {
    setPendingPayment({ amount, memo });
    reset();
    setStep('confirm');
  };

  // Confirm screen → actually sign
  const handleConfirm = async () => {
    if (!address || !pendingPayment) return;
    await sendPayment(address, vendorAddress, pendingPayment.amount, pendingPayment.memo);
  };

  const handleAcceptUtang = async () => {
    if (!utangOffer || !address) return;
    setUtangAcceptStatus('signing');
    setUtangError(null);
    const hash = await createUtang(
      {
        vendorWallet: utangOffer.v,
        customerWallet: address,
        totalAmountXlm: utangOffer.a / STROOPS,
        installmentsTotal: utangOffer.n,
        intervalDays: Math.round(utangOffer.i / 86400),
        description: utangOffer.d ?? '',
      },
      address
    );
    if (hash) {
      setUtangTxHash(hash);
      setUtangAcceptStatus('confirmed');
      setStep('utang_done');
    } else {
      setUtangError('Transaction failed — check wallet and try again');
      setUtangAcceptStatus('failed');
    }
  };

  const backToScan = () => {
    setStep('scan');
    setUtangOffer(null);
    setUtangAcceptStatus('idle');
    setPendingPayment(null);
    reset();
  };

  const stepTitle: Record<Step, string> = {
    scan: 'Scan QR',
    manual: 'Enter Address',
    pay: 'Pay Vendor',
    confirm: 'Confirm Payment',
    done: 'Payment Sent!',
    utang_offer: 'Installment Offer',
    utang_done: 'Accepted!',
  };

  const vendorDisplay = vendor?.name ?? scannedMeta?.name ?? truncateAddress(vendorAddress);

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Scan QR</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 mb-3">Connect wallet to scan and pay.</p>
          <button onClick={connect} className="text-sm font-medium bg-teal-700 text-white px-4 py-2 rounded-lg">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === 'scan') navigate('/customer/home');
            else if (step === 'done' || step === 'utang_done') navigate('/customer/home');
            else backToScan();
          }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">{stepTitle[step]}</h1>
      </div>

      {/* ── Step: scan ─────────────────────────────────── */}
      {step === 'scan' && (
        <>
          <p className="text-xs text-slate-500 text-center -mt-2">
            Scans payment QRs and utang offer QRs automatically
          </p>
          <QRScanner
            onScan={handlePaymentScan}
            onRawScan={handleRawScan}
            onManualEntry={() => setStep('manual')}
          />
        </>
      )}

      {/* ── Step: manual address ───────────────────────── */}
      {step === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Vendor Wallet Address
            </label>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="G..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Continue
          </button>
        </form>
      )}

      {/* ── Step: payment form ─────────────────────────── */}
      {step === 'pay' && (
        <PaymentForm
          vendorAddress={vendorAddress}
          vendor={vendor}
          isLoading={vendorLoading}
          preloadedVendorName={scannedMeta?.name}
          preloadedStallInfo={scannedMeta?.stallInfo}
          onSubmit={handlePay}
          disabled={false}
        />
      )}

      {/* ── Step: confirm ──────────────────────────────── */}
      {step === 'confirm' && pendingPayment && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Review before signing</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Vendor info */}
            <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl p-4">
              <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center shrink-0">
                <Store size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-teal-600 font-medium">Paying</p>
                <p className="text-sm font-bold text-slate-900 truncate">{vendorDisplay}</p>
              </div>
            </div>

            {/* Amount + memo */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Amount</span>
                <span className="text-xl font-black text-teal-700">{pendingPayment.amount} XLM</span>
              </div>
              {pendingPayment.memo && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Memo</span>
                  <span className="text-sm font-semibold text-slate-800">{pendingPayment.memo}</span>
                </div>
              )}
            </div>

            {status === 'idle' && (
              <button
                onClick={handleConfirm}
                className="w-full bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-4 rounded-xl transition-all text-base"
              >
                Confirm &amp; Sign
              </button>
            )}

            {status !== 'idle' && status !== 'confirmed' && (
              <TxStatusTracker
                status={status}
                txHash={txHash}
                error={error}
                amount={pendingPayment.amount}
                recipientName={vendorDisplay}
                onRetry={() => { reset(); }}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Step: payment done ─────────────────────────── */}
      {step === 'done' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Payment sent!</h2>
          {vendorDisplay && (
            <p className="text-sm text-slate-500 mb-1">to {vendorDisplay}</p>
          )}
          {pendingPayment && (
            <p className="text-xl font-black text-teal-700 mb-4">{pendingPayment.amount} XLM</p>
          )}
          {txHash && (
            <a
              href={stellarExpertUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-teal-700 underline underline-offset-2 mb-6"
            >
              View receipt on Stellar Expert <ExternalLink size={12} />
            </a>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={backToScan}
              className="flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              <RotateCcw size={14} /> Pay Again
            </button>
            <button
              onClick={() => navigate('/customer/home')}
              className="bg-teal-700 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      )}

      {/* ── Step: utang offer ──────────────────────────── */}
      {step === 'utang_offer' && utangOffer && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs text-teal-600 font-semibold uppercase tracking-wide">Installment Credit Offer</p>
            <button onClick={backToScan} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              {utangOffer.d && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Items</p>
                  <p className="text-sm font-semibold text-slate-800">{utangOffer.d}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-base font-bold text-slate-900">{(utangOffer.a / STROOPS).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">XLM total</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-base font-bold text-slate-900">{utangOffer.n}×</p>
                  <p className="text-xs text-slate-400">{(utangOffer.a / STROOPS / utangOffer.n).toFixed(2)} XLM</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-sm font-bold text-slate-900 capitalize">{intervalLabel(utangOffer.i)}</p>
                  <p className="text-xs text-slate-400">interval</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">
                Vendor: {utangOffer.v.slice(0, 12)}…{utangOffer.v.slice(-6)}
              </p>
            </div>

            {utangAcceptStatus === 'idle' && (
              <button
                onClick={handleAcceptUtang}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                Accept &amp; Sign
              </button>
            )}

            {(utangAcceptStatus === 'signing' || isCreating) && (
              <div className="text-center py-3 space-y-2">
                <Loader2 className="animate-spin mx-auto text-teal-600" size={24} />
                <p className="text-sm text-slate-500">Confirm in your wallet…</p>
                <p className="text-xs text-slate-400">On mobile: open LOBSTR app and approve.</p>
              </div>
            )}

            {utangAcceptStatus === 'failed' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-center text-rose-600">
                  <AlertTriangle size={16} />
                  <span className="text-sm font-semibold">Failed</span>
                </div>
                <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2 text-center">{utangError}</p>
                <button
                  onClick={handleAcceptUtang}
                  className="w-full bg-teal-700 text-white py-2.5 rounded-xl text-sm font-semibold"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step: utang accepted ───────────────────────── */}
      {step === 'utang_done' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-teal-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Agreement accepted!</h2>
          <p className="text-sm text-slate-500 mb-4">Installment plan is now active.</p>
          {utangTxHash && (
            <a
              href={stellarExpertUrl(utangTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-sm text-teal-700 underline underline-offset-2 mb-6"
            >
              View on Stellar Expert <ExternalLink size={13} />
            </a>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/customer/utang')}
              className="border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              View Utang
            </button>
            <button
              onClick={() => navigate('/customer/home')}
              className="bg-teal-700 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
