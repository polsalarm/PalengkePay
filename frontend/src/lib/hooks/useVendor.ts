import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface VendorProfile {
  name: string;
  stallNumber: string;
  productType: string;
  marketId: string;
  phone?: string;
  isActive: boolean;
}

export function useVendor(walletAddress: string | null) {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!walletAddress || !db) {
      setVendor(null);
      return;
    }
    setIsLoading(true);
    setNotFound(false);

    getDoc(doc(db, 'vendors', walletAddress))
      .then((snap) => {
        if (snap.exists()) {
          setVendor(snap.data() as VendorProfile);
        } else {
          setNotFound(true);
          setVendor(null);
        }
      })
      .catch(() => setVendor(null))
      .finally(() => setIsLoading(false));
  }, [walletAddress]);

  return { vendor, isLoading, notFound };
}
