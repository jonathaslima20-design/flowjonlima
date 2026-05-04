'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import Link from 'next/link';
import { Check, Star, X, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PLANS } from '@/lib/plans';
import { WhatsAppSupport } from '@/components/shared/WhatsAppSupport';

const ANNUAL_DISCOUNT = Math.round((1 - (PLANS.pro_annual.priceCents / 100) / ((PLANS.pro_monthly.priceCents / 100) * 12)) * 100);

type PlanButtons = { button_label: string | null; button_url: string | null };
type DbButtons = { pro_monthly: PlanButtons; pro_annual: PlanButtons };

const DEFAULT_BUTTONS: DbButtons = {
  pro_monthly: { button_label: 'Assinar Pro Mensal', button_url: null },
  pro_annual:  { button_label: 'Assinar Pro Anual',  button_url: null },
};

type ModalCtx = { open: () => void; close: () => void; isOpen: boolean };

const UpgradeModalContext = createContext<ModalCtx | null>(null);

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

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
  const [buttons, setButtons] = useState<DbButtons>(DEFAULT_BUTTONS);

  useEffect(() => {
    supabase
      .from('plans')
      .select('slug, button_label, button_url')
      .in('slug', ['pro_monthly', 'pro_annual'])
      .then(({ data }) => {
        if (!data) return;
        const next = { ...DEFAULT_BUTTONS };
        for (const p of data) {
          if (p.slug === 'pro_monthly') next.pro_monthly = { button_label: p.button_label, button_url: p.button_url };
          if (p.slug === 'pro_annual')  next.pro_annual  = { button_label: p.button_label, button_url: p.button_url };
        }
        setButtons(next);
      });
  }, []);

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

        <div className="p-6 grid md:grid-cols-2 gap-5">
          <PlanCardUpgrade
            name={PLANS.pro_monthly.name}
            price={PLANS.pro_monthly.priceLabel}
            period={PLANS.pro_monthly.periodLabel}
            features={PLANS.pro_monthly.features}
            bg="bg-bioyellow"
            ctaBg="bg-blue-600"
            ctaText="text-white"
            ctaLabel={buttons.pro_monthly.button_label ?? 'Assinar Pro Mensal'}
            href={buttons.pro_monthly.button_url}
            badge={{ label: 'MAIS POPULAR', bg: 'bg-black', text: 'text-white', icon: true }}
          />
          <PlanCardUpgrade
            name={PLANS.pro_annual.name}
            price={PLANS.pro_annual.priceLabel}
            period={PLANS.pro_annual.periodLabel}
            features={PLANS.pro_annual.features}
            bg="bg-biolime"
            ctaBg="bg-black"
            ctaText="text-white"
            ctaLabel={buttons.pro_annual.button_label ?? 'Assinar Pro Anual'}
            href={buttons.pro_annual.button_url}
            badge={{ label: `ECONOMIZE ${ANNUAL_DISCOUNT}%`, bg: 'bg-blue-600', text: 'text-white' }}
          />
        </div>

        <div className="px-6 pb-2 -mt-2">
          <p className="text-center text-[11px] text-black/50">
            Cancele quando quiser. Sem taxas ocultas.
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
  name, price, period, features, bg, ctaBg, ctaText, ctaLabel, href, badge,
}: {
  name: string; price: string; period: string; features: string[];
  bg: string; ctaBg: string; ctaText: string; ctaLabel: string; href: string | null;
  badge: { label: string; bg: string; text: string; icon?: boolean };
}) {
  return (
    <div className={`${bg} brutal-border p-6 relative flex flex-col`}>
      <span className={`absolute -top-3 left-4 ${badge.bg} ${badge.text} px-3 py-1 text-[10px] font-bold brutal-border inline-flex items-center gap-1.5`}>
        {badge.icon && <Star className="w-3 h-3" fill="currentColor" />}
        {badge.label}
      </span>
      <h3 className="font-display text-2xl mt-2">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-4xl">{price}</span>
        <span className="text-sm font-medium">{period}</span>
      </div>
      <ul className="mt-5 space-y-2 flex-1">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2 text-sm font-bold">
            <span className="w-5 h-5 shrink-0 bg-black text-white flex items-center justify-center mt-0.5">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {href ? (
        <Link
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className={`mt-6 brutal-btn w-full py-3 text-center font-bold ${ctaBg} ${ctaText}`}
        >
          {ctaLabel}
        </Link>
      ) : (
        <span className={`mt-6 brutal-btn w-full py-3 text-center font-bold opacity-40 cursor-not-allowed ${ctaBg} ${ctaText}`}>
          {ctaLabel}
        </span>
      )}
    </div>
  );
}
