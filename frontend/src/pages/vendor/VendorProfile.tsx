import { User } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';

export function VendorProfile() {
  const { address } = useWallet();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Profile</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
            <User size={22} className="text-teal-700" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Vendor</p>
            {address && <p className="text-xs font-mono text-slate-400">{address.slice(0, 12)}...</p>}
          </div>
        </div>
        <p className="text-xs text-slate-300">Vendor profile editing coming in Phase 2</p>
      </div>
    </div>
  );
}
