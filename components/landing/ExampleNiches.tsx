'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { ThemeMockup } from '@/components/themes/ThemeMockup';
import { THEMES } from '@/themes/registry';
import { nicheDemoFor, type LandingNiche } from '@/lib/landing-niches';

// Lista da página /exemplos; roda no navegador porque o registro de temas é client-side
export function ExampleNiches({ niches: all }: { niches: LandingNiche[] }) {
  const niches = all.filter(n => THEMES[n.theme_key]);
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-20 flex flex-col gap-24">
      {niches.length === 0 && <p className="text-center font-bold">Os exemplos estão sendo preparados.</p>}
      {niches.map((n, i) => {
        const demo = nicheDemoFor(n);
        return (
          <section key={n.id} id={n.key} className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
            <div>
              <span className="inline-block bg-bioyellow brutal-border px-3 py-1 text-xs font-bold uppercase">{n.label}</span>
              {n.headline && <h2 className="font-display text-3xl md:text-4xl mt-4 leading-tight">{n.headline}</h2>}
              {n.description && <p className="mt-4 text-base text-black/75 leading-relaxed">{n.description}</p>}
              {n.benefits.length > 0 && (
                <ul className="mt-6 space-y-3">
                  {n.benefits.map(b => (
                    <li key={b} className="flex items-start gap-3 font-bold">
                      <span className="w-6 h-6 shrink-0 bg-black text-white flex items-center justify-center mt-0.5">
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/register" className="mt-8 brutal-btn bg-white px-5 py-3 gap-2 inline-flex">
                Criar uma página assim <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex justify-center">
              <ThemeMockup
                themeKey={n.theme_key}
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
          </section>
        );
      })}
    </div>
  );
}
