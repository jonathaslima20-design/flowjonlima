'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, onColor } from '@/themes/_kit';

const LAYERS: Record<string, string[]> = {
  ocean: ['#0B3C5D', '#1D6A96', '#3FA3C9', '#8ED1E8'],
  sunset: ['#5B1A3A', '#A4295B', '#E2566B', '#F9A26C'],
  forest: ['#1B3B2F', '#2F6B4F', '#5FA36B', '#B6D98A'],
  candy: ['#4A2A7A', '#8A4FD0', '#E070C8', '#FFB6D9'],
};

export const papercutMeta: BioThemeMeta = {
  key: 'papercut',
  name: 'Papercut',
  description: 'Camadas de papel recortado: ondas sobrepostas no topo e botões com sombras em degraus de cor.',
  available: true,
  defaults: { bg_color: '#F7F3EC', button_color: '#E2566B', text_color: '#2A1A24' },
  palettes: { bg: ['#F7F3EC', '#FFFFFF', '#EEF6F9', '#1E1420'], accent: ['#E2566B', '#1D6A96', '#2F6B4F', '#8A4FD0'], text: ['#2A1A24', '#0B2233', '#FFFFFF'] },
  controls: [
    { key: 'layers', label: 'Paleta das camadas', type: 'select', options: [
      { value: 'sunset', label: 'Pôr do sol' }, { value: 'ocean', label: 'Oceano' }, { value: 'forest', label: 'Floresta' }, { value: 'candy', label: 'Doce' },
    ], default: 'sunset', group: 'Cores', category: 'cores' },
    { key: 'depth', label: 'Profundidade das camadas', type: 'slider', min: 2, max: 8, step: 1, suffix: 'px', default: 4, group: 'Efeitos', category: 'efeitos' },
    footerControl(),
    ...fontControls('syne', 'dmsans'),
  ],
};

export function PapercutTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, titleFont, bodyFont, t } = useThemeKit(props, papercutMeta, 'var(--font-syne), sans-serif');
  const L = LAYERS[s.layers] || LAYERS.sunset;
  const d = Number(s.depth) || 4;
  const stack = (base: number) => ({
    boxShadow: [1, 2, 3].map(k => `${d * k}px ${d * k}px 0 ${L[(base + k) % 4]}`).join(', '),
  });

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="relative h-56 overflow-hidden" aria-hidden>
        {L.map((c, i) => (
          <svg key={i} className="absolute left-0 w-full" style={{ top: i * 26 - 10, filter: `drop-shadow(0 6px 6px rgba(0,0,0,0.18))` }} viewBox="0 0 400 120" preserveAspectRatio="none" height="140">
            <path d={`M0 0 H400 V${70 + (i % 2) * 15} C 300 ${110 - i * 6}, 220 ${40 + i * 8}, 120 ${85 - i * 4} S 20 ${60 + i * 5}, 0 ${80 - i * 3} Z`} fill={c} />
          </svg>
        ))}
      </div>
      <div className="max-w-md mx-auto px-6 -mt-24 pb-16 relative">
        <header className="flex flex-col items-center text-center mb-9">
          <div className="rounded-full p-1.5" style={{ background: bg, ...stack(0) }}><Avatar profile={profile} /></div>
          <h1 className="mt-6 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line opacity-80">{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-6">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-4 flex-wrap"
                render={({ Icon, label, attrs, index }) => (
                  <a {...attrs} aria-label={label} className="pc-press w-12 h-12 rounded-full flex items-center justify-center" style={{ background: L[3], color: onColor(L[3]), ...stack(index) }}><Icon className="w-5 h-5" /></a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-6 pr-3">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="pc-press flex items-center gap-3 px-5 py-4 rounded-2xl" style={{ background: '#FFFFFF', color: '#2A1A24', ...stack(i) }}>
                    <KitLinkIcon link={l} size={36} radius={10} style={{ background: L[i % 4], color: onColor(L[i % 4]) }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-extrabold truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] truncate opacity-65">{l.subtitle}</span>}
                    </span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-6 pr-3" frameStyle={{ borderRadius: 16, ...stack(1) }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} className="flex flex-col gap-6 pr-3" frameStyle={{ borderRadius: 16, background: '#FFF', color: '#2A1A24', ...stack(2) }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.pc-press) { transition: transform 160ms, box-shadow 160ms; }
        :global(.pc-press:hover) { transform: translate(-2px, -2px); }
        :global(.pc-press:active) { transform: translate(${d * 2}px, ${d * 2}px); box-shadow: none !important; }
      `}</style>
    </div>
  );
}

export default PapercutTheme;
