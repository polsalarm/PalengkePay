import { useState, useEffect, useCallback } from 'react';
import { getServer } from '../stellar';

export interface TxRecord {
  id: string;       // tx hash
  from: string;
  to: string;
  amountXlm: number;
  createdAt: string; // ISO 8601
}

async function fetchPaymentsForAccount(address: string): Promise<TxRecord[]> {
  const server = getServer();
  const page = await server
    .payments()
    .forAccount(address)
    .order('desc')
    .limit(50)
    .call();

  return page.records
    .filter((r) => r.type === 'payment' && (r as { asset_type: string }).asset_type === 'native')
    .map((r) => {
      const p = r as {
        transaction_hash: string;
        from: string;
        to: string;
        amount: string;
        created_at: string;
      };
      return {
        id: p.transaction_hash,
        from: p.from,
        to: p.to,
        amountXlm: parseFloat(p.amount),
        createdAt: p.created_at,
      };
    });
}

export function useVendorTransactions(vendorWallet: string | null) {
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async (wallet: string) => {
    setIsLoading(true);
    try {
      const all = await fetchPaymentsForAccount(wallet);
      setTransactions(all.filter((t) => t.to === wallet));
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!vendorWallet) return;
    load(vendorWallet);
    const interval = setInterval(() => load(vendorWallet), 30_000);
    return () => clearInterval(interval);
  }, [vendorWallet, load]);

  const todayEarnings = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactions
      .filter((t) => new Date(t.createdAt) >= today)
      .reduce((sum, t) => sum + t.amountXlm, 0);
  }, [transactions]);

  const todayCount = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactions.filter((t) => new Date(t.createdAt) >= today).length;
  }, [transactions]);

  return { transactions, isLoading, todayEarnings, todayCount };
}

export function useCustomerTransactions(customerWallet: string | null) {
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async (wallet: string) => {
    setIsLoading(true);
    try {
      const all = await fetchPaymentsForAccount(wallet);
      setTransactions(all.filter((t) => t.from === wallet));
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!customerWallet) return;
    load(customerWallet);
    const interval = setInterval(() => load(customerWallet), 30_000);
    return () => clearInterval(interval);
  }, [customerWallet, load]);

  return { transactions, isLoading };
}

export function relativeTime(isoDate: string): string {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
