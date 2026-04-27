import { Home, TrendingUp, Clock } from 'lucide-react';
import { BalanceDisplay } from '../../components/BalanceDisplay';

export function VendorHome() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Good morning 👋</h1>
        <p className="text-sm text-slate-500">Here's your summary for today.</p>
      </div>

      <div className="bg-teal-700 rounded-xl p-5 text-white">
        <p className="text-xs font-medium text-teal-200 uppercase tracking-wide mb-1">Today's Earnings</p>
        <p className="text-3xl font-bold mb-0.5">0.00 <span className="text-teal-300 text-xl">XLM</span></p>
        <p className="text-sm text-teal-200">0 transactions today</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <BalanceDisplay />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Recent Payments</h2>
        </div>
        <div className="text-center py-8">
          <TrendingUp size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-400">No payments yet</p>
          <p className="text-xs text-slate-300 mt-0.5">Your transactions will appear here</p>
        </div>
      </div>

      <p className="text-xs text-center text-slate-300 flex items-center justify-center gap-1">
        <Home size={11} />
        Phase 2 — full dashboard coming soon
      </p>
    </div>
  );
}
