import { useState, useEffect } from 'react';
import { simulateViewCall, addressToScVal } from '../stellar';

export interface VendorProfile {
  id: number;
  name: string;
  stallNumber: string;
  productType: string;
  marketId: string;
  phone: string;
  totalTransactions: number;
  totalVolume: bigint;
  isActive: boolean;
}

const CONTRACT_ID = import.meta.env.VITE_VENDOR_REGISTRY_CONTRACT_ID as string | undefined;

export function useVendor(walletAddress: string | null) {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setVendor(null);
      return;
    }
    if (!CONTRACT_ID) {
      setNotFound(true);
      return;
    }

    setIsLoading(true);
    setNotFound(false);

    simulateViewCall(CONTRACT_ID, 'get_vendor', [addressToScVal(walletAddress)])
      .then((raw) => {
        if (!raw) {
          setNotFound(true);
          setVendor(null);
          return;
        }
        const r = raw as Record<string, unknown>;
        setVendor({
          id: Number(r.id),
          name: String(r.name ?? ''),
          stallNumber: String(r.stall_number ?? ''),
          productType: String(r.product_type ?? ''),
          marketId: String(r.market_id ?? ''),
          phone: String(r.phone ?? ''),
          totalTransactions: Number(r.total_transactions ?? 0),
          totalVolume: BigInt(String(r.total_volume ?? 0)),
          isActive: Boolean(r.is_active),
        });
      })
      .catch(() => {
        setNotFound(true);
        setVendor(null);
      })
      .finally(() => setIsLoading(false));
  }, [walletAddress]);

  return { vendor, isLoading, notFound };
}

/** Check if a wallet address is a registered vendor. Returns true/false. */
export async function isRegisteredVendor(walletAddress: string): Promise<boolean> {
  if (!CONTRACT_ID) return false;
  try {
    const result = await simulateViewCall(CONTRACT_ID, 'get_vendor', [addressToScVal(walletAddress)]);
    return result !== null;
  } catch {
    return false;
  }
}
