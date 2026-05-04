'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const mangaMeta: BioThemeMeta = {
  key: 'manga',
  name: 'Manga Panel',
  description: 'Layout de quadrinho mangá: painéis em preto e branco, screentone e speed lines no hover.',
  available: true,
  defaults: {
    bg_color: '#FFFFFF',
    button_color: '#000000',
    text_color: '#000000',
  },
  palettes: {
    bg: ['#FFFFFF', '#F8F8F8', '#FFFFF0', '#000000', '#111111'],
    accent: ['#000000', '#E53935', '#1565C0', '#FF8F00', '#6A1B9A'],
    text: ['#000000', '#1A1A1A', '#FFFFFF', '#F8F8F8'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'archivo', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'showScreentone', label: 'Textura screentone', type: 'toggle', default: true, group: 'Visual' },
    { key: 'showSpeedLines', label: 'Speed lines no hover', type: 'toggle', default: true, group: 'Visual' },
    { key: 'cornerStyle', label: 'Canto dos painéis', type: 'select', options: [
      { value: 'fold', label: 'Dobrado' },
      { value: 'sharp', label: 'Reto' },
    ], default: 'fold', group: 'Layout' },
    { key: 'sfxText', label: 'Efeito sonoro (SFX)', type: 'text', default: '', placeholder: 'Ex: BZZT!! / POW!', maxLength: 20, group: 'Textos' },
    { key: 'chapterTitle', label: 'Título do capítulo', type: 'text', default: '', placeholder: 'Ex: Chapter 01: Links', maxLength: 60, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: To be continued...', maxLength: 60, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function MangaTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'manga', mangaMeta.controls);
  const bg = profile.bg_color || '#FFFFFF';
  const text = profile.text_color || '#000000';
  const accent = profile.button_color || '#000000';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-archivo-black), Impact, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-inter), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);
  const isDark = bg === '#000000' || bg === '#111111';
  const borderColor = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.85)';

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showScreentone && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${text}08 1px, transparent 1px)`,
            backgroundSize: '8px 8px',
          }}
        />
      )}

      <div className="relative mx-auto px-5 max-w-md pt-10 pb-16">
        {s.sfxText && s.sfxText.trim() && (
          <div
            className="absolute top-4 right-4 pointer-events-none select-none"
            style={{
              fontFamily: titleFamily,
              fontSize: '28px',
              fontWeight: 900,
              color: accent,
              opacity: 0.15,
              transform: 'rotate(12deg)',
              letterSpacing: '-2px',
            }}
          >
            {s.sfxText}
          </div>
        )}

        <div
          className="mb-8 p-5 relative"
          style={{ border: `3px solid ${borderColor}`, backgroundColor: bg }}
        >
          <div className="flex items-start gap-4">
            {profile.avatar_url && (
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: profile.avatar_size ?? 80,
                  height: profile.avatar_size ?? 80,
                  border: `3px solid ${borderColor}`,
                  borderRadius: '4px',
                  filter: 'contrast(1.1)',
                }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(30%)' }} />
              </div>
            )}
            <div className="flex-1">
              <h1
                className="leading-none tracking-tighter"
                style={{ fontSize: '22px', fontWeight: 900, fontFamily: titleFamily, color: text, textTransform: 'uppercase' }}
              >
                {profile.display_name}
              </h1>
              {profile.bio && (
                <p className="mt-2 text-[13px] leading-snug whitespace-pre-line" style={{ color: `${text}CC` }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {socials?.length > 0 && (
            <div className="mt-4 pt-3 flex items-center gap-4 flex-wrap" style={{ borderTop: `2px solid ${borderColor}` }}>
              {socials.map((soc: any) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return Icon ? (
                  <a
                    key={soc.id}
                    href={getSocialHref(soc.platform, soc.url)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => t('social', soc.id)}
                    className="transition-opacity hover:opacity-50"
                    style={{ color: `${text}88` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}

          {s.cornerStyle === 'fold' && (
            <div
              className="absolute bottom-0 right-0 w-0 h-0 pointer-events-none"
              style={{
                borderLeft: '16px solid transparent',
                borderBottom: `16px solid ${accent}`,
              }}
            />
          )}
        </div>

        {s.chapterTitle && s.chapterTitle.trim() && (
          <div
            className="mb-4 px-3 py-1.5 inline-block"
            style={{ backgroundColor: accent, color: bg, fontFamily: titleFamily, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            {s.chapterTitle}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {links.map((l: any, i: number) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className={`group flex items-center gap-3 px-4 py-3.5 relative overflow-hidden transition-all ${s.showSpeedLines ? 'manga-link' : 'hover:opacity-70'}`}
              style={{ border: `2.5px solid ${borderColor}`, backgroundColor: bg }}
            >
              <span
                className="w-6 h-6 flex items-center justify-center shrink-0 text-[11px] font-black"
                style={{ backgroundColor: accent, color: bg, fontFamily: titleFamily }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 text-[15px] font-bold" style={{ fontFamily: titleFamily, color: text }}>
                {l.title}
              </span>
              <span className="text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent, fontFamily: titleFamily }}>
                GO→
              </span>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ border: `2.5px solid ${borderColor}` }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" style={{ filter: 'contrast(1.05) grayscale(10%)' }} />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div
              key={v.id}
              className="overflow-hidden mt-2"
              style={{ border: `2.5px solid ${borderColor}` }}
            >
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div
                  className="px-3 py-2 text-xs font-black uppercase"
                  style={{ fontFamily: titleFamily, color: text, borderTop: `2px solid ${borderColor}` }}
                >
                  {v.title}
                </div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p
            className="mt-10 text-center text-sm font-bold italic"
            style={{ fontFamily: titleFamily, color: `${text}66` }}
          >
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>

      <style jsx>{`
        .manga-link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 8px,
            ${accent}06 8px,
            ${accent}06 9px
          );
          opacity: 0;
          transition: opacity 0.2s;
        }
        .manga-link:hover::before { opacity: 1; }
      `}</style>
    </div>
  );
}

export default MangaTheme;
