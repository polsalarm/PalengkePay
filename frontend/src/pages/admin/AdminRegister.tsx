import { useState } from 'react';
import { UserPlus, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useWallet } from '../../lib/hooks/useWallet';
import { useToast } from '../../components/Toast';
import {
  prepareContractTx, submitSorobanTx,
  addressToScVal, stringToScVal,
} from '../../lib/stellar';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';

const REGISTRY_ID = import.meta.env.VITE_VENDOR_REGISTRY_CONTRACT_ID as string | undefined;

const PRODUCT_TYPES = ['fish', 'meat', 'vegetables', 'fruits', 'rice & grains', 'spices', 'other'];

export function AdminRegister() {
  const { address, isConnected, connect } = useWallet();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [form, setForm] = useState({
    name: '',
    stallNumber: '',
    productType: 'fish',
    walletAddress: '',
    phone: '',
    marketId: 'marikina-public-market',
  });

  const update = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) { connect(); return; }
    if (!address) return;

    if (!form.walletAddress.startsWith('G') || form.walletAddress.length !== 56) {
      showToast('Invalid Stellar wallet address (must start with G, 56 chars)', 'error');
      return;
    }

    if (!REGISTRY_ID) {
      showToast('VendorRegistry contract not deployed yet — set VITE_VENDOR_REGISTRY_CONTRACT_ID', 'error');
      return;
    }

    setLoading(true);
    try {
      const xdr = await prepareContractTx(address, REGISTRY_ID, 'register_vendor', [
        addressToScVal(address),                           // admin
        addressToScVal(form.walletAddress),                // wallet
        stringToScVal(form.marketId),                      // market_id
        stringToScVal(form.name),                          // name
        stringToScVal(form.stallNumber),                   // stall_number
        stringToScVal(form.phone),                         // phone
        stringToScVal(form.productType),                   // product_type
      ]);

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address,
      });

      const hash = await submitSorobanTx(signedTxXdr);
      setTxHash(hash);
      showToast(`${form.name} registered on-chain!`, 'success');
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Registration failed';
      showToast(msg.slice(0, 100), 'error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDone(false);
    setTxHash('');
    setForm({ name: '', stallNumber: '', productType: 'fish', walletAddress: '', phone: '', marketId: 'marikina-public-market' });
  };

  if (!REGISTRY_ID) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-3">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Contract not deployed</p>
            <p className="text-xs text-amber-700">
              Set <code className="bg-amber-100 px-1 rounded">VITE_VENDOR_REGISTRY_CONTRACT_ID</code> in{' '}
              <code className="bg-amber-100 px-1 rounded">.env.local</code> after deploying the VendorRegistry contract.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Vendor Registered!</h2>
          <p className="text-sm text-slate-500 mb-1">{form.name}</p>
          <p className="text-xs font-mono text-slate-400 mb-2">{form.walletAddress}</p>
          {txHash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-600 hover:underline block mb-6"
            >
              View on Stellar Expert →
            </a>
          )}
          <button
            onClick={reset}
            className="w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Register Vendor</h1>
        <p className="text-sm text-slate-500">Registers on the VendorRegistry smart contract.</p>
      </div>

      {!isConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-700 mb-2">Connect admin wallet to register vendors.</p>
          <button onClick={connect} className="text-sm font-medium bg-teal-700 text-white px-4 py-2 rounded-lg">
            Connect Wallet
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vendor Name</label>
          <input
            type="text" required value={form.name} onChange={update('name')}
            placeholder="e.g. Aling Nena"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stall Number</label>
            <input
              type="text" required value={form.stallNumber} onChange={update('stallNumber')}
              placeholder="e.g. B-14"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Product Type</label>
            <select
              value={form.productType} onChange={update('productType')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Vendor Wallet Address</label>
          <input
            type="text" required value={form.walletAddress} onChange={update('walletAddress')}
            placeholder="G... (56 characters)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="tel" value={form.phone} onChange={update('phone')}
            placeholder="+63917..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
          />
        </div>

        <button
          type="submit" disabled={loading || !isConnected}
          className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Submitting on-chain…</>
            : <><UserPlus size={16} /> Register Vendor</>
          }
        </button>
      </form>
    </div>
  );
}
