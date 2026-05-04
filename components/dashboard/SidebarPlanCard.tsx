'use client';

import { Crown, Sparkles } from 'lucide-react';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from './UpgradeModal';

export function SidebarPlanCard() {
  const { plan, profile, loading } = usePlan();
  const { open } = useUpgradeModal();

  if (loading) return null;

  const isFree = plan.slug === 'free';
  const isAnnual = plan.slug === 'pro_annual';
  const expires = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;

  const accentBg = isAnnual ? 'bg-black text-white' : isFree ? 'bg-neutral-100' : 'bg-bioyellow';
  const pillBg = isAnnual ? 'bg-bioyellow text-black' : isFree ? 'bg-black text-white' : 'bg-black text-white';

  return (
    <div className={`brutal-border p-3 mt-3 ${accentBg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Seu plano</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 ${pillBg}`}>
          {plan.name.toUpperCase()}
        </span>
      </div>
      {expires && !isFree && (
        <p className="text-[11px] font-bold opacity-80 mb-2">
          Expira em {expires.toLocaleDateString('pt-BR')}
        </p>
      )}
      {isFree && (
        <p className="text-[11px] font-bold text-black/70 mb-2">
          Desbloqueie todos os recursos.
        </p>
      )}
      {!isAnnual && (
        <button
          onClick={open}
          className={`brutal-btn w-full py-2 text-xs gap-2 ${isFree ? 'bg-bioyellow' : 'bg-white text-black'}`}
        >
          {isFree ? <Crown className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isFree ? 'Fazer upgrade' : 'Upgrade para anual'}
        </button>
      )}
    </div>
  );
}
