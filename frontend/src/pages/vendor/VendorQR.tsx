import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendor } from '../../lib/hooks/useVendor';
import { QRGenerator } from '../../components/QRGenerator';

export function VendorQR() {
  const { address, isConnected } = useWallet();
  const { vendor, isLoading } = useVendor(address);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <p className="text-sm text-slate-500">Connect wallet to see your QR code.</p>
      </div>
    );
  }

  const stallInfo = vendor
    ? `Stall ${vendor.stallNumber} · ${vendor.productType}`
    : undefined;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
        <Link to="/vendor/home" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-semibold text-slate-900">My QR Code</h1>
      </div>

      {/* QR display — full screen optimized */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-slate-50">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-60 h-60 bg-slate-200 animate-pulse rounded-2xl" />
            <div className="h-5 w-32 bg-slate-200 animate-pulse rounded" />
            <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
          </div>
        ) : (
          <QRGenerator
            value={address!}
            size={280}
            vendorName={vendor?.name ?? 'Your QR Code'}
            stallInfo={stallInfo}
          />
        )}
      </div>

      {/* Bottom hint */}
      <div className="px-6 py-5 text-center">
        <p className="text-xs text-slate-400">
          Show this screen to customers so they can scan and pay you.
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-slate-300">
          <Download size={11} />
          <span>Screenshot to save</span>
        </div>
      </div>
    </div>
  );
}
