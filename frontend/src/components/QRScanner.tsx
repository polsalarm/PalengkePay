import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, Keyboard } from 'lucide-react';

export interface QRScanMeta {
  name?: string;
  stallInfo?: string;
}

interface Props {
  onScan: (address: string, meta?: QRScanMeta) => void;
  onManualEntry?: () => void;
  /** Return true to mark as handled — skips payment address parsing */
  onRawScan?: (text: string) => boolean;
}

export function QRScanner({ onScan, onManualEntry, onRawScan }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-scanner-container';
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        const raw = decodedText.trim();

        // Let parent intercept before payment parsing (e.g. utang offer QRs)
        if (onRawScan?.(raw)) return;

        let address = raw;
        let meta: QRScanMeta | undefined;

        // Try JSON payload (PalengkePay vendor QR)
        try {
          const parsed = JSON.parse(raw) as { a?: string; n?: string; s?: string };
          if (typeof parsed.a === 'string' && parsed.a.startsWith('G') && parsed.a.length === 56) {
            address = parsed.a;
            if (parsed.n) meta = { name: parsed.n, stallInfo: parsed.s ?? undefined };
          }
        } catch {
          // Not JSON — treat as plain Stellar address
        }

        if (address.startsWith('G') && address.length === 56) {
          onScan(address, meta);
        } else {
          setError('QR code is not a Stellar address. Try again.');
          setTimeout(() => setError(null), 3000);
        }
      },
      () => {}
    )
      .then(() => setStarted(true))
      .catch((err) => {
        setError(`Camera error: ${(err as Error).message ?? 'permission denied'}`);
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden bg-black">
        <div id={containerId} className="w-full" style={{ minHeight: 300 }} />
        {!started && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3 text-white">
              <ScanLine size={40} className="animate-pulse text-teal-400" />
              <p className="text-sm">Starting camera…</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm text-slate-400 text-center">
        Point your camera at the QR code
      </p>

      {onManualEntry && (
        <button
          onClick={onManualEntry}
          className="flex items-center justify-center gap-2 w-full text-sm text-teal-700 hover:text-teal-600 border border-teal-200 hover:bg-teal-50 py-2.5 rounded-lg transition-colors"
        >
          <Keyboard size={15} />
          Enter address manually
        </button>
      )}
    </div>
  );
}
