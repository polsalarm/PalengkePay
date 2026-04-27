import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useWallet } from '../lib/hooks/useWallet';
import { isRegisteredVendor } from '../lib/hooks/useVendor';

export function Dashboard() {
  const { address, isConnected } = useWallet();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      navigate('/connect');
      return;
    }
    if (!address) return;

    isRegisteredVendor(address)
      .then((isVendor) => {
        navigate(isVendor ? '/vendor/home' : '/customer/home', { replace: true });
      })
      .catch(() => navigate('/customer/home', { replace: true }))
      .finally(() => setChecking(false));
  }, [address, isConnected, navigate]);

  if (!checking) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500">
        <Loader2 size={20} className="animate-spin text-teal-700" />
        <span className="text-sm">Loading your dashboard…</span>
      </div>
    </div>
  );
}
