'use client';

import { ArrowRight } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha } from '@/themes/_kit';

const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>\")";

export const fluxMeta: BioThemeMeta = {
  key: 'flux',
  name: 'Flux',
  description: 'Gradiente fluido que se move como tinta, textura granulada e botões com borda de luz animada.',
  available: true,
  defaults: { bg_color: '#140A2E', button_color: '#FF5E8A', text_color: '#FFFFFF' },
  palettes: {
    bg: ['#140A2E', '#0A1A2E', '#2E0A1A', '#0E0E0E', '#F7F2EC'],
    accent: ['#FF5E8A', '#5EE6FF', '#FFB85E', '#8A5EFF', '#5EFFA8'],
    text: ['#FFFFFF', '#FFF7F0', '#140A2E'],
  },
  controls: [
    { key: 'colorB', label: 'Segunda cor do fluxo', type: 'color', palette: ['#5E6BFF', '#5EE6FF', '#FFB85E', '#8A5EFF', '#5EFFA8'], default: '#5E6BFF', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'colorC', label: 'Terceira cor do fluxo', type: 'color', palette: ['#FFB85E', '#FF5E8A', '#5EE6FF', '#8A5EFF', '#5EFFA8'], default: '#FFB85E', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'speed', label: 'Velocidade do fluxo', type: 'slider', min: 6, max: 40, step: 2, suffix: 's', default: 16, group: 'Efeitos', category: 'efeitos' },
    { key: 'grain', label: 'Textura granulada', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    motionControl(),
    footerControl(),
    ...fontControls('unbounded', 'manrope'),
  ],
};

export function FluxTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, fluxMeta, 'var(--font-unbounded), sans-serif');
  const anim = s.motion !== 'off';
  const speed = (Number(s.speed) || 16) * (s.motion === 'subtle' ? 2 : 1);
  const b = s.colorB || '#5E6BFF';
  const c = s.colorC || '#FFB85E';
  const ring = { background: `linear-gradient(${bg}, ${bg}) padding-box, conic-gradient(from var(--fx-a, 0deg), ${accent}, ${b}, ${c}, ${accent}) border-box`, border: '2px solid transparent' };

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative overflow-hidden" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div aria-hidden className={`absolute -inset-[30%] ${anim ? 'fx-swirl' : ''}`} style={{
        animationDuration: `${speed}s`,
        background: `radial-gradient(35% 30% at 30% 30%, ${accent} 0%, transparent 70%), radial-gradient(30% 35% at 70% 40%, ${b} 0%, transparent 70%), radial-gradient(40% 30% at 45% 75%, ${c} 0%, transparent 70%)`,
        filter: 'blur(40px) saturate(140%)', opacity: 0.85,
      }} />
      {s.grain !== false && <div aria-hidden className="absolute inset-0 mix-blend-overlay opacity-40" style={{ backgroundImage: GRAIN }} />}

      <div className="relative max-w-md mx-auto px-5 pt-16 pb-20">
        <header className="mb-10">
          <Avatar profile={profile} size={Math.min(profile.avatar_size ?? 88, 96)} style={{ boxShadow: `0 0 0 3px ${alpha(text, 0.9)}` }} />
          <h1 className="mt-6 text-[34px] font-bold leading-[1.02] tracking-tight" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line max-w-[340px]" style={{ opacity: 0.85 }}>{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-3">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex gap-2.5 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className={`fx-ring w-12 h-12 rounded-full flex items-center justify-center ${anim ? 'fx-spin' : ''}`} style={ring}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-3">
                {links.map((l: any) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className={`fx-ring group flex items-center gap-3 px-5 py-4 rounded-full ${anim ? 'fx-spin' : ''}`} style={ring}>
                    <KitLinkIcon link={l} size={32} radius={999} style={{ background: alpha(text, 0.12) }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate" style={{ fontFamily: titleFont, fontSize: 15 }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[12px] truncate" style={{ opacity: 0.65 }}>{l.subtitle}</span>}
                    </span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ borderRadius: 28 }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ borderRadius: 28, background: alpha(bg, 0.6) }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        @property --fx-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
        :global(.fx-swirl) { animation: fxSwirl linear infinite; }
        @keyframes fxSwirl { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.15); } 100% { transform: rotate(360deg) scale(1); } }
        :global(.fx-spin) { animation: fxRing 4s linear infinite; }
        @keyframes fxRing { to { --fx-a: 360deg; } }
        :global(.fx-ring) { transition: transform 200ms; }
        :global(.fx-ring:hover) { transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) { :global(.fx-swirl), :global(.fx-spin) { animation: none; } }
      `}</style>
    </div>
  );
}

export default FluxTheme;
