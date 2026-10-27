'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, alpha, buttonControls, exactButton } from '@/themes/_kit';

const PASTELS: Record<string, string[]> = {
  peach: ['#FFD8C2', '#FFC6D9', '#D9E7FF', '#D7F5E4'],
  mint: ['#C9F2E3', '#D6EBFF', '#FFF1C9', '#F3D9FF'],
  lilac: ['#E4D9FF', '#FFD9EC', '#D9F3FF', '#FFF0D9'],
  butter: ['#FFF0B8', '#FFD6B8', '#C8EFD9', '#D3E1FF'],
};

export const clayMeta: BioThemeMeta = {
  key: 'clay',
  name: 'Clay',
  description: 'Claymorphism: botões fofos em 3D, cores pastel e sombras macias que parecem massinha.',
  available: true,
  defaults: { bg_color: '#F4EEFF', button_color: '#6C4CF5', text_color: '#2A2340' },
  palettes: {
    bg: ['#F4EEFF', '#FFF4EC', '#EAFBF3', '#FFFBEA', '#EEF4FF'],
    accent: ['#6C4CF5', '#FF6B9A', '#18B67A', '#FF9F43', '#2D8CFF'],
    text: ['#2A2340', '#1F2937', '#3B2F2F'],
  },
  controls: [
    { key: 'pastel', label: 'Tons pastel', type: 'select', options: [
      { value: 'lilac', label: 'Lilás' }, { value: 'peach', label: 'Pêssego' }, { value: 'mint', label: 'Menta' }, { value: 'butter', label: 'Manteiga' },
    ], default: 'lilac', group: 'Cores', category: 'cores' },
    { key: 'puff', label: 'Volume (3D)', type: 'slider', min: 2, max: 14, step: 1, suffix: '', default: 8, group: 'Efeitos', category: 'efeitos' },
    { key: 'radius', label: 'Arredondamento', type: 'slider', min: 18, max: 40, step: 2, suffix: 'px', default: 30, group: 'Layout', category: 'layout' },
    ...buttonControls('#FFFFFF', '#2A2340'),
    footerControl(),
    ...fontControls('bricolage', 'dmsans'),
  ],
};

export function ClayTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, clayMeta, 'var(--font-bricolage), sans-serif');
  const tones = PASTELS[s.pastel] || PASTELS.lilac;
  const eb = exactButton(s);
  const puff = Number(s.puff) || 8;
  const radius = Number(s.radius) || 30;
  const clay = (color: string) => ({
    background: color,
    borderRadius: radius,
    boxShadow: `${puff * 1.4}px ${puff * 1.6}px ${puff * 3}px ${alpha('#5B4B8A', 0.22)}, inset -${puff * 0.8}px -${puff}px ${puff * 1.4}px ${alpha('#000000', 0.08)}, inset ${puff * 0.8}px ${puff}px ${puff * 1.4}px ${alpha('#FFFFFF', 0.85)}`,
  });

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-6 pt-14 pb-16">
        <header className="flex flex-col items-center text-center mb-10">
          <div className="p-2.5 rounded-full" style={{ ...clay(tones[0]), borderRadius: 9999 }}>
            <Avatar profile={profile} />
          </div>
          <h1 className="mt-6 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line" style={{ opacity: 0.75 }}>{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-5">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-4 flex-wrap"
                render={({ Icon, label, attrs, index }) => (
                  <a {...attrs} aria-label={label} className="cl-squish w-14 h-14 flex items-center justify-center" style={{ ...clay(eb ? eb.bg : tones[(index + 1) % tones.length]), borderRadius: 20, color: eb?.fg }}>
                    <Icon className="w-6 h-6" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-5">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="cl-squish flex items-center gap-4 px-5 py-4" style={{ ...clay(eb ? eb.bg : tones[i % tones.length]), color: eb?.fg }}>
                    <KitLinkIcon link={l} size={42} radius={radius * 0.5} style={{ ...clay(accent), borderRadius: radius * 0.5, color: '#FFF', boxShadow: `inset 3px 3px 6px ${alpha('#FFFFFF', 0.45)}, inset -3px -3px 6px ${alpha('#000000', 0.2)}` }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-extrabold text-[17px] truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] truncate" style={{ opacity: 0.65 }}>{l.subtitle}</span>}
                    </span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-5" frameStyle={{ ...clay(tones[0]), padding: 8 }} frameClassName="[&>img]:rounded-[inherit]" />,
            videos: <VideoList key="videos" videos={videos} preview={preview} className="flex flex-col gap-5" frameStyle={clay(tones[1])} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.cl-squish) { transition: transform 260ms cubic-bezier(.3,1.7,.5,1); }
        :global(.cl-squish:hover) { transform: translateY(-3px) scale(1.015); }
        :global(.cl-squish:active) { transform: scale(0.95, 0.92); }
        @media (prefers-reduced-motion: reduce) { :global(.cl-squish) { transition: none; } }
      `}</style>
    </div>
  );
}

export default ClayTheme;
