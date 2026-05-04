'use client';

import { Lock, Crown, Clock } from 'lucide-react';
import { usePlan } from '@/hooks/use-plan';
import { FeatureFlag, PLANS } from '@/lib/plans';
import { useUpgradeModal } from './UpgradeModal';

export function ProFeatureCard({
  feature,
  title,
  description,
  children,
  comingSoon = true,
}: {
  feature: FeatureFlag;
  title: string;
  description: string;
  children?: React.ReactNode;
  comingSoon?: boolean;
}) {
  const { has, plan } = usePlan();
  const { open } = useUpgradeModal();
  const unlocked = has(feature);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl">{title}</h1>
          <p className="text-sm font-bold text-black/60 mt-1">{description}</p>
        </div>
        {comingSoon && (
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide bg-black text-white px-3 py-2 rounded">
            <Clock className="w-3 h-3" /> Em breve
          </span>
        )}
      </div>

      {!unlocked && (
        <div className="brutal-card p-5 mb-5 bg-bioyellow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 mt-1 shrink-0" />
            <div>
              <p className="font-bold">Disponível nos planos Pro</p>
              <p className="text-xs text-black/70">Seu plano atual: {plan.name}. Faça upgrade para ativar este recurso.</p>
            </div>
          </div>
          <button onClick={open} className="brutal-btn bg-black text-white px-4 py-2 text-xs gap-2 shrink-0">
            <Crown className="w-4 h-4" /> Ver planos
          </button>
        </div>
      )}

      <div className={`brutal-card p-6 ${!unlocked ? 'opacity-60 pointer-events-none select-none' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export function comingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-neutral-200 text-black px-2 py-1 rounded">
      Em breve
    </span>
  );
}

export function getProPlansName() {
  return `${PLANS.pro_monthly.name} / ${PLANS.pro_annual.name}`;
}
