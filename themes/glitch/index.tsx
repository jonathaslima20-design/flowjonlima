'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const glitchMeta: BioThemeMeta = {
  key: 'glitch',
  name: 'Glitch City',
  description: 'Estética cyberpunk: glitch digital constante no nome, noise texture, scanlines e chromatic aberration.',
  available: true,
  defaults: {
    bg_color: '#000000',
    button_color: '#00FF41',
    text_color: '#FFFFFF',
  },
  palettes: {
    bg: ['#000000', '#020208', '#050510', '#050010', '#001005', '#100000'],
    accent: ['#00FF41', '#00FFFF', '#FF0080', '#FF4500', '#FFFF00', '#FF00FF'],
    text: ['#FFFFFF', '#00FF41', '#00FFFF', '#FFFF00'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'jetbrains', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'jetbrains', group: 'Tipografia' },
    { key: 'glitchSpeed', label: 'Velocidade do glitch', type: 'select', options: [
      { value: 'slow', label: 'Lento' },
      { value: 'medium', label: 'Médio' },
      { value: 'fast', label: 'Rápido' },
    ], default: 'medium', group: 'Visual' },
    { key: 'showScanlines', label: 'Scanlines CRT', type: 'toggle', default: true, group: 'Visual' },
    { key: 'showNoise', label: 'Noise texture', type: 'toggle', default: true, group: 'Visual' },
    { key: 'showChromatic', label: 'Aberração cromática', type: 'toggle', default: true, group: 'Visual' },
    { key: 'secondAccent', label: 'Segunda cor de glitch', type: 'colorPicker', default: '#FF0080', group: 'Visual' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: ERROR_404: REALITY_NOT_FOUND', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: [SYS] Connection established', maxLength: 60, group: 'Textos' },
  ],
};

const GLITCH_SPEEDS: Record<string, string> = { slow: '4s', medium: '2s', fast: '0.8s' };
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function GlitchTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'glitch', glitchMeta.controls);
  const bg = profile.bg_color || '#000000';
  const text = profile.text_color || '#FFFFFF';
  const accent = profile.button_color || '#00FF41';
  const accent2 = s.secondAccent || '#FF0080';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-jetbrains), ui-monospace, monospace');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const t = (a: string, b: string | null) => track?.(a, b);
  const speed = GLITCH_SPEEDS[s.glitchSpeed] || GLITCH_SPEEDS.medium;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showScanlines && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)`,
          }}
        />
      )}

      {s.showNoise && (
        <div
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            opacity: 0.4,
          }}
        />
      )}

      <div className="relative mx-auto px-6 max-w-md pt-14 pb-16" style={{ zIndex: 20 }}>
        <header className="flex flex-col items-center text-center mb-10">
          {profile.avatar_url && (
            <div className="relative mb-5">
              {s.showChromatic && (
                <>
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{ transform: 'translate(-2px, 0)', opacity: 0.6, mixBlendMode: 'screen' }}
                  >
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" style={{ filter: `sepia(1) saturate(10) hue-rotate(120deg)` }} />
                  </div>
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{ transform: 'translate(2px, 0)', opacity: 0.6, mixBlendMode: 'screen' }}
                  >
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" style={{ filter: `sepia(1) saturate(10) hue-rotate(300deg)` }} />
                  </div>
                </>
              )}
              <div
                className="relative rounded-full overflow-hidden"
                style={{
                  width: profile.avatar_size ?? 88,
                  height: profile.avatar_size ?? 88,
                  boxShadow: `0 0 20px ${accent}55`,
                  border: `1px solid ${accent}66`,
                }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="relative">
            <h1
              className="leading-none tracking-tighter glitch-title"
              style={{
                fontSize: '26px',
                fontWeight: 700,
                fontFamily: titleFamily,
                color: text,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
              data-text={profile.display_name}
            >
              {profile.display_name}
            </h1>
          </div>

          {s.tagline && (
            <p className="mt-2 text-[12px] font-medium" style={{ color: accent, fontFamily: titleFamily }}>
              {s.tagline}
            </p>
          )}

          {profile.bio && (
            <p className="mt-3 text-[13px] max-w-xs leading-relaxed whitespace-pre-line" style={{ color: `${text}BB`, fontFamily: titleFamily }}>
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
                    className="transition-all hover:opacity-50"
                    style={{ color: accent }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </header>

        <div className="flex flex-col gap-2">
          {links.map((l: any, i: number) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="group flex items-center gap-3 px-4 py-3.5 transition-all hover:opacity-80 glitch-link"
              style={{
                backgroundColor: `${accent}0A`,
                border: `1px solid ${accent}44`,
                borderRadius: '4px',
              }}
            >
              <span className="text-[12px] font-bold shrink-0 tabular-nums" style={{ color: accent, fontFamily: titleFamily }}>
                {String(i).padStart(2, '0')}:
              </span>
              <span className="flex-1 text-[14px] font-medium" style={{ color: text, fontFamily: titleFamily }}>
                {l.title}
              </span>
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold" style={{ color: accent2, fontFamily: titleFamily }}>
                [OPEN]
              </span>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ border: `1px solid ${accent}44`, borderRadius: '4px' }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" style={{ filter: 'contrast(1.1) saturate(0.8)' }} />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="overflow-hidden mt-2" style={{ border: `1px solid ${accent}44`, borderRadius: '4px' }}>
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-3 py-2 text-xs font-bold" style={{ fontFamily: titleFamily, color: accent }}>{v.title}</div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-[11px]" style={{ color: `${accent}66`, fontFamily: titleFamily }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>

      <style jsx>{`
        @keyframes glitch-1 {
          0%, 100% { clip-path: inset(0 0 95% 0); transform: translate(-3px, 0); color: ${accent}; }
          25% { clip-path: inset(50% 0 40% 0); transform: translate(3px, 0); color: ${accent2}; }
          50% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 0); color: ${accent}; }
          75% { clip-path: inset(20% 0 70% 0); transform: translate(2px, 0); color: ${accent2}; }
        }
        @keyframes glitch-2 {
          0%, 100% { clip-path: inset(60% 0 20% 0); transform: translate(3px, 0); color: ${accent2}; }
          33% { clip-path: inset(10% 0 80% 0); transform: translate(-3px, 0); color: ${accent}; }
          66% { clip-path: inset(40% 0 45% 0); transform: translate(2px, 0); color: ${accent2}; }
        }
        :global(.glitch-title) { position: relative; }
        :global(.glitch-title::before),
        :global(.glitch-title::after) {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
        }
        :global(.glitch-title::before) { animation: glitch-1 ${speed} steps(1) infinite; }
        :global(.glitch-title::after) { animation: glitch-2 ${speed} steps(1) infinite; animation-delay: calc(${speed} / 2); }
      `}</style>
    </div>
  );
}

export default GlitchTheme;
