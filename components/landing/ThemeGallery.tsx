'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ThemeMockup } from '@/components/themes/ThemeMockup';
import { THEMES } from '@/themes/registry';
import { landingOrCatalogDemoFor } from '@/lib/theme-showcase';
import type { ThemeGalleryData } from '@/lib/landing-content';

const INITIAL = 8;

// Galeria com os temas disponíveis (Admin → Landing page → Galeria): demonstração da landing quando existe, senão a do catálogo
export function ThemeGallery({ data }: { data: ThemeGalleryData }) {
  const [showAll, setShowAll] = useState(false);
  const byKey = new Map(data.presets.map(p => [p.theme_key, p]));

  // Seleção manual quando existe; senão, ordem do catálogo e depois os temas sem demonstração cadastrada
  const ordered = (data.selection.length > 0 ? data.selection : [
    ...[...data.presets].sort((a, b) => a.catalog_order - b.catalog_order).map(p => p.theme_key),
    ...Object.keys(THEMES).filter(k => !byKey.has(k)),
  ]).filter((k, i, arr) => THEMES[k] && THEMES[k].meta.available !== false && !data.disabled.includes(k) && arr.indexOf(k) === i);

  if (ordered.length === 0) return null;
  const visible = showAll ? ordered : ordered.slice(0, INITIAL);
  // Os números do texto contam todo o catálogo ativo, mesmo com seleção manual na galeria
  const catalog = Object.keys(THEMES).filter(k => THEMES[k].meta.available !== false && !data.disabled.includes(k));
  const freeCount = catalog.filter(k => !data.proOnly.includes(k)).length;

  return (
    <section id="temas" className="py-24 bg-bioyellow/20 border-y-2 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">TEMAS</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Uma página com a cara da sua marca.</h2>
          <p className="mt-4 text-base text-black/70">
            {catalog.length} temas prontos para personalizar cores, fontes e estilo. {freeCount} deles são grátis.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {visible.map(key => {
            const demo = landingOrCatalogDemoFor(byKey.get(key));
            const pro = data.proOnly.includes(key);
            return (
              <div key={key} className="flex flex-col items-center">
                {/* O celular com moldura mede 288×568; o quadro externo reserva o tamanho já reduzido */}
                <div className="relative w-[158px] h-[312px] md:w-[216px] md:h-[426px]">
                  <div className="origin-top-left scale-[0.55] md:scale-75">
                    <ThemeMockup
                      themeKey={key}
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
                  <span className={`absolute top-1 right-1 z-10 brutal-border px-2 py-0.5 text-[10px] font-bold uppercase ${pro ? 'bg-bioyellow' : 'bg-white'}`}>
                    {pro ? 'Pro' : 'Grátis'}
                  </span>
                </div>
                <p className="font-display text-base mt-3">{THEMES[key].meta.name}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {!showAll && ordered.length > INITIAL && (
            <button onClick={() => setShowAll(true)} className="brutal-btn bg-white px-6 py-3">
              Ver todos os {ordered.length} temas
            </button>
          )}
          <Link href="/register" className="brutal-btn bg-bioblue text-white px-6 py-3 gap-2">
            Escolher meu tema <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
