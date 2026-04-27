import { List } from 'lucide-react';

export function VendorTransactions() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Transaction History</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <List size={32} className="text-slate-200 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-400">No transactions yet</p>
        <p className="text-xs text-slate-300 mt-0.5">Your transactions will appear here</p>
      </div>
      <p className="text-xs text-center text-slate-300">Phase 2 — full history coming soon</p>
    </div>
  );
}
