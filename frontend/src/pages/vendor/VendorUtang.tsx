import { useState } from 'react';
import { Plus, X, HandCoins, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendorUtangs, useCreateUtang } from '../../lib/hooks/useUtang';
import { UtangCard } from '../../components/UtangCard';

const ESCROW_ID = import.meta.env.VITE_UTANG_ESCROW_CONTRACT_ID as string | undefined;

const INTERVAL_OPTIONS = [
  { label: 'Weekly', days: 7 },
  { label: 'Biweekly', days: 14 },
  { label: 'Monthly', days: 30 },
];

const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6];

interface NewUtangForm {
  customerWallet: string;
  totalAmountXlm: string;
  installmentsTotal: number;
  intervalDays: number;
}

const DEFAULT_FORM: NewUtangForm = {
  customerWallet: '',
  totalAmountXlm: '',
  installmentsTotal: 3,
  intervalDays: 7,
};

export function VendorUtang() {
  const { address } = useWallet();
  const { utangs, isLoading, refetch } = useVendorUtangs(address);
  const { createUtang, isCreating, error: createError } = useCreateUtang();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewUtangForm>(DEFAULT_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'defaulted'>('all');

  const active = utangs.filter((u) => u.status === 'active');
  const filtered = filter === 'all' ? utangs : utangs.filter((u) => u.status === filter);
  const totalOwed = active.reduce(
    (sum, u) => sum + (u.totalAmountXlm - u.installmentAmountXlm * u.installmentsPaid),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);
    if (!address) { setFormError('Wallet not connected'); return; }
    if (!form.customerWallet.trim().startsWith('G')) {
      setFormError('Enter a valid Stellar wallet address (starts with G)');
      return;
    }
    const amount = parseFloat(form.totalAmountXlm);
    if (!amount || amount <= 0) { setFormError('Enter a valid amount'); return; }

    const hash = await createUtang(
      {
        vendorWallet: address,
        customerWallet: form.customerWallet.trim(),
        totalAmountXlm: amount,
        installmentsTotal: form.installmentsTotal,
        intervalDays: form.intervalDays,
      },
      address
    );

    if (hash) {
      setSuccess(true);
      setForm(DEFAULT_FORM);
      setShowForm(false);
      refetch();
    }
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
            onClick={() => { setShowForm(true); setSuccess(false); }}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={15} />
            New Utang
          </button>
        )}
      </div>

      {/* No contract banner */}
      {!ESCROW_ID && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">Contract not deployed</p>
            <p className="text-xs text-amber-700">
              Set <code className="bg-amber-100 px-1 rounded">VITE_UTANG_ESCROW_CONTRACT_ID</code> to enable BNPL.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      {active.length > 0 && (
        <div className="bg-teal-700 rounded-xl p-5 text-white">
          <p className="text-xs font-medium text-teal-200 uppercase tracking-wide mb-1">Total Outstanding</p>
          <p className="text-3xl font-bold">
            {totalOwed.toFixed(2)} <span className="text-teal-300 text-xl">XLM</span>
          </p>
          <p className="text-sm text-teal-200 mt-0.5">{active.length} active agreement{active.length !== 1 ? 's' : ''}</p>
        </div>
      )}

      {/* New utang form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">New Installment Agreement</h2>
            <button onClick={() => { setShowForm(false); setFormError(null); }} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer Wallet Address</label>
              <input
                type="text" placeholder="G..."
                value={form.customerWallet}
                onChange={(e) => setForm((f) => ({ ...f, customerWallet: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Total Amount (XLM)</label>
              <input
                type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.totalAmountXlm}
                onChange={(e) => setForm((f) => ({ ...f, totalAmountXlm: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Installments</label>
                <select
                  value={form.installmentsTotal}
                  onChange={(e) => setForm((f) => ({ ...f, installmentsTotal: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {INSTALLMENT_OPTIONS.map((n) => <option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Interval</label>
                <select
                  value={form.intervalDays}
                  onChange={(e) => setForm((f) => ({ ...f, intervalDays: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {INTERVAL_OPTIONS.map((o) => <option key={o.days} value={o.days}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {form.totalAmountXlm && Number(form.totalAmountXlm) > 0 && (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                {form.installmentsTotal} installments of{' '}
                <strong>{(Number(form.totalAmountXlm) / form.installmentsTotal).toFixed(2)} XLM</strong>{' '}
                every {INTERVAL_OPTIONS.find((o) => o.days === form.intervalDays)?.label.toLowerCase()}
              </p>
            )}

            {(formError || createError) && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {formError ?? createError}
              </p>
            )}

            <button
              type="submit" disabled={isCreating}
              className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {isCreating ? 'Submitting on-chain…' : 'Create Agreement'}
            </button>
          </form>
        </div>
      )}

      {success && !showForm && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          Agreement recorded on-chain. Customer will see it in their Utang tab.
        </div>
      )}

      {/* Filter tabs */}
      {utangs.length > 0 && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['all', 'active', 'completed', 'defaulted'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
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
          {filtered.map((u) => (
            <UtangCard key={String(u.id)} utang={u} perspective="vendor" />
          ))}
        </div>
      )}
    </div>
  );
}
