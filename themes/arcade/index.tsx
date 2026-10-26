'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha } from '@/themes/_kit';

const MODES: Record<string, { bg: string; fg: string; accent: string; dim: string }> = {
  classic: { bg: '#0B0B1A', fg: '#FFFFFF', accent: '#FFD400', dim: '#FF3D6E' },
  gameboy: { bg: '#9BBC0F', fg: '#0F380F', accent: '#306230', dim: '#8BAC0F' },
  neon: { bg: '#05010F', fg: '#E6FFFB', accent: '#00F0FF', dim: '#FF00E5' },
  amber: { bg: '#120A00', fg: '#FFB000', accent: '#FFB000', dim: '#FF6A00' },
};

export const arcadeMeta: BioThemeMeta = {
  key: 'arcade',
  name: 'Arcade 8-bit',
  description: 'Fliperama pixelado: fonte 8-bit, tela de tubo com scanlines, barra de vida e botões de “START”.',
  available: true,
  defaults: { bg_color: '#0B0B1A', button_color: '#FFD400', text_color: '#FFFFFF' },
  palettes: { bg: ['#0B0B1A', '#9BBC0F', '#05010F', '#120A00'], accent: ['#FFD400', '#00F0FF', '#FF3D6E', '#306230'], text: ['#FFFFFF', '#0F380F', '#FFB000'] },
  controls: [
    { key: 'mode', label: 'Console', type: 'select', options: [
      { value: 'classic', label: 'Fliperama' }, { value: 'gameboy', label: 'Portátil verde' }, { value: 'neon', label: 'Neon' }, { value: 'amber', label: 'Monitor âmbar' }, { value: 'custom', label: 'Minhas cores' },
    ], default: 'classic', group: 'Cores', category: 'cores' },
    { key: 'scanlines', label: 'Scanlines de TV antiga', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    { key: 'player', label: 'Texto do jogador', type: 'text', default: 'PLAYER 1', maxLength: 14, group: 'Textos', category: 'textos' },
    { key: 'cta', label: 'Texto piscando', type: 'text', default: 'INSERT COIN', maxLength: 18, group: 'Textos', category: 'textos' },
    motionControl(),
    footerControl('Ex: GAME OVER? NUNCA'),
    ...fontControls('pixel', 'pixel'),
  ],
};

export function ArcadeTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, arcadeMeta, 'var(--font-pixel), monospace');
  // "Minhas cores" usa as cores do painel (fundo, destaque e texto)
  const m = s.mode === 'custom' ? { bg, fg: text, accent, dim: alpha(accent, 0.6) } : (MODES[s.mode] || MODES.classic);
  const anim = s.motion !== 'off';
  const px = (c: string) => ({ boxShadow: `0 4px 0 0 ${c}, 0 -4px 0 0 ${c}, 4px 0 0 0 ${c}, -4px 0 0 0 ${c}` });

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative overflow-hidden" style={{ backgroundColor: m.bg, color: m.fg, fontFamily: bodyFont }}>
      {s.scanlines !== false && <div aria-hidden className="absolute inset-0 pointer-events-none z-20" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 4px)' }} />}
      <div className="relative max-w-md mx-auto px-6 pt-12 pb-16">
        <div className="flex justify-between text-[10px] mb-6" style={{ color: m.dim }}>
          <span>{s.player || 'PLAYER 1'}</span><span>HI-SCORE 99999</span>
        </div>
        <header className="flex flex-col items-center text-center mb-8">
          <div className="p-1" style={{ ...px(m.fg), background: m.bg }}>
            <Avatar profile={profile} size={Math.min(profile.avatar_size ?? 88, 96)} shape="square" imgClassName="[image-rendering:pixelated]" />
          </div>
          <h1 className="mt-7 text-[18px] leading-relaxed uppercase" style={{ fontFamily: titleFont, color: m.accent, textShadow: `3px 3px 0 ${m.dim}` }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-3 text-[9px] leading-[1.9] whitespace-pre-line uppercase">{profile.bio}</p>}
          <div className="mt-5 w-full flex items-center gap-2 text-[9px]">
            <span>HP</span>
            <div className="flex-1 h-3 flex gap-[2px]" style={{ ...px(m.fg), background: m.bg }}>
              {Array.from({ length: 10 }).map((_, i) => <span key={i} className="flex-1" style={{ background: i < 8 ? m.accent : 'transparent' }} />)}
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-4 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="ac-press w-11 h-11 flex items-center justify-center" style={{ ...px(m.fg), background: m.bg }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-5 px-1">
                {links.map((l: any) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="ac-press group flex items-center gap-3 px-4 py-3.5" style={{ ...px(m.accent), background: m.bg }}>
                    <span className="text-[12px]" style={{ color: m.accent }}>▶</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11px] leading-relaxed uppercase truncate">{l.title}</span>
                      {l.subtitle && <span className="block text-[8px] mt-1 uppercase truncate" style={{ color: m.dim }}>{l.subtitle}</span>}
                    </span>
                    <span className="text-[8px]" style={{ color: m.accent }}>START</span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-5 px-1" frameStyle={{ ...px(m.fg) }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} className="flex flex-col gap-5 px-1" frameStyle={{ ...px(m.fg) }} captionClassName="px-2 py-3 text-[9px] uppercase" />,
          })}
        </div>
        {s.cta && <p className={`mt-10 text-center text-[11px] ${anim ? 'ac-blink' : ''}`} style={{ color: m.accent }}>{s.cta}</p>}
        <ThemeFooter profile={profile} bg={m.bg} text={s.footerText} className="mt-6 text-center text-[8px] uppercase opacity-80" />
      </div>
      <style jsx>{`
        :global(.ac-blink) { animation: acBlink 1s steps(1) infinite; }
        @keyframes acBlink { 50% { opacity: 0; } }
        :global(.ac-press:hover) { filter: brightness(1.2); }
        :global(.ac-press:active) { transform: translate(2px, 2px); }
        @media (prefers-reduced-motion: reduce) { :global(.ac-blink) { animation: none; } }
      `}</style>
    </div>
  );
}

export default ArcadeTheme;
