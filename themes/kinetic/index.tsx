'use client';

import { ArrowRight } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, onColor } from '@/themes/_kit';

export const kineticMeta: BioThemeMeta = {
  key: 'kinetic',
  name: 'Kinetic Type',
  description: 'Tipografia em movimento: seu nome gigante correndo em faixas e links em linhas de alto contraste.',
  available: true,
  defaults: { bg_color: '#0A0A0A', button_color: '#D7FF3A', text_color: '#F4F4F0' },
  palettes: {
    bg: ['#0A0A0A', '#F4F4F0', '#1A1AFF', '#FF3D00', '#111111'],
    accent: ['#D7FF3A', '#FF3D00', '#1A1AFF', '#FFFFFF', '#FF2E93'],
    text: ['#F4F4F0', '#0A0A0A', '#FFFFFF'],
  },
  controls: [
    { key: 'speed', label: 'Velocidade das faixas', type: 'slider', min: 10, max: 60, step: 5, suffix: 's', default: 28, group: 'Efeitos', category: 'efeitos' },
    { key: 'outline', label: 'Faixa vazada (só contorno)', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    { key: 'marqueeText', label: 'Texto das faixas', type: 'text', default: '', placeholder: 'Padrão: seu nome', maxLength: 40, group: 'Textos', category: 'textos' },
    motionControl(),
    footerControl(),
    ...fontControls('anton', 'grotesk'),
  ],
};

export function KineticTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, kineticMeta, 'var(--font-anton), Impact, sans-serif');
  const word = (s.marqueeText || profile.display_name || '').toUpperCase();
  const speed = Number(s.speed) || 28;
  const anim = s.motion !== 'off';
  const dur = s.motion === 'subtle' ? speed * 1.8 : speed;
  const strip = Array.from({ length: 6 }, () => word).join('  ✦  ');

  const Marquee = ({ reverse, outline }: { reverse?: boolean; outline?: boolean }) => (
    <div className="overflow-hidden whitespace-nowrap py-1" aria-hidden>
      <div className={`inline-block ${anim ? 'kn-run' : ''}`} style={{ animationDuration: `${dur}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
        <span className="text-[64px] leading-none" style={{ fontFamily: titleFont, color: outline ? 'transparent' : text, WebkitTextStroke: outline ? `1.5px ${text}` : undefined }}>{strip}  ✦  {strip}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-[max(100%,100vh)] text-left overflow-hidden" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="pt-10">
        <Marquee />
        <div style={{ background: accent, color: onColor(accent) }} className="-rotate-2 scale-105 my-2">
          <Marquee reverse outline={false} />
        </div>
        <Marquee outline={s.outline !== false} />
      </div>

      <div className="max-w-md mx-auto px-5 pt-8 pb-16">
        <header className="flex items-end gap-4 mb-8">
          <Avatar profile={profile} size={Math.min(profile.avatar_size ?? 88, 96)} shape="square" style={{ boxShadow: `6px 6px 0 ${accent}` }} />
          <div className="min-w-0">
            <h1 className="text-4xl leading-[0.9] uppercase break-words" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
            {profile.bio && <p className="mt-2 text-sm leading-snug whitespace-pre-line" style={{ opacity: 0.75 }}>{profile.bio}</p>}
          </div>
        </header>

        <div className="flex flex-col gap-6">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex gap-2 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="kn-inv w-11 h-11 flex items-center justify-center" style={{ border: `2px solid ${text}`, ['--kn-fg' as any]: bg, ['--kn-bg' as any]: text }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" style={{ borderTop: `2px solid ${text}` }}>
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="kn-inv group flex items-center gap-4 py-4 px-2"
                    style={{ borderBottom: `2px solid ${text}`, ['--kn-fg' as any]: onColor(accent), ['--kn-bg' as any]: accent }}>
                    <span className="text-sm tabular-nums" style={{ opacity: 0.6 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-2xl uppercase leading-none truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-xs mt-1 truncate" style={{ opacity: 0.7 }}>{l.subtitle}</span>}
                    </span>
                    <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ border: `2px solid ${text}` }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ border: `2px solid ${text}` }} captionClassName="px-3 py-2 text-lg uppercase" captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.kn-run) { animation: knRun linear infinite; }
        @keyframes knRun { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        :global(.kn-inv) { transition: background-color 160ms, color 160ms; }
        :global(.kn-inv:hover) { background: var(--kn-bg); color: var(--kn-fg); }
        @media (prefers-reduced-motion: reduce) { :global(.kn-run) { animation: none; } }
      `}</style>
    </div>
  );
}

export default KineticTheme;
