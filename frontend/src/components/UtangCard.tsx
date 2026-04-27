import { CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import type { UtangRecord } from '../lib/hooks/useUtang';
import { dueLabel, isOverdue } from '../lib/hooks/useUtang';
import { truncateAddress, stellarExpertUrl } from '../lib/stellar';

interface UtangCardProps {
  utang: UtangRecord;
  perspective: 'vendor' | 'customer';
  onPayInstallment?: (utang: UtangRecord) => void;
  txHash?: string | null;
}

export function UtangCard({ utang, perspective, onPayInstallment, txHash }: UtangCardProps) {
  const progress = utang.installmentsTotal > 0
    ? utang.installmentsPaid / utang.installmentsTotal
    : 0;

  const statusColors = {
    active: 'bg-blue-50 text-blue-700 border-blue-100',
    completed: 'bg-green-50 text-green-700 border-green-100',
    defaulted: 'bg-red-50 text-red-700 border-red-100',
  };

  const overdue = utang.status === 'active' && isOverdue(utang.nextDueSecs);
  const counterparty = perspective === 'vendor' ? utang.customerWallet : utang.vendorWallet;
  const counterpartyLabel = perspective === 'vendor' ? 'Customer' : 'Vendor';

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
      utang.status === 'defaulted' ? 'border-red-200' :
      overdue ? 'border-amber-200' : 'border-slate-200'
    }`}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 mb-0.5">{counterpartyLabel}</p>
          <p className="text-sm font-mono font-medium text-slate-800 truncate">
            {truncateAddress(counterparty)}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${statusColors[utang.status]}`}>
          {utang.status === 'active' && overdue ? 'overdue' : utang.status}
        </span>
      </div>

      {/* Amount + progress */}
      <div className="px-5 pb-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-slate-900">
            {utang.totalAmountXlm.toFixed(2)}
            <span className="text-base font-medium text-slate-400 ml-1">XLM</span>
          </span>
          <span className="text-sm text-slate-500">
            {utang.installmentsPaid}/{utang.installmentsTotal} paid
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              utang.status === 'completed' ? 'bg-green-500' :
              utang.status === 'defaulted' ? 'bg-red-400' :
              overdue ? 'bg-amber-400' : 'bg-teal-600'
            }`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {utang.installmentAmountXlm.toFixed(2)} XLM × {utang.installmentsTotal} installments
          · every {utang.intervalDays}d
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between gap-3">
        {utang.status === 'active' && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${
            overdue ? 'text-amber-600' : 'text-slate-500'
          }`}>
            {overdue ? <AlertTriangle size={13} /> : <Clock size={13} />}
            {dueLabel(utang.nextDueSecs)}
          </div>
        )}
        {utang.status === 'completed' && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
            <CheckCircle size={13} />
            Fully paid
          </div>
        )}
        {utang.status === 'defaulted' && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertTriangle size={13} />
            Defaulted
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {txHash && (
            <a
              href={stellarExpertUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-600 flex items-center gap-1 hover:underline"
            >
              View tx <ExternalLink size={11} />
            </a>
          )}
          {perspective === 'customer' && utang.status === 'active' && onPayInstallment && (
            <button
              onClick={() => onPayInstallment(utang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                overdue
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-teal-700 hover:bg-teal-800 text-white'
              }`}
            >
              Pay installment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
