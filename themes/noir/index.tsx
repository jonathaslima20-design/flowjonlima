'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl } from '@/themes/_kit';

const METALS: Record<string, string> = {
  gold: 'linear-gradient(110deg, #8A6A2F 0%, #F3E2A9 22%, #B88A3B 40%, #FFF3C4 55%, #9C7533 75%, #E8CF8A 100%)',
  silver: 'linear-gradient(110deg, #6E7378 0%, #F2F4F6 22%, #9CA3A9 40%, #FFFFFF 55%, #7D838A 75%, #DADFE3 100%)',
  rose: 'linear-gradient(110deg, #8C5A4E 0%, #F7D7C9 22%, #B97A68 40%, #FFE8DE 55%, #9A6352 75%, #E9B9A6 100%)',
};

export const noirMeta: BioThemeMeta = {
  key: 'noir',
  name: 'Noir Luxe',
  description: 'Luxo discreto: preto profundo, letras em folha de ouro, linhas finas e muito espaço, como uma grife.',
  available: true,
  defaults: { bg_color: '#0A0908', button_color: '#C9A75D', text_color: '#EDE6D6' },
  palettes: { bg: ['#0A0908', '#000000', '#14110E', '#0E1012', '#F3EEE4'], accent: ['#C9A75D', '#C0C4C8', '#C99382'], text: ['#EDE6D6', '#FFFFFF', '#1A1612'] },
  controls: [
    { key: 'metal', label: 'Metal', type: 'radio', options: [{ value: 'gold', label: 'Ouro' }, { value: 'silver', label: 'Prata' }, { value: 'rose', label: 'Ouro rosé' }], default: 'gold', group: 'Cores', category: 'cores' },
    { key: 'ornaments', label: 'Ornamentos', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    { key: 'monogram', label: 'Monograma', type: 'text', default: '', placeholder: 'Ex: MC', maxLength: 3, group: 'Textos', category: 'textos' },
    footerControl('Ex: Atendimento exclusivo'),
    ...fontControls('cormorant', 'cormorant'),
  ],
};

export function NoirTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, titleFont, bodyFont, t } = useThemeKit(props, noirMeta, 'var(--font-cormorant), Georgia, serif');
  const metal = METALS[s.metal] || METALS.gold;
  const foil = { backgroundImage: metal, WebkitBackgroundClip: 'text' as const, backgroundClip: 'text' as const, color: 'transparent' };
  const hairline = { height: 1, backgroundImage: metal, opacity: 0.7 };

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-8 pt-16 pb-16 text-center">
        {s.monogram && <div className="mx-auto mb-6 w-14 h-14 flex items-center justify-center text-[22px] tracking-widest" style={{ border: '1px solid', borderImage: `${metal} 1`, ...foil }}>{s.monogram}</div>}
        <div className="flex justify-center"><div className="p-[2px] rounded-full" style={{ backgroundImage: metal }}><div className="p-1 rounded-full" style={{ background: bg }}><Avatar profile={profile} style={{ filter: 'grayscale(0.25) contrast(1.05)' }} /></div></div></div>
        <h1 className="mt-7 text-[38px] leading-none tracking-[0.12em] uppercase" style={{ fontFamily: titleFont, ...foil }}>{profile.display_name}</h1>
        {s.ornaments !== false && (
          <div className="flex items-center justify-center gap-3 my-5" aria-hidden>
            <span className="w-16" style={hairline} /><span className="text-[10px]" style={foil}>◆</span><span className="w-16" style={hairline} />
          </div>
        )}
        {profile.bio && <p className="text-[16px] italic leading-relaxed whitespace-pre-line" style={{ opacity: 0.8 }}>{profile.bio}</p>}

        <div className="mt-10 flex flex-col gap-8">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-6 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="nr-fade"><Icon className="w-[18px] h-[18px]" /></a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col">
                {links.map((l: any) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="nr-link group block py-5">
                    <span className="block text-[15px] uppercase tracking-[0.35em] transition-all group-hover:tracking-[0.45em]">{l.title}</span>
                    {l.subtitle && <span className="block mt-1 text-[13px] italic" style={{ opacity: 0.55 }}>{l.subtitle}</span>}
                    <span className="block mx-auto mt-4 w-10 transition-all group-hover:w-24" style={hairline} />
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ border: '1px solid', borderImage: `${metal} 1` }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ border: '1px solid', borderImage: `${metal} 1` }} captionClassName="pt-3 text-[13px] uppercase tracking-[0.3em]" />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} className="mt-12 text-center text-[12px] uppercase tracking-[0.3em] opacity-60" />
      </div>
      <style jsx>{`
        :global(.nr-fade) { opacity: 0.6; transition: opacity 300ms; }
        :global(.nr-fade:hover) { opacity: 1; }
      `}</style>
    </div>
  );
}

export default NoirTheme;
