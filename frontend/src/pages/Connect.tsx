import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useWallet } from '../lib/hooks/useWallet';
import { WalletButton } from '../components/WalletButton';

export function Connect() {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) navigate('/dashboard');
  }, [isConnected, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-5">
          <Wallet size={28} className="text-teal-700" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Connect Your Wallet</h1>
        <p className="text-sm text-slate-500 mb-8">
          Connect a Stellar wallet to start sending and receiving payments on PalengkePay.
        </p>
        <div className="flex justify-center">
          <WalletButton />
        </div>
        <p className="text-xs text-slate-400 mt-6">
          Supports Freighter, Lobstr, xBull, and Albedo
        </p>
      </div>
    </div>
  );
}
