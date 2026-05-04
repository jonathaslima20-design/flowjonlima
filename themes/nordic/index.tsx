'use client';

import { ArrowUpRight } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const nordicMeta: BioThemeMeta = {
  key: 'nordic',
  name: 'Nordic Frost',
  description: 'Design escandinavo puro: grid frio, espaço generoso, tipografia DM Sans e zero excesso visual.',
  available: true,
  defaults: {
    bg_color: '#F4F6F8',
    button_color: '#1C2B3A',
    text_color: '#1C2B3A',
  },
  palettes: {
    bg: ['#F4F6F8', '#FFFFFF', '#EEF1F4', '#E8EDF2', '#1C2B3A', '#0F1923'],
    accent: ['#1C2B3A', '#2D4A6A', '#1A6B8A', '#2E7D5A', '#7C5C2C', '#8B2020'],
    text: ['#1C2B3A', '#0F1923', '#3D5166', '#FFFFFF'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'layout', label: 'Layout dos links', type: 'select', options: [
      { value: 'single', label: 'Coluna única' },
      { value: 'grid', label: '2 colunas' },
    ], default: 'grid', group: 'Layout' },
    { key: 'avatarShape', label: 'Forma do avatar', type: 'select', options: [
      { value: 'circle', label: 'Círculo' },
      { value: 'square', label: 'Quadrado' },
      { value: 'squircle', label: 'Squircle' },
    ], default: 'squircle', group: 'Layout' },
    { key: 'showTagline', label: 'Mostrar tagline', type: 'toggle', default: true, group: 'Cabeçalho' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Product Designer', maxLength: 80, group: 'Textos' },
    { key: 'showCompany', label: 'Mostrar empresa', type: 'toggle', default: false, group: 'Cabeçalho' },
    { key: 'companyText', label: 'Empresa', type: 'text', default: '', placeholder: 'Ex: @ Spotify', maxLength: 60, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: Stockholm, Sweden', maxLength: 60, group: 'Textos' },
  ],
};

const RADIUS: Record<string, string> = { circle: '50%', square: '8px', squircle: '22%' };
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function NordicTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'nordic', nordicMeta.controls);
  const bg = profile.bg_color || '#F4F6F8';
  const text = profile.text_color || '#1C2B3A';
  const accent = profile.button_color || '#1C2B3A';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-dmsans), system-ui, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const t = (a: string, b: string | null) => track?.(a, b);

  const linkCard = (l: any) => (
    <a
      key={l.id}
      href={l.url}
      target="_blank"
      rel="noreferrer"
      onClick={() => t('link', l.id)}
      className="group flex items-center justify-between p-4 transition-all hover:opacity-70"
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${text}12`,
        borderRadius: '4px',
      }}
    >
      <span className="text-[14px] font-medium tracking-tight leading-tight">{l.title}</span>
      <ArrowUpRight className="w-4 h-4 opacity-30 shrink-0 ml-2 group-hover:opacity-70 transition-opacity" strokeWidth={1.5} />
    </a>
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      <div className="relative mx-auto px-6 max-w-lg pt-14 pb-16">
        <header className="mb-8">
          <div className="flex items-start gap-5">
            {profile.avatar_url && (
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: profile.avatar_size ?? 80,
                  height: profile.avatar_size ?? 80,
                  borderRadius: RADIUS[s.avatarShape] || RADIUS.squircle,
                  border: `1px solid ${text}14`,
                }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 pt-1">
              <h1
                className="leading-none tracking-tight"
                style={{ fontSize: '22px', fontWeight: 600, fontFamily: titleFamily, color: text }}
              >
                {profile.display_name}
              </h1>
              {s.showTagline && s.tagline && (
                <p className="mt-1 text-sm font-medium" style={{ color: `${text}88` }}>{s.tagline}</p>
              )}
              {s.showCompany && s.companyText && (
                <p className="text-sm" style={{ color: accent }}>{s.companyText}</p>
              )}
              {profile.bio && (
                <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line" style={{ color: `${text}99` }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {socials?.length > 0 && (
            <div className="mt-5 flex items-center gap-4 pl-0">
              {socials.map((soc: any) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return Icon ? (
                  <a
                    key={soc.id}
                    href={getSocialHref(soc.platform, soc.url)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => t('social', soc.id)}
                    className="transition-opacity hover:opacity-50"
                    style={{ color: `${text}66` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[17px] h-[17px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </header>

        <div className="mb-6" style={{ borderTop: `1px solid ${text}14` }} />

        {s.layout === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {links.map((l: any) => linkCard(l))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {links.map((l: any) => linkCard(l))}
          </div>
        )}

        {banners?.map((b: any) => {
          const inner = (
            <div key={b.id} className={`overflow-hidden rounded mt-4 ${BANNER_H[b.size] || BANNER_H.md}`} style={{ border: `1px solid ${text}10` }}>
              {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
            </div>
          );
          return b.link_url ? (
            <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
          ) : inner;
        })}

        {videos.map((v: any) => (
          <div key={v.id} className="overflow-hidden rounded mt-4" style={{ border: `1px solid ${text}12` }}>
            <div className="relative aspect-video bg-slate-100">
              <VideoEmbed video={v} preview={preview} />
            </div>
            {v.title && (
              <div className="px-4 py-3 text-sm font-medium" style={{ color: `${text}BB` }}>{v.title}</div>
            )}
          </div>
        ))}

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-xs font-medium uppercase tracking-widest" style={{ color: `${text}44` }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default NordicTheme;
