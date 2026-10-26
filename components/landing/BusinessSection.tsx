'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Layers, Mail, Users } from 'lucide-react';
import { PLANS, brl, monthlyPrice } from '@/lib/plans';

const ITEMS = [
  { icon: Layers, title: `Até ${PLANS.business.limits.pages} páginas`, desc: 'Uma para cada cliente, marca ou campanha, cada uma com tema, links, analytics e contatos próprios.' },
  { icon: Users, title: 'Acesso de clientes e equipe', desc: `Convide até ${PLANS.business.limits.members} pessoas por link para editar uma página, sem compartilhar a senha.` },
  { icon: Mail, title: 'Relatório mensal por e-mail', desc: 'Todo dia 1, um resumo com visitas, cliques e contatos de cada página, comparado ao mês anterior.' },
  { icon: BarChart3, title: 'Dados para apresentar', desc: 'Analytics de 1 ano, exportação em CSV e contatos ilimitados com exportação.' },
];

const DEMO_PAGES = [
  { handle: 'brasaburger', name: 'Brasa Burger', views: '3.482', leads: 41, color: 'bg-orange-400' },
  { handle: 'dracamilarocha', name: 'Dra. Camila Rocha', views: '1.906', leads: 27, color: 'bg-slate-500' },
  { handle: 'ateliefloredelis', name: 'Ateliê Flor de Lis', views: '5.120', leads: 63, color: 'bg-pink-300' },
];

// Simulação do painel trocando entre as páginas dos clientes
function PanelVisual() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive(i => (i + 1) % DEMO_PAGES.length), 2500);
    return () => clearInterval(id);
  }, []);
  const page = DEMO_PAGES[active];

  return (
    <div className="brutal-card bg-white w-full max-w-md overflow-hidden">
      <div className="border-b-2 border-black px-4 py-3 flex items-center justify-between bg-neutral-50">
        <span className="font-display text-sm">Painel da agência</span>
        <span className="text-[10px] font-bold uppercase bg-biolime brutal-border px-2 py-0.5">Business</span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase text-black/60">Editando a página</p>
        {DEMO_PAGES.map((p, i) => (
          <button
            key={p.handle}
            onClick={() => setActive(i)}
            className={`flex items-center gap-3 brutal-border px-3 py-2 text-left transition-colors ${i === active ? 'bg-bioyellow' : 'bg-white'}`}
          >
            <span className={`w-7 h-7 ${p.color} brutal-border shrink-0`} />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold truncate">{p.name}</span>
              <span className="block text-[11px] text-black/60 truncate">bioflowzy.com/{p.handle}</span>
            </span>
          </button>
        ))}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="brutal-border p-3 text-center">
            <div className="text-[10px] font-bold uppercase text-black/60">Visitas no mês</div>
            <div className="font-display text-2xl">{page.views}</div>
          </div>
          <div className="brutal-border p-3 text-center">
            <div className="text-[10px] font-bold uppercase text-black/60">Contatos</div>
            <div className="font-display text-2xl">{page.leads}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BusinessSection() {
  return (
    <section id="agencias" className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-biolime text-black px-3 py-1 text-xs font-bold">PARA AGÊNCIAS E NEGÓCIOS</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Gerencie as páginas dos seus clientes num só lugar.</h2>
          <p className="mt-4 text-base text-white/70">
            O plano Business foi feito para agências, social medias e quem tem mais de uma marca.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-5">
            {ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title}>
                <span className="w-10 h-10 bg-biolime text-black flex items-center justify-center border-2 border-white">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="font-display text-lg mt-3">{title}</h3>
                <p className="text-sm text-white/70 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/register?plan=business" className="brutal-btn bg-biolime text-black px-6 py-3 gap-2">
              Começar com o Business <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-sm font-bold text-white/70">
              A partir de {brl(monthlyPrice('business', 'annual'))}/mês no plano anual
            </span>
          </div>
        </div>
        <div className="flex justify-center text-black">
          <PanelVisual />
        </div>
      </div>
    </section>
  );
}
