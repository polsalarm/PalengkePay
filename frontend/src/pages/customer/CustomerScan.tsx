import { ScanLine } from 'lucide-react';

export function CustomerScan() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Scan to Pay</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="bg-slate-100 rounded-xl p-8 mb-4 inline-block">
          <ScanLine size={64} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-500 mb-1">Camera scanner coming in Phase 2</p>
        <p className="text-xs text-slate-300">Point your camera at the vendor's QR code</p>
      </div>
      <div className="text-center">
        <button className="text-sm text-teal-700 hover:text-teal-600 underline underline-offset-2">
          Enter address manually
        </button>
      </div>
    </div>
  );
}
