'use client';

import { ChevronsRight, Trophy } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha, onColor, buttonControls, exactButton } from '@/themes/_kit';

export const esportsMeta: BioThemeMeta = {
  key: 'esports',
  name: 'Esports',
  description: 'Visual de time competitivo: cortes angulares, brilho neon, listras diagonais, patente e botões com reflexo.',
  available: true,
  defaults: { bg_color: '#0B0D12', button_color: '#FF2E4D', text_color: '#F4F6FA' },
  palettes: { bg: ['#0B0D12', '#000000', '#0D0A1A', '#0A1210'], accent: ['#FF2E4D', '#00E5FF', '#B6FF00', '#FFB800', '#8A5CFF'], text: ['#F4F6FA', '#FFFFFF'] },
  controls: [
    { key: 'cut', label: 'Corte dos cantos', type: 'slider', min: 0, max: 24, step: 2, suffix: 'px', default: 14, group: 'Layout', category: 'layout' },
    { key: 'glow', label: 'Brilho neon', type: 'slider', min: 0, max: 100, step: 10, suffix: '%', default: 60, group: 'Efeitos', category: 'efeitos' },
    { key: 'rank', label: 'Patente / título', type: 'text', default: 'PRO PLAYER', maxLength: 20, group: 'Textos', category: 'textos' },
    { key: 'tag', label: 'Tag do time', type: 'text', default: '', placeholder: 'Ex: [BFZ]', maxLength: 8, group: 'Textos', category: 'textos' },
    ...buttonControls('#1A1F2B', '#F4F6FA'),
    motionControl(),
    footerControl('Ex: GG WP'),
    ...fontControls('anton', 'grotesk'),
  ],
};

export function EsportsTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, esportsMeta, 'var(--font-anton), Impact, sans-serif');
  const c = Number(s.cut ?? 14);
  const g = (Number(s.glow ?? 60) / 100);
  const anim = s.motion !== 'off';
  const eb = exactButton(s);
  const clip = `polygon(${c}px 0, 100% 0, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, 0 100%, 0 ${c}px)`;
  const glow = `0 0 ${24 * g}px ${alpha(accent, 0.55 * g)}`;

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative overflow-hidden" style={{
      backgroundColor: bg, color: text, fontFamily: bodyFont,
      backgroundImage: `repeating-linear-gradient(-45deg, ${alpha(text, 0.03)} 0 2px, transparent 2px 14px), radial-gradient(80% 50% at 50% 0%, ${alpha(accent, 0.25)} 0%, transparent 70%)`,
    }}>
      <div className="max-w-md mx-auto px-5 pt-12 pb-16">
        <header className="flex flex-col items-center text-center mb-8">
          <div className="p-[3px]" style={{ background: accent, clipPath: clip, filter: `drop-shadow(${glow})` }}>
            <div style={{ clipPath: clip }}><Avatar profile={profile} shape="square" /></div>
          </div>
          <div className="mt-5 flex items-center gap-2">
            {s.tag && <span className="text-[22px]" style={{ fontFamily: titleFont, color: accent }}>{s.tag}</span>}
            <h1 className="text-[34px] uppercase leading-none tracking-wide" style={{ fontFamily: titleFont, textShadow: glow }}>{profile.display_name}</h1>
          </div>
          {s.rank && (
            <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-[0.25em]" style={{ background: accent, color: onColor(accent), clipPath: `polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)` }}>
              <Trophy className="w-3.5 h-3.5" />{s.rank}
            </span>
          )}
          {profile.bio && <p className="mt-4 text-[14px] leading-relaxed whitespace-pre-line opacity-80">{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-3">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-2 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="es-hit w-12 h-12 flex items-center justify-center" style={{ background: alpha(text, 0.08), clipPath: clip }}><Icon className="w-5 h-5" /></a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-3">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className={`es-hit relative flex items-center gap-3 px-4 py-3.5 overflow-hidden ${anim ? 'es-sheen' : ''}`}
                    style={{ background: eb ? eb.bg : i === 0 ? accent : alpha(text, 0.07), color: eb ? eb.fg : i === 0 ? onColor(accent) : text, clipPath: clip, borderLeft: i === 0 ? undefined : `3px solid ${accent}` }}>
                    <KitLinkIcon link={l} size={34} radius={0} style={{ background: i === 0 ? alpha(onColor(accent), 0.18) : alpha(accent, 0.18), color: i === 0 ? onColor(accent) : accent }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[18px] uppercase tracking-wide truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[12px] truncate opacity-75">{l.subtitle}</span>}
                    </span>
                    <ChevronsRight className="w-6 h-6" />
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ clipPath: clip }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ clipPath: clip, background: alpha(text, 0.06) }} captionClassName="px-3 py-2 text-lg uppercase" captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} className="mt-10 text-center text-sm uppercase tracking-[0.3em] opacity-70" />
      </div>
      <style jsx>{`
        :global(.es-sheen)::after { content: ''; position: absolute; top: 0; bottom: 0; width: 40%; left: -60%; transform: skewX(-20deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent); animation: esSheen 3.6s ease-in-out infinite; }
        @keyframes esSheen { 0%, 60% { left: -60%; } 100% { left: 130%; } }
        :global(.es-hit) { transition: transform 150ms, filter 150ms; }
        :global(.es-hit:hover) { transform: translateX(4px); filter: brightness(1.15); }
        :global(.es-hit:active) { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) { :global(.es-sheen)::after { animation: none; display: none; } }
      `}</style>
    </div>
  );
}

export default EsportsTheme;
