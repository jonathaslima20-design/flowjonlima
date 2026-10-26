'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl, alpha } from '@/themes/_kit';

export const editorialMeta: BioThemeMeta = {
  key: 'editorial',
  name: 'Editorial',
  description: 'Capa de revista: masthead, foto de capa, título serifado enorme e um índice numerado com os seus links.',
  available: true,
  defaults: { bg_color: '#F3EEE6', button_color: '#C2410C', text_color: '#141210' },
  palettes: {
    bg: ['#F3EEE6', '#FFFFFF', '#EDE7DB', '#111111', '#1C1A17'],
    accent: ['#C2410C', '#1D4ED8', '#047857', '#9D174D', '#141210'],
    text: ['#141210', '#000000', '#F3EEE6'],
  },
  controls: [
    { key: 'masthead', label: 'Nome da revista', type: 'text', default: 'BIO', maxLength: 16, group: 'Textos', category: 'textos' },
    { key: 'issue', label: 'Edição', type: 'text', default: 'Edição Nº 01', maxLength: 24, group: 'Textos', category: 'textos' },
    { key: 'cover', label: 'Foto como capa', type: 'toggle', default: true, group: 'Layout', category: 'layout' },
    { key: 'tocLabel', label: 'Título do índice', type: 'text', default: 'Nesta edição', maxLength: 24, group: 'Textos', category: 'textos' },
    footerControl(),
    ...fontControls('instrument', 'dmsans'),
  ],
};

export function EditorialTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, editorialMeta, 'var(--font-instrument), Georgia, serif');
  const rule = `1px solid ${alpha(text, 0.85)}`;

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-5 pt-8 pb-16">
        <div className="flex items-end justify-between pb-2" style={{ borderBottom: rule }}>
          <span className="text-[56px] leading-[0.8] tracking-tight" style={{ fontFamily: titleFont }}>{s.masthead || 'BIO'}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-right pb-1">{s.issue}<br /><span style={{ color: accent }}>bioflowzy.com/{profile.username}</span></span>
        </div>

        {s.cover !== false && profile.avatar_url && (
          <figure className="mt-4 relative">
            <img src={profile.avatar_url} alt="" className="w-full aspect-[4/5] object-cover grayscale-[15%]" />
            <span className="absolute top-3 left-3 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white" style={{ background: accent }}>Capa</span>
          </figure>
        )}

        <header className="mt-5 mb-6">
          <h1 className="text-[52px] leading-[0.92] tracking-tight" style={{ fontFamily: titleFont }}>
            {profile.display_name}
          </h1>
          {profile.bio && <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line" style={{ opacity: 0.85 }}>{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-7">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.18em]"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} className="ed-under inline-flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{label}</a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <section key="links">
                <h2 className="text-[11px] uppercase tracking-[0.25em] pb-2" style={{ borderBottom: rule, color: accent }}>{s.tocLabel || 'Nesta edição'}</h2>
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="ed-row group flex items-baseline gap-3 py-3.5" style={{ borderBottom: `1px solid ${alpha(text, 0.2)}` }}>
                    <span className="text-[13px] tabular-nums" style={{ color: accent }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[24px] leading-tight group-hover:italic" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] mt-0.5" style={{ opacity: 0.65 }}>{l.subtitle}</span>}
                    </span>
                    <span className="text-[12px] tabular-nums" style={{ opacity: 0.5 }}>p. {String((i + 1) * 12).padStart(2, '0')}</span>
                  </a>
                ))}
              </section>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ border: rule }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ border: rule }} captionClassName="pt-2 text-lg" captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.ed-under) { background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat; transition: background-size 200ms; }
        :global(.ed-under:hover) { background-size: 100% 1px; }
      `}</style>
    </div>
  );
}

export default EditorialTheme;
