import { useState, useCallback } from 'react';
import { buildPaymentTx, submitTx } from '../stellar';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export type TxStatus = 'idle' | 'building' | 'signing' | 'submitting' | 'confirmed' | 'failed';

export interface PaymentState {
  status: TxStatus;
  txHash: string | null;
  error: string | null;
}

export function usePayment() {
  const [state, setState] = useState<PaymentState>({
    status: 'idle',
    txHash: null,
    error: null,
  });

  const sendPayment = useCallback(async (
    from: string,
    to: string,
    amount: string,
    memo?: string
  ) => {
    try {
      setState({ status: 'building', txHash: null, error: null });
      const xdr = await buildPaymentTx(from, to, amount, memo);

      setState((s) => ({ ...s, status: 'signing' }));
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: from,
      });

      setState((s) => ({ ...s, status: 'submitting' }));
      const result = await submitTx(signedTxXdr);

      // Save tx metadata to Firestore
      if (db) {
        await setDoc(doc(db, 'transactions', result.hash), {
          customerWallet: from,
          vendorWallet: to,
          amountXlm: parseFloat(amount),
          memo: memo ?? '',
          status: 'completed',
          createdAt: serverTimestamp(),
        }).catch(() => {}); // non-blocking
      }

      setState({ status: 'confirmed', txHash: result.hash, error: null });
    } catch (err: unknown) {
      const message = parseWalletError(err);
      setState({ status: 'failed', txHash: null, error: message });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', txHash: null, error: null });
  }, []);

  return { ...state, sendPayment, reset };
}

function parseWalletError(err: unknown): string {
  if (!err) return 'Unknown error';
  const msg = (err as { message?: string }).message ?? String(err);
  if (msg.includes('rejected') || msg.includes('cancel') || msg.includes('denied')) {
    return 'Transaction cancelled — no funds sent';
  }
  if (msg.includes('network') || msg.includes('Network')) {
    return 'Please switch to Stellar Testnet';
  }
  if (msg.includes('balance') || msg.includes('insufficient')) {
    return 'Insufficient XLM balance';
  }
  if (msg.includes('timeout') || msg.includes('Timeout')) {
    return 'Transaction timed out — tap to retry';
  }
  return msg.slice(0, 120);
}
