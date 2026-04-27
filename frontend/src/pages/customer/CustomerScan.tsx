import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRScanner } from '../../components/QRScanner';
import { PaymentForm } from '../../components/PaymentForm';
import { TxStatusTracker } from '../../components/TxStatusTracker';
import { useWallet } from '../../lib/hooks/useWallet';
import { useVendor } from '../../lib/hooks/useVendor';
import { usePayment } from '../../lib/hooks/usePayment';
import { stellarExpertUrl } from '../../lib/stellar';

type Step = 'scan' | 'manual' | 'pay' | 'done';

export function CustomerScan() {
  const navigate = useNavigate();
  const { address, isConnected, connect } = useWallet();
  const [step, setStep] = useState<Step>('scan');
  const [vendorAddress, setVendorAddress] = useState('');
  const [manualInput, setManualInput] = useState('');
  const { vendor, isLoading: vendorLoading } = useVendor(
    step === 'pay' || step === 'done' ? vendorAddress : null
  );
  const { status, txHash, error, sendPayment, reset } = usePayment();

  const handleScan = (addr: string) => {
    setVendorAddress(addr);
    setStep('pay');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = manualInput.trim();
    if (addr.startsWith('G') && addr.length === 56) {
      setVendorAddress(addr);
      setStep('pay');
    }
  };

  const handlePay = async (amount: string, memo: string) => {
    if (!address) return;
    await sendPayment(address, vendorAddress, amount, memo);
    if (status !== 'failed') setStep('done');
  };

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Scan to Pay</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 mb-3">Connect wallet to make payments.</p>
          <button
            onClick={connect}
            className="text-sm font-medium bg-teal-700 text-white px-4 py-2 rounded-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === 'pay' || step === 'manual') { setStep('scan'); reset(); }
            else if (step === 'done') navigate('/customer/home');
            else navigate('/customer/home');
          }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          {step === 'scan' && 'Scan to Pay'}
          {step === 'manual' && 'Enter Address'}
          {step === 'pay' && 'Pay Vendor'}
          {step === 'done' && 'Payment Sent!'}
        </h1>
      </div>

      {/* Step: scan */}
      {step === 'scan' && (
        <QRScanner
          onScan={handleScan}
          onManualEntry={() => setStep('manual')}
        />
      )}

      {/* Step: manual address entry */}
      {step === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Vendor Wallet Address
            </label>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="G..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Continue
          </button>
        </form>
      )}

      {/* Step: payment form */}
      {step === 'pay' && (
        <>
          <PaymentForm
            vendorAddress={vendorAddress}
            vendor={vendor}
            isLoading={vendorLoading}
            onSubmit={handlePay}
            disabled={status !== 'idle'}
          />
          {status !== 'idle' && (
            <TxStatusTracker
              status={status}
              txHash={txHash}
              error={error}
              amount={undefined}
              recipientName={vendor?.name}
              onRetry={() => { reset(); }}
            />
          )}
        </>
      )}

      {/* Step: done */}
      {step === 'done' && status === 'confirmed' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Payment sent!</h2>
          {vendor && <p className="text-sm text-slate-500 mb-4">to {vendor.name}</p>}
          {txHash && (
            <a
              href={stellarExpertUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-700 underline underline-offset-2 block mb-4"
            >
              View on Stellar Expert →
            </a>
          )}
          <button
            onClick={() => navigate('/customer/home')}
            className="w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
