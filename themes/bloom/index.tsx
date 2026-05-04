'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const bloomMeta: BioThemeMeta = {
  key: 'bloom',
  name: 'Botanical Bloom',
  description: 'Jardim orgânico: ilustrações botânicas SVG, cards pontilhados, tipografia serifada e tons de terra.',
  available: true,
  defaults: {
    bg_color: '#FFFBF0',
    button_color: '#5C8A4A',
    text_color: '#2C2010',
  },
  palettes: {
    bg: ['#FFFBF0', '#FFF8EC', '#F5F0E8', '#F0F8EC', '#2C2010', '#1A2C14'],
    accent: ['#5C8A4A', '#7BAD68', '#4A7A38', '#8B6B38', '#D4694A', '#6B4A8B'],
    text: ['#2C2010', '#1A2C14', '#4A3820', '#FFFFFF'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'cormorant', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'showBotanical', label: 'Elementos botânicos', type: 'toggle', default: true, group: 'Visual' },
    { key: 'cardBorder', label: 'Borda dos cards', type: 'select', options: [
      { value: 'dashed', label: 'Pontilhada' },
      { value: 'solid', label: 'Sólida' },
      { value: 'none', label: 'Sem borda' },
    ], default: 'dashed', group: 'Layout' },
    { key: 'cardRadius', label: 'Raio dos cards', type: 'slider', min: 8, max: 32, step: 4, suffix: 'px', default: 16, group: 'Layout' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Organic Wellness & Care', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: 🌿 Sustainably made', maxLength: 60, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function BloomTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'bloom', bloomMeta.controls);
  const bg = profile.bg_color || '#FFFBF0';
  const text = profile.text_color || '#2C2010';
  const accent = profile.button_color || '#5C8A4A';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-cormorant), Georgia, serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-dmsans), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);
  const r = s.cardRadius ?? 16;

  const getBorderStyle = () => {
    if (s.cardBorder === 'none') return 'none';
    if (s.cardBorder === 'solid') return `1px solid ${accent}44`;
    return `1.5px dashed ${accent}55`;
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showBotanical && (
        <>
          <div className="absolute top-0 left-0 pointer-events-none opacity-20" style={{ width: '120px', transform: 'rotate(-20deg) translate(-20px, -10px)' }}>
            <svg viewBox="0 0 100 150" fill="none">
              <path d="M50 140 Q30 100 20 60 Q40 80 50 140Z" fill={accent} opacity="0.6" />
              <path d="M50 140 Q70 100 80 60 Q60 80 50 140Z" fill={accent} opacity="0.5" />
              <path d="M50 140 Q20 70 10 30 Q35 65 50 140Z" fill={accent} opacity="0.4" />
              <path d="M50 140 Q80 70 90 30 Q65 65 50 140Z" fill={accent} opacity="0.3" />
            </svg>
          </div>
          <div className="absolute top-0 right-0 pointer-events-none opacity-15" style={{ width: '100px', transform: 'rotate(15deg) translate(10px, -5px)' }}>
            <svg viewBox="0 0 100 120" fill="none">
              <circle cx="50" cy="40" r="25" fill={accent} opacity="0.5" />
              <ellipse cx="30" cy="60" rx="20" ry="15" fill={accent} opacity="0.4" />
              <ellipse cx="70" cy="65" rx="18" ry="13" fill={accent} opacity="0.35" />
            </svg>
          </div>
        </>
      )}

      <div className="relative mx-auto px-6 max-w-sm pt-14 pb-16" style={{ zIndex: 10 }}>
        <header className="flex flex-col items-center text-center mb-10">
          {profile.avatar_url && (
            <div
              className="rounded-full overflow-hidden mb-5"
              style={{
                width: profile.avatar_size ?? 88,
                height: profile.avatar_size ?? 88,
                border: `3px solid ${accent}55`,
                boxShadow: `0 4px 20px ${accent}22`,
              }}
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h1
            className="leading-tight"
            style={{ fontSize: '28px', fontWeight: 600, fontFamily: titleFamily, fontStyle: 'italic', color: text }}
          >
            {profile.display_name}
          </h1>

          {s.tagline && (
            <p className="mt-1.5 text-sm font-medium" style={{ color: accent }}>{s.tagline}</p>
          )}

          {profile.bio && (
            <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-line" style={{ color: `${text}AA` }}>
              {profile.bio}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: `${accent}33` }} />
            <span style={{ color: `${accent}66`, fontSize: '10px' }}>✿</span>
            <div className="h-px flex-1" style={{ background: `${accent}33` }} />
          </div>

          {socials?.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-4">
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
                    style={{ color: `${text}66` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[16px] h-[16px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </header>

        <div className="flex flex-col gap-3">
          {links.map((l: any) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="group flex items-center gap-4 px-5 py-4 transition-all hover:opacity-70"
              style={{
                border: getBorderStyle(),
                borderRadius: `${r}px`,
                backgroundColor: `${accent}08`,
              }}
            >
              <span className="text-[16px]">🌿</span>
              <span className="flex-1 text-[15px] font-medium" style={{ fontFamily: titleFamily, fontStyle: 'italic', color: text }}>
                {l.title}
              </span>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ borderRadius: `${r}px`, border: getBorderStyle() }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
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
              style={{ borderRadius: `${r}px`, border: getBorderStyle() }}
            >
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-3 text-sm" style={{ fontFamily: titleFamily, fontStyle: 'italic', color: `${text}AA` }}>
                  {v.title}
                </div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-sm" style={{ color: `${text}55`, fontStyle: 'italic', fontFamily: titleFamily }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default BloomTheme;
