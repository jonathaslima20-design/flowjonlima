'use client';

import { Check, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PLANS } from '@/lib/plans';

const ANNUAL_DISCOUNT = Math.round((1 - (PLANS.pro_annual.priceCents / 100) / ((PLANS.pro_monthly.priceCents / 100) * 12)) * 100);

type Card = {
  key: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  bg: string;
  ctaBg: string;
  ctaText: string;
  highlight?: boolean;
  badge?: { label: string; bg: string; text: string; position: 'top-center' | 'top-right'; icon?: boolean };
};

const freeCard: Card = {
  key: 'free',
  name: PLANS.free.name.toUpperCase(),
  price: PLANS.free.priceLabel,
  period: '/sempre',
  features: PLANS.free.features,
  cta: 'COMEÇAR GRÁTIS',
  href: '/register',
  bg: 'bg-white',
  ctaBg: 'bg-white',
  ctaText: 'text-black',
};

const proMonthlyCard: Card = {
  key: 'pro_monthly',
  name: PLANS.pro_monthly.name.toUpperCase(),
  price: PLANS.pro_monthly.priceLabel,
  period: PLANS.pro_monthly.periodLabel,
  features: PLANS.pro_monthly.features,
  cta: 'ASSINAR PRO',
  href: '/register?plan=pro_monthly',
  bg: 'bg-bioyellow',
  ctaBg: 'bg-blue-600',
  ctaText: 'text-white',
  highlight: true,
  badge: { label: 'MAIS POPULAR', bg: 'bg-black', text: 'text-white', position: 'top-center', icon: true },
};

const proAnnualCard: Card = {
  key: 'pro_annual',
  name: PLANS.pro_annual.name.toUpperCase(),
  price: PLANS.pro_annual.priceLabel,
  period: PLANS.pro_annual.periodLabel,
  features: PLANS.pro_annual.features,
  cta: 'ASSINAR ANUAL',
  href: '/register?plan=pro_annual',
  bg: 'bg-biolime',
  ctaBg: 'bg-black',
  ctaText: 'text-white',
  badge: { label: `ECONOMIZE ${ANNUAL_DISCOUNT}%`, bg: 'bg-blue-600', text: 'text-white', position: 'top-right' },
};

export function Pricing() {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const proCard = period === 'monthly' ? proMonthlyCard : proAnnualCard;
  const allCards: Card[] = [freeCard, proCard, period === 'monthly' ? proAnnualCard : proMonthlyCard];

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
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 text-sm font-bold ${period === 'monthly' ? 'bg-black text-white' : 'bg-white text-black'}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriod('annual')}
              className={`px-4 py-2 text-sm font-bold inline-flex items-center gap-2 ${period === 'annual' ? 'bg-black text-white' : 'bg-white text-black'}`}
            >
              Anual
              <span className={`text-[10px] px-1.5 py-0.5 ${period === 'annual' ? 'bg-biolime text-black' : 'bg-biolime text-black'} font-bold`}>
                -{ANNUAL_DISCOUNT}%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6 items-stretch">
          {allCards.map((p) => (
            <div
              key={p.key}
              className={`${p.bg} brutal-border p-8 ${p.highlight ? 'brutal-shadow-xl' : 'brutal-shadow'} relative flex flex-col`}
            >
              {p.badge && (
                <span
                  className={`absolute ${p.badge.position === 'top-center' ? '-top-4 left-1/2 -translate-x-1/2' : '-top-3 right-4'} ${p.badge.bg} ${p.badge.text} px-3 py-1.5 text-xs font-bold brutal-border inline-flex items-center gap-1.5 whitespace-nowrap`}
                >
                  {p.badge.icon && <Star className="w-3 h-3" fill="currentColor" />}
                  {p.badge.label}
                </span>
              )}

              <h3 className="font-display text-2xl">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-5xl">{p.price}</span>
                <span className="text-sm font-medium">{p.period}</span>
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm font-bold">
                    <span className="w-5 h-5 shrink-0 bg-black text-white flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={p.href}
                className={`mt-8 brutal-btn w-full py-3 text-center font-bold ${p.ctaBg} ${p.ctaText}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
