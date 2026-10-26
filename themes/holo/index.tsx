'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha } from '@/themes/_kit';

const FOILS: Record<string, string> = {
  prism: '#FF6AD5, #C774E8, #AD8CFF, #8795E8, #94D0FF, #7CFFCB, #FFF07C, #FF6AD5',
  pearl: '#F8F4FF, #E3F6FF, #FFE9F6, #FFF8E1, #E8FFF4, #F8F4FF',
  gold: '#FFF3B0, #E9C46A, #F4A261, #FFE8A3, #D4A373, #FFF3B0',
  ice: '#E0FBFF, #A0E7FF, #C7D2FE, #F0F9FF, #99F6E4, #E0FBFF',
};

export const holoMeta: BioThemeMeta = {
  key: 'holo',
  name: 'Holo Foil',
  description: 'Cartões holográficos iridescentes que mudam de cor com o movimento, como um card colecionável raro.',
  available: true,
  defaults: { bg_color: '#09090F', button_color: '#C774E8', text_color: '#FFFFFF' },
  palettes: {
    bg: ['#09090F', '#000000', '#12101A', '#F5F3FA'],
    accent: ['#C774E8', '#7CFFCB', '#FFF07C', '#94D0FF', '#FF6AD5'],
    text: ['#FFFFFF', '#F4F0FF', '#0B0B12'],
  },
  controls: [
    { key: 'foil', label: 'Tipo de holográfico', type: 'select', options: [
      { value: 'prism', label: 'Prisma' }, { value: 'pearl', label: 'Pérola' }, { value: 'gold', label: 'Ouro' }, { value: 'ice', label: 'Gelo' },
    ], default: 'prism', group: 'Aparência', category: 'cores' },
    { key: 'intensity', label: 'Intensidade do brilho', type: 'slider', min: 20, max: 100, step: 5, suffix: '%', default: 70, group: 'Efeitos', category: 'efeitos' },
    { key: 'radius', label: 'Arredondamento', type: 'slider', min: 8, max: 32, step: 2, suffix: 'px', default: 18, group: 'Layout', category: 'layout' },
    motionControl(),
    footerControl(),
    ...fontControls('syne', 'dmsans'),
  ],
};

export function HoloTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, titleFont, bodyFont, t } = useThemeKit(props, holoMeta, 'var(--font-syne), sans-serif');
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const foil = FOILS[s.foil] || FOILS.prism;
  const intensity = (Number(s.intensity) || 70) / 100;
  const radius = Number(s.radius) || 18;
  const anim = s.motion !== 'off';
  const foilBg = `linear-gradient(${115 + (pos.x - 50) * 0.6}deg, ${foil})`;
  const card = (i: number) => ({
    backgroundImage: `${foilBg}, radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.65), transparent 45%)`,
    backgroundSize: '300% 300%, 100% 100%',
    backgroundPosition: `${(pos.x + i * 13) % 100}% ${pos.y}%, center`,
    borderRadius: radius,
    color: '#111018',
    opacity: 0.55 + intensity * 0.45,
    boxShadow: `0 0 ${24 * intensity}px ${alpha('#FFFFFF', 0.12 * intensity)}, inset 0 0 0 1px rgba(255,255,255,0.6)`,
  });

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (preview) return;
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }

  return (
    <div className="min-h-[max(100%,100vh)] text-left" onPointerMove={onMove} style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-5 pt-14 pb-20">
        <header className="flex flex-col items-center text-center mb-8">
          <div className={`p-[3px] rounded-full ${anim ? 'ho-spin' : ''}`} style={{ backgroundImage: `conic-gradient(${foil})` }}>
            <div className="p-[3px] rounded-full" style={{ background: bg }}><Avatar profile={profile} /></div>
          </div>
          <h1 className="mt-5 text-[30px] font-extrabold tracking-tight ho-text" style={{ fontFamily: titleFont, backgroundImage: `linear-gradient(90deg, ${foil})` }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line" style={{ opacity: 0.75 }}>{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-3">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-2.5 flex-wrap"
                render={({ Icon, label, attrs, index }) => (
                  <a {...attrs} aria-label={label} className="ho-press w-12 h-12 flex items-center justify-center" style={{ ...card(index), borderRadius: 14 }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-3">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className={`ho-press relative flex items-center gap-3 px-4 py-3.5 overflow-hidden ${anim ? 'ho-drift' : ''}`} style={card(i)}>
                    <KitLinkIcon link={l} size={38} radius={radius * 0.6} style={{ background: 'rgba(17,16,24,0.85)', color: '#fff' }} fallback={<Sparkles className="w-4 h-4" />} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-extrabold truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] truncate" style={{ opacity: 0.7 }}>{l.subtitle}</span>}
                    </span>
                    <span className="text-[10px] font-black tracking-[0.2em] opacity-60">#{String(i + 1).padStart(3, '0')}</span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ borderRadius: radius, padding: 3, backgroundImage: `linear-gradient(120deg, ${foil})` }} frameClassName="[&>img]:rounded-[inherit]" />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ borderRadius: radius, border: `2px solid ${alpha(text, 0.3)}` }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.ho-text) { -webkit-background-clip: text; background-clip: text; color: transparent; background-size: 200% 100%; }
        :global(.ho-spin) { animation: hoSpin 8s linear infinite; }
        @keyframes hoSpin { to { filter: hue-rotate(360deg); } }
        :global(.ho-drift) { animation: hoDrift 7s ease-in-out infinite alternate; }
        @keyframes hoDrift { to { filter: hue-rotate(40deg) saturate(1.2); } }
        :global(.ho-press) { transition: transform 220ms cubic-bezier(.2,.8,.2,1); }
        :global(.ho-press:hover) { transform: translateY(-2px) rotate(-0.4deg); }
        :global(.ho-press:active) { transform: scale(0.97); }
        @media (prefers-reduced-motion: reduce) { :global(.ho-spin), :global(.ho-drift) { animation: none; } }
      `}</style>
    </div>
  );
}

export default HoloTheme;
