'use client';

import { ArrowUpRight } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, onColor, buttonControls, exactButton } from '@/themes/_kit';

const PALETTES: Record<string, string[]> = {
  candy: ['#FF8FC7', '#FFD84D', '#7CE0FF', '#B8F26B', '#C9A7FF'],
  sunset: ['#FF6B4A', '#FFB443', '#FFE5A0', '#FF8FB1', '#7B61FF'],
  mono: ['#FFFFFF', '#F2F2F2', '#FFFFFF', '#E9E9E9', '#FFFFFF'],
  retro: ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#F78C6B'],
};

export const stickerMeta: BioThemeMeta = {
  key: 'sticker',
  name: 'Sticker Pop',
  description: 'Links como adesivos coloridos e tortinhos, com sombra forte, bolha de fala e muito bom humor.',
  available: true,
  defaults: { bg_color: '#FFF6E5', button_color: '#111111', text_color: '#111111' },
  palettes: {
    bg: ['#FFF6E5', '#F0F7FF', '#FFFFFF', '#FFEFF6', '#1A1A1A'],
    accent: ['#111111', '#FF3D7F', '#2B59FF', '#00A86B'],
    text: ['#111111', '#000000', '#FFFFFF'],
  },
  controls: [
    { key: 'palette', label: 'Cores dos adesivos', type: 'select', options: [
      { value: 'candy', label: 'Bala' }, { value: 'sunset', label: 'Pôr do sol' }, { value: 'retro', label: 'Retrô' }, { value: 'mono', label: 'Branco' },
    ], default: 'candy', group: 'Cores', category: 'cores' },
    { key: 'tilt', label: 'Inclinação', type: 'slider', min: 0, max: 4, step: 0.5, suffix: '°', default: 2, group: 'Layout', category: 'layout' },
    { key: 'bubble', label: 'Bolha de fala', type: 'text', default: 'Oi! 👋', maxLength: 18, group: 'Textos', category: 'textos' },
    { key: 'dots', label: 'Fundo pontilhado', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    ...buttonControls('#FFE14D', '#111111'),
    footerControl(),
    ...fontControls('bricolage', 'grotesk'),
  ],
};

export function StickerTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, stickerMeta, 'var(--font-bricolage), sans-serif');
  const colors = PALETTES[s.palette] || PALETTES.candy;
  const eb = exactButton(s);
  const tilt = Number(s.tilt ?? 2);
  const ink = accent;
  const sticker = (i: number) => ({
    background: eb ? eb.bg : colors[i % colors.length],
    color: eb ? eb.fg : onColor(colors[i % colors.length]),
    border: `3px solid ${ink}`,
    boxShadow: `5px 5px 0 ${ink}`,
    borderRadius: 18,
    transform: `rotate(${(i % 2 ? 1 : -1) * tilt}deg)`,
  });

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{
      backgroundColor: bg, color: text, fontFamily: bodyFont,
      backgroundImage: s.dots !== false ? `radial-gradient(${ink}22 1.5px, transparent 1.5px)` : undefined,
      backgroundSize: '18px 18px',
    }}>
      <div className="max-w-md mx-auto px-5 pt-14 pb-16">
        <header className="flex flex-col items-center text-center mb-8">
          <div className="relative">
            {s.bubble && (
              <span className="absolute -top-4 -right-12 z-10 px-3 py-1 text-sm font-black rotate-6 whitespace-nowrap"
                style={{ background: '#FFFFFF', color: '#111', border: `3px solid ${ink}`, borderRadius: 14, boxShadow: `3px 3px 0 ${ink}` }}>
                {s.bubble}
              </span>
            )}
            <div className="rounded-full p-1.5 -rotate-3" style={{ background: colors[0], border: `3px solid ${ink}`, boxShadow: `5px 5px 0 ${ink}` }}>
              <Avatar profile={profile} />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight px-3 py-1 rotate-1" style={{ fontFamily: titleFont, background: colors[1], color: onColor(colors[1]), border: `3px solid ${ink}`, boxShadow: `4px 4px 0 ${ink}`, borderRadius: 12 }}>
            {profile.display_name}
          </h1>
          {profile.bio && <p className="mt-4 text-[15px] font-semibold leading-snug whitespace-pre-line max-w-[320px]">{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-4">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-3 flex-wrap"
                render={({ Icon, label, attrs, index }) => (
                  <a {...attrs} aria-label={label} className="st-pop w-12 h-12 flex items-center justify-center" style={{ ...sticker(index + 2), borderRadius: 9999 }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-4 px-1">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="st-pop flex items-center gap-3 px-4 py-3.5" style={sticker(i)}>
                    <KitLinkIcon link={l} size={36} radius={10} style={{ background: '#FFFFFF', color: '#111', border: `2px solid ${ink}` }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-black text-[17px] truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] font-semibold truncate" style={{ opacity: 0.75 }}>{l.subtitle}</span>}
                    </span>
                    <ArrowUpRight className="w-6 h-6 shrink-0" strokeWidth={3} />
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ border: `3px solid ${ink}`, boxShadow: `5px 5px 0 ${ink}`, borderRadius: 18 }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ border: `3px solid ${ink}`, boxShadow: `5px 5px 0 ${ink}`, borderRadius: 18, background: '#FFF' }} captionClassName="px-4 py-2 font-black text-[#111]" />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.st-pop) { transition: transform 180ms cubic-bezier(.3,1.6,.5,1), box-shadow 180ms; }
        :global(.st-pop:hover) { transform: rotate(0deg) scale(1.03) !important; }
        :global(.st-pop:active) { transform: translate(4px, 4px) !important; box-shadow: 1px 1px 0 currentColor !important; }
        @media (prefers-reduced-motion: reduce) { :global(.st-pop) { transition: none; } }
      `}</style>
    </div>
  );
}

export default StickerTheme;
