import { useNavigate } from 'react-router-dom';
import { ScanLine, Clock } from 'lucide-react';
import { BalanceDisplay } from '../../components/BalanceDisplay';

export function CustomerHome() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Welcome 👋</h1>
        <p className="text-sm text-slate-500">Ready to pay at the palengke?</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <BalanceDisplay />
      </div>

      <button
        onClick={() => navigate('/customer/scan')}
        className="w-full flex items-center justify-center gap-3 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-4 rounded-xl transition-all shadow-sm"
      >
        <ScanLine size={22} />
        Scan to Pay
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Recent Payments</h2>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-slate-400">No payments yet</p>
          <p className="text-xs text-slate-300 mt-0.5">Phase 2 — history coming soon</p>
        </div>
      </div>
    </div>
  );
}
