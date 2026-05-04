'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const lavaMeta: BioThemeMeta = {
  key: 'lava',
  name: 'Lava Dark',
  description: 'Dark agressivo com borda de magma pulsante, glow de brasa e tipografia Archivo Black bold.',
  available: true,
  defaults: {
    bg_color: '#0A0A0A',
    button_color: '#FF4500',
    text_color: '#FFFFFF',
  },
  palettes: {
    bg: ['#0A0A0A', '#000000', '#0F0500', '#120800', '#1A0000', '#0A0010'],
    accent: ['#FF4500', '#FF6B00', '#FF2200', '#FF8C00', '#FF0040', '#FF4080'],
    text: ['#FFFFFF', '#FFE0CC', '#FFC0A0', '#FF8060'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'archivo', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'glowIntensity', label: 'Intensidade do glow', type: 'slider', min: 1, max: 5, step: 1, default: 3, group: 'Visual' },
    { key: 'borderPulse', label: 'Borda pulsante', type: 'toggle', default: true, group: 'Visual' },
    { key: 'showCracks', label: 'Rachaduras de magma', type: 'toggle', default: true, group: 'Visual' },
    { key: 'cardStyle', label: 'Estilo dos cards', type: 'select', options: [
      { value: 'glow', label: 'Glow border' },
      { value: 'solid', label: 'Sólido quente' },
      { value: 'ghost', label: 'Ghost' },
    ], default: 'glow', group: 'Layout' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Born from fire', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: 🔥 Worldwide', maxLength: 60, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function LavaTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'lava', lavaMeta.controls);
  const bg = profile.bg_color || '#0A0A0A';
  const text = profile.text_color || '#FFFFFF';
  const accent = profile.button_color || '#FF4500';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-archivo-black), Impact, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-inter), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);
  const glow = Math.max(1, Math.min(5, s.glowIntensity ?? 3));
  const glowPx = glow * 6;

  const cardStyle = (i: number) => {
    if (s.cardStyle === 'solid') {
      return {
        background: i === 0 ? accent : `${accent}22`,
        border: `1px solid ${accent}44`,
        color: i === 0 ? '#000' : text,
      };
    }
    if (s.cardStyle === 'ghost') {
      return {
        background: 'transparent',
        border: `1px solid ${accent}55`,
        color: text,
      };
    }
    return {
      background: `${accent}0A`,
      border: `1px solid ${accent}77`,
      color: text,
      boxShadow: s.borderPulse ? undefined : `0 0 ${glowPx}px ${accent}44`,
    };
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showCracks && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-full opacity-5" viewBox="0 0 400 200" preserveAspectRatio="none">
            <polyline points="0,150 80,100 120,140 200,80 280,120 350,90 400,110 400,200 0,200" fill={accent} />
          </svg>
        </div>
      )}

      <div className="relative mx-auto px-6 max-w-md pt-14 pb-16" style={{ zIndex: 1 }}>
        <header className="flex flex-col items-center text-center mb-10">
          {profile.avatar_url && (
            <div
              className="rounded-full overflow-hidden mb-5"
              style={{
                width: profile.avatar_size ?? 88,
                height: profile.avatar_size ?? 88,
                boxShadow: `0 0 ${glowPx * 2}px ${accent}66, 0 0 ${glowPx}px ${accent}44`,
                border: `2px solid ${accent}88`,
              }}
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h1
            className="leading-none tracking-tighter"
            style={{
              fontSize: '30px',
              fontWeight: 900,
              fontFamily: titleFamily,
              color: text,
              textShadow: `0 0 ${glowPx}px ${accent}88`,
              textTransform: 'uppercase',
            }}
          >
            {profile.display_name}
          </h1>

          {s.tagline && (
            <p className="mt-1.5 text-sm font-bold uppercase tracking-widest" style={{ color: accent, fontFamily: titleFamily }}>
              {s.tagline}
            </p>
          )}

          {profile.bio && (
            <p className="mt-3 text-[14px] max-w-xs leading-relaxed whitespace-pre-line" style={{ color: `${text}BB` }}>
              {profile.bio}
            </p>
          )}

          {socials?.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-4">
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
                    className="transition-all hover:scale-110"
                    style={{ color: `${accent}88` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </header>

        <div className="flex flex-col gap-3">
          {links.map((l: any, i: number) => {
            const cs = cardStyle(i);
            return (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => t('link', l.id)}
                className={`group flex items-center gap-4 px-5 py-4 transition-all hover:opacity-90 ${s.borderPulse && s.cardStyle === 'glow' ? 'lava-card' : ''}`}
                style={{ ...cs, borderRadius: '8px' }}
              >
                <span className="text-lg shrink-0">🔥</span>
                <span className="flex-1 text-[15px] font-bold tracking-tight" style={{ fontFamily: titleFamily, color: cs.color }}>
                  {l.title}
                </span>
              </a>
            );
          })}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ borderRadius: '8px', border: `1px solid ${accent}44` }}
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
              style={{ borderRadius: '8px', border: `1px solid ${accent}44` }}
            >
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-3 text-sm font-bold" style={{ fontFamily: titleFamily, color: accent }}>{v.title}</div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-sm font-bold" style={{ color: `${accent}66`, fontFamily: titleFamily }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>

      <style jsx>{`
        @keyframes lava-pulse {
          0%, 100% { box-shadow: 0 0 ${glowPx}px ${accent}44, 0 0 ${glowPx * 2}px ${accent}22; border-color: ${accent}66; }
          50% { box-shadow: 0 0 ${glowPx * 2}px ${accent}77, 0 0 ${glowPx * 3}px ${accent}44; border-color: ${accent}AA; }
        }
        :global(.lava-card) { animation: lava-pulse 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default LavaTheme;
