import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, Timestamp,
} from 'firebase/firestore';

export interface TxRecord {
  id: string;
  customerWallet: string;
  vendorWallet: string;
  amountXlm: number;
  memo: string;
  status: string;
  createdAt: Timestamp | null;
}

export function useVendorTransactions(vendorWallet: string | null) {
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!vendorWallet || !db) return;
    setIsLoading(true);

    const q = query(
      collection(db, 'transactions'),
      where('vendorWallet', '==', vendorWallet),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TxRecord, 'id'>),
      }));
      setTransactions(docs);
      setIsLoading(false);
    });

    return () => unsub();
  }, [vendorWallet]);

  const todayEarnings = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactions
      .filter((t) => {
        if (!t.createdAt) return false;
        return t.createdAt.toDate() >= today;
      })
      .reduce((sum, t) => sum + t.amountXlm, 0);
  }, [transactions]);

  const todayCount = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactions.filter((t) => {
      if (!t.createdAt) return false;
      return t.createdAt.toDate() >= today;
    }).length;
  }, [transactions]);

  return { transactions, isLoading, todayEarnings, todayCount };
}

export function useCustomerTransactions(customerWallet: string | null) {
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customerWallet || !db) return;
    setIsLoading(true);

    const q = query(
      collection(db, 'transactions'),
      where('customerWallet', '==', customerWallet),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TxRecord, 'id'>),
      }));
      setTransactions(docs);
      setIsLoading(false);
    });

    return () => unsub();
  }, [customerWallet]);

  return { transactions, isLoading };
}

export function relativeTime(ts: Timestamp | null): string {
  if (!ts) return '';
  const diff = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
