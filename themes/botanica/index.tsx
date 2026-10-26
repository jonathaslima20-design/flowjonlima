'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha, onColor } from '@/themes/_kit';

const LEAF = 'M50 5 C 80 25, 90 60, 50 95 C 10 60, 20 25, 50 5 Z';

export const botanicaMeta: BioThemeMeta = {
  key: 'botanica',
  name: 'Botanica',
  description: 'Orgânico e natural: formas que respiram como folhas, tons de terra e botões em formato de seixo.',
  available: true,
  defaults: { bg_color: '#EEF0E5', button_color: '#3F6B4A', text_color: '#1F2E22' },
  palettes: { bg: ['#EEF0E5', '#F6EFE6', '#E9EFEA', '#1D2A20', '#F3E9DC'], accent: ['#3F6B4A', '#B5603A', '#7A8F5A', '#C08A3E', '#4A6670'], text: ['#1F2E22', '#3A2A20', '#F1F4EC'] },
  controls: [
    { key: 'leaves', label: 'Folhas decorativas', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    { key: 'leafColor', label: 'Cor das folhas', type: 'color', palette: ['#9DB89A', '#D9A07B', '#B9C69A', '#E3C79A'], default: '#9DB89A', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'morph', label: 'Formas que se movem', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    motionControl(),
    footerControl('Ex: cultivado com carinho 🌿'),
    ...fontControls('fraunces', 'dmsans'),
  ],
};

const PEBBLES = ['42% 58% 55% 45% / 55% 45% 55% 45%', '58% 42% 45% 55% / 45% 55% 45% 55%', '50% 50% 60% 40% / 40% 60% 40% 60%'];

export function BotanicaTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, botanicaMeta, 'var(--font-fraunces), Georgia, serif');
  const anim = s.motion !== 'off' && s.morph !== false;
  const leaf = s.leafColor || '#9DB89A';
  const fg = onColor(accent);

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative overflow-hidden" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      {s.leaves !== false && (
        <svg aria-hidden className="absolute pointer-events-none" style={{ top: -30, right: -40, width: 220, opacity: 0.55 }} viewBox="0 0 200 200">
          {[0, 35, 70, 115].map((r, i) => <path key={i} d={LEAF} fill={leaf} transform={`translate(${60 + i * 10} ${30 + i * 18}) rotate(${r} 50 50) scale(${0.9 - i * 0.12})`} />)}
        </svg>
      )}
      {s.leaves !== false && (
        <svg aria-hidden className="absolute pointer-events-none" style={{ bottom: 40, left: -50, width: 200, opacity: 0.45 }} viewBox="0 0 200 200">
          {[200, 240, 280].map((r, i) => <path key={i} d={LEAF} fill={leaf} transform={`translate(${30 + i * 20} ${60 - i * 10}) rotate(${r} 50 50) scale(${0.8 - i * 0.1})`} />)}
        </svg>
      )}
      <div className="relative max-w-md mx-auto px-6 pt-14 pb-16">
        <header className="flex flex-col items-center text-center mb-9">
          {profile.avatar_url && (
            <div className={`overflow-hidden ${anim ? 'bt-morph' : ''}`} style={{ width: profile.avatar_size ?? 120, height: profile.avatar_size ?? 120, borderRadius: PEBBLES[0], boxShadow: `0 0 0 6px ${alpha(accent, 0.18)}` }}>
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="mt-6 text-[34px] leading-tight" style={{ fontFamily: titleFont, fontWeight: 600 }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line max-w-[330px]" style={{ opacity: 0.78 }}>{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-4">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-3 flex-wrap"
                render={({ Icon, label, attrs, index }) => (
                  <a {...attrs} aria-label={label} className="bt-grow w-12 h-12 flex items-center justify-center" style={{ background: alpha(accent, 0.12), color: accent, borderRadius: PEBBLES[index % 3] }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-4">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="bt-grow flex items-center gap-4 px-5 py-4" style={{ background: i === 0 ? accent : alpha(accent, 0.1), color: i === 0 ? fg : text, borderRadius: PEBBLES[i % 3].replace(/(\d+)%/g, (_, n) => `${Math.round(Number(n) * 0.6)}px`) }}>
                    <KitLinkIcon link={l} size={36} radius="50%" style={{ background: i === 0 ? alpha(fg, 0.18) : alpha(accent, 0.18), color: i === 0 ? fg : accent }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[17px] truncate" style={{ fontFamily: titleFont, fontWeight: 600 }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] truncate opacity-70">{l.subtitle}</span>}
                    </span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-4" frameStyle={{ borderRadius: 28 }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} className="flex flex-col gap-4" frameStyle={{ borderRadius: 28, background: alpha(accent, 0.08) }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.bt-morph) { animation: btMorph 12s ease-in-out infinite; }
        @keyframes btMorph {
          0%, 100% { border-radius: 42% 58% 55% 45% / 55% 45% 55% 45%; }
          33% { border-radius: 58% 42% 45% 55% / 45% 55% 45% 55%; }
          66% { border-radius: 50% 50% 60% 40% / 40% 60% 40% 60%; }
        }
        :global(.bt-grow) { transition: transform 300ms cubic-bezier(.2,.8,.2,1); }
        :global(.bt-grow:hover) { transform: scale(1.02); }
        @media (prefers-reduced-motion: reduce) { :global(.bt-morph) { animation: none; } :global(.bt-grow) { transition: none; } }
      `}</style>
    </div>
  );
}

export default BotanicaTheme;
