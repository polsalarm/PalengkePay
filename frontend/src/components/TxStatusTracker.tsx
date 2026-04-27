import { Loader2, Lock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import type { TxStatus } from '../lib/hooks/usePayment';
import { stellarExpertUrl } from '../lib/stellar';

interface Props {
  status: TxStatus;
  txHash: string | null;
  error: string | null;
  amount?: string;
  recipientName?: string;
  onRetry?: () => void;
}

export function TxStatusTracker({ status, txHash, error, amount, recipientName, onRetry }: Props) {
  if (status === 'idle') return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
      {status === 'building' && (
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 size={20} className="animate-spin text-teal-700 shrink-0" />
          <span className="text-sm font-medium">Preparing transaction…</span>
        </div>
      )}

      {status === 'signing' && (
        <div className="flex items-center gap-3">
          <Lock size={20} className="text-teal-700 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-slate-800">Confirm in your wallet</p>
            <p className="text-xs text-slate-400">Check your wallet app or extension</p>
          </div>
        </div>
      )}

      {status === 'submitting' && (
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="text-sm font-medium text-amber-600">Processing…</span>
        </div>
      )}

      {status === 'confirmed' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={22} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700">Payment sent!</p>
              {amount && recipientName && (
                <p className="text-xs text-slate-500">{amount} XLM → {recipientName}</p>
              )}
            </div>
          </div>
          {txHash && (
            <a
              href={stellarExpertUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-600 font-medium"
            >
              <ExternalLink size={12} />
              View on Stellar Expert
            </a>
          )}
        </div>
      )}

      {status === 'failed' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <XCircle size={22} className="text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Transaction failed</p>
              {error && <p className="text-xs text-slate-500">{error}</p>}
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium text-teal-700 hover:text-teal-600 border border-teal-200 rounded-lg px-4 py-1.5 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
