import { useWallet } from '../lib/hooks/useWallet';
import { useBalance } from '../lib/hooks/useBalance';

export function BalanceDisplay() {
  const { address } = useWallet();
  const { balance, isLoading } = useBalance(address);

  if (isLoading || (address && balance === null)) {
    return (
      <div className="text-center">
        <div className="h-8 w-40 bg-slate-200 animate-pulse rounded-lg mx-auto mb-1" />
        <div className="h-4 w-28 bg-slate-100 animate-pulse rounded mx-auto" />
      </div>
    );
  }

  if (!address) {
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-slate-300">—</p>
        <p className="text-xs text-slate-400 mt-1">Connect wallet to see balance</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-slate-900">{balance ?? '0.00'} <span className="text-teal-700">XLM</span></p>
      <p className="text-xs text-slate-400 mt-1">Available balance</p>
    </div>
  );
}
