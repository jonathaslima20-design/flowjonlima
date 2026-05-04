'use client';

import { ArrowUpRight } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const graphiteMeta: BioThemeMeta = {
  key: 'graphite',
  name: 'Graphite Canvas',
  description: 'Dark corporativo premium estilo Apple/OpenAI: cinza profundo, links em vidro sutil e elegância absoluta.',
  available: true,
  defaults: {
    bg_color: '#1C1C1E',
    button_color: '#FFFFFF',
    text_color: '#FFFFFF',
  },
  palettes: {
    bg: ['#1C1C1E', '#000000', '#111111', '#0A0A0A', '#18181B', '#09090B'],
    accent: ['#FFFFFF', '#E5E5EA', '#48AFF0', '#32D74B', '#FF9F0A', '#FF453A'],
    text: ['#FFFFFF', '#E5E5EA', '#AEAEB2', '#8E8E93'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'cardOpacity', label: 'Opacidade do card', type: 'slider', min: 3, max: 15, step: 1, suffix: '%', default: 7, group: 'Layout' },
    { key: 'radius', label: 'Raio do card', type: 'slider', min: 8, max: 24, step: 2, suffix: 'px', default: 14, group: 'Layout' },
    { key: 'showArrow', label: 'Seta nos links', type: 'toggle', default: true, group: 'Layout' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Design Lead @ Apple', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: San Francisco, CA', maxLength: 60, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function GraphiteTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'graphite', graphiteMeta.controls);
  const bg = profile.bg_color || '#1C1C1E';
  const text = profile.text_color || '#FFFFFF';
  const accent = profile.button_color || '#FFFFFF';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-inter), system-ui, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const t = (a: string, b: string | null) => track?.(a, b);
  const opacity = Math.max(3, Math.min(15, s.cardOpacity ?? 7));

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      <div className="relative mx-auto px-6 max-w-md pt-16 pb-16">
        <header className="flex flex-col items-center text-center mb-10">
          {profile.avatar_url ? (
            <div
              className="rounded-full overflow-hidden mb-5"
              style={{
                width: profile.avatar_size ?? 88,
                height: profile.avatar_size ?? 88,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.12)`,
              }}
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="rounded-full mb-5"
              style={{
                width: profile.avatar_size ?? 88,
                height: profile.avatar_size ?? 88,
                background: `rgba(255,255,255,0.06)`,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.08)`,
              }}
            />
          )}
          <h1
            className="leading-none tracking-tight"
            style={{ fontSize: '26px', fontWeight: 600, fontFamily: titleFamily, color: text }}
          >
            {profile.display_name}
          </h1>
          {s.tagline && (
            <p className="mt-1.5 text-[14px] font-normal" style={{ color: `${text}66` }}>{s.tagline}</p>
          )}
          {profile.bio && (
            <p className="mt-3 text-[14px] max-w-xs leading-relaxed whitespace-pre-line" style={{ color: `${text}99` }}>
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
                    style={{ color: `${text}55` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </header>

        <div className="flex flex-col gap-2.5">
          {links.map((l: any) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="group flex items-center gap-4 px-5 py-4 transition-all hover:opacity-80"
              style={{
                backgroundColor: `rgba(255,255,255,${opacity / 100})`,
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: `${s.radius}px`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium truncate" style={{ color: text, letterSpacing: '-0.01em' }}>
                  {l.title}
                </p>
              </div>
              {s.showArrow && (
                <ArrowUpRight
                  className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-70 transition-opacity"
                  strokeWidth={1.5}
                  style={{ color: text }}
                />
              )}
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{
                  borderRadius: `${s.radius}px`,
                  border: `1px solid rgba(255,255,255,0.08)`,
                }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div
              key={v.id}
              className="overflow-hidden mt-2"
              style={{
                borderRadius: `${s.radius}px`,
                border: `1px solid rgba(255,255,255,0.08)`,
              }}
            >
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-3 text-sm font-medium" style={{ color: `${text}88` }}>{v.title}</div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-[12px]" style={{ color: `${text}33` }}>{s.footerText}</p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default GraphiteTheme;
