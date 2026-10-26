'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { ThemeMockup } from '@/components/themes/ThemeMockup';
import { THEMES } from '@/themes/registry';
import { nicheDemoFor, type LandingNiche } from '@/lib/landing-niches';

// "Para quem é": abas por nicho com o mesmo celular de exemplo do hero (editável em Admin → Nichos da landing)
export function NicheShowcase({ niches }: { niches: LandingNiche[] }) {
  const valid = niches.filter(n => THEMES[n.theme_key]);
  const [activeId, setActiveId] = useState(valid[0]?.id);
  if (valid.length === 0) return null;

  const active = valid.find(n => n.id === activeId) ?? valid[0];
  const demo = nicheDemoFor(active);

  return (
    <section id="para-quem-e" className="py-24 bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">PARA QUEM É</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Feito para o seu tipo de negócio.</h2>
        </div>

        <div role="tablist" aria-label="Nichos" className="mt-8 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {valid.map(n => (
            <button
              key={n.id}
              role="tab"
              aria-selected={n.id === active.id}
              onClick={() => setActiveId(n.id)}
              className={`shrink-0 brutal-border px-4 py-2 text-sm font-bold transition-colors ${n.id === active.id ? 'bg-bioyellow brutal-shadow' : 'bg-white hover:bg-black/5'}`}
            >
              {n.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {active.headline && <h3 className="font-display text-3xl md:text-4xl leading-tight">{active.headline}</h3>}
            {active.description && <p className="mt-4 text-base text-black/75 leading-relaxed">{active.description}</p>}
            {active.benefits.length > 0 && (
              <ul className="mt-6 space-y-3">
                {active.benefits.map(b => (
                  <li key={b} className="flex items-start gap-3 text-base font-bold">
                    <span className="w-6 h-6 shrink-0 bg-black text-white flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register" className="brutal-btn bg-bioblue text-white px-6 py-3 gap-2 inline-flex">
                Criar minha página <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/exemplos" className="text-sm font-bold underline underline-offset-4">Ver todos os exemplos</Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div key={active.id} className="animate-in fade-in zoom-in-95 duration-300">
              <ThemeMockup
                themeKey={active.theme_key}
                overrides={demo.profile as any}
                links={demo.links}
                socials={demo.socials}
                videos={demo.videos}
                banners={demo.banners}
                themeSettings={demo.themeSettings}
                width={260}
                height={540}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
