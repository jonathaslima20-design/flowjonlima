'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Check, Star, X, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  PLANS, PERIOD_LABELS, annualDiscount, brl, monthlyPrice,
  type BillingPeriod, type PaidPlanSlug,
} from '@/lib/plans';
import { startCheckout } from '@/lib/checkout';
import { WhatsAppSupport } from '@/components/shared/WhatsAppSupport';

const PAID_PLANS: PaidPlanSlug[] = ['pro', 'business'];

type PlanButton = { label: string; fallbackUrl: string | null };

type ModalCtx = { open: () => void; close: () => void; isOpen: boolean };

const UpgradeModalContext = createContext<ModalCtx | null>(null);

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  // Vindo da página de preços (/register?plan=...) o cadastro redireciona com ?upgrade=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') !== '1') return;
    setOpen(true);
    params.delete('upgrade');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <UpgradeModalContext.Provider value={{ open, close, isOpen }}>
      {children}
      {isOpen && <UpgradeModal onClose={close} />}
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) throw new Error('useUpgradeModal must be used within UpgradeModalProvider');
  return ctx;
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState<BillingPeriod>('annual');
  const [buttons, setButtons] = useState<Partial<Record<PaidPlanSlug, PlanButton>>>({});
  const [pending, setPending] = useState<PaidPlanSlug | null>(null);
  const [error, setError] = useState('');

  const plans = PAID_PLANS.filter(slug => PLANS[slug].available);

  useEffect(() => {
    supabase
      .from('plans')
      .select('slug, button_label, button_url')
      .in('slug', PAID_PLANS)
      .then(({ data }) => {
        if (!data) return;
        const next: Partial<Record<PaidPlanSlug, PlanButton>> = {};
        for (const p of data) {
          next[p.slug as PaidPlanSlug] = {
            label: p.button_label || `Assinar ${PLANS[p.slug as PaidPlanSlug].name}`,
            fallbackUrl: p.button_url?.startsWith('https://') ? p.button_url : null,
          };
        }
        setButtons(next);
      });
  }, []);

  async function subscribe(plan: PaidPlanSlug) {
    setError('');
    setPending(plan);
    const result = await startCheckout(plan, period);
    // Em caso de sucesso a página é redirecionada para o Mercado Pago
    if (result.ok) return;
    setPending(null);
    // Enquanto a integração não está configurada, usa o link de pagamento cadastrado no admin
    const fallback = buttons[plan]?.fallbackUrl;
    if (result.notConfigured && fallback) {
      window.open(fallback, '_blank', 'noopener,noreferrer');
      return;
    }
    setError(result.message);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white brutal-border brutal-shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 bg-bioyellow brutal-border flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display text-xl leading-tight">Faça upgrade para o Pro</h2>
              <p className="text-xs text-black/60">Desbloqueie todos os recursos e remova limites.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="w-9 h-9 brutal-border bg-white flex items-center justify-center hover:bg-bioyellow transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-6 flex justify-center">
          <div className="inline-flex brutal-border">
            {(['quarterly', 'annual'] as BillingPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-bold inline-flex items-center gap-2 ${period === p ? 'bg-black text-white' : 'bg-white text-black'}`}
              >
                {PERIOD_LABELS[p].name}
                {p === 'annual' && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-biolime text-black font-bold">-{annualDiscount('pro')}%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={`p-6 grid gap-5 ${plans.length > 1 ? 'md:grid-cols-2' : 'max-w-md mx-auto'}`}>
          {plans.map(slug => (
            <PlanCardUpgrade
              key={slug}
              plan={slug}
              period={period}
              bg={slug === 'pro' ? 'bg-bioyellow' : 'bg-biolime'}
              ctaBg={slug === 'pro' ? 'bg-blue-600' : 'bg-black'}
              ctaLabel={buttons[slug]?.label ?? `Assinar ${PLANS[slug].name}`}
              onSubscribe={() => subscribe(slug)}
              loading={pending === slug}
              disabled={pending !== null}
              badge={slug === 'pro' ? { label: 'MAIS POPULAR', bg: 'bg-black', text: 'text-white', icon: true } : undefined}
            />
          ))}
        </div>

        {error && (
          <div className="px-6 pb-3 -mt-2">
            <p className="text-center text-sm font-bold text-biored">{error}</p>
          </div>
        )}

        <div className="px-6 pb-2 -mt-2">
          <p className="text-center text-[11px] text-black/50">
            Pagamento seguro pelo Mercado Pago: PIX, cartão ou boleto. Pagamento único pelo período, sem renovação automática.
          </p>
        </div>

        <div className="px-6 pb-6">
          <WhatsAppSupport />
        </div>
      </div>
    </div>
  );
}

function PlanCardUpgrade({
  plan, period, bg, ctaBg, ctaLabel, onSubscribe, loading, disabled, badge,
}: {
  plan: PaidPlanSlug; period: BillingPeriod;
  bg: string; ctaBg: string; ctaLabel: string;
  onSubscribe: () => void; loading: boolean; disabled: boolean;
  badge?: { label: string; bg: string; text: string; icon?: boolean };
}) {
  const def = PLANS[plan];
  return (
    <div className={`${bg} brutal-border p-6 relative flex flex-col`}>
      {badge && (
        <span className={`absolute -top-3 left-4 ${badge.bg} ${badge.text} px-3 py-1 text-[10px] font-bold brutal-border inline-flex items-center gap-1.5`}>
          {badge.icon && <Star className="w-3 h-3" fill="currentColor" />}
          {badge.label}
        </span>
      )}
      <h3 className="font-display text-2xl mt-2">{def.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-4xl">{brl(monthlyPrice(plan, period))}</span>
        <span className="text-sm font-medium">/mês</span>
      </div>
      <p className="text-xs font-bold text-black/60 mt-1">
        {brl(def.prices[period])} no pacote {PERIOD_LABELS[period].adjective}
      </p>
      <ul className="mt-5 space-y-2 flex-1">
        {def.features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm font-bold">
            <span className="w-5 h-5 shrink-0 bg-black text-white flex items-center justify-center mt-0.5">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSubscribe}
        disabled={disabled}
        className={`mt-6 brutal-btn w-full py-3 text-center font-bold gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${ctaBg} text-white`}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Abrindo pagamento...' : ctaLabel}
      </button>
    </div>
  );
}
