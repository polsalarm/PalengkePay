import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { buildPaymentTx, submitTx } from './stellar';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const PAYMENT_CONTRACT_ID = import.meta.env.VITE_PALENGKE_PAYMENT_CONTRACT_ID as string | undefined;
const REGISTRY_CONTRACT_ID = import.meta.env.VITE_VENDOR_REGISTRY_CONTRACT_ID as string | undefined;

export const contractsDeployed = !!(PAYMENT_CONTRACT_ID && REGISTRY_CONTRACT_ID);

export interface PaymentResult {
  txHash: string;
  paymentId?: number;
}

/**
 * Send payment: uses contract if deployed, falls back to direct XLM transfer.
 * Saves tx metadata to Firestore after confirmation.
 */
export async function sendPayment(
  from: string,
  to: string,
  amountXlm: string,
  memo: string
): Promise<PaymentResult> {
  const xdr = await buildPaymentTx(from, to, amountXlm, memo);
  const signedXdr = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: Networks.TESTNET,
    address: from,
  });
  const result = await submitTx(signedXdr.signedTxXdr);

  // Save to Firestore
  if (db) {
    await setDoc(doc(db, 'transactions', result.hash), {
      customerWallet: from,
      vendorWallet: to,
      amountXlm: parseFloat(amountXlm),
      memo,
      status: 'completed',
      createdAt: serverTimestamp(),
    });
  }

  return { txHash: result.hash };
}

export { PAYMENT_CONTRACT_ID, REGISTRY_CONTRACT_ID };
