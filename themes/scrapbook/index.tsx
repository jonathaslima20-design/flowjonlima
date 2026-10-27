'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, alpha, buttonControls, exactButton } from '@/themes/_kit';

const SURFACES: Record<string, { bg: string; img?: string; size?: string }> = {
  kraft: { bg: '#C9A57A', img: 'radial-gradient(rgba(90,60,30,0.12) 1px, transparent 1px)', size: '6px 6px' },
  cork: { bg: '#B98A55', img: 'radial-gradient(rgba(60,35,10,0.25) 1.5px, transparent 1.6px), radial-gradient(rgba(255,240,210,0.2) 1px, transparent 1.2px)', size: '9px 9px, 13px 13px' },
  grid: { bg: '#FAFAF5', img: 'linear-gradient(rgba(70,120,200,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(70,120,200,0.18) 1px, transparent 1px)', size: '22px 22px' },
  lined: { bg: '#FFFEF7', img: 'linear-gradient(rgba(70,120,200,0.2) 1px, transparent 1px)', size: '100% 28px' },
};

const NOTES = ['#FFF475', '#FFB7D5', '#B5F0FF', '#C8FFB5', '#FFD3A5'];

export const scrapbookMeta: BioThemeMeta = {
  key: 'scrapbook',
  name: 'Scrapbook',
  description: 'Mural feito à mão: foto polaroid com fita adesiva, bilhetes coloridos, letra cursiva e rabiscos.',
  available: true,
  defaults: { bg_color: '#C9A57A', button_color: '#E63946', text_color: '#2B2118' },
  palettes: { bg: ['#C9A57A', '#B98A55', '#FAFAF5', '#FFFEF7'], accent: ['#E63946', '#2A9D8F', '#264653', '#F4A261'], text: ['#2B2118', '#1A1A1A'] },
  controls: [
    { key: 'surface', label: 'Fundo', type: 'select', options: [
      { value: 'kraft', label: 'Papel kraft' }, { value: 'cork', label: 'Cortiça' }, { value: 'grid', label: 'Caderno quadriculado' }, { value: 'lined', label: 'Caderno pautado' }, { value: 'solid', label: 'Cor de fundo do painel' },
    ], default: 'kraft', group: 'Aparência', category: 'cores' },
    { key: 'caption', label: 'Legenda da foto', type: 'text', default: 'eu ♥', maxLength: 24, group: 'Textos', category: 'textos' },
    { key: 'doodles', label: 'Rabiscos', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    ...buttonControls('#FFF59D', '#2B2118'),
    footerControl('Ex: feito com carinho'),
    ...fontControls('caveat', 'dmsans'),
  ],
};

export function ScrapbookTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, scrapbookMeta, 'var(--font-caveat), cursive');
  const sf = s.surface === 'solid' ? { bg } : (SURFACES[s.surface] || SURFACES.kraft);
  const eb = exactButton(s);
  const tape = (rot: number) => ({ background: alpha('#FFFFFF', 0.55), boxShadow: `0 1px 2px ${alpha('#000', 0.15)}`, transform: `rotate(${rot}deg)` });

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative overflow-hidden" style={{ backgroundColor: sf.bg, backgroundImage: sf.img, backgroundSize: sf.size, color: text, fontFamily: bodyFont }}>
      <div className="relative max-w-md mx-auto px-6 pt-12 pb-16">
        <header className="flex flex-col items-center mb-8">
          <figure className="relative bg-white p-3 pb-10 -rotate-3" style={{ boxShadow: `0 12px 24px -10px ${alpha('#000', 0.45)}` }}>
            <span aria-hidden className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6" style={tape(-4)} />
            {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-44 h-44 object-cover" />}
            <figcaption className="absolute bottom-2 left-0 right-0 text-center text-[24px]" style={{ fontFamily: titleFont, color: '#2B2118' }}>{s.caption}</figcaption>
          </figure>
          <h1 className="mt-6 text-[46px] leading-none rotate-[-1deg]" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-2 text-[15px] text-center leading-relaxed whitespace-pre-line max-w-[320px]">{profile.bio}</p>}
          {s.doodles !== false && (
            <svg aria-hidden viewBox="0 0 120 40" className="w-28 mt-2" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 30 C 20 5, 35 5, 45 25 S 70 40, 80 15 S 105 5, 115 20" />
              <path d="M108 14 l7 6 -9 2" />
            </svg>
          )}
        </header>

        <div className="flex flex-col gap-6">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-3 flex-wrap"
                render={({ Icon, label, attrs, index }) => (
                  <a {...attrs} aria-label={label} className="sb-wiggle w-12 h-12 rounded-full flex items-center justify-center" style={{ background: eb ? eb.bg : NOTES[(index + 2) % NOTES.length], color: eb ? eb.fg : '#2B2118', boxShadow: `0 4px 8px ${alpha('#000', 0.2)}`, transform: `rotate(${index % 2 ? 6 : -6}deg)` }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-6 px-2">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="sb-wiggle relative flex items-center gap-3 px-4 pt-5 pb-4"
                    style={{ background: eb ? eb.bg : NOTES[i % NOTES.length], color: eb ? eb.fg : '#2B2118', boxShadow: `2px 8px 14px -6px ${alpha('#000', 0.4)}`, transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}>
                    <span aria-hidden className="absolute -top-2.5 w-4 h-4 rounded-full" style={{ left: i % 2 ? '85%' : '10%', background: accent, boxShadow: `inset -2px -2px 0 ${alpha('#000', 0.25)}, 0 2px 3px ${alpha('#000', 0.3)}` }} />
                    <KitLinkIcon link={l} size={32} radius={6} style={{ background: alpha('#FFFFFF', 0.6) }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[26px] leading-none truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] mt-1 truncate opacity-75">{l.subtitle}</span>}
                    </span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-6" frameStyle={{ border: '8px solid #FFF', boxShadow: `0 10px 20px -10px ${alpha('#000', 0.45)}`, transform: 'rotate(1deg)' }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} className="flex flex-col gap-6" frameStyle={{ border: '8px solid #FFF', background: '#FFF', boxShadow: `0 10px 20px -10px ${alpha('#000', 0.45)}` }} captionClassName="px-2 pt-2 text-[22px] text-[#2B2118]" captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={sf.bg} text={s.footerText} className="mt-10 text-center text-[22px]" />
      </div>
      <style jsx>{`
        :global(.sb-wiggle) { transition: transform 220ms cubic-bezier(.3,1.6,.5,1); }
        :global(.sb-wiggle:hover) { transform: rotate(0deg) scale(1.03) !important; }
        @media (prefers-reduced-motion: reduce) { :global(.sb-wiggle) { transition: none; } }
      `}</style>
    </div>
  );
}

export default ScrapbookTheme;
