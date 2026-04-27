import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useWallet } from '../lib/hooks/useWallet';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

    async function checkRole() {
      setChecking(true);
      try {
        if (db) {
          const vendorDoc = await getDoc(doc(db, 'vendors', address!));
          if (vendorDoc.exists()) {
            navigate('/vendor/home', { replace: true });
            return;
          }
        }
        navigate('/customer/home', { replace: true });
      } catch {
        navigate('/customer/home', { replace: true });
      } finally {
        setChecking(false);
      }
    }

    checkRole();
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
