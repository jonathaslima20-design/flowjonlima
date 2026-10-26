'use client';

import type { ReactNode } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { ThemeMockup } from '@/components/themes/ThemeMockup';
import { DemoPageEditor, type DemoPageValue } from '@/components/admin/DemoPageEditor';
import { catalogDemoFor, landingDemoFor, type ShowcasePreset } from '@/lib/theme-showcase';

export type ShowcaseKind = 'catalog' | 'landing';

// Colunas de cada conjunto de demonstração em theme_showcase_presets
const FIELDS: Record<ShowcaseKind, Record<keyof DemoPageValue, keyof ShowcasePreset>> = {
  catalog: {
    profile: 'catalog_profile', links: 'catalog_links', socials: 'catalog_socials', banners: 'catalog_banners',
    videos: 'catalog_videos', theme_core: 'catalog_theme_core', theme_settings: 'catalog_theme_settings',
  },
  landing: {
    profile: 'landing_profile', links: 'landing_links', socials: 'landing_socials', banners: 'landing_banners',
    videos: 'landing_videos', theme_core: 'landing_theme_core', theme_settings: 'landing_theme_settings',
  },
};

function readDemo(preset: ShowcasePreset, kind: ShowcaseKind): DemoPageValue {
  const f = FIELDS[kind];
  const p = preset as any;
  return {
    profile: p[f.profile] || {}, links: p[f.links] || [], socials: p[f.socials] || [], banners: p[f.banners] || [],
    videos: p[f.videos] || [], theme_core: p[f.theme_core] || {}, theme_settings: p[f.theme_settings] || {},
  };
}

function toFields(value: Partial<DemoPageValue>, kind: ShowcaseKind): Partial<ShowcasePreset> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) out[FIELDS[kind][k as keyof DemoPageValue] as string] = v;
  return out as Partial<ShowcasePreset>;
}

// Editor de uma demonstração (catálogo do painel ou slide do hero da landing) de um tema
export function ShowcaseDemoEditor({ kind, preset, onPatch, onToast, afterProfile }: {
  kind: ShowcaseKind;
  preset: ShowcasePreset;
  onPatch: (fn: (prev: ShowcasePreset) => Partial<ShowcasePreset>) => void;
  onToast: (message: string) => void;
  afterProfile?: ReactNode;
}) {
  const other: ShowcaseKind = kind === 'catalog' ? 'landing' : 'catalog';

  function copyFromOther() {
    onPatch(prev => toFields(readDemo(prev, other), kind));
    onToast(kind === 'catalog' ? 'Copiado da demonstração da landing' : 'Copiado da demonstração do catálogo');
  }

  function reset() {
    onPatch(() => ({
      ...toFields({ profile: {}, links: [], socials: [], banners: [], videos: [], theme_core: {}, theme_settings: {} }, kind),
      ...(kind === 'landing' ? { landing_tagline: '' } : {}),
    }));
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3 mb-4 flex-wrap">
        <button onClick={copyFromOther} className="text-[11px] font-bold uppercase underline underline-offset-4 inline-flex items-center gap-1">
          <Copy className="w-3 h-3" /> {kind === 'catalog' ? 'Copiar da landing' : 'Copiar do catálogo'}
        </button>
        <button onClick={reset} className="text-[11px] font-bold uppercase underline underline-offset-4 inline-flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> Restaurar padrão
        </button>
      </div>
      <DemoPageEditor
        themeKey={preset.theme_key}
        value={readDemo(preset, kind)}
        onChange={fn => onPatch(prev => toFields(fn(readDemo(prev, kind)), kind))}
        pathBase={`${preset.theme_key}/${kind}`}
        onToast={onToast}
        afterProfile={afterProfile}
      />
    </>
  );
}

export function ShowcasePreview({ kind, preset, title }: { kind: ShowcaseKind; preset: ShowcasePreset; title: string }) {
  const demo = kind === 'catalog' ? catalogDemoFor(preset) : landingDemoFor(preset);
  return (
    <aside className="lg:sticky lg:top-4 self-start brutal-card p-4 bg-[#F7F7F5]">
      <h3 className="font-display text-base mb-3">{title}</h3>
      <div className="flex items-center justify-center">
        <ThemeMockup
          themeKey={preset.theme_key}
          overrides={demo.profile as any}
          links={demo.links}
          socials={demo.socials}
          videos={demo.videos}
          banners={demo.banners}
          themeSettings={demo.themeSettings}
        />
      </div>
    </aside>
  );
}
