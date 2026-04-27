import { LayoutDashboard } from 'lucide-react';

export function VendorUtang() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Utang (BNPL)</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <LayoutDashboard size={32} className="text-slate-200 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-400">No active agreements</p>
        <p className="text-xs text-slate-300 mt-0.5">Utang installment tracking coming in Phase 3</p>
      </div>
    </div>
  );
}
