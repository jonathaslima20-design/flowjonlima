'use client';

import { ArrowUpRight } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl, alpha, onColor } from '@/themes/_kit';

export const swissMeta: BioThemeMeta = {
  key: 'swiss',
  name: 'Swiss Grid',
  description: 'Estilo tipográfico internacional: grade rigorosa, tipografia grande alinhada à esquerda e um bloco de cor marcante.',
  available: true,
  defaults: { bg_color: '#FFFFFF', button_color: '#E30613', text_color: '#111111' },
  palettes: {
    bg: ['#FFFFFF', '#F2F0EB', '#111111', '#E30613'],
    accent: ['#E30613', '#0047FF', '#FFCC00', '#111111', '#00A651'],
    text: ['#111111', '#000000', '#FFFFFF'],
  },
  controls: [
    { key: 'grid', label: 'Linhas da grade visíveis', type: 'toggle', default: true, group: 'Layout', category: 'layout' },
    { key: 'block', label: 'Bloco de cor', type: 'radio', options: [{ value: 'top', label: 'No topo' }, { value: 'side', label: 'Na lateral' }, { value: 'none', label: 'Sem bloco' }], default: 'top', group: 'Layout', category: 'layout' },
    { key: 'kicker', label: 'Texto pequeno do topo', type: 'text', default: 'Perfil / Links', maxLength: 30, group: 'Textos', category: 'textos' },
    footerControl(),
    ...fontControls('inter', 'inter'),
  ],
};

export function SwissTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, swissMeta);
  const line = alpha(text, 0.9);
  const gridBg = s.grid !== false ? `repeating-linear-gradient(90deg, ${alpha(text, 0.06)} 0 1px, transparent 1px 25%)` : undefined;

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative" style={{ backgroundColor: bg, backgroundImage: gridBg, color: text, fontFamily: bodyFont }}>
      {s.block === 'side' && <div aria-hidden className="absolute left-0 top-0 bottom-0 w-3" style={{ background: accent }} />}
      {s.block !== 'side' && s.block !== 'none' && <div aria-hidden className="h-24" style={{ background: accent }} />}
      <div className="max-w-md mx-auto px-6 pt-8 pb-16">
        <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider pb-2" style={{ borderBottom: `2px solid ${line}` }}>
          <span>{s.kicker}</span><span>{new Date().getFullYear()}</span>
        </div>
        <header className="pt-6 pb-8 grid grid-cols-4 gap-x-3">
          <h1 className="col-span-4 text-[48px] font-black leading-[0.92] tracking-[-0.04em] break-words" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
          <div className="col-span-1 mt-5"><Avatar profile={profile} size={64} shape="square" /></div>
          {profile.bio && <p className="col-span-3 mt-5 text-[15px] leading-snug whitespace-pre-line font-medium">{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-8">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="grid grid-cols-4"
                render={({ Icon, label, attrs, index }) => (
                  <a {...attrs} aria-label={label} className="sw-inv h-12 flex items-center justify-center" style={{ borderTop: `2px solid ${line}`, borderLeft: index % 4 ? `2px solid ${line}` : undefined, ['--sw-bg' as any]: accent, ['--sw-fg' as any]: onColor(accent) }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" style={{ borderTop: `2px solid ${line}` }}>
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="sw-inv grid grid-cols-[2.5rem_1fr_auto] items-start gap-2 py-4 px-1" style={{ borderBottom: `1px solid ${line}`, ['--sw-bg' as any]: accent, ['--sw-fg' as any]: onColor(accent) }}>
                    <span className="text-[13px] font-bold tabular-nums pt-1">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="block text-[20px] font-bold leading-tight tracking-tight" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] mt-0.5 opacity-70">{l.subtitle}</span>}
                    </span>
                    <ArrowUpRight className="w-6 h-6" strokeWidth={2.5} />
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ border: `2px solid ${line}` }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ border: `2px solid ${line}` }} captionClassName="px-2 py-2 text-[15px] font-bold" />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.sw-inv) { transition: background-color 120ms, color 120ms; }
        :global(.sw-inv:hover) { background: var(--sw-bg); color: var(--sw-fg); }
      `}</style>
    </div>
  );
}

export default SwissTheme;
