import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, addDoc, updateDoc, doc, serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { buildPaymentTx, submitTx } from '../stellar';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';

export type UtangStatus = 'active' | 'completed' | 'defaulted';

export interface UtangRecord {
  id: string;
  customerWallet: string;
  vendorWallet: string;
  vendorName?: string;
  customerName?: string;
  totalAmountXlm: number;
  installmentAmountXlm: number;
  installmentsTotal: number;
  installmentsPaid: number;
  nextDueDate: Timestamp | null;
  intervalDays: number;
  status: UtangStatus;
  memo?: string;
  createdAt: Timestamp | null;
}

export interface CreateUtangParams {
  vendorWallet: string;
  customerWallet: string;
  totalAmountXlm: number;
  installmentsTotal: number;
  intervalDays: number;
  memo?: string;
  vendorName?: string;
}

export function useVendorUtangs(vendorWallet: string | null) {
  const [utangs, setUtangs] = useState<UtangRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!vendorWallet || !db) return;
    setIsLoading(true);

    const q = query(
      collection(db, 'utangRecords'),
      where('vendorWallet', '==', vendorWallet),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<UtangRecord, 'id'>),
      }));
      setUtangs(docs);
      setIsLoading(false);
    });

    return () => unsub();
  }, [vendorWallet]);

  return { utangs, isLoading };
}

export function useCustomerUtangs(customerWallet: string | null) {
  const [utangs, setUtangs] = useState<UtangRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customerWallet || !db) return;
    setIsLoading(true);

    const q = query(
      collection(db, 'utangRecords'),
      where('customerWallet', '==', customerWallet),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<UtangRecord, 'id'>),
      }));
      setUtangs(docs);
      setIsLoading(false);
    });

    return () => unsub();
  }, [customerWallet]);

  return { utangs, isLoading };
}

export function useCreateUtang() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUtang = useCallback(async (params: CreateUtangParams): Promise<string | null> => {
    if (!db) {
      setError('Firebase not configured');
      return null;
    }
    setIsCreating(true);
    setError(null);

    try {
      const installmentAmountXlm = params.totalAmountXlm / params.installmentsTotal;
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + params.intervalDays);

      const docRef = await addDoc(collection(db, 'utangRecords'), {
        customerWallet: params.customerWallet,
        vendorWallet: params.vendorWallet,
        vendorName: params.vendorName ?? '',
        totalAmountXlm: params.totalAmountXlm,
        installmentAmountXlm,
        installmentsTotal: params.installmentsTotal,
        installmentsPaid: 0,
        nextDueDate: Timestamp.fromDate(nextDueDate),
        intervalDays: params.intervalDays,
        status: 'active' as UtangStatus,
        memo: params.memo ?? '',
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? 'Failed to create utang');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { createUtang, isCreating, error };
}

export type InstallmentStatus = 'idle' | 'building' | 'signing' | 'submitting' | 'confirmed' | 'failed';

export function usePayInstallment() {
  const [status, setStatus] = useState<InstallmentStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payInstallment = useCallback(async (
    utang: UtangRecord,
    fromAddress: string
  ) => {
    if (!db) { setError('Firebase not configured'); return; }

    setStatus('building');
    setTxHash(null);
    setError(null);

    try {
      const remainingInstallments = utang.installmentsTotal - utang.installmentsPaid;
      const totalPaidSoFar = utang.installmentAmountXlm * utang.installmentsPaid;
      const remaining = utang.totalAmountXlm - totalPaidSoFar;
      const payAmount = remainingInstallments === 1
        ? remaining
        : utang.installmentAmountXlm;

      const memo = `Utang ${utang.installmentsPaid + 1}/${utang.installmentsTotal}`;
      const xdr = await buildPaymentTx(
        fromAddress,
        utang.vendorWallet,
        payAmount.toFixed(7),
        memo
      );

      setStatus('signing');
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET,
        address: fromAddress,
      });

      setStatus('submitting');
      const result = await submitTx(signedTxXdr);

      // Update Firestore record
      const newPaid = utang.installmentsPaid + 1;
      const isCompleted = newPaid >= utang.installmentsTotal;
      const nextDueDate = isCompleted
        ? null
        : Timestamp.fromDate(
            new Date(Date.now() + utang.intervalDays * 86400 * 1000)
          );

      await updateDoc(doc(db, 'utangRecords', utang.id), {
        installmentsPaid: newPaid,
        status: isCompleted ? 'completed' : 'active',
        nextDueDate,
      });

      setTxHash(result.hash);
      setStatus('confirmed');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? String(err);
      setError(
        msg.includes('rejected') || msg.includes('cancel')
          ? 'Transaction cancelled — no funds sent'
          : msg.slice(0, 120)
      );
      setStatus('failed');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setError(null);
  }, []);

  return { status, txHash, error, payInstallment, reset };
}

export function dueLabel(ts: Timestamp | null): string {
  if (!ts) return '';
  const date = ts.toDate();
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'due today';
  if (diffDays === 1) return 'due tomorrow';
  return `due in ${diffDays}d`;
}

export function isDue(ts: Timestamp | null): boolean {
  if (!ts) return false;
  return ts.toDate() <= new Date();
}

export function isOverdue(ts: Timestamp | null): boolean {
  if (!ts) return false;
  const diff = new Date().getTime() - ts.toDate().getTime();
  return diff > 0;
}
