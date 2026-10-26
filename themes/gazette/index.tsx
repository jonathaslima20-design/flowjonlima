'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl, alpha } from '@/themes/_kit';

export const gazetteMeta: BioThemeMeta = {
  key: 'gazette',
  name: 'Gazeta',
  description: 'Jornal impresso: manchete com seu nome, foto em retícula, colunas de notícias e “leia mais” em cada link.',
  available: true,
  defaults: { bg_color: '#F1EBDD', button_color: '#111111', text_color: '#161412' },
  palettes: { bg: ['#F1EBDD', '#FFFFFF', '#E8E1CF', '#161412'], accent: ['#111111', '#A11D1D', '#1F3A93'], text: ['#161412', '#000000', '#F1EBDD'] },
  controls: [
    { key: 'paper', label: 'Nome do jornal', type: 'text', default: '', placeholder: 'Padrão: The <seu nome> Times', maxLength: 30, group: 'Textos', category: 'textos' },
    { key: 'edition', label: 'Linha da edição', type: 'text', default: 'Edição extra · Grátis', maxLength: 36, group: 'Textos', category: 'textos' },
    { key: 'halftone', label: 'Foto em retícula (P&B)', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    { key: 'columns', label: 'Links em duas colunas', type: 'toggle', default: true, group: 'Layout', category: 'layout' },
    footerControl(),
    ...fontControls('playfair', 'cormorant'),
  ],
};

export function GazetteTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, gazetteMeta, 'var(--font-playfair), Georgia, serif');
  const name = s.paper || `The ${(profile.display_name || '').replace(/^@/, '')} Times`;
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const rule = `1px solid ${text}`;
  const cols = s.columns !== false;

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-5 pt-8 pb-16">
        <div className="text-center pb-2" style={{ borderBottom: `3px double ${text}` }}>
          <h2 className="text-[34px] leading-none tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontWeight: 900 }}>{name}</h2>
        </div>
        <div className="flex justify-between text-[10px] uppercase tracking-wider py-1.5 capitalize" style={{ borderBottom: rule }}>
          <span>{today}</span><span>{s.edition}</span>
        </div>

        <header className="pt-5 pb-5" style={{ borderBottom: rule }}>
          <h1 className="text-[38px] leading-[0.95] font-black" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
          {profile.avatar_url && (
            <figure className="mt-4">
              <div className="relative overflow-hidden">
                <img src={profile.avatar_url} alt="" className="w-full aspect-[4/3] object-cover" style={{ filter: s.halftone !== false ? 'grayscale(1) contrast(1.35) brightness(1.05)' : undefined }} />
                {s.halftone !== false && <span aria-hidden className="absolute inset-0 mix-blend-multiply" style={{ backgroundImage: `radial-gradient(${alpha('#000', 0.55)} 0.9px, transparent 1.2px)`, backgroundSize: '4px 4px' }} />}
              </div>
              <figcaption className="text-[11px] italic mt-1 opacity-70">Foto: arquivo pessoal</figcaption>
            </figure>
          )}
          {profile.bio && <p className="mt-3 text-[16px] leading-snug whitespace-pre-line first-line:uppercase first-line:tracking-wide">{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-6 pt-5">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] uppercase tracking-wider"
                render={({ Icon, label, attrs }) => (<a {...attrs} className="inline-flex items-center gap-1 underline underline-offset-2"><Icon className="w-3.5 h-3.5" />{label}</a>)}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className={cols ? 'grid grid-cols-2' : 'flex flex-col'}>
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="gz-art block py-3"
                    style={cols ? { paddingRight: i % 2 === 0 ? 12 : 0, paddingLeft: i % 2 ? 12 : 0, borderLeft: i % 2 ? rule : undefined, borderBottom: rule } : { borderBottom: rule }}>
                    <span className="block text-[10px] uppercase tracking-[0.2em]" style={{ color: accent }}>{['Destaque', 'Exclusivo', 'Imperdível', 'Agora', 'Novidade'][i % 5]}</span>
                    <span className="block mt-1 text-[19px] leading-tight font-bold" style={{ fontFamily: titleFont }}>{l.title}</span>
                    {l.subtitle && <span className="block mt-1 text-[13px] leading-snug opacity-80">{l.subtitle}</span>}
                    <span className="block mt-2 text-[11px] uppercase tracking-wider font-bold">Leia mais →</span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ border: rule, filter: 'grayscale(0.4)' }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ border: rule }} captionClassName="pt-2 text-[15px] font-bold" captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.gz-art:hover span:nth-child(2)) { text-decoration: underline; text-underline-offset: 3px; }
      `}</style>
    </div>
  );
}

export default GazetteTheme;
