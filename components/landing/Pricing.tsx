'use client';

import { Check, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PLANS, PERIOD_LABELS, annualDiscount, brl, monthlyPrice, type BillingPeriod, type PlanSlug } from '@/lib/plans';

type CardStyle = {
  bg: string;
  ctaBg: string;
  ctaText: string;
  highlight?: boolean;
  badge?: { label: string; bg: string; text: string; position: 'top-center' | 'top-right'; icon?: boolean };
};

const STYLES: Record<PlanSlug, CardStyle> = {
  free: { bg: 'bg-white', ctaBg: 'bg-white', ctaText: 'text-black' },
  pro: {
    bg: 'bg-bioyellow',
    ctaBg: 'bg-blue-600',
    ctaText: 'text-white',
    highlight: true,
    badge: { label: 'MAIS POPULAR', bg: 'bg-black', text: 'text-white', position: 'top-center', icon: true },
  },
  business: {
    bg: 'bg-biolime',
    ctaBg: 'bg-black',
    ctaText: 'text-white',
    badge: { label: PLANS.business.available ? 'PARA AGÊNCIAS' : 'EM BREVE', bg: 'bg-blue-600', text: 'text-white', position: 'top-right' },
  },
};

export function Pricing() {
  const [period, setPeriod] = useState<BillingPeriod>('annual');

  return (
    <section id="pricing" className="py-24 bg-white border-y-2 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block bg-biolime text-black px-4 py-1 text-xs font-bold brutal-border">
            PREÇOS
          </span>
          <h2 className="font-display text-4xl md:text-6xl mt-5 tracking-tight">PREÇOS SIMPLES</h2>
          <p className="mt-4 text-base text-black/70">
            Escolha o plano perfeito para você. Cancele quando quiser.
          </p>

          <div className="mt-8 inline-flex brutal-border bg-white p-1 gap-1">
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

        <div className="mt-14 grid md:grid-cols-3 gap-6 items-stretch">
          {(['free', 'pro', 'business'] as PlanSlug[]).map(slug => {
            const plan = PLANS[slug];
            const style = STYLES[slug];
            const isFree = slug === 'free';
            return (
              <div
                key={slug}
                className={`${style.bg} brutal-border p-8 ${style.highlight ? 'brutal-shadow-xl' : 'brutal-shadow'} relative flex flex-col`}
              >
                {style.badge && (
                  <span
                    className={`absolute ${style.badge.position === 'top-center' ? '-top-4 left-1/2 -translate-x-1/2' : '-top-3 right-4'} ${style.badge.bg} ${style.badge.text} px-3 py-1.5 text-xs font-bold brutal-border inline-flex items-center gap-1.5 whitespace-nowrap`}
                  >
                    {style.badge.icon && <Star className="w-3 h-3" fill="currentColor" />}
                    {style.badge.label}
                  </span>
                )}

                <h3 className="font-display text-2xl">{plan.name.toUpperCase()}</h3>
                <p className="text-xs font-bold text-black/60 mt-1">{plan.tagline}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-5xl">{isFree ? 'R$ 0' : brl(monthlyPrice(slug, period))}</span>
                  <span className="text-sm font-medium">{isFree ? '/sempre' : '/mês'}</span>
                </div>
                <p className="text-xs font-bold text-black/60 mt-1 min-h-[1rem]">
                  {isFree ? 'Sem cartão de crédito' : `${brl(plan.prices[period])} no pacote ${PERIOD_LABELS[period].adjective}`}
                </p>

                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm font-bold">
                      <span className="w-5 h-5 shrink-0 bg-black text-white flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.available ? (
                  <Link
                    href={isFree ? '/register' : `/register?plan=${slug}`}
                    className={`mt-8 brutal-btn w-full py-3 text-center font-bold ${style.ctaBg} ${style.ctaText}`}
                  >
                    {isFree ? 'COMEÇAR GRÁTIS' : `ASSINAR ${plan.name.toUpperCase()}`}
                  </Link>
                ) : (
                  <span className={`mt-8 brutal-btn w-full py-3 text-center font-bold opacity-50 cursor-not-allowed ${style.ctaBg} ${style.ctaText}`}>
                    EM BREVE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
