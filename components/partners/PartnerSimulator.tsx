'use client';

import { useState } from 'react';
import { PLANS, brl, type BillingPeriod, type PaidPlanSlug } from '@/lib/plans';
import { tierFor, type PartnerProgram } from '@/lib/partner';

// Simulação da comissão recorrente: clientes pagantes × preço do pacote × % do nível alcançado
export function PartnerSimulator({ program }: { program: PartnerProgram }) {
  const [clients, setClients] = useState(20);
  const [plan, setPlan] = useState<PaidPlanSlug>('pro');
  const [period, setPeriod] = useState<BillingPeriod>('annual');
  const { current } = tierFor(program.tiers, clients);
  const price = Math.round(PLANS[plan].prices[period] * (100 - program.coupon_discount_pct) / 100);
  const perPayment = Math.round(price * current.rate / 100);
  const perYear = perPayment * clients * (period === 'annual' ? 1 : 4);

  return (
    <div className="brutal-card bg-white p-6">
      <p className="font-display text-xl">Simule seus ganhos</p>

      <label className="block mt-6">
        <span className="flex justify-between text-sm font-bold">
          <span>Clientes pagantes</span>
          <span className="bg-bioyellow brutal-border px-2">{clients}</span>
        </span>
        <input type="range" min={1} max={150} value={clients} onChange={e => setClients(Number(e.target.value))} className="w-full mt-3 accent-black" />
      </label>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {(['pro', 'business'] as PaidPlanSlug[]).map(p => (
          <button key={p} onClick={() => setPlan(p)} className={`brutal-border px-3 py-2 text-sm font-bold ${plan === p ? 'bg-black text-white' : 'bg-white'}`}>
            {PLANS[p].name}
          </button>
        ))}
        {(['quarterly', 'annual'] as BillingPeriod[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`brutal-border px-3 py-2 text-sm font-bold ${period === p ? 'bg-black text-white' : 'bg-white'}`}>
            {p === 'annual' ? 'Anual' : 'Trimestral'}
          </button>
        ))}
      </div>

      <div className="mt-6 brutal-border bg-bioyellow p-5 text-center">
        <div className="text-xs font-bold uppercase">Você ganharia por ano</div>
        <div className="font-display text-4xl md:text-5xl mt-1">{brl(perYear)}</div>
        <div className="text-xs font-bold text-black/70 mt-1">
          Nível {current.name} · {current.rate}% · {brl(perPayment)} por pagamento de cliente
        </div>
      </div>
      <p className="text-[11px] text-black/50 mt-3">
        Simulação com os clientes renovando e o cupom de {program.coupon_discount_pct}% no primeiro pagamento. A comissão é
        calculada sobre o valor pago.
      </p>
    </div>
  );
}
