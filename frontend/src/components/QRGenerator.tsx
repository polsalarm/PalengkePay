import { QRCodeSVG } from 'qrcode.react';

interface Props {
  value: string;
  size?: number;
  vendorName?: string;
  stallInfo?: string;
}

export function QRGenerator({ value, size = 240, vendorName, stallInfo }: Props) {
  // Embed vendor info in QR so scanner can show name without chain lookup
  const qrValue = vendorName
    ? JSON.stringify({ a: value, n: vendorName, s: stallInfo ?? '' })
    : value;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
        <QRCodeSVG
          value={qrValue}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#0f172a"
        />
      </div>
      {vendorName && (
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">{vendorName}</p>
          {stallInfo && <p className="text-sm text-slate-500">{stallInfo}</p>}
          <p className="text-xs text-slate-400 mt-1">Scan to pay me</p>
        </div>
      )}
    </div>
  );
}
