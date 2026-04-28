import { useState, useRef, useEffect } from 'react';
import { Link, Wallet, Copy, LogOut, Loader2 } from 'lucide-react';
import { useWallet } from '../lib/hooks/useWallet';
import { truncateAddress } from '../lib/stellar';

const WALLET_BADGES: Record<string, { label: string; cls: string }> = {
  freighter:      { label: 'Freighter',      cls: 'bg-indigo-100 text-indigo-700' },
  lobstr:         { label: 'LOBSTR',         cls: 'bg-blue-100 text-blue-700' },
  xbull:          { label: 'xBull',          cls: 'bg-purple-100 text-purple-700' },
  albedo:         { label: 'Albedo',         cls: 'bg-orange-100 text-orange-700' },
  walletconnect:  { label: 'WalletConnect',  cls: 'bg-slate-100 text-slate-600' },
};

function walletBadge(name: string | null) {
  if (!name) return null;
  const key = name.toLowerCase().replace(/\s+/g, '');
  return WALLET_BADGES[key] ?? { label: name, cls: 'bg-slate-100 text-slate-600' };
}

export function WalletButton() {
  const { address, balance, walletName, isConnected, isConnecting, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const badge = walletBadge(walletName);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="flex items-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-60"
      >
        {isConnecting ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Link size={15} />
        )}
        {isConnecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-slate-200 hover:border-teal-300 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-full transition-all shadow-sm active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        {badge && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
            {badge.label}
          </span>
        )}
        <span className="font-mono text-xs">{truncateAddress(address!)}</span>
        {balance !== null && (
          <span className="text-teal-700 font-semibold hidden sm:inline">{balance} XLM</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-teal-700" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Wallet</span>
            </div>
            {badge && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>
          <div className="bg-slate-50 rounded-lg p-3 mb-3 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-slate-700 break-all">{address}</span>
            <button
              onClick={copyAddress}
              className="shrink-0 text-slate-400 hover:text-teal-600 transition-colors active:scale-95"
              title="Copy address"
            >
              <Copy size={14} />
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mb-2">Copied!</p>
          )}
          {balance !== null && (
            <p className="text-sm font-semibold text-slate-800 mb-3">
              Balance: <span className="text-teal-700">{balance} XLM</span>
            </p>
          )}
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            className="flex items-center gap-2 w-full text-sm text-red-600 hover:bg-red-50 active:scale-95 px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
