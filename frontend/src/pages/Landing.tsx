import { useNavigate } from 'react-router-dom';
import { ScanLine, QrCode, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { useWallet } from '../lib/hooks/useWallet';
import { isRegisteredVendor } from '../lib/hooks/useVendor';

export function Landing() {
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();

  const handleVendorClick = async () => {
    if (!isConnected || !address) {
      navigate('/vendor/apply');
      return;
    }
    const registered = await isRegisteredVendor(address);
    navigate(registered ? '/vendor/home' : '/vendor/apply');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} />
          Powered by Stellar Blockchain
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-700 flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">₱</span>
          </div>
        </div>

        <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
          Digital payments for<br />
          <span className="text-teal-700">every palengke vendor</span>
        </h1>
        <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto">
          Vendors get a QR code. Customers scan and pay. Transactions settle in seconds on-chain. No bank account needed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <button
            onClick={handleVendorClick}
            className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-sm"
          >
            <QrCode size={18} />
            I'm a Vendor
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/customer/scan')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 active:scale-95 text-teal-700 font-semibold px-6 py-3 rounded-lg border border-teal-200 transition-all shadow-sm"
          >
            <ScanLine size={18} />
            I'm a Customer
            <ArrowRight size={16} />
          </button>
        </div>
        <button
          onClick={() => navigate('/onboard')}
          className="text-sm text-slate-400 hover:text-teal-700 transition-colors underline underline-offset-2"
        >
          New here? Start setup guide →
        </button>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-center text-xl font-semibold text-slate-700 mb-8">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: QrCode, title: 'Vendor shows QR', desc: 'Every vendor gets a unique QR code linked to their wallet.' },
            { icon: ScanLine, title: 'Customer scans', desc: 'Open the app, scan the QR, enter amount and item.' },
            { icon: Zap, title: 'Instant settlement', desc: 'XLM transfers directly on Stellar — seconds, not days.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
                <Icon size={20} className="text-teal-700" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
              <p className="text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-slate-900 py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-teal-400" />
            Built on Stellar Testnet
          </div>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-teal-400" />
            Settles in seconds
          </div>
          <div className="flex items-center gap-2">
            <span className="text-teal-400">₱</span>
            Zero bank account required
          </div>
        </div>
      </section>
    </div>
  );
}
