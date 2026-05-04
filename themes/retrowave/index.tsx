'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const retrowaveMeta: BioThemeMeta = {
  key: 'retrowave',
  name: 'Retrowave Sunset',
  description: 'Synthwave 80s: sol em gradiente, grid em perspectiva infinita e cromo metalico.',
  available: true,
  defaults: {
    bg_color: '#0B0324',
    button_color: '#F472B6',
    text_color: '#FDE68A',
  },
  palettes: {
    bg: ['#0B0324', '#1A0B3D', '#000814', '#0E1B4D', '#1B0A3A'],
    accent: ['#F472B6', '#22D3EE', '#FB923C', '#FACC15', '#34D399', '#F87171'],
    text: ['#FDE68A', '#FFFFFF', '#FBCFE8', '#A5F3FC'],
  },
  controls: [
    { key: 'gridSpeed', label: 'Velocidade do grid', type: 'slider', min: 0, max: 100, step: 5, suffix: '%', default: 50, group: 'Cenario' },
    { key: 'palms', label: 'Palmeiras laterais', type: 'toggle', default: true, group: 'Cenario' },
    { key: 'sunY', label: 'Posicao do sol', type: 'slider', min: 20, max: 70, step: 2, suffix: '%', default: 45, group: 'Cenario' },
    { key: 'scanlines', label: 'Scanlines VHS', type: 'toggle', default: true, group: 'Efeitos' },
    { key: 'bannerTracking', label: 'Tracking VHS nos banners', type: 'toggle', default: true, group: 'Efeitos' },
    { key: 'palette', label: 'Paleta sunset', type: 'select', options: [
      { value: 'miami', label: 'Miami' },
      { value: 'tokyo', label: 'Tokyo' },
      { value: 'la', label: 'Los Angeles' },
      { value: 'berlin', label: 'Berlim' },
    ], default: 'miami', group: 'Cenario' },
    { key: 'chrome', label: 'Cromo do nome', type: 'slider', min: 0, max: 100, step: 5, suffix: '%', default: 80, group: 'Tipografia' },
    { key: 'tagline', label: 'Frase neon (acima do nome)', type: 'textarea', default: '', placeholder: 'Ex: NEON NIGHTS', maxLength: 80, rows: 2, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé neon', type: 'text', default: '', placeholder: 'Ex: STAY RETRO', maxLength: 40, group: 'Textos' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#F472B6', group: 'Cores' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada', type: 'toggle', default: false, group: 'Cores' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'archivo', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
    { key: 'showPalms', label: 'Mostrar palmeiras', type: 'toggle', default: true, group: 'Elementos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

const PALETTES: Record<string, { a: string; b: string; c: string }> = {
  miami: { a: '#F472B6', b: '#FB923C', c: '#FACC15' },
  tokyo: { a: '#F472B6', b: '#A78BFA', c: '#22D3EE' },
  la: { a: '#FB923C', b: '#F87171', c: '#FDE68A' },
  berlin: { a: '#34D399', b: '#22D3EE', c: '#A78BFA' },
};

export function RetrowaveTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'retrowave', retrowaveMeta.controls);
  const pal = PALETTES[s.palette] || PALETTES.miami;
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || pal.a);
  const t = (a: string, b: string | null) => track?.(a, b);
  const gridAnim = s.gridSpeed > 0 ? `retro-grid ${110 - s.gridSpeed}s linear infinite` : 'none';
  const chrome = Math.max(0, Math.min(1, s.chrome / 100));

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: profile.bg_color || '#0B0324', color: profile.text_color, fontFamily: getFontStack(s.bodyFont, 'var(--font-inter), system-ui') }}
    >
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: '70%',
          background: `radial-gradient(circle at 50% ${s.sunY}%, ${pal.c} 0%, ${pal.b} 15%, ${pal.a} 30%, transparent 55%)`,
        }}
        aria-hidden
      />
      <div
        className="absolute left-1/2 pointer-events-none"
        style={{
          top: `${s.sunY - 15}%`,
          transform: 'translateX(-50%)',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: `linear-gradient(to bottom, ${pal.c} 0%, ${pal.b} 45%, ${pal.a} 100%)`,
          boxShadow: `0 0 80px ${pal.a}aa`,
          maskImage: 'repeating-linear-gradient(to bottom, black 0 14px, transparent 14px 17px)',
          WebkitMaskImage: 'repeating-linear-gradient(to bottom, black 0 14px, transparent 14px 17px)',
          opacity: 0.95,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none retro-grid-container"
        style={{ height: '45%', perspective: '400px', perspectiveOrigin: '50% 0%' }}
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${pal.a} 1px, transparent 1px), linear-gradient(90deg, ${pal.a} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: 'rotateX(60deg) translateZ(0)',
            transformOrigin: '50% 0%',
            animation: gridAnim,
            opacity: 0.8,
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: '50%', background: `linear-gradient(to top, ${profile.bg_color || '#0B0324'} 10%, transparent)` }}
        />
      </div>

      {s.palms && s.showPalms !== false && (
        <>
          <div className="absolute left-3 bottom-8 pointer-events-none retro-palm" aria-hidden>
            <PalmSVG color="#000000" />
          </div>
          <div className="absolute right-3 bottom-8 pointer-events-none retro-palm" style={{ transform: 'scaleX(-1)' }} aria-hidden>
            <PalmSVG color="#000000" />
          </div>
        </>
      )}

      {s.scanlines && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 4px)', mixBlendMode: 'multiply' }}
          aria-hidden
        />
      )}

      <div className="relative max-w-md mx-auto px-5 pt-[72px] pb-24">
        <div className="flex flex-col items-center text-center">
          <div
            className="rounded-full overflow-hidden"
            style={{
              width: profile.avatar_size ?? 100,
              height: profile.avatar_size ?? 100,
              border: `3px solid ${pal.c}`,
              boxShadow: `0 0 24px ${pal.a}, inset 0 0 12px ${pal.b}66`,
            }}
          >
            {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
          </div>

          {s.tagline && s.tagline.trim() && (
            <div
              className="mt-3 text-xs tracking-[0.5em] uppercase whitespace-pre-line"
              style={{ color: pal.c, textShadow: `0 0 8px ${pal.a}` }}
            >
              {s.tagline}
            </div>
          )}

          <h1
            className="mt-5 text-4xl tracking-tight retro-chrome"
            style={{
              fontFamily: getFontStack(s.titleFont, 'var(--font-archivo), system-ui'),
              fontWeight: 900,
              letterSpacing: '-0.02em',
              background: `linear-gradient(180deg, #FFFFFF 0%, ${pal.c} 20%, ${pal.b} 50%, ${pal.a} 75%, #FFFFFF 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextStroke: chrome > 0 ? `1px ${pal.a}` : 'none',
              color: chrome > 0 ? 'transparent' : profile.text_color,
              filter: `drop-shadow(0 0 ${8 * chrome}px ${pal.a}aa)`,
            }}
          >
            {profile.display_name}
          </h1>
          {profile.bio && <p className="mt-3 text-sm opacity-95 max-w-xs whitespace-pre-line" style={{ color: profile.text_color, textShadow: '0 0 6px rgba(0,0,0,0.7)' }}>{profile.bio}</p>}

          {s.showSocials !== false && socials?.length > 0 && (
            <div className="mt-5 flex gap-2 flex-wrap justify-center">
              {socials.map((soc: any) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return (
                  <a
                    key={soc.id}
                    href={getSocialHref(soc.platform, soc.url)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => t('social', soc.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-sm transition-transform hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(135deg, ${pal.a}, ${pal.b})`,
                      border: `2px solid ${pal.c}`,
                      boxShadow: `0 0 12px ${pal.a}88`,
                      color: '#FFFFFF',
                    }}
                    aria-label={meta?.label || soc.platform}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {links.map((l: any) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="relative px-4 py-3.5 text-center font-bold tracking-wider uppercase transition-transform hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${profile.bg_color || '#0B0324'}dd, ${pal.a}33)`,
                border: `2px solid ${pal.c}`,
                boxShadow: `inset 0 0 0 1px ${pal.a}, 0 0 16px ${pal.a}66, 0 4px 0 ${pal.a}`,
                color: accent,
                textShadow: `0 0 8px ${accent}`,
                fontSize: 13,
              }}
            >
              {l.title}
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                className={`overflow-hidden ${s.bannerTracking ? 'retro-track' : ''} ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{
                  border: `2px solid ${pal.c}`,
                  boxShadow: `0 0 16px ${pal.a}66`,
                }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : (
              <div key={b.id}>{inner}</div>
            );
          })}

          {videos.map((v: any) => (
            <div key={v.id} style={{ border: `2px solid ${pal.c}`, boxShadow: `0 0 16px ${pal.a}66` }}>
              <div className="relative aspect-video bg-black">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && <div className="px-3 py-2 text-sm font-bold" style={{ color: pal.c, background: '#00000099' }}>{v.title}</div>}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <div
            className="mt-10 text-center text-xs tracking-[0.5em] uppercase"
            style={{ color: pal.c, textShadow: `0 0 8px ${pal.a}` }}
          >
            {s.footerText}
          </div>
        )}

        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
        <div aria-hidden className="h-16" />
      </div>

      <style jsx>{`
        @keyframes retro-grid {
          from { background-position: 0 0; }
          to { background-position: 0 40px; }
        }
        :global(.retro-track) { position: relative; }
        :global(.retro-track)::after {
          content: '';
          position: absolute; inset: 0;
          background: repeating-linear-gradient(0deg, transparent 0 4px, rgba(255,255,255,0.05) 4px 6px);
          mix-blend-mode: screen;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

function PalmSVG({ color }: { color: string }) {
  return (
    <svg width="80" height="180" viewBox="0 0 80 180" fill={color}>
      <rect x="36" y="60" width="6" height="120" rx="3" />
      <path d="M39 60 C 10 50, 4 30, 2 14 C 14 22, 28 36, 39 60 Z" />
      <path d="M39 60 C 70 50, 74 28, 78 12 C 66 22, 52 36, 39 60 Z" />
      <path d="M39 60 C 18 42, 16 20, 14 4 C 26 14, 34 32, 39 60 Z" />
      <path d="M39 60 C 60 42, 62 22, 64 6 C 54 16, 46 32, 39 60 Z" />
    </svg>
  );
}

export default RetrowaveTheme;
