'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl, alpha } from '@/themes/_kit';

const PAPER = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23p)'/></svg>\")";

export const kyotoMeta: BioThemeMeta = {
  key: 'kyoto',
  name: 'Kyoto',
  description: 'Minimalismo japonês: papel washi, espaço em branco (ma), nome na vertical e um carimbo hanko vermelho.',
  available: true,
  defaults: { bg_color: '#F4EFE6', button_color: '#B7282E', text_color: '#1F1A17' },
  palettes: {
    bg: ['#F4EFE6', '#FAF7F2', '#EAE3D6', '#1C1A18', '#EDEBE4'],
    accent: ['#B7282E', '#1F1A17', '#3C5A3E', '#2E4A7A', '#A0622D'],
    text: ['#1F1A17', '#2B2522', '#F4EFE6'],
  },
  controls: [
    { key: 'seal', label: 'Texto do carimbo', type: 'text', default: '', placeholder: 'Padrão: suas iniciais', maxLength: 4, group: 'Textos', category: 'textos' },
    { key: 'vertical', label: 'Nome na vertical', type: 'toggle', default: true, group: 'Layout', category: 'layout' },
    { key: 'paper', label: 'Textura de papel', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    footerControl('Ex: obrigado pela visita'),
    ...fontControls('cormorant', 'dmsans'),
  ],
};

function initials(name: string) {
  return (name || '').replace(/[@_.-]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'B';
}

export function KyotoTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, kyotoMeta, 'var(--font-cormorant), Georgia, serif');
  const seal = (s.seal || initials(profile.display_name)).slice(0, 4);
  const vertical = s.vertical !== false;
  const hair = `1px solid ${alpha(text, 0.25)}`;

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, backgroundImage: s.paper !== false ? PAPER : undefined, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-7 pt-16 pb-16">
        <header className={`mb-12 ${vertical ? 'flex gap-6 items-start' : ''}`}>
          {vertical ? (
            <h1 className="text-[34px] leading-none tracking-[0.15em] shrink-0" style={{ fontFamily: titleFont, writingMode: 'vertical-rl', maxHeight: 300 }}>{profile.display_name}</h1>
          ) : null}
          <div className="flex-1 min-w-0">
            <div className="relative inline-block">
              <Avatar profile={profile} size={Math.min(profile.avatar_size ?? 96, 120)} shape="square" style={{ filter: 'saturate(0.85)' }} />
              <span className="absolute -bottom-3 -right-3 w-12 h-12 flex items-center justify-center text-white text-[13px] font-bold leading-none rotate-[-8deg]"
                style={{ background: accent, borderRadius: 6, boxShadow: `0 0 0 2px ${alpha(accent, 0.35)}`, fontFamily: titleFont, letterSpacing: '0.05em' }}>
                {seal}
              </span>
            </div>
            {!vertical && <h1 className="mt-6 text-[36px] leading-tight tracking-wide" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>}
            {profile.bio && <p className="mt-6 text-[14px] leading-[1.9] whitespace-pre-line" style={{ opacity: 0.8 }}>{profile.bio}</p>}
            <svg aria-hidden viewBox="0 0 200 12" className="mt-6 w-40" preserveAspectRatio="none">
              <path d="M2 8 C 40 2, 80 10, 120 5 S 180 4, 198 7" fill="none" stroke={text} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
            </svg>
          </div>
        </header>

        <div className="flex flex-col gap-10">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex gap-5 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="ky-fade" style={{ color: text }}><Icon className="w-5 h-5" /></a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" style={{ borderTop: hair }}>
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="ky-row group flex items-baseline gap-4 py-5" style={{ borderBottom: hair }}>
                    <span className="text-[12px] tracking-[0.3em]" style={{ color: accent }}>{['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i] || i + 1}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[21px] leading-tight tracking-wide" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[12px] mt-1 tracking-wider" style={{ opacity: 0.6 }}>{l.subtitle}</span>}
                    </span>
                    <span className="w-6 h-px transition-all group-hover:w-10" style={{ background: text }} />
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-4" />,
            videos: <VideoList key="videos" videos={videos} preview={preview} captionClassName="pt-2 text-lg tracking-wide" captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} className="mt-14 text-center text-xs tracking-[0.3em] opacity-60" />
      </div>
      <style jsx>{`
        :global(.ky-fade) { opacity: 0.7; transition: opacity 200ms; }
        :global(.ky-fade:hover) { opacity: 1; }
      `}</style>
    </div>
  );
}

export default KyotoTheme;
