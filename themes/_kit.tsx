'use client';

import type { CSSProperties, ReactNode } from 'react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import { VideoEmbed } from '@/components/themes/VideoEmbed';
import { LinkIcon } from '@/components/themes/LinkIcon';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import type { BioProfile, BioThemeMeta, BioThemeProps } from './types';
import { getThemeSettings, getFontStack } from './types';

// Kit compartilhado pelos temas da coleção 2026: cada tema cuida só do visual;
// rastreio de cliques, ícones de redes, banners e vídeos ficam aqui.

export type Track = (entity_type: string, entity_id: string | null) => void;

export function useThemeKit(props: BioThemeProps, meta: BioThemeMeta, fallbackFont = 'var(--font-inter), system-ui, sans-serif') {
  const { profile } = props;
  const s = getThemeSettings(profile, meta.key, meta.controls);
  const bg = profile.bg_color || meta.defaults.bg_color;
  const text = profile.text_color || meta.defaults.text_color;
  const accent = profile.button_color || meta.defaults.button_color;
  const titleFont = getFontStack(s.titleFont, fallbackFont);
  const bodyFont = getFontStack(s.bodyFont, titleFont);
  const t: Track = (type, id) => props.track?.(type, id);
  return { s, bg, text, accent, titleFont, bodyFont, t };
}

// Atributos de um link clicável com rastreio
export function linkAttrs(href: string, t: Track, type: string, id: string | null) {
  return { href, target: '_blank', rel: 'noreferrer', onClick: () => t(type, id) };
}

export function Avatar({ profile, size, className = '', style, imgClassName = '', shape = 'circle' }: {
  profile: BioProfile; size?: number; className?: string; style?: CSSProperties; imgClassName?: string;
  shape?: 'circle' | 'square' | 'rounded' | 'none';
}) {
  if (!profile.avatar_url) return null;
  const px = size ?? profile.avatar_size ?? 96;
  const radius = shape === 'circle' ? '9999px' : shape === 'rounded' ? '28%' : 0;
  return (
    <div className={`relative overflow-hidden shrink-0 ${className}`} style={{ width: px, height: px, borderRadius: radius, ...style }}>
      <img src={profile.avatar_url} alt="" className={`w-full h-full object-cover ${imgClassName}`} />
    </div>
  );
}

export function SocialRow({ socials, t, className = '', render }: {
  socials: any[]; t: Track; className?: string;
  render: (args: { soc: any; Icon: any; label: string; attrs: ReturnType<typeof linkAttrs>; index: number }) => ReactNode;
}) {
  if (!socials?.length) return null;
  return (
    <div className={className}>
      {socials.map((soc, index) => {
        const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
        if (!meta?.icon) return null;
        return (
          <span key={soc.id} className="contents">
            {render({ soc, Icon: meta.icon, label: meta.label, attrs: linkAttrs(getSocialHref(soc.platform, soc.url), t, 'social', soc.id), index })}
          </span>
        );
      })}
    </div>
  );
}

const BANNER_ASPECT: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function BannerList({ banners, t, className = 'flex flex-col gap-3', frameClassName = '', frameStyle }: {
  banners: any[]; t: Track; className?: string; frameClassName?: string; frameStyle?: CSSProperties;
}) {
  if (!banners?.length) return null;
  return (
    <div className={className}>
      {banners.map(b => {
        const inner = (
          <div className={`overflow-hidden ${BANNER_ASPECT[b.size] || BANNER_ASPECT.md} ${frameClassName}`} style={frameStyle}>
            {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
          </div>
        );
        return b.link_url
          ? <a key={b.id} {...linkAttrs(b.link_url, t, 'banner', b.id)} className="block">{inner}</a>
          : <div key={b.id}>{inner}</div>;
      })}
    </div>
  );
}

export function VideoList({ videos, preview, className = 'flex flex-col gap-3', frameClassName = '', frameStyle, captionClassName = 'px-4 py-3 text-sm font-semibold', captionStyle }: {
  videos: any[]; preview?: boolean; className?: string; frameClassName?: string; frameStyle?: CSSProperties;
  captionClassName?: string; captionStyle?: CSSProperties;
}) {
  if (!videos?.length) return null;
  return (
    <div className={className}>
      {videos.map(v => (
        <figure key={v.id} className={`overflow-hidden ${frameClassName}`} style={frameStyle}>
          <div className="relative aspect-video"><VideoEmbed video={v} preview={preview} /></div>
          {v.title && <figcaption className={captionClassName} style={captionStyle}>{v.title}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

// Ícone do link (favicon/ícone enviado) com um fallback desenhado pelo tema
export function KitLinkIcon({ link, size = 32, radius = 10, style, fallback }: {
  link: any; size?: number; radius?: number | string; style?: CSSProperties; fallback?: ReactNode;
}) {
  return (
    <LinkIcon
      link={link}
      size={size}
      radius={radius}
      className="flex items-center justify-center shrink-0"
      containerStyle={style}
      fallback={fallback ?? (
        <svg viewBox="0 0 24 24" width={size * 0.45} height={size * 0.45} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
          <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
        </svg>
      )}
    />
  );
}

export function ThemeFooter({ profile, bg, text, color, className = 'mt-10 text-center text-xs opacity-70' }: {
  profile: BioProfile; bg: string; text?: string; color?: string; className?: string;
}) {
  return (
    <>
      {text && text.trim() && <p className={className} style={{ color }}>{text}</p>}
      <BioflowzyBadge profile={profile} bgColor={bg} />
    </>
  );
}

// Controles de tipografia repetidos pelos temas
export function fontControls(title: string, body: string) {
  return [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily' as const, default: title, group: 'Tipografia', category: 'tipografia' as const },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily' as const, default: body, group: 'Tipografia', category: 'tipografia' as const },
  ];
}

export function footerControl(placeholder = 'Ex: Respondo em até 24h') {
  return { key: 'footerText', label: 'Texto do rodapé', type: 'text' as const, default: '', placeholder, maxLength: 60, group: 'Textos', category: 'textos' as const };
}

export function motionControl() {
  return { key: 'motion', label: 'Animações', type: 'select' as const, options: [
    { value: 'full', label: 'Completas' },
    { value: 'subtle', label: 'Suaves' },
    { value: 'off', label: 'Desligadas' },
  ], default: 'full', group: 'Efeitos', category: 'efeitos' as const };
}

// Cor com transparência a partir de #RRGGBB
export function alpha(hex: string, a: number) {
  const h = (hex || '#000000').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Preto ou branco legível sobre uma cor
export function onColor(hex: string) {
  const h = (hex || '#000000').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#FFFFFF';
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0A0A0A' : '#FFFFFF';
}
