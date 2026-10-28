'use client';

import { Suspense } from 'react';
import { refreshLanding } from '@/lib/revalidate-landing';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { HeroTab } from '@/components/admin/landing/HeroTab';
import { NichesTab } from '@/components/admin/landing/NichesTab';
import { GalleryTab } from '@/components/admin/landing/GalleryTab';
import { TestimonialsTab } from '@/components/admin/landing/TestimonialsTab';

const TABS = [
  { key: 'hero', label: 'Hero', anchor: '' },
  { key: 'niches', label: 'Para quem é', anchor: '#para-quem-e' },
  { key: 'gallery', label: 'Galeria de temas', anchor: '#temas' },
  { key: 'testimonials', label: 'Depoimentos', anchor: '#depoimentos' },
] as const;

// Tudo o que é configurável na página inicial, separado do catálogo de temas do painel (Admin → Temas)
export default function AdminLandingPage() {
  return (
    <Suspense fallback={<div className="p-6 font-bold">Carregando...</div>}>
      <LandingAdmin />
    </Suspense>
  );
}

function LandingAdmin() {
  const params = useSearchParams();
  const active = TABS.find(t => t.key === params.get('tab')) ?? TABS[0];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Landing page</h1>
          <p className="text-sm text-black/70 mt-1">Conteúdo configurável da página inicial. As alterações vão para o site ao sair desta tela ou ao clicar em “Ver na landing”.</p>
        </div>
        <a
          href={`/${active.anchor}`}
          target="_blank"
          rel="noreferrer"
          onClick={async (e) => {
            // Regenera a home antes de abrir, para mostrar as últimas edições
            e.preventDefault();
            const w = window.open('about:blank', '_blank');
            await refreshLanding(true);
            if (w) w.location.href = `/${active.anchor}`;
          }}
          className="brutal-btn bg-white px-4 py-2 text-sm gap-2"
        >
          <ExternalLink className="w-4 h-4" /> Ver na landing
        </a>
      </div>

      <nav className="flex gap-1 flex-wrap mb-6 border-b-2 border-black">
        {TABS.map(t => (
          <Link key={t.key} href={`/admin/landing?tab=${t.key}`} scroll={false}
            className={`px-4 py-2 text-sm font-bold brutal-border border-b-0 -mb-[2px] ${t.key === active.key ? 'bg-bioyellow' : 'bg-white hover:bg-black/5'}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      {active.key === 'hero' && <HeroTab />}
      {active.key === 'niches' && <NichesTab />}
      {active.key === 'gallery' && <GalleryTab />}
      {active.key === 'testimonials' && <TestimonialsTab />}
    </div>
  );
}
