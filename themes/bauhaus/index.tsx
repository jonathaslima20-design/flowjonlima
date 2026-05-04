'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const bauhausMeta: BioThemeMeta = {
  key: 'bauhaus',
  name: 'Bauhaus Grid',
  description: 'Geometria pura da escola Bauhaus: blocos de cor, grid rigoroso, grotesca bold e arte como função.',
  available: true,
  defaults: {
    bg_color: '#F5F0E8',
    button_color: '#E63025',
    text_color: '#0D0D0D',
  },
  palettes: {
    bg: ['#F5F0E8', '#FFFFFF', '#0D0D0D', '#1A1A1A', '#F0EBE0', '#FFFBF0'],
    accent: ['#E63025', '#1A56DB', '#F5BE18', '#0D0D0D', '#2D8C4E', '#7B2FBE'],
    text: ['#0D0D0D', '#1A1A1A', '#FFFFFF', '#F5F0E8'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'archivo', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'grotesk', group: 'Tipografia' },
    { key: 'secondaryColor', label: 'Segunda cor de destaque', type: 'colorPicker', default: '#1A56DB', group: 'Visual' },
    { key: 'thirdColor', label: 'Terceira cor de destaque', type: 'colorPicker', default: '#F5BE18', group: 'Visual' },
    { key: 'avatarSquare', label: 'Avatar quadrado (Bauhaus)', type: 'toggle', default: true, group: 'Layout' },
    { key: 'showGeometry', label: 'Formas geométricas decorativas', type: 'toggle', default: true, group: 'Visual' },
    { key: 'nameUppercase', label: 'Nome em maiúsculas', type: 'toggle', default: true, group: 'Tipografia' },
    { key: 'tagline', label: 'Manifesto / Tagline', type: 'text', default: '', placeholder: 'Ex: Form Follows Function', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: Dessau, 1923', maxLength: 60, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function BauhausTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'bauhaus', bauhausMeta.controls);
  const bg = profile.bg_color || '#F5F0E8';
  const text = profile.text_color || '#0D0D0D';
  const accent = profile.button_color || '#E63025';
  const c2 = s.secondaryColor || '#1A56DB';
  const c3 = s.thirdColor || '#F5BE18';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-archivo-black), Impact, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-space-grotesk), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);
  const colors = [accent, c2, c3];

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showGeometry && (
        <div className="absolute top-0 right-0 pointer-events-none overflow-hidden w-32 h-32">
          <div className="absolute top-4 right-4 w-16 h-16 rounded-full" style={{ backgroundColor: `${accent}22` }} />
          <div className="absolute top-10 right-10 w-8 h-8" style={{ backgroundColor: `${c2}33` }} />
        </div>
      )}

      <div className="relative mx-auto max-w-md">
        <div
          className="px-6 pt-10 pb-6"
          style={{ borderBottom: `4px solid ${text}` }}
        >
          <div className="flex items-start gap-4">
            {profile.avatar_url && (
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: profile.avatar_size ?? 80,
                  height: profile.avatar_size ?? 80,
                  borderRadius: s.avatarSquare ? '0px' : '50%',
                  outline: `4px solid ${text}`,
                  outlineOffset: '-4px',
                }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              {s.showGeometry && (
                <div className="flex gap-1.5 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />
                  <div className="w-3 h-3" style={{ backgroundColor: c2 }} />
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderBottom: `12px solid ${c3}`,
                      marginTop: 0,
                    }}
                  />
                </div>
              )}
              <h1
                className="leading-none"
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  fontFamily: titleFamily,
                  color: text,
                  textTransform: s.nameUppercase ? 'uppercase' : 'none',
                  letterSpacing: s.nameUppercase ? '0.05em' : '-0.02em',
                }}
              >
                {profile.display_name}
              </h1>
              {s.tagline && (
                <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
                  {s.tagline}
                </p>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-[14px] leading-relaxed whitespace-pre-line" style={{ color: `${text}CC` }}>
              {profile.bio}
            </p>
          )}

          {socials?.length > 0 && (
            <div className="mt-4 flex items-center gap-3 flex-wrap">
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
                    className="transition-opacity hover:opacity-60"
                    style={{ color: `${text}88` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[16px] h-[16px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-6 flex flex-col gap-2">
          {links.map((l: any, i: number) => {
            const linkColor = colors[i % colors.length];
            return (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => t('link', l.id)}
                className="group flex items-center gap-0 overflow-hidden transition-all hover:opacity-90"
                style={{ height: '56px', border: `3px solid ${text}` }}
              >
                <div
                  className="w-14 h-full flex items-center justify-center shrink-0 text-xs font-black"
                  style={{ backgroundColor: linkColor, color: bg, fontFamily: titleFamily }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  className="flex-1 h-full flex items-center px-4"
                  style={{ backgroundColor: bg }}
                >
                  <span className="text-[14px] font-bold tracking-tight" style={{ fontFamily: titleFamily, color: text, textTransform: 'uppercase' }}>
                    {l.title}
                  </span>
                </div>
                <div
                  className="w-10 h-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: text, color: bg }}
                >
                  <span className="text-[14px] font-black">→</span>
                </div>
              </a>
            );
          })}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ border: `3px solid ${text}` }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="overflow-hidden mt-2" style={{ border: `3px solid ${text}` }}>
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div
                  className="px-4 py-2 text-xs font-black uppercase"
                  style={{ fontFamily: titleFamily, color: text, borderTop: `3px solid ${text}`, backgroundColor: `${accent}14` }}
                >
                  {v.title}
                </div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <div
            className="mx-6 mb-8 px-4 py-2"
            style={{ backgroundColor: text, color: bg }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ fontFamily: titleFamily }}>
              {s.footerText}
            </p>
          </div>
        )}
        <div className="px-6 pb-6">
          <BioflowzyBadge profile={profile} bgColor={bg} />
        </div>
      </div>
    </div>
  );
}

export default BauhausTheme;
