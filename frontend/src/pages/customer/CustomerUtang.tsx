import { useState } from 'react';
import { HandCoins, CheckCircle, Loader2, X, ExternalLink, ScanLine, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../lib/hooks/useWallet';
import { useCustomerUtangs, usePayInstallment } from '../../lib/hooks/useUtang';
import type { UtangRecord } from '../../lib/hooks/useUtang';
import { UtangCard } from '../../components/UtangCard';
import { stellarExpertUrl } from '../../lib/stellar';

export function CustomerUtang() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { utangs, isLoading, refetch } = useCustomerUtangs(address);
  const { status, txHash, error, payInstallment, reset } = usePayInstallment();

  const [paying, setPaying] = useState<UtangRecord | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Utang</h1>
          <p className="text-sm text-slate-400">Installment plans and upcoming payments</p>
        </div>
        <button
          onClick={() => navigate('/customer/scan')}
          className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <ScanLine size={15} /> Scan QR
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
          <p className="text-xs text-slate-300 mt-0.5 mb-4">
            Scan your vendor's QR code to accept an installment plan
          </p>
          <button
            onClick={() => navigate('/customer/scan')}
            className="flex items-center gap-1.5 mx-auto bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <ScanLine size={14} /> Scan Vendor QR
          </button>
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
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
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
                      className="flex items-center justify-center gap-1.5 text-xs text-teal-600 hover:underline">
                      View on Stellar Expert <ExternalLink size={11} />
                    </a>
                  )}
                  <button onClick={handleClosePayModal}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-medium transition-colors">
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
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
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
