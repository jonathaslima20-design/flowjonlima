'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Lock, QrCode } from 'lucide-react';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from './UpgradeModal';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com').replace(/\/$/, '');

// O utm_source faz as visitas vindas do QR code aparecerem como origem "qrcode" no analytics
export function QrCodeCard({ username }: { username: string }) {
  const { has } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const unlocked = has('qr_code');
  const [dataUrl, setDataUrl] = useState('');
  const url = `${SITE_URL}/${username}?utm_source=qrcode`;

  useEffect(() => {
    QRCode.toDataURL(url, { width: 600, margin: 2, errorCorrectionLevel: 'M' }).then(setDataUrl).catch(() => setDataUrl(''));
  }, [url]);

  function download() {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode-${username}.png`;
    a.click();
  }

  return (
    <div className="brutal-card p-5 flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0">
        {dataUrl ? (
          <img src={dataUrl} alt="QR code da sua página" className={`w-36 h-36 border-2 border-black bg-white ${unlocked ? '' : 'blur-sm'}`} />
        ) : (
          <div className="w-36 h-36 border-2 border-black bg-black/5" />
        )}
        {!unlocked && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </span>
        )}
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h2 className="font-display text-xl flex items-center gap-2 justify-center sm:justify-start">
          <QrCode className="w-5 h-5" /> QR code da sua página
        </h2>
        <p className="text-sm text-black/70 mt-1">
          Imprima em embalagens, cartões de visita, cardápios ou na vitrine. As visitas aparecem como “qrcode” no Analytics.
        </p>
        {unlocked ? (
          <button onClick={download} disabled={!dataUrl} className="brutal-btn bg-bioyellow px-4 py-2 text-xs gap-2 mt-3 disabled:opacity-50">
            <Download className="w-4 h-4" /> Baixar PNG
          </button>
        ) : (
          <button onClick={openUpgrade} className="brutal-btn bg-black text-white px-4 py-2 text-xs mt-3">Disponível no Pro</button>
        )}
      </div>
    </div>
  );
}
