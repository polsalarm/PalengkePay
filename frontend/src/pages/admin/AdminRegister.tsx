import { User } from 'lucide-react';

export function AdminRegister() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Register Vendor</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <User size={32} className="text-slate-200 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-400">Vendor registration form</p>
        <p className="text-xs text-slate-300 mt-0.5">Phase 2 — on-chain registration coming soon</p>
      </div>
    </div>
  );
}
