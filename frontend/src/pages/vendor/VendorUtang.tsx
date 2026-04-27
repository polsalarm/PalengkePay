import { useState } from 'react';
import { Plus, X, HandCoins, AlertTriangle, ScanLine, Keyboard, QrCode, ChevronLeft, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendorUtangs, useCreateUtang } from '../../lib/hooks/useUtang';
import { UtangCard } from '../../components/UtangCard';
import { QRScanner } from '../../components/QRScanner';
import { buildPaymentTx, submitTx } from '../../lib/stellar';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';

const ESCROW_ID = import.meta.env.VITE_UTANG_ESCROW_CONTRACT_ID as string | undefined;
const FEE_XLM = import.meta.env.VITE_UTANG_FEE_XLM ?? '1';
const FEE_DEST = 'GBI5W3JPFNGBMW2TCSGTNL3NPW6E423UN4BMAXAU34AXTSMTSDT2JDXH';

const INTERVAL_OPTIONS = [
  { label: 'Weekly', days: 7 },
  { label: 'Biweekly', days: 14 },
  { label: 'Monthly', days: 30 },
];
const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6];
const STROOPS = 10_000_000;

export interface UtangOfferPayload {
  t: 'u';
  v: string;   // vendor address
  a: number;   // total amount in stroops
  n: number;   // installments
  i: number;   // interval seconds
  d: string;   // description
}

type Mode = 'qr' | 'manual';
type Step = 'form' | 'fee_payment' | 'qr_display';
type FeeStatus = 'idle' | 'paying' | 'paid' | 'failed';

interface UtangForm {
  customerWallet: string;
  totalAmountXlm: string;
  installmentsTotal: number;
  intervalDays: number;
  description: string;
}

const DEFAULT_FORM: UtangForm = {
  customerWallet: '',
  totalAmountXlm: '',
  installmentsTotal: 3,
  intervalDays: 7,
  description: '',
};

