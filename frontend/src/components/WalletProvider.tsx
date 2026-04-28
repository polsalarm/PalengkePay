import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { fetchBalance } from '../lib/stellar';

export interface WalletContextValue {
  address: string | null;
  balance: string | null;
  walletName: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  error: string | null;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

// WalletConnect loaded via dynamic import — avoids @reown/appkit circular dep
// crash during bundle evaluation in production builds
let kitInitPromise: Promise<void> | null = null;

function initKit(): Promise<void> {
  if (!kitInitPromise) {
    kitInitPromise = import('@creit.tech/stellar-wallets-kit/modules/wallet-connect').then(
      ({ WalletConnectModule, WalletConnectTargetChain }) => {
        StellarWalletsKit.init({
          network: Networks.TESTNET,
          modules: [
            new WalletConnectModule({
              projectId: 'c7916523a37cc092c33241c5bf3efcbd',
              metadata: {
                name: 'PalengkePay',
                description: 'Stellar micropayments for Philippine wet market vendors',
                url: 'https://palengke-pay.vercel.app',
                icons: ['https://palengke-pay.vercel.app/icon-192.svg'],
              },
              allowedChains: [WalletConnectTargetChain.TESTNET],
            }),
            new FreighterModule(),
            new LobstrModule(),
            new xBullModule(),
            new AlbedoModule(),
          ],
        });
      }
    );
  }
  return kitInitPromise;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async (addr: string) => {
    try {
      const bal = await fetchBalance(addr);
      setBalance(bal);
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('palengkepay_address');
    const storedWallet = localStorage.getItem('palengkepay_wallet_name');
    if (stored) {
      setAddress(stored);
      if (storedWallet) setWalletName(storedWallet);
      refreshBalance(stored);
    }
    initKit(); // pre-warm in background
  }, [refreshBalance]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await initKit();
      const result = await StellarWalletsKit.authModal() as { address: string; name?: string };
      const addr = result.address;
      const name = result.name ?? null;
      // Always trigger wallet popup for explicit sign-in confirmation
      await StellarWalletsKit.signMessage('Sign in to PalengkePay', { address: addr });
      setAddress(addr);
      setWalletName(name);
      localStorage.setItem('palengkepay_address', addr);
      if (name) localStorage.setItem('palengkepay_wallet_name', name);
      await refreshBalance(addr);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Connection failed';
      if (!msg.includes('close') && !msg.includes('Cancel') && !msg.includes('cancel')) {
        setError(msg);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch {
      // ignore
    }
    setAddress(null);
    setBalance(null);
    setWalletName(null);
    localStorage.removeItem('palengkepay_address');
    localStorage.removeItem('palengkepay_wallet_name');
  }, []);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    await initKit();
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: Networks.TESTNET,
      address,
    });
    return signedTxXdr;
  }, [address]);

  return (
    <WalletContext.Provider value={{
      address,
      balance,
      walletName,
      isConnected: !!address,
      isConnecting,
      connect,
      disconnect,
      signTransaction,
      error,
    }}>
      {children}
    </WalletContext.Provider>
  );
}
