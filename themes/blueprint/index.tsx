'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, alpha } from '@/themes/_kit';

export const blueprintMeta: BioThemeMeta = {
  key: 'blueprint',
  name: 'Blueprint',
  description: 'Planta técnica: papel quadriculado azul, traços brancos, cotas de medida e etiquetas “FIG.” em cada link.',
  available: true,
  defaults: { bg_color: '#1652A8', button_color: '#FFFFFF', text_color: '#EAF2FF' },
  palettes: { bg: ['#1652A8', '#0D2F66', '#0E1116', '#F4F1E8'], accent: ['#FFFFFF', '#FFD166', '#7FDBFF'], text: ['#EAF2FF', '#FFFFFF', '#16324F'] },
  controls: [
    { key: 'density', label: 'Tamanho da grade', type: 'slider', min: 12, max: 40, step: 2, suffix: 'px', default: 20, group: 'Layout', category: 'layout' },
    { key: 'annotations', label: 'Cotas e anotações', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    { key: 'project', label: 'Nome do projeto', type: 'text', default: 'PROJETO: BIO', maxLength: 24, group: 'Textos', category: 'textos' },
    footerControl('Ex: ESCALA 1:1'),
    ...fontControls('ibmplex', 'ibmplex'),
  ],
};

export function BlueprintTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, blueprintMeta, 'var(--font-ibmplex), monospace');
  const g = Number(s.density) || 20;
  const line = alpha(text, 0.85);
  const ann = s.annotations !== false;

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{
      backgroundColor: bg, color: text, fontFamily: bodyFont,
      backgroundImage: `linear-gradient(${alpha(text, 0.18)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(text, 0.18)} 1px, transparent 1px), linear-gradient(${alpha(text, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(text, 0.07)} 1px, transparent 1px)`,
      backgroundSize: `${g * 5}px ${g * 5}px, ${g * 5}px ${g * 5}px, ${g}px ${g}px, ${g}px ${g}px`,
    }}>
      <div className="max-w-md mx-auto px-6 pt-10 pb-16">
        <div className="flex justify-between text-[10px] tracking-[0.2em] pb-2 mb-6" style={{ borderBottom: `1px solid ${line}` }}>
          <span>{s.project}</span><span>REV. A</span>
        </div>
        <header className="flex gap-5 items-start mb-8">
          <div className="relative shrink-0">
            <Avatar profile={profile} size={Math.min(profile.avatar_size ?? 96, 104)} style={{ boxShadow: `0 0 0 1px ${line}, 0 0 0 6px ${alpha(text, 0.15)}` }} />
            {ann && <>
              <span aria-hidden className="absolute -left-3 -right-3 top-1/2 h-px" style={{ background: alpha(text, 0.5) }} />
              <span aria-hidden className="absolute -top-3 -bottom-3 left-1/2 w-px" style={{ background: alpha(text, 0.5) }} />
              <span aria-hidden className="absolute -bottom-6 left-0 right-0 text-center text-[9px]">⌀ {profile.avatar_size ?? 96}</span>
            </>}
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-[10px] tracking-[0.2em] opacity-75">FIG. 00 — AUTOR</p>
            <h1 className="mt-1 text-[24px] font-bold uppercase leading-tight break-words" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
            {profile.bio && <p className="mt-2 text-[12px] leading-relaxed whitespace-pre-line opacity-85">{profile.bio}</p>}
          </div>
        </header>

        <div className="flex flex-col gap-6">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex gap-2 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="bp-hl w-11 h-11 flex items-center justify-center" style={{ border: `1px dashed ${line}` }}><Icon className="w-5 h-5" /></a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-5">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="bp-hl relative block p-4" style={{ border: `1.5px solid ${line}` }}>
                    {ann && <span className="absolute -top-2.5 left-3 px-1.5 text-[9px] tracking-[0.2em]" style={{ background: bg }}>FIG. {String(i + 1).padStart(2, '0')}</span>}
                    <div className="flex items-center gap-3">
                      <KitLinkIcon link={l} size={32} radius={0} style={{ border: `1px solid ${line}`, color: accent }} />
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold uppercase text-[14px] tracking-wide truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                        {l.subtitle && <span className="block text-[11px] truncate opacity-70">{l.subtitle}</span>}
                      </span>
                      <span className="text-[16px]" style={{ color: accent }}>→</span>
                    </div>
                    {ann && <span aria-hidden className="absolute -right-5 top-0 bottom-0 flex flex-col items-center justify-center text-[8px]" style={{ borderLeft: `1px solid ${alpha(text, 0.5)}`, width: 1 }} />}
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-5" frameStyle={{ border: `1.5px solid ${line}`, padding: 4 }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} className="flex flex-col gap-5" frameStyle={{ border: `1.5px solid ${line}` }} captionClassName="px-3 py-2 text-[11px] uppercase tracking-wider" />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} className="mt-10 text-center text-[10px] tracking-[0.3em] opacity-80" />
      </div>
      <style jsx>{`
        :global(.bp-hl) { transition: background-color 150ms; }
        :global(.bp-hl:hover) { background-color: rgba(255,255,255,0.08); }
      `}</style>
    </div>
  );
}

export default BlueprintTheme;
