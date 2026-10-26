'use client';

import { useState, type ReactNode } from 'react';
import { CalendarClock, Globe, Inbox, QrCode, TrendingUp } from 'lucide-react';
import { CountdownProvider, PageCountdown } from '@/components/bio/PageCountdown';

type Plan = 'Free' | 'Pro' | 'Business';

const PLAN_STYLE: Record<Plan, string> = {
  Free: 'bg-white',
  Pro: 'bg-bioyellow',
  Business: 'bg-biolime',
};

function PlanTags({ plans }: { plans: Plan[] }) {
  return (
    <div className="flex gap-2 mt-5">
      {plans.map(p => (
        <span key={p} className={`${PLAN_STYLE[p]} brutal-border px-2 py-0.5 text-[11px] font-bold uppercase`}>{p}</span>
      ))}
    </div>
  );
}

function Block({ icon: Icon, eyebrow, title, desc, plans, visual, reverse }: {
  icon: typeof Inbox; eyebrow: string; title: string; desc: string; plans: Plan[]; visual: ReactNode; reverse?: boolean;
}) {
  return (
    <div className={`grid lg:grid-cols-2 gap-10 items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
          <Icon className="w-4 h-4" /> {eyebrow}
        </span>
        <h3 className="font-display text-3xl md:text-4xl mt-3 leading-tight">{title}</h3>
        <p className="mt-4 text-base text-black/75 leading-relaxed">{desc}</p>
        <PlanTags plans={plans} />
      </div>
      <div className="flex justify-center">{visual}</div>
    </div>
  );
}

function LeadsVisual() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="brutal-card p-5 bg-white">
        <p className="font-display text-lg">Fale comigo</p>
        <p className="text-xs text-black/60 mb-4">Deixe seu contato que eu te chamo.</p>
        {['Seu nome', 'Seu e-mail', 'WhatsApp'].map(f => (
          <div key={f} className="brutal-border px-3 py-2 text-sm text-black/40 mb-2 bg-white">{f}</div>
        ))}
        <div className="bg-black text-white text-sm font-bold text-center py-2 mt-3">Enviar</div>
      </div>
      <span className="absolute -top-4 -right-3 bg-biolime brutal-border brutal-shadow px-3 py-1 text-xs font-bold rotate-3">
        +3 contatos hoje
      </span>
    </div>
  );
}

function AnalyticsVisual() {
  const sources = [
    { name: 'Instagram', pct: 62, color: 'bg-bioblue' },
    { name: 'WhatsApp', pct: 21, color: 'bg-biolime' },
    { name: 'QR code', pct: 9, color: 'bg-bioyellow' },
    { name: 'Direto', pct: 8, color: 'bg-black' },
  ];
  return (
    <div className="brutal-card p-5 bg-white w-full max-w-sm">
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[['Visitas', '1.240'], ['Cliques', '410'], ['Taxa', '33%']].map(([k, v]) => (
          <div key={k} className="brutal-border p-2 text-center">
            <div className="text-[10px] font-bold uppercase text-black/60">{k}</div>
            <div className="font-display text-xl">{v}</div>
          </div>
        ))}
      </div>
      <p className="text-xs font-bold uppercase mb-2">De onde vêm as visitas</p>
      <div className="space-y-2">
        {sources.map(s => (
          <div key={s.name}>
            <div className="flex justify-between text-xs font-bold"><span>{s.name}</span><span>{s.pct}%</span></div>
            <div className="h-3 brutal-border bg-white mt-1">
              <div className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QrVisual() {
  return (
    <div className="relative">
      <div className="brutal-card p-6 bg-white flex flex-col items-center gap-3 -rotate-2">
        <QrCode className="w-40 h-40" strokeWidth={1.25} />
        <span className="font-display text-sm">Aponte a câmera</span>
      </div>
      <span className="absolute -bottom-4 -left-6 bg-bioyellow brutal-border brutal-shadow px-3 py-1 text-xs font-bold">
        Mesa · Embalagem · Cartão
      </span>
    </div>
  );
}

function LaunchVisual() {
  // Termina daqui a 3 dias e 4 horas, contado a partir de quando a página abre
  const [endsAt] = useState(() => new Date(Date.now() + (3 * 24 + 4) * 3600 * 1000).toISOString());
  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      <div className="brutal-card p-4 bg-black text-white">
        <CountdownProvider value={{ title: 'A promoção acaba em', endsAt, accent: '#FACC15' }}>
          <PageCountdown />
        </CountdownProvider>
      </div>
      <div className="brutal-card p-4 bg-white flex items-center justify-between gap-3">
        <div>
          <p className="font-bold">Lançamento da coleção</p>
          <p className="text-xs text-black/60">Aparece sozinho na sexta, 18h</p>
        </div>
        <span className="bg-bioyellow brutal-border px-2 py-1 text-[10px] font-bold uppercase inline-flex items-center gap-1">
          <CalendarClock className="w-3 h-3" /> Agendado
        </span>
      </div>
    </div>
  );
}

function BrandVisual() {
  return (
    <div className="brutal-card bg-white w-full max-w-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b-2 border-black px-3 py-2 bg-neutral-100">
        <span className="w-3 h-3 rounded-full bg-red-400 border border-black" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 border border-black" />
        <span className="w-3 h-3 rounded-full bg-green-400 border border-black" />
        <span className="ml-2 flex-1 bg-white brutal-border px-2 py-0.5 text-xs font-bold truncate">🔒 links.suamarca.com.br</span>
      </div>
      <div className="p-5 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase">Integrações ativas</p>
        {['Meta Pixel', 'Google Analytics', 'Prévia no WhatsApp e redes (SEO)'].map(i => (
          <div key={i} className="flex items-center justify-between brutal-border px-3 py-2 text-sm font-bold">
            {i}
            <span className="w-9 h-5 bg-black relative brutal-border"><span className="absolute right-0.5 top-0.5 w-3 h-3 bg-bioyellow" /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeatureShowcase() {
  return (
    <section id="recursos-destaque" className="py-24 bg-white border-t-2 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">RECURSOS EM DESTAQUE</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Mais que links: resultados.</h2>
        </div>

        <div className="mt-16 flex flex-col gap-24">
          <Block
            icon={Inbox}
            eyebrow="Captura de contatos"
            title="Transforme visitas em clientes"
            desc="Um botão abre um formulário simples na sua página. Os contatos chegam no seu painel com nome, e-mail e WhatsApp, prontos para você chamar."
            plans={['Pro', 'Business']}
            visual={<LeadsVisual />}
          />
          <Block
            reverse
            icon={TrendingUp}
            eyebrow="Analytics"
            title="Saiba de onde vem o seu público"
            desc="Visitas, cliques, taxa de cliques e a origem de cada visita: Instagram, TikTok, WhatsApp, QR code e mais. Com histórico de até 1 ano."
            plans={['Free', 'Pro', 'Business']}
            visual={<AnalyticsVisual />}
          />
          <Block
            icon={QrCode}
            eyebrow="QR code"
            title="Leve sua página para o mundo real"
            desc="Gere o QR code da sua página e coloque na mesa, na vitrine, na embalagem ou no cartão de visita. As visitas aparecem separadas no analytics."
            plans={['Pro', 'Business']}
            visual={<QrVisual />}
          />
          <Block
            reverse
            icon={CalendarClock}
            eyebrow="Lançamentos e promoções"
            title="Tudo no ar na hora certa"
            desc="Agende links para entrar e sair do ar sozinhos e crie urgência com uma contagem regressiva ao vivo na sua página."
            plans={['Pro', 'Business']}
            visual={<LaunchVisual />}
          />
          <Block
            icon={Globe}
            eyebrow="Sua marca"
            title="Profissional do endereço à prévia"
            desc="Use seu próprio domínio, conecte Meta Pixel e Google Analytics para suas campanhas e controle como sua página aparece ao ser compartilhada."
            plans={['Pro', 'Business']}
            visual={<BrandVisual />}
          />
        </div>
      </div>
    </section>
  );
}
