'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Gift } from 'lucide-react';
import { PLANS, brl, type PaidPlanSlug } from '@/lib/plans';

// Mesma regra de grant_paid_plan: 30% do primeiro pagamento aprovado de cada indicado
const COMMISSION = 0.3;

export function ReferralCalculator() {
  const [count, setCount] = useState(10);
  const [plan, setPlan] = useState<PaidPlanSlug>('pro');
  const perReferral = Math.round(PLANS[plan].prices.annual * COMMISSION);
  const total = perReferral * count;

  return (
    <section id="indique" className="py-24 bg-biolime/30 border-y-2 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-bold"><Gift className="w-3 h-3" /> INDIQUE E GANHE</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Sua bio também pode virar renda.</h2>
          <p className="mt-4 text-base text-black/75 leading-relaxed">
            Assinantes Pro e Business recebem um link de indicação. A cada pessoa que assinar por ele, você ganha {Math.round(COMMISSION * 100)}% do primeiro pagamento, e saca via PIX.
          </p>
          <Link href="/register" className="mt-8 brutal-btn bg-bioblue text-white px-6 py-3 gap-2 inline-flex">
            Quero meu link de indicação <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="brutal-card bg-white p-6">
          <p className="font-display text-xl">Simule seus ganhos</p>

          <label className="block mt-6">
            <span className="flex justify-between text-sm font-bold">
              <span>Pessoas que assinam pelo seu link</span>
              <span className="bg-bioyellow brutal-border px-2">{count}</span>
            </span>
            <input type="range" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} className="w-full mt-3 accent-black" />
          </label>

          <div className="mt-6">
            <span className="text-sm font-bold">Plano que elas assinam (anual)</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['pro', 'business'] as PaidPlanSlug[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`brutal-border px-3 py-2 text-sm font-bold ${plan === p ? 'bg-black text-white' : 'bg-white'}`}
                >
                  {PLANS[p].name} · {brl(PLANS[p].prices.annual)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 brutal-border bg-bioyellow p-5 text-center">
            <div className="text-xs font-bold uppercase">Você ganharia</div>
            <div className="font-display text-4xl md:text-5xl mt-1">{brl(total)}</div>
            <div className="text-xs font-bold text-black/70 mt-1">{brl(perReferral)} por indicação</div>
          </div>
          <p className="text-[11px] text-black/50 mt-3">Simulação. A comissão vale para o primeiro pagamento aprovado de cada pessoa indicada.</p>
        </div>
      </div>
    </section>
  );
}