export function VendorUtang() {
  const { address } = useWallet();
  const { utangs, isLoading, refetch } = useVendorUtangs(address);
  const { createUtang, isCreating, error: createError } = useCreateUtang();

  const [showPanel, setShowPanel] = useState(false);
  const [mode, setMode] = useState<Mode>('qr');
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<UtangForm>(DEFAULT_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCustomerScanner, setShowCustomerScanner] = useState(false);
  const [qrPayload, setQrPayload] = useState<UtangOfferPayload | null>(null);
  const [feeStatus, setFeeStatus] = useState<FeeStatus>('idle');
  const [feeError, setFeeError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'defaulted'>('all');

  const active = utangs.filter((u) => u.status === 'active');
  const filtered = filter === 'all' ? utangs : utangs.filter((u) => u.status === filter);
  const totalOwed = active.reduce(
    (sum, u) => sum + (u.totalAmountXlm - u.installmentAmountXlm * u.installmentsPaid),
    0
  );

  const installmentXlm = form.totalAmountXlm && Number(form.totalAmountXlm) > 0
    ? (Number(form.totalAmountXlm) / form.installmentsTotal).toFixed(2)
    : null;

  function validate(): boolean {
    setFormError(null);
    if (!address) { setFormError('Wallet not connected'); return false; }
    if (!form.description.trim()) { setFormError('Enter items description'); return false; }
    const amount = parseFloat(form.totalAmountXlm);
    if (!amount || amount <= 0) { setFormError('Enter a valid amount'); return false; }
    if (mode === 'manual') {
      if (!form.customerWallet.trim().startsWith('G') || form.customerWallet.trim().length !== 56) {
        setFormError('Enter a valid Stellar wallet address (G..., 56 chars)');
        return false;
      }
    }
    return true;
  }

  function handleGenerateQR() {
    if (!validate() || !address) return;
    // Go to fee payment step first
    setFeeStatus('idle');
    setFeeError(null);
    setStep('fee_payment');
  }

  async function handlePayFee() {
    if (!address) return;
    setFeeStatus('paying');
    setFeeError(null);
    try {
      const xdr = await buildPaymentTx(address, FEE_DEST, FEE_XLM, 'PalengkePay utang fee');
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });
      await submitTx(signedTxXdr);
      setFeeStatus('paid');
      // Build payload and advance to QR display
      setQrPayload({
        t: 'u',
        v: address,
        a: Math.round(parseFloat(form.totalAmountXlm) * STROOPS),
        n: form.installmentsTotal,
        i: form.intervalDays * 86400,
        d: form.description.trim(),
      });
      setStep('qr_display');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? String(err);
      setFeeError(
        msg.includes('rejected') || msg.includes('cancel')
          ? 'Transaction cancelled'
          : msg.slice(0, 120)
      );
      setFeeStatus('failed');
    }
  }

  async function handleManualCreate() {
    if (!validate() || !address) return;
    const hash = await createUtang(
      {
        vendorWallet: address,
        customerWallet: form.customerWallet.trim(),
        totalAmountXlm: parseFloat(form.totalAmountXlm),
        installmentsTotal: form.installmentsTotal,
        intervalDays: form.intervalDays,
        description: form.description.trim(),
      },
      address
    );
    if (hash) { handleClose(); refetch(); }
    else if (createError) setFormError(createError);
  }

  function handleClose() {
    setShowPanel(false);
    setStep('form');
    setForm(DEFAULT_FORM);
    setFormError(null);
    setQrPayload(null);
    setShowCustomerScanner(false);
    setFeeStatus('idle');
    setFeeError(null);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Utang (BNPL)</h1>
          <p className="text-sm text-slate-400">Manage installment agreements</p>
        </div>
        {ESCROW_ID && (
          <button
            onClick={() => { setShowPanel(true); setMode('qr'); setStep('form'); }}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={15} /> New Utang
          </button>
        )}
      </div>

      {!ESCROW_ID && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Set <code className="bg-amber-100 px-1 rounded">VITE_UTANG_ESCROW_CONTRACT_ID</code> to enable BNPL.
          </p>
        </div>
      )}

      {active.length > 0 && (
        <div className="bg-teal-700 rounded-xl p-5 text-white">
          <p className="text-xs font-medium text-teal-200 uppercase tracking-wide mb-1">Total Outstanding</p>
          <p className="text-3xl font-bold">
            {totalOwed.toFixed(2)} <span className="text-teal-300 text-xl">XLM</span>
          </p>
          <p className="text-sm text-teal-200 mt-0.5">{active.length} active agreement{active.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {utangs.length > 0 && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['all', 'active', 'completed', 'defaulted'] as const).map((f) => (
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

      {!isLoading && filtered.length === 0 && ESCROW_ID && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <HandCoins size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-400">
            {filter === 'all' ? 'No agreements yet' : `No ${filter} agreements`}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((u) => <UtangCard key={String(u.id)} utang={u} perspective="vendor" />)}
        </div>
      )}

      {/* ── New Utang fullscreen panel ──────────────────────────────────── */}
      {showPanel && (
        <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto">
          <div className="max-w-md mx-auto px-4 py-6 space-y-5">

            {/* Top bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (step === 'qr_display') { setStep('form'); setQrPayload(null); }
                  else if (step === 'fee_payment' && feeStatus !== 'paying') { setStep('form'); setFeeStatus('idle'); setFeeError(null); }
                  else if (step === 'form') handleClose();
                }}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                {step === 'form' ? <X size={22} /> : <ChevronLeft size={22} />}
              </button>
              <h2 className="text-lg font-bold text-slate-900">
                {step === 'qr_display' ? 'Show QR to Customer' : step === 'fee_payment' ? 'Service Fee' : 'New Installment'}
              </h2>
            </div>

            {/* ── Form step ── */}
            {step === 'form' && (
              <>
                {/* Mode selector */}
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: 'qr' as Mode, icon: QrCode, title: 'QR Code', sub: 'Customer scans your screen' },
                    { id: 'manual' as Mode, icon: Keyboard, title: 'Manual Entry', sub: 'Type / scan customer wallet' },
                  ]).map(({ id, icon: Icon, title, sub }) => (
                    <button key={id} onClick={() => { setMode(id); setShowCustomerScanner(false); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors text-center ${
                        mode === id
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={26} />
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-xs leading-tight mt-0.5">{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">

                  {/* Manual: customer wallet input */}
                  {mode === 'manual' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Customer Wallet Address</label>
                      <div className="flex gap-2">
                        <input
                          type="text" placeholder="G..."
                          value={form.customerWallet}
                          onChange={(e) => setForm((f) => ({ ...f, customerWallet: e.target.value }))}
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomerScanner((s) => !s)}
                          className={`flex items-center justify-center px-3 rounded-lg border transition-colors ${
                            showCustomerScanner ? 'bg-teal-700 border-teal-700 text-white' : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <ScanLine size={16} />
                        </button>
                      </div>
                      {showCustomerScanner && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-200">
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                            <p className="text-xs font-medium text-slate-600">Scan customer's wallet QR</p>
                            <button onClick={() => setShowCustomerScanner(false)} className="text-slate-400"><X size={14} /></button>
                          </div>
                          <QRScanner onScan={(addr) => { setForm((f) => ({ ...f, customerWallet: addr })); setShowCustomerScanner(false); }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items description */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Items <span className="font-normal text-slate-400">(what they're buying on credit)</span>
                    </label>
                    <input
                      type="text" placeholder="e.g. 5kg rice, 2kg pork, vegetables"
                      maxLength={100}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Total Amount (XLM)</label>
                    <input
                      type="number" min="0.01" step="0.01" placeholder="0.00"
                      value={form.totalAmountXlm}
                      onChange={(e) => setForm((f) => ({ ...f, totalAmountXlm: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Installments + Interval */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Installments</label>
                      <select value={form.installmentsTotal}
                        onChange={(e) => setForm((f) => ({ ...f, installmentsTotal: Number(e.target.value) }))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {INSTALLMENT_OPTIONS.map((n) => <option key={n} value={n}>{n}x</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Interval</label>
                      <select value={form.intervalDays}
                        onChange={(e) => setForm((f) => ({ ...f, intervalDays: Number(e.target.value) }))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {INTERVAL_OPTIONS.map((o) => <option key={o.days} value={o.days}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Preview */}
                  {installmentXlm && form.description && (
                    <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-2.5 text-xs text-teal-800">
                      <p className="font-semibold mb-0.5">{form.description}</p>
                      <p>{form.installmentsTotal} × {installmentXlm} XLM · {INTERVAL_OPTIONS.find((o) => o.days === form.intervalDays)?.label.toLowerCase()}</p>
                    </div>
                  )}

                  {(formError || createError) && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError ?? createError}</p>
                  )}
                </div>

                {/* CTA */}
                {mode === 'qr' ? (
                  <button onClick={handleGenerateQR}
                    className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                  >
                    <QrCode size={16} /> Generate QR Code
                  </button>
                ) : (
                  <button onClick={handleManualCreate} disabled={isCreating}
                    className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                  >
                    {isCreating && <Loader2 size={15} className="animate-spin" />}
                    {isCreating ? 'Submitting on-chain…' : 'Create Agreement'}
                  </button>
                )}
              </>
            )}

            {/* ── Fee payment step ── */}
            {step === 'fee_payment' && (
              <div className="space-y-5">
                {/* Summary of what they're creating */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Agreement Summary</p>
                  <p className="text-sm font-semibold text-slate-800">{form.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total amount</span>
                    <span className="font-bold text-slate-900">{form.totalAmountXlm} XLM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Installments</span>
                    <span className="font-medium text-slate-700">
                      {form.installmentsTotal} × {(Number(form.totalAmountXlm) / form.installmentsTotal).toFixed(2)} XLM
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Interval</span>
                    <span className="font-medium text-slate-700">
                      {INTERVAL_OPTIONS.find((o) => o.days === form.intervalDays)?.label}
                    </span>
                  </div>
                </div>

                {/* Fee card */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-teal-700 shrink-0" />
                    <p className="text-sm font-semibold text-teal-800">PalengkePay Service Fee</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-teal-700">QR utang creation fee</span>
                    <span className="text-xl font-bold text-teal-900">{FEE_XLM} XLM</span>
                  </div>
                  <p className="text-xs text-teal-600">
                    One-time fee per QR agreement. Paid to PalengkePay to register this installment on-chain.
                  </p>
                </div>

                {feeError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{feeError}</p>
                )}

                {feeStatus !== 'paying' ? (
                  <button
                    onClick={handlePayFee}
                    className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                  >
                    <CheckCircle size={16} />
                    Pay {FEE_XLM} XLM &amp; Generate QR
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 bg-teal-700/70 text-white py-3.5 rounded-xl text-sm font-semibold">
                    <Loader2 size={16} className="animate-spin" />
                    Confirm in wallet…
                  </div>
                )}
              </div>
            )}

            {/* ── QR display step ── */}
            {step === 'qr_display' && qrPayload && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center gap-4">
                  <div className="bg-white p-3 rounded-xl border-2 border-teal-200 shadow-sm">
                    <QRCodeSVG value={JSON.stringify(qrPayload)} size={220} level="M" bgColor="#ffffff" fgColor="#0f172a" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-900">{qrPayload.d}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {(qrPayload.a / STROOPS).toFixed(2)} XLM · {qrPayload.n} × {(qrPayload.a / STROOPS / qrPayload.n).toFixed(2)} XLM · {INTERVAL_OPTIONS.find((o) => o.days * 86400 === qrPayload.i)?.label ?? ''}
                    </p>
                  </div>
                </div>

                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-teal-800">How it works</p>
                  <ol className="text-xs text-teal-700 space-y-1 list-decimal list-inside">
                    <li>Show this QR to your customer</li>
                    <li>Customer opens PalengkePay → My Utang → tap Scan</li>
                    <li>Customer reviews details and taps Accept</li>
                    <li>Agreement registers on-chain automatically</li>
                  </ol>
                </div>

                <button onClick={handleClose}
                  className="w-full border border-slate-200 hover:bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
