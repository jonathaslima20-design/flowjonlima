'use client';

import { Crown } from 'lucide-react';
import { isUnlimited } from '@/lib/plans';
import { useUpgradeModal } from './UpgradeModal';

export function LimitBadge({ current, limit }: { current: number; limit: number }) {
  if (isUnlimited(limit)) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-black text-white px-2 py-1 rounded">
        <Crown className="w-3 h-3" /> Ilimitado
      </span>
    );
  }
  const atLimit = current >= limit;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded ${atLimit ? 'bg-red-100 text-red-700' : 'bg-neutral-200 text-black'}`}>
      {current} / {limit}
    </span>
  );
}

export function UpgradeBanner({ resource }: { resource: string }) {
  const { open } = useUpgradeModal();
  return (
    <div className="brutal-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-bioyellow">
      <div>
        <p className="font-bold text-sm">Você atingiu o limite do plano Free para {resource}.</p>
        <p className="text-xs text-black/70">Faça upgrade para o Pro e tenha {resource} ilimitados.</p>
      </div>
      <button onClick={open} className="brutal-btn bg-black text-white px-3 py-2 text-xs gap-2 shrink-0">
        <Crown className="w-4 h-4" /> Fazer upgrade
      </button>
    </div>
  );
}
