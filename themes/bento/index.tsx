'use client';

import { ArrowUpRight } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, alpha, onColor } from '@/themes/_kit';

export const bentoMeta: BioThemeMeta = {
  key: 'bento',
  name: 'Bento',
  description: 'Grade bento: blocos de tamanhos diferentes, link principal em destaque e tudo organizado como um painel.',
  available: true,
  defaults: { bg_color: '#EFEDE8', button_color: '#FF5B2E', text_color: '#141414' },
  palettes: {
    bg: ['#EFEDE8', '#FFFFFF', '#F3F4F6', '#0E0E10', '#161618', '#E8F0EC'],
    accent: ['#FF5B2E', '#2E5BFF', '#18B26B', '#FFC23D', '#9B5CFF', '#141414'],
    text: ['#141414', '#000000', '#F5F5F5', '#FFFFFF'],
  },
  controls: [
    { key: 'tile', label: 'Cor dos blocos', type: 'color', palette: ['#FFFFFF', '#F7F6F2', '#1C1C1F', '#232326'], default: '#FFFFFF', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'featured', label: 'Primeiro link em destaque', type: 'toggle', default: true, group: 'Layout', category: 'layout' },
    { key: 'columns', label: 'Links por linha', type: 'radio', options: [{ value: '2', label: '2' }, { value: '1', label: '1' }], default: '2', group: 'Layout', category: 'layout' },
    { key: 'radius', label: 'Arredondamento', type: 'slider', min: 8, max: 36, step: 2, suffix: 'px', default: 24, group: 'Layout', category: 'layout' },
    { key: 'gap', label: 'Espaço entre blocos', type: 'slider', min: 6, max: 18, step: 2, suffix: 'px', default: 10, group: 'Layout', category: 'layout' },
    footerControl(),
    ...fontControls('bricolage', 'dmsans'),
  ],
};

export function BentoTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, bentoMeta);
  const radius = Number(s.radius) || 24;
  const gap = Number(s.gap) || 10;
  const tile = s.tile || '#FFFFFF';
  const tileText = onColor(tile);
  const tileStyle = { background: tile, color: tileText, borderRadius: radius, boxShadow: `0 1px 0 ${alpha(tileText, 0.04)}, 0 10px 30px -18px ${alpha('#000000', 0.35)}` };
  const featured = s.featured !== false && links.length > 0;
  const rest = featured ? links.slice(1) : links;
  const cols = s.columns === '1' ? 1 : 2;

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-4 pt-10 pb-16">
        <div className="grid grid-cols-2" style={{ gap }}>
          <header className="col-span-2 p-5 flex items-center gap-4" style={tileStyle}>
            <Avatar profile={profile} size={Math.min(profile.avatar_size ?? 88, 96)} shape="rounded" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight" style={{ fontFamily: titleFont, letterSpacing: '-0.02em' }}>{profile.display_name}</h1>
              {profile.bio && <p className="mt-1 text-sm leading-snug whitespace-pre-line" style={{ opacity: 0.7 }}>{profile.bio}</p>}
            </div>
          </header>

          {orderedSections(sectionOrder, {
            socials: socials?.length ? (
              <div key="socials" className="col-span-2 p-3" style={tileStyle}>
                <SocialRow socials={socials} t={t} className="flex flex-wrap gap-2 justify-between"
                  render={({ Icon, label, attrs }) => (
                    <a {...attrs} aria-label={label} className="bt-press flex-1 min-w-[44px] h-11 flex items-center justify-center" style={{ borderRadius: radius * 0.6, background: alpha(tileText, 0.06) }}>
                      <Icon className="w-5 h-5" />
                    </a>
                  )}
                />
              </div>
            ) : null,
            links: links.length > 0 ? (
              <div key="links" className="col-span-2 grid" style={{ gap, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {featured && (
                  <a {...linkAttrs(links[0].url, t, 'link', links[0].id)} className="bt-press relative overflow-hidden p-5 flex flex-col justify-between min-h-[150px]" style={{ gridColumn: '1 / -1', background: accent, color: onColor(accent), borderRadius: radius }}>
                    <div className="flex items-start justify-between">
                      <KitLinkIcon link={links[0]} size={44} radius={radius * 0.5} style={{ background: alpha(onColor(accent), 0.15) }} />
                      <ArrowUpRight className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[22px] font-extrabold leading-tight" style={{ fontFamily: titleFont }}>{links[0].title}</div>
                      {links[0].subtitle && <div className="text-sm mt-1" style={{ opacity: 0.8 }}>{links[0].subtitle}</div>}
                    </div>
                    <span aria-hidden className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full" style={{ background: alpha(onColor(accent), 0.12) }} />
                  </a>
                )}
                {rest.map((l: any) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className={`bt-press p-4 flex ${cols === 1 ? 'items-center gap-3' : 'flex-col justify-between min-h-[128px]'}`} style={tileStyle}>
                    <KitLinkIcon link={l} size={36} radius={radius * 0.45} style={{ background: alpha(accent, 0.12), color: accent }} />
                    <div className="min-w-0">
                      <div className="font-bold leading-tight line-clamp-2" style={{ fontFamily: titleFont }}>{l.title}</div>
                      {l.subtitle && <div className="text-xs mt-1 truncate" style={{ opacity: 0.6 }}>{l.subtitle}</div>}
                    </div>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="col-span-2 flex flex-col" frameStyle={{ borderRadius: radius }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} className="col-span-2 flex flex-col gap-3" frameStyle={tileStyle} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.bt-press) { transition: transform 200ms cubic-bezier(.2,.8,.2,1); }
        :global(.bt-press:hover) { transform: translateY(-3px); }
        :global(.bt-press:active) { transform: scale(0.97); }
        @media (prefers-reduced-motion: reduce) { :global(.bt-press) { transition: none; } }
      `}</style>
    </div>
  );
}

export default BentoTheme;
