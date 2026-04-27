import { LayoutDashboard } from 'lucide-react';

export function AdminMarket() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Market Overview</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <LayoutDashboard size={32} className="text-slate-200 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-400">No markets registered</p>
        <p className="text-xs text-slate-300 mt-0.5">Phase 2 — market dashboard coming soon</p>
      </div>
    </div>
  );
}
