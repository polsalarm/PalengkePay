import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Wallet, Droplets, PartyPopper, CheckCircle, Loader2, ExternalLink, ArrowRight, ArrowLeft, QrCode, ScanLine } from 'lucide-react';
import { useWallet } from '../lib/hooks/useWallet';
import { useBalance } from '../lib/hooks/useBalance';

const STEPS = ['Install Wallet', 'Connect Wallet', 'Get Test XLM', "You're Ready!"];

export function Onboard() {
  const [step, setStep] = useState(0);
  const { address, isConnected, connect, isConnecting } = useWallet();
  const { balance, refetch } = useBalance(address);
  const navigate = useNavigate();

  // Auto-advance when wallet connects on step 1
  useEffect(() => {
    if (step === 1 && isConnected) setStep(2);
  }, [isConnected, step]);

  // Auto-check balance after 5s on step 2
  useEffect(() => {
    if (step === 2 && address) {
      const timer = setTimeout(() => refetch(), 5000);
      return () => clearTimeout(timer);
    }
  }, [step, address, refetch]);

  const hasBalance = balance !== null && parseFloat(balance) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-teal-700' : i < step ? 'w-2 bg-teal-400' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">
            Step {step + 1} of {STEPS.length}
          </p>

          {/* Step 0: Install Wallet */}
          {step === 0 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Download size={22} className="text-teal-700" />
                <h2 className="text-xl font-bold text-slate-900">Install a Wallet</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                You need a Stellar wallet to use PalengkePay. We recommend Freighter (desktop) or Lobstr (mobile).
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-sm">F</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Freighter</span>
                  <span className="text-xs text-slate-400">Desktop extension</span>
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                </a>
                <a
                  href="https://lobstr.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">L</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Lobstr</span>
                  <span className="text-xs text-slate-400">Mobile app</span>
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                </a>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Next <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-slate-400 hover:text-slate-600 px-4 transition-colors"
                >
                  I already have one
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Connect Wallet */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Wallet size={22} className="text-teal-700" />
                <h2 className="text-xl font-bold text-slate-900">Connect Your Wallet</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Tap below to open the wallet picker and connect your Stellar wallet.
              </p>

              {isConnected ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <CheckCircle size={20} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Wallet connected!</p>
                    <p className="text-xs text-green-600 font-mono">{address}</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-3 rounded-lg transition-all mb-4 disabled:opacity-60"
                >
                  {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
                  {isConnecting ? 'Connecting…' : 'Connect Wallet'}
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                {isConnected && (
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-2.5 rounded-lg transition-all"
                  >
                    Next <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Get Test XLM */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Droplets size={22} className="text-teal-700" />
                <h2 className="text-xl font-bold text-slate-900">Get Free Test XLM</h2>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-700 font-medium">
                  This is Stellar Testnet — play money only. No real funds involved.
                </p>
              </div>
              <p className="text-sm text-slate-500 mb-5">
                Click the button below to fund your testnet wallet with 10,000 XLM from the Stellar Friendbot.
              </p>

              {address && (
                <a
                  href={`https://friendbot.stellar.org/?addr=${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-3 rounded-lg transition-all mb-4"
                  onClick={() => setTimeout(() => refetch(), 5000)}
                >
                  <Droplets size={18} />
                  Fund with Friendbot
                  <ExternalLink size={14} />
                </a>
              )}

              {hasBalance ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <CheckCircle size={20} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Balance received!</p>
                    <p className="text-xs text-green-600">{balance} XLM on testnet</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => refetch()}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-teal-600 transition-colors mb-4"
                >
                  <Loader2 size={14} />
                  Check balance
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-2.5 rounded-lg transition-all"
                >
                  {hasBalance ? 'Continue' : 'Skip for now'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <PartyPopper size={30} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">You're Ready!</h2>
              <p className="text-sm text-slate-500 mb-1">Wallet connected and funded.</p>
              {balance && (
                <p className="text-2xl font-bold text-teal-700 mb-6">{balance} XLM</p>
              )}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">How will you use PalengkePay?</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => navigate('/vendor/apply')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-teal-200 bg-teal-50 hover:border-teal-400 hover:bg-teal-100 active:scale-95 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center">
                    <QrCode size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-teal-800">I'm a Vendor</span>
                  <span className="text-xs text-teal-600">Accept payments</span>
                </button>
                <button
                  onClick={() => navigate('/customer/home')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <ScanLine size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">I'm a Customer</span>
                  <span className="text-xs text-slate-500">Scan & pay</span>
                </button>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Not sure yet → Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
