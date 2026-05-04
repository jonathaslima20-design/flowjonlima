'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const grainMeta: BioThemeMeta = {
  key: 'grain',
  name: 'Film Grain',
  description: 'Fotografia analógica: grain texture, polaroids inclinados, cores dessaturadas e Fraunces.',
  available: true,
  defaults: {
    bg_color: '#2C2016',
    button_color: '#D4A96A',
    text_color: '#F0E8D8',
  },
  palettes: {
    bg: ['#2C2016', '#241A10', '#1E1810', '#3A2C1E', '#F0E8D8', '#FAF4EC'],
    accent: ['#D4A96A', '#C8935A', '#E8C48A', '#B87844', '#A06830', '#C4A060'],
    text: ['#F0E8D8', '#FAF4EC', '#E8D8C0', '#2C2016'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'fraunces', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'showGrain', label: 'Textura grain', type: 'toggle', default: true, group: 'Visual' },
    { key: 'polaroidTilt', label: 'Polaroids inclinados', type: 'toggle', default: true, group: 'Visual' },
    { key: 'desaturate', label: 'Dessaturar avatar', type: 'toggle', default: true, group: 'Visual' },
    { key: 'filmType', label: 'Tipo de filme', type: 'select', options: [
      { value: 'kodak', label: 'Kodak Gold' },
      { value: 'fuji', label: 'Fuji Velvia' },
      { value: 'ilford', label: 'Ilford B&W' },
      { value: 'lomo', label: 'Lomography' },
    ], default: 'kodak', group: 'Visual' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Captured on film', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: © 2025 · 35mm', maxLength: 60, group: 'Textos' },
  ],
};

const FILM_FILTERS: Record<string, string> = {
  kodak: 'sepia(20%) saturate(0.9) contrast(1.05) brightness(0.95)',
  fuji: 'saturate(1.2) contrast(1.1) hue-rotate(5deg)',
  ilford: 'grayscale(90%) contrast(1.15)',
  lomo: 'saturate(1.3) contrast(1.2) sepia(15%)',
};
const TILT_ANGLES = [-3, 2, -1.5, 2.5, -2, 1, -2.5, 1.5, -1, 2];
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function GrainTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'grain', grainMeta.controls);
  const bg = profile.bg_color || '#2C2016';
  const text = profile.text_color || '#F0E8D8';
  const accent = profile.button_color || '#D4A96A';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-fraunces), Georgia, serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-inter), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);
  const filmFilter = FILM_FILTERS[s.filmType] || FILM_FILTERS.kodak;
  const avatarFilter = s.desaturate ? filmFilter : 'none';

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showGrain && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23grain)' opacity='0.08'/%3E%3C/svg%3E")`,
            opacity: 0.6,
            mixBlendMode: 'overlay',
          }}
        />
      )}

      <div className="relative mx-auto px-6 max-w-sm pt-12 pb-16" style={{ zIndex: 20 }}>
        <header className="text-center mb-10">
          {profile.avatar_url && (
            <div
              className="relative mx-auto mb-5 inline-block"
              style={{
                padding: '10px 10px 28px',
                backgroundColor: '#F5F0E8',
                boxShadow: `3px 4px 20px rgba(0,0,0,0.5), 1px 2px 8px rgba(0,0,0,0.3)`,
                transform: s.polaroidTilt ? 'rotate(-2deg)' : 'none',
              }}
            >
              <div
                className="overflow-hidden"
                style={{
                  width: profile.avatar_size ?? 88,
                  height: profile.avatar_size ?? 88,
                  filter: avatarFilter,
                }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <h1
            className="leading-tight"
            style={{ fontSize: '26px', fontWeight: 400, fontFamily: titleFamily, fontStyle: 'italic', color: text }}
          >
            {profile.display_name}
          </h1>

          {s.tagline && (
            <p className="mt-1.5 text-sm" style={{ color: `${text}88`, fontStyle: 'italic' }}>{s.tagline}</p>
          )}

          {profile.bio && (
            <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line" style={{ color: `${text}BB` }}>
              {profile.bio}
            </p>
          )}

          {socials?.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-5">
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
                    <Icon className="w-[16px] h-[16px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </header>

        <div className="flex flex-col gap-3">
          {links.map((l: any, i: number) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="group flex items-center gap-4 px-5 py-4 transition-all hover:opacity-80"
              style={{
                padding: '12px 14px 28px',
                backgroundColor: '#F5F0E8',
                boxShadow: `2px 3px 12px rgba(0,0,0,0.4)`,
                transform: s.polaroidTilt ? `rotate(${TILT_ANGLES[i % TILT_ANGLES.length]}deg)` : 'none',
                marginBottom: s.polaroidTilt ? '8px' : '0',
              }}
            >
              <div className="flex-1">
                <p
                  className="text-[15px] font-medium"
                  style={{ fontFamily: titleFamily, color: '#2C2016', fontStyle: 'italic' }}
                >
                  {l.title}
                </p>
              </div>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-5 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{
                  padding: '6px 6px 20px',
                  backgroundColor: '#F5F0E8',
                  boxShadow: `3px 4px 16px rgba(0,0,0,0.4)`,
                  transform: s.polaroidTilt ? 'rotate(1deg)' : 'none',
                }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" style={{ filter: filmFilter }} />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div
              key={v.id}
              className="overflow-hidden mt-5"
              style={{
                padding: '6px 6px 20px',
                backgroundColor: '#F5F0E8',
                boxShadow: `3px 4px 16px rgba(0,0,0,0.4)`,
              }}
            >
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-1 pt-2 text-xs text-center italic" style={{ color: '#6B5A42' }}>{v.title}</div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-xs" style={{ color: `${text}44`, fontStyle: 'italic' }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default GrainTheme;
