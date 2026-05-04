'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const newspaperMeta: BioThemeMeta = {
  key: 'newspaper',
  name: 'Breaking News',
  description: 'Layout tipográfico de jornal clássico: manchete bold, fio duplo, colunas e papel envelhecido.',
  available: true,
  defaults: {
    bg_color: '#FBF8F0',
    button_color: '#1A1A1A',
    text_color: '#1A1A1A',
  },
  palettes: {
    bg: ['#FBF8F0', '#F5F0E0', '#FFFEF5', '#F0ECD8', '#1A1A1A', '#0D0D0D'],
    accent: ['#1A1A1A', '#8B0000', '#003366', '#2D4A1E', '#4A3000', '#4A0028'],
    text: ['#1A1A1A', '#0D0D0D', '#2C2C2C', '#FFFFFF'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título (manchete)', type: 'fontFamily', default: 'playfair', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'publicationName', label: 'Nome da publicação', type: 'text', default: 'THE DAILY', placeholder: 'Ex: THE TIMES', maxLength: 30, group: 'Textos' },
    { key: 'edition', label: 'Edição / Número', type: 'text', default: 'Vol. I', placeholder: 'Ex: Vol. III, No. 42', maxLength: 30, group: 'Textos' },
    { key: 'tagline', label: 'Subtítulo do jornal', type: 'text', default: '', placeholder: 'Ex: All the news fit to print', maxLength: 80, group: 'Textos' },
    { key: 'breakingTag', label: 'Tag de destaque', type: 'text', default: 'BREAKING', placeholder: 'Ex: EXCLUSIVE', maxLength: 20, group: 'Textos' },
    { key: 'showDoubleRule', label: 'Fio duplo decorativo', type: 'toggle', default: true, group: 'Layout' },
    { key: 'showEditionBar', label: 'Barra de edição', type: 'toggle', default: true, group: 'Layout' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: Est. 2025 · Worldwide Edition', maxLength: 80, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function NewspaperTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'newspaper', newspaperMeta.controls);
  const bg = profile.bg_color || '#FBF8F0';
  const text = profile.text_color || '#1A1A1A';
  const accent = profile.button_color || '#1A1A1A';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-playfair), Georgia, serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-inter), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      <div className="relative mx-auto max-w-md">
        <div className="px-6 pt-8 pb-0">
          {s.showEditionBar && (
            <div className="flex items-center justify-between mb-1 text-[10px] uppercase tracking-widest" style={{ color: `${text}66` }}>
              <span>{s.edition || 'Vol. I'}</span>
              <span>{dateStr}</span>
            </div>
          )}

          {s.showDoubleRule && (
            <div className="mb-1">
              <div className="h-[3px]" style={{ backgroundColor: text }} />
              <div className="h-[1px] mt-[2px]" style={{ backgroundColor: text }} />
            </div>
          )}

          <div className="py-3 text-center">
            <h2
              className="tracking-widest font-black uppercase"
              style={{ fontSize: '28px', fontFamily: titleFamily, color: text, letterSpacing: '0.15em' }}
            >
              {s.publicationName || 'THE DAILY'}
            </h2>
            {s.tagline && (
              <p className="text-[11px] italic mt-0.5" style={{ color: `${text}77` }}>{s.tagline}</p>
            )}
          </div>

          {s.showDoubleRule && (
            <div className="mb-4">
              <div className="h-[1px]" style={{ backgroundColor: text }} />
              <div className="h-[3px] mt-[2px]" style={{ backgroundColor: text }} />
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            {profile.avatar_url && (
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: profile.avatar_size ?? 72,
                  height: profile.avatar_size ?? 72,
                  border: `2px solid ${text}`,
                  filter: 'grayscale(20%) sepia(10%)',
                }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              {s.breakingTag && (
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 mr-2"
                  style={{ backgroundColor: accent, color: bg }}
                >
                  {s.breakingTag}
                </span>
              )}
              <h1
                className="leading-tight mt-0.5"
                style={{ fontSize: '22px', fontWeight: 900, fontFamily: titleFamily, color: text, lineHeight: 1.1 }}
              >
                {profile.display_name}
              </h1>
              {profile.bio && (
                <p className="mt-1 text-[12px] leading-snug whitespace-pre-line" style={{ color: `${text}BB` }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {socials?.length > 0 && (
            <div className="mb-4 pb-4 flex items-center gap-4 flex-wrap" style={{ borderBottom: `1px solid ${text}22` }}>
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
                    className="flex items-center gap-1.5 transition-opacity hover:opacity-50"
                    style={{ color: `${text}66` }}
                  >
                    <Icon className="w-[13px] h-[13px]" />
                    <span className="text-[10px] uppercase tracking-wide">{meta?.label || soc.platform}</span>
                  </a>
                ) : null;
              })}
            </div>
          )}
        </div>

        <div className="px-6 pb-10">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: `${text}55` }}>
            LINKS & CHANNELS
          </p>
          <div className="flex flex-col">
            {links.map((l: any, i: number) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => t('link', l.id)}
                className="group flex items-start gap-3 py-3 transition-opacity hover:opacity-60"
                style={{ borderBottom: `1px solid ${text}14` }}
              >
                <span
                  className="text-[11px] font-black shrink-0 mt-0.5"
                  style={{ fontFamily: titleFamily, color: `${text}55`, minWidth: '20px' }}
                >
                  {String.fromCharCode(65 + i)}.
                </span>
                <span className="flex-1 text-[15px] leading-tight" style={{ fontFamily: titleFamily, color: text, fontWeight: 600 }}>
                  {l.title}
                </span>
              </a>
            ))}
          </div>

          {banners?.map((b: any) => {
            const inner = (
              <div key={b.id} className={`overflow-hidden mt-5 ${BANNER_H[b.size] || BANNER_H.md}`} style={{ border: `1px solid ${text}22`, filter: 'sepia(8%)' }}>
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="overflow-hidden mt-5" style={{ border: `1px solid ${text}22` }}>
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ fontFamily: titleFamily, color: `${text}AA`, borderTop: `1px solid ${text}14` }}>
                  {v.title}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 pb-8">
          <div className="h-[1px] mb-1" style={{ backgroundColor: text }} />
          <div className="h-[3px] mb-3" style={{ backgroundColor: text }} />
          {s.footerText && s.footerText.trim() && (
            <p className="text-[10px] text-center italic" style={{ color: `${text}66` }}>{s.footerText}</p>
          )}
          <BioflowzyBadge profile={profile} bgColor={bg} />
        </div>
      </div>
    </div>
  );
}

export default NewspaperTheme;
