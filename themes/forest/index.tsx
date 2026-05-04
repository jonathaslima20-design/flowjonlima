'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const forestMeta: BioThemeMeta = {
  key: 'forest',
  name: 'Deep Forest',
  description: 'Verde musgo profundo, textura orgânica e tipografia natural para marcas sustentáveis e wellness.',
  available: true,
  defaults: {
    bg_color: '#1A2C1E',
    button_color: '#7BC67E',
    text_color: '#E8F5E9',
  },
  palettes: {
    bg: ['#1A2C1E', '#0D1F10', '#243B27', '#1B3A2D', '#F1F8F2', '#FFFFFF'],
    accent: ['#7BC67E', '#4CAF50', '#A5D6A7', '#66BB6A', '#81C784', '#AED581'],
    text: ['#E8F5E9', '#FFFFFF', '#C8E6C9', '#1A2C1E'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'manrope', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'manrope', group: 'Tipografia' },
    { key: 'showTexture', label: 'Textura de floresta', type: 'toggle', default: true, group: 'Visual' },
    { key: 'cardRadius', label: 'Raio dos cards', type: 'slider', min: 8, max: 32, step: 4, suffix: 'px', default: 16, group: 'Layout' },
    { key: 'leafIcon', label: 'Ícone decorativo', type: 'select', options: [
      { value: 'none', label: 'Nenhum' },
      { value: 'leaf', label: 'Folha 🍃' },
      { value: 'tree', label: 'Árvore 🌿' },
      { value: 'flower', label: 'Flor 🌺' },
    ], default: 'leaf', group: 'Decoração' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Viva com intenção', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: 🌱 Eco-friendly', maxLength: 60, group: 'Textos' },
  ],
};

const LEAF_ICONS: Record<string, string> = { none: '', leaf: '🍃', tree: '🌿', flower: '🌺' };
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function ForestTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'forest', forestMeta.controls);
  const bg = profile.bg_color || '#1A2C1E';
  const text = profile.text_color || '#E8F5E9';
  const accent = profile.button_color || '#7BC67E';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-manrope), system-ui, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const t = (a: string, b: string | null) => track?.(a, b);
  const icon = LEAF_ICONS[s.leafIcon] || '';
  const r = s.cardRadius ?? 16;
  const isDark = bg === '#1A2C1E' || bg === '#0D1F10' || bg === '#243B27' || bg === '#1B3A2D';

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showTexture && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${accent}08 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, ${accent}06 0%, transparent 40%)`,
          }}
        />
      )}

      <div className="relative mx-auto px-6 max-w-md pt-14 pb-16">
        <header className="flex flex-col items-center text-center mb-10">
          {icon && <div className="text-2xl mb-3">{icon}</div>}

          {profile.avatar_url && (
            <div
              className="rounded-full overflow-hidden mb-5"
              style={{
                width: profile.avatar_size ?? 88,
                height: profile.avatar_size ?? 88,
                boxShadow: `0 0 0 3px ${accent}44, 0 8px 32px ${accent}22`,
                border: `2px solid ${accent}66`,
              }}
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h1
            className="leading-tight tracking-tight"
            style={{ fontSize: '26px', fontWeight: 700, fontFamily: titleFamily, color: text }}
          >
            {profile.display_name}
          </h1>

          {s.tagline && (
            <p className="mt-1.5 text-sm font-medium" style={{ color: accent }}>{s.tagline}</p>
          )}

          {profile.bio && (
            <p className="mt-3 text-[14px] max-w-xs leading-relaxed whitespace-pre-line" style={{ color: `${text}BB` }}>
              {profile.bio}
            </p>
          )}

          {socials?.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-3">
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
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: `${accent}22`, color: accent, border: `1px solid ${accent}33` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[15px] h-[15px]" />
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
              className="group flex items-center gap-4 px-5 py-4 transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: `${accent}14`,
                border: `1px solid ${accent}33`,
                borderRadius: `${r}px`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: accent }}
              />
              <span className="flex-1 text-[15px] font-medium" style={{ color: text }}>{l.title}</span>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ borderRadius: `${r}px`, border: `1px solid ${accent}22` }}
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
              style={{ borderRadius: `${r}px`, border: `1px solid ${accent}22` }}
            >
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-3 text-sm font-medium" style={{ color: `${text}BB` }}>{v.title}</div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-sm" style={{ color: `${text}55` }}>{s.footerText}</p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default ForestTheme;
