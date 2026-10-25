'use client';

import { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';
import { usePlan } from '@/hooks/use-plan';
import { PLANS, isPlanSlug } from '@/lib/plans';
import { useUpgradeModal } from './UpgradeModal';

const DAY = 24 * 60 * 60 * 1000;
const DISMISS_KEY = 'bioflowzy:renewal-notice-dismissed';

// Sem renovação automática: avisa 7 dias antes de vencer e até 30 dias depois
export function RenewalNotice() {
  const { profile, loading } = usePlan();
  const { open } = useUpgradeModal();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === profile?.plan_expires_at);
    } catch {
      setDismissed(false);
    }
  }, [profile?.plan_expires_at]);

  if (loading || dismissed || !profile?.plan_expires_at || !isPlanSlug(profile.plan) || profile.plan === 'free') return null;

  const expires = new Date(profile.plan_expires_at);
  const daysLeft = Math.ceil((expires.getTime() - Date.now()) / DAY);
  if (daysLeft > 7 || daysLeft < -30) return null;

  const planName = PLANS[profile.plan].name;
  const expired = daysLeft <= 0;

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, profile!.plan_expires_at!); } catch {}
  }

  return (
    <div className={`${expired ? 'bg-red-100' : 'bg-bioyellow'} brutal-border p-4 mb-6 flex items-start gap-3`}>
      <Clock className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-bold">
          {expired
            ? `Seu plano ${planName} venceu em ${expires.toLocaleDateString('pt-BR')}`
            : daysLeft === 1
              ? `Seu plano ${planName} vence amanhã`
              : `Seu plano ${planName} vence em ${daysLeft} dias`}
        </p>
        <p className="text-sm">
          {expired
            ? 'Sua página voltou aos limites do plano Free. Renove para recuperar todos os recursos.'
            : 'A renovação não é automática. Renove para não perder os recursos Pro.'}
        </p>
        <button onClick={open} className="brutal-btn bg-black text-white px-4 py-2 text-xs mt-3">
          Renovar agora
        </button>
      </div>
      <button onClick={dismiss} aria-label="Fechar" className="shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
