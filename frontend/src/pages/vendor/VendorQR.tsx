import { QrCode } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';

export function VendorQR() {
  const { address, isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="bg-slate-100 rounded-2xl p-8 mb-5 inline-block">
          <QrCode size={200} className="text-slate-300" />
        </div>
        {isConnected ? (
          <>
            <p className="text-lg font-semibold text-slate-900 mb-1">Your Vendor QR</p>
            <p className="text-xs font-mono text-slate-400 mb-2">{address}</p>
            <p className="text-xs text-slate-400">Phase 2 — QR generation coming soon</p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Connect wallet to generate your QR code</p>
        )}
        <p className="text-xs text-slate-300 mt-4">Scan to pay me</p>
      </div>
    </div>
  );
}
