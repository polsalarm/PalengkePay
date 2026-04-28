import { useNavigate } from 'react-router-dom';
import { ScanLine, QrCode, Zap, ShieldCheck, ArrowRight, TrendingUp, Smartphone } from 'lucide-react';
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
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500 opacity-20 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-teal-800 opacity-30 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-sm">
            <Zap size={12} className="text-yellow-300" />
            Powered by Stellar Blockchain · Instant Payments
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-2xl">
              <span className="text-white text-4xl font-black">₱</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-6xl font-black mb-5 leading-tight tracking-tight">
            Palengke payments,<br />
            <span className="text-yellow-300">finally digital.</span>
          </h1>
          <p className="text-white/70 text-xl mb-10 max-w-lg mx-auto leading-relaxed">
            QR code on every stall. Scan and pay in seconds. No bank account needed — just your phone.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={handleVendorClick}
              className="group flex items-center justify-center gap-2.5 bg-white text-teal-700 hover:bg-yellow-300 hover:text-teal-900 font-bold px-8 py-4 rounded-2xl transition-all shadow-lg active:scale-95 text-base"
            >
              <QrCode size={20} />
              I'm a Vendor
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/customer/scan')}
              className="group flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg active:scale-95 text-base"
            >
              <ScanLine size={20} />
              I'm a Customer
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <button
            onClick={() => navigate('/onboard')}
            className="text-sm text-white/50 hover:text-white/80 transition-colors underline underline-offset-4"
          >
            New here? Start the setup guide →
          </button>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-6 py-4 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Settlement', value: '~5 sec' },
              { label: 'Bank account', value: 'Not needed' },
              { label: 'Network fee', value: '< ₱0.01' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-white font-bold text-lg lg:text-xl">{value}</p>
                <p className="text-white/50 text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Simple process</span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">How it works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: QrCode,
              color: 'bg-teal-500',
              title: 'Vendor gets a QR',
              desc: 'Register your stall and receive a unique QR code linked to your Stellar wallet.',
            },
            {
              step: '02',
              icon: ScanLine,
              color: 'bg-violet-500',
              title: 'Customer scans',
              desc: 'Open PalengkePay, point at the QR, enter the amount and what you bought.',
            },
            {
              step: '03',
              icon: Zap,
              color: 'bg-yellow-500',
              title: 'Instant settlement',
              desc: 'XLM transfers directly on Stellar blockchain — confirmed in seconds, permanent record.',
            },
          ].map(({ step, icon: Icon, color, title, desc }) => (
            <div key={step} className="relative bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="absolute -top-3 -left-1 text-6xl font-black text-slate-50 select-none group-hover:text-slate-100 transition-colors">{step}</div>
              <div className={`relative w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-base">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Features</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Built for the palengke</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: QrCode,
                color: 'text-teal-600 bg-teal-50',
                title: 'QR Payments',
                desc: 'Display your stall QR — customers scan, enter amount, confirm. Done.',
              },
              {
                icon: TrendingUp,
                color: 'text-violet-600 bg-violet-50',
                title: 'Installment Credit (Utang)',
                desc: 'Formalize utang agreements on-chain. Track payments, due dates, and history.',
              },
              {
                icon: ShieldCheck,
                color: 'text-green-600 bg-green-50',
                title: 'Immutable Records',
                desc: 'Every transaction is permanently recorded on Stellar blockchain. Dispute-proof.',
              },
              {
                icon: Smartphone,
                color: 'text-amber-600 bg-amber-50',
                title: 'Mobile-first PWA',
                desc: 'Install on any phone. Works like a native app, no app store needed.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex gap-4 items-start hover:border-teal-200 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-3">Ready to get started?</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Join vendors already accepting digital payments at the palengke.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleVendorClick}
            className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-md text-base"
          >
            <QrCode size={20} />
            Register as Vendor
          </button>
          <button
            onClick={() => navigate('/onboard')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold px-8 py-4 rounded-2xl border border-slate-200 transition-all shadow-sm text-base"
          >
            Setup Guide
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer trust strip */}
      <div className="border-t border-slate-100 py-5 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs font-medium">
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-teal-500" /> Stellar Testnet</span>
          <span className="flex items-center gap-1.5"><Zap size={13} className="text-teal-500" /> 5-second finality</span>
          <span className="flex items-center gap-1.5"><span className="text-teal-500 font-bold">₱</span> No bank required</span>
        </div>
      </div>
    </div>
  );
}
