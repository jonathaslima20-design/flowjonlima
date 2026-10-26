'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, alpha } from '@/themes/_kit';

const ENVIRONMENTS: Record<string, string> = {
  dawn: 'radial-gradient(120% 80% at 10% 0%, #FFD6A5 0%, transparent 55%), radial-gradient(100% 70% at 100% 30%, #B5A8FF 0%, transparent 60%), linear-gradient(180deg, #F7E6D8 0%, #D9D4F2 100%)',
  dusk: 'radial-gradient(120% 80% at 0% 0%, #6E4BD8 0%, transparent 55%), radial-gradient(100% 80% at 100% 40%, #F06A8A 0%, transparent 60%), linear-gradient(180deg, #1B1532 0%, #2B1730 100%)',
  ocean: 'radial-gradient(120% 80% at 0% 0%, #3FD0E0 0%, transparent 55%), radial-gradient(100% 80% at 100% 50%, #2A66F0 0%, transparent 60%), linear-gradient(180deg, #0D2A3A 0%, #0A1830 100%)',
  forest: 'radial-gradient(120% 80% at 0% 0%, #9AE6B4 0%, transparent 55%), radial-gradient(100% 80% at 100% 50%, #2F855A 0%, transparent 60%), linear-gradient(180deg, #13281E 0%, #0B1A14 100%)',
};

export const spatialMeta: BioThemeMeta = {
  key: 'spatial',
  name: 'Spatial',
  description: 'Interface espacial: painéis de vidro flutuando em camadas de profundidade que seguem o movimento do cursor.',
  available: true,
  defaults: { bg_color: '#1B1532', button_color: '#FFFFFF', text_color: '#FFFFFF' },
  palettes: {
    bg: ['#1B1532', '#0A1830', '#F7E6D8', '#0B1A14'],
    accent: ['#FFFFFF', '#B5A8FF', '#3FD0E0', '#F06A8A', '#9AE6B4'],
    text: ['#FFFFFF', '#F5F3FF', '#1A1530'],
  },
  controls: [
    { key: 'environment', label: 'Ambiente', type: 'select', options: [
      { value: 'dusk', label: 'Entardecer' }, { value: 'dawn', label: 'Amanhecer' }, { value: 'ocean', label: 'Oceano' }, { value: 'forest', label: 'Floresta' },
    ], default: 'dusk', group: 'Aparência', category: 'cores' },
    { key: 'depth', label: 'Profundidade 3D', type: 'slider', min: 0, max: 14, step: 1, suffix: '°', default: 8, group: 'Efeitos', category: 'efeitos' },
    { key: 'radius', label: 'Arredondamento', type: 'slider', min: 18, max: 44, step: 2, suffix: 'px', default: 32, group: 'Layout', category: 'layout' },
    footerControl(),
    ...fontControls('manrope', 'manrope'),
  ],
};

export function SpatialTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, spatialMeta, 'var(--font-manrope), system-ui, sans-serif');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const depth = Number(s.depth ?? 8);
  const radius = Number(s.radius) || 32;
  const env = ENVIRONMENTS[s.environment] || ENVIRONMENTS.dusk;
  const panel = {
    background: alpha(text, 0.12),
    backdropFilter: 'blur(30px) saturate(160%)',
    WebkitBackdropFilter: 'blur(30px) saturate(160%)',
    border: `1px solid ${alpha(text, 0.2)}`,
    boxShadow: `inset 0 1px 1px ${alpha('#FFFFFF', 0.35)}, 0 30px 60px -30px ${alpha('#000000', 0.55)}`,
  };
  const layer = (z: number) => ({
    transform: `perspective(900px) rotateX(${(-tilt.y * depth).toFixed(2)}deg) rotateY(${(tilt.x * depth).toFixed(2)}deg) translateZ(${z}px)`,
    transition: 'transform 300ms cubic-bezier(.2,.8,.2,1)',
  });

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (preview || !depth) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  }

  return (
    <div className="min-h-[max(100%,100vh)] text-left" onPointerMove={onMove} onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      style={{ backgroundColor: bg, backgroundImage: env, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-5 pt-16 pb-20" style={{ transformStyle: 'preserve-3d' }}>
        <header className="flex flex-col items-center text-center p-6 mb-5" style={{ ...panel, borderRadius: radius, ...layer(40) }}>
          <div className="p-1 rounded-full" style={{ background: alpha(text, 0.25), boxShadow: `0 20px 40px -18px ${alpha('#000000', 0.6)}` }}>
            <Avatar profile={profile} />
          </div>
          <h1 className="mt-4 text-[26px] font-bold tracking-tight" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line" style={{ opacity: 0.78 }}>{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-3">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-2.5 flex-wrap"
                render={({ Icon, label, attrs, index }) => (
                  <a {...attrs} aria-label={label} className="sp-hover w-12 h-12 rounded-full flex items-center justify-center" style={{ ...panel, ...layer(24 + index * 2) }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-3">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="sp-hover flex items-center gap-3 p-3 pr-4" style={{ ...panel, borderRadius: radius, ...layer(30 - i * 3) }}>
                    <KitLinkIcon link={l} size={44} radius={radius * 0.6} style={{ background: alpha(accent, 0.9), color: accent === '#FFFFFF' ? '#1B1532' : '#FFFFFF' }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-[16px] truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] truncate" style={{ opacity: 0.65 }}>{l.subtitle}</span>}
                    </span>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: alpha(text, 0.15) }}><ChevronRight className="w-4 h-4" /></span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ ...panel, borderRadius: radius, ...layer(20) }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ ...panel, borderRadius: radius, ...layer(20) }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.sp-hover:hover) { filter: brightness(1.12); }
        :global(.sp-hover:active) { filter: brightness(0.95); }
      `}</style>
    </div>
  );
}

export default SpatialTheme;
