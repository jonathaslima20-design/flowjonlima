'use client';

import type { ReactNode } from 'react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha } from '@/themes/_kit';

export const hudMeta: BioThemeMeta = {
  key: 'hud',
  name: 'HUD',
  description: 'Interface de ficção científica: cantoneiras, linhas de varredura, leituras de sistema e painéis com códigos.',
  available: true,
  defaults: { bg_color: '#050B14', button_color: '#2CF5FF', text_color: '#CFF8FF' },
  palettes: { bg: ['#050B14', '#000000', '#0A0F0A', '#14060A'], accent: ['#2CF5FF', '#39FF14', '#FF3B5C', '#FFB000', '#B48CFF'], text: ['#CFF8FF', '#E6FFE6', '#FFFFFF'] },
  controls: [
    { key: 'scan', label: 'Linha de varredura', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    { key: 'grid', label: 'Grade de fundo', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    { key: 'status', label: 'Status do sistema', type: 'text', default: 'ONLINE', maxLength: 16, group: 'Textos', category: 'textos' },
    motionControl(),
    footerControl('Ex: TRANSMISSÃO ENCERRADA'),
    ...fontControls('jetbrains', 'jetbrains'),
  ],
};

function Frame({ color, children, className = '', style }: { color: string; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const c = (pos: string) => <span aria-hidden className={`absolute w-3 h-3 ${pos}`} style={{ borderColor: color }} />;
  return (
    <div className={`relative ${className}`} style={style}>
      {c('top-0 left-0 border-t-2 border-l-2')}{c('top-0 right-0 border-t-2 border-r-2')}
      {c('bottom-0 left-0 border-b-2 border-l-2')}{c('bottom-0 right-0 border-b-2 border-r-2')}
      {children}
    </div>
  );
}

export function HudTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, hudMeta, 'var(--font-jetbrains), monospace');
  const anim = s.motion !== 'off';
  const panel = { background: alpha(accent, 0.05), border: `1px solid ${alpha(accent, 0.25)}`, boxShadow: `inset 0 0 20px ${alpha(accent, 0.06)}` };

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative overflow-hidden" style={{
      backgroundColor: bg, color: text, fontFamily: bodyFont,
      backgroundImage: s.grid !== false ? `linear-gradient(${alpha(accent, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(accent, 0.07)} 1px, transparent 1px)` : undefined,
      backgroundSize: '28px 28px',
    }}>
      {s.scan !== false && anim && <div aria-hidden className="hd-scan absolute inset-x-0 h-24 pointer-events-none" style={{ background: `linear-gradient(180deg, transparent, ${alpha(accent, 0.12)}, transparent)` }} />}
      <div className="relative max-w-md mx-auto px-5 pt-10 pb-16">
        <div className="flex justify-between text-[10px] tracking-[0.2em] mb-5" style={{ color: accent }}>
          <span>SYS://{(profile.username || 'bio').toUpperCase()}</span>
          <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${anim ? 'hd-pulse' : ''}`} style={{ background: accent }} />{s.status || 'ONLINE'}</span>
        </div>

        <Frame color={accent} className="p-5 mb-6" style={panel}>
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Avatar profile={profile} size={Math.min(profile.avatar_size ?? 80, 88)} shape="square" style={{ filter: 'saturate(0.6) contrast(1.1)' }} />
              <span aria-hidden className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 1px ${accent}`, background: `linear-gradient(transparent 50%, ${alpha(accent, 0.12)} 50%)`, backgroundSize: '100% 4px' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.25em]" style={{ color: alpha(accent, 0.8) }}>IDENT</p>
              <h1 className="text-[20px] font-bold uppercase tracking-wider truncate" style={{ fontFamily: titleFont, color: accent, textShadow: `0 0 12px ${alpha(accent, 0.6)}` }}>{profile.display_name}</h1>
              <div className="mt-2 flex gap-[3px] items-end h-3" aria-hidden>{[3, 5, 7, 9, 11].map(h => <span key={h} className="w-1.5" style={{ height: h, background: accent }} />)}</div>
            </div>
          </div>
          {profile.bio && <p className="mt-4 text-[12px] leading-relaxed whitespace-pre-line" style={{ opacity: 0.85 }}>&gt; {profile.bio}</p>}
        </Frame>

        <div className="flex flex-col gap-4">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex gap-2 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="hd-glow w-11 h-11 flex items-center justify-center" style={{ ...panel, color: accent }}><Icon className="w-5 h-5" /></a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-3">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="hd-glow block">
                    <Frame color={accent} className="flex items-center gap-3 px-4 py-3" style={panel}>
                      <KitLinkIcon link={l} size={30} radius={2} style={{ border: `1px solid ${alpha(accent, 0.5)}`, color: accent }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold uppercase tracking-wider truncate">{l.title}</span>
                        {l.subtitle && <span className="block text-[10px] truncate" style={{ opacity: 0.6 }}>{l.subtitle}</span>}
                      </span>
                      <span className="text-[10px] tracking-widest" style={{ color: accent }}>[{String(i + 1).padStart(2, '0')}]</span>
                    </Frame>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ border: `1px solid ${alpha(accent, 0.4)}` }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={panel} captionClassName="px-3 py-2 text-[11px] uppercase tracking-wider" />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} className="mt-10 text-center text-[10px] tracking-[0.3em] opacity-70" />
      </div>
      <style jsx>{`
        :global(.hd-scan) { animation: hdScan 5s linear infinite; }
        @keyframes hdScan { from { top: -100px; } to { top: 100%; } }
        :global(.hd-pulse) { animation: hdPulse 1.4s ease-in-out infinite; }
        @keyframes hdPulse { 50% { opacity: 0.2; } }
        :global(.hd-glow) { transition: filter 160ms, transform 160ms; }
        :global(.hd-glow:hover) { filter: brightness(1.35) drop-shadow(0 0 8px currentColor); transform: translateX(2px); }
        @media (prefers-reduced-motion: reduce) { :global(.hd-scan), :global(.hd-pulse) { animation: none; } }
      `}</style>
    </div>
  );
}

export default HudTheme;
