'use client';

import { Sparkles, Heart, Star, Zap } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const creatorMeta: BioThemeMeta = {
  key: 'creator',
  name: 'Creator Pastel',
  description: 'Playful gen-Z: pastel vibrante, stickers flutuantes, avatar com anel gradient e cards bubble com micro-animacoes.',
  available: true,
  defaults: {
    bg_color: '#FFF0F5',
    button_color: '#FF6B9D',
    text_color: '#2D1B3D',
    border_width: 0,
    shadow_offset: 6,
  },
  palettes: {
    bg: ['#FFF0F5', '#F5F0FF', '#F0FFF5', '#FFFBF0', '#FFE8F0', '#1A0F2E'],
    accent: ['#FF6B9D', '#B794F6', '#5EEAD4', '#FDE047', '#FB7185', '#F472B6'],
    text: ['#2D1B3D', '#0F0F23', '#FFFFFF', '#4A2B5C'],
  },
  controls: [
    { key: 'stickers', label: 'Stickers decorativos', type: 'select', options: [
      { value: 'none', label: 'Sem stickers' },
      { value: 'minimal', label: 'Minimo' },
      { value: 'abundant', label: 'Abundante' },
    ], default: 'minimal', group: 'Decoracao' },
    { key: 'stickerType', label: 'Tipo de sticker', type: 'select', options: [
      { value: 'stars', label: 'Estrelas sparkle' },
      { value: 'hearts', label: 'Coracoes' },
      { value: 'bolts', label: 'Raios' },
      { value: 'mix', label: 'Mix' },
    ], default: 'mix', group: 'Decoracao' },
    { key: 'avatarRing', label: 'Anel do avatar', type: 'select', options: [
      { value: 'static', label: 'Estatico' },
      { value: 'spinning', label: 'Girando' },
      { value: 'pulsing', label: 'Pulsando' },
    ], default: 'spinning', group: 'Avatar' },
    { key: 'highlight', label: 'Marca-texto no titulo', type: 'toggle', default: true, group: 'Titulo' },
    { key: 'highlightColor', label: 'Cor do marca-texto', type: 'color', palette: ['#FDE047', '#5EEAD4', '#FB7185', '#B794F6', '#FACC15'], default: '#FDE047', group: 'Titulo' },
    { key: 'bubbleShape', label: 'Formato dos cards', type: 'select', options: [
      { value: 'rounded', label: 'Arredondado' },
      { value: 'blob', label: 'Blob organico' },
      { value: 'squircle', label: 'Squircle' },
    ], default: 'rounded', group: 'Cards' },
    { key: 'hoverAnim', label: 'Animacao ao passar mouse', type: 'select', options: [
      { value: 'none', label: 'Nenhuma' },
      { value: 'wiggle', label: 'Wiggle' },
      { value: 'bounce', label: 'Bounce' },
      { value: 'scale', label: 'Scale' },
    ], default: 'wiggle', group: 'Cards' },
    { key: 'holoCta', label: 'CTA holografico', type: 'toggle', default: false, group: 'Cards' },
    { key: 'tagline', label: 'Frase divertida (subtítulo)', type: 'textarea', default: '', placeholder: 'Ex: Content Creator & Vibes', maxLength: 120, rows: 2, group: 'Textos' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#FF6B9D', group: 'Cores' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada', type: 'toggle', default: false, group: 'Cores' },
    { key: 'highlightCustom', label: 'Cor do marca-texto (hex livre)', type: 'colorPicker', default: '#FDE047', group: 'Titulo' },
    { key: 'useHighlightCustom', label: 'Usar marca-texto personalizado', type: 'toggle', default: false, group: 'Titulo' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: Feito com amor', maxLength: 80, group: 'Textos' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
  ],
};

const SHAPES: Record<string, string> = {
  rounded: '24px',
  blob: '42% 58% 55% 45% / 55% 45% 55% 45%',
  squircle: '35% 35% 35% 35% / 35% 35% 35% 35%',
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

const HOVER_CLS: Record<string, string> = {
  none: '',
  wiggle: 'creator-wiggle',
  bounce: 'creator-bounce',
  scale: 'creator-scale',
};

const STICKER_ICONS = {
  stars: Sparkles,
  hearts: Heart,
  bolts: Zap,
};

type StickerSpec = { icon: any; x: string; y: string; size: number; rot: number; color: string; delay: number };

function buildStickers(mode: string, type: string, accent: string): StickerSpec[] {
  if (mode === 'none') return [];
  const count = mode === 'abundant' ? 10 : 5;
  const colors = [accent, '#FDE047', '#5EEAD4', '#FB7185', '#B794F6'];
  const positions: Array<{ x: string; y: string }> = [
    { x: '8%', y: '6%' }, { x: '88%', y: '10%' }, { x: '14%', y: '32%' }, { x: '90%', y: '40%' },
    { x: '6%', y: '62%' }, { x: '92%', y: '68%' }, { x: '12%', y: '86%' }, { x: '84%', y: '90%' },
    { x: '50%', y: '4%' }, { x: '50%', y: '96%' },
  ];
  const getIcon = (i: number) => {
    if (type === 'mix') {
      const keys = Object.keys(STICKER_ICONS) as Array<keyof typeof STICKER_ICONS>;
      return STICKER_ICONS[keys[i % keys.length]];
    }
    return STICKER_ICONS[type as keyof typeof STICKER_ICONS] || Star;
  };
  return Array.from({ length: count }).map((_, i) => ({
    icon: getIcon(i),
    x: positions[i]?.x || `${(i * 17) % 100}%`,
    y: positions[i]?.y || `${(i * 23) % 100}%`,
    size: 14 + (i % 3) * 6,
    rot: (i * 37) % 360,
    color: colors[i % colors.length],
    delay: (i % 5) * 0.4,
  }));
}

export function CreatorTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'creator', creatorMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#FF6B9D');
  const highlightColor = s.useHighlightCustom && s.highlightCustom ? s.highlightCustom : (s.highlightColor || '#FDE047');
  const bg = profile.bg_color || '#FFF0F5';
  const text = profile.text_color || '#2D1B3D';
  const shape = SHAPES[s.bubbleShape] || SHAPES.rounded;
  const hoverCls = HOVER_CLS[s.hoverAnim] || '';
  const t = (a: string, b: string | null) => track?.(a, b);

  const stickers = buildStickers(s.stickers, s.stickerType, accent);

  const ringAnim = s.avatarRing === 'spinning' ? 'creator-spin 8s linear infinite'
    : s.avatarRing === 'pulsing' ? 'creator-pulse 2.4s ease-in-out infinite'
    : 'none';

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: getFontStack(s.bodyFont, 'var(--font-dmsans), var(--font-inter), system-ui'),
        backgroundImage: `radial-gradient(circle at 20% 15%, ${accent}22, transparent 45%), radial-gradient(circle at 85% 85%, #5EEAD433, transparent 45%), radial-gradient(circle at 80% 20%, #FDE04733, transparent 40%)`,
      }}
    >
      {stickers.map((st, i) => {
        const Icon = st.icon;
        return (
          <div
            key={i}
            className="absolute pointer-events-none creator-float"
            style={{
              left: st.x,
              top: st.y,
              transform: `rotate(${st.rot}deg)`,
              animationDelay: `${st.delay}s`,
            }}
            aria-hidden
          >
            <Icon className="" style={{ width: st.size, height: st.size, color: st.color, fill: st.color }} />
          </div>
        );
      })}

      <div className="relative max-w-md mx-auto px-5 pt-[72px] pb-16">
        <div className="flex flex-col items-center text-center">
          <div className="relative" style={{ width: profile.avatar_size ?? 128, height: profile.avatar_size ?? 128 }}>
            <div
              className="absolute inset-[-6px] rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${accent}, #FDE047, #5EEAD4, #B794F6, ${accent})`,
                animation: ringAnim,
              }}
              aria-hidden
            />
            <div className="absolute inset-[-2px] rounded-full" style={{ background: bg }} aria-hidden />
            <div className="relative w-full h-full overflow-hidden rounded-full">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: `${accent}33` }} />
              )}
            </div>
            <div
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}, #FDE047)`,
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white" fill="white" />
            </div>
          </div>

          <h1
            className="mt-6 text-4xl leading-tight"
            style={{ color: text, fontWeight: 900, letterSpacing: '-0.03em', fontFamily: getFontStack(s.titleFont, 'inherit') }}
          >
            {s.highlight ? (
              <span
                style={{
                  background: `linear-gradient(180deg, transparent 60%, ${highlightColor} 60%)`,
                  padding: '0 6px',
                  borderRadius: 4,
                }}
              >
                {profile.display_name || ''}
              </span>
            ) : (
              profile.display_name || ''
            )}
          </h1>
          {s.tagline && s.tagline.trim() && (
            <div className="mt-2 text-sm font-bold whitespace-pre-line" style={{ color: accent }}>{s.tagline}</div>
          )}
          {profile.bio && (
            <p
              className="mt-3 text-[15px] max-w-xs leading-relaxed whitespace-pre-line"
              style={{ color: text, opacity: 0.8, fontWeight: 500 }}
            >
              {profile.bio}
            </p>
          )}

          {s.showSocials !== false && socials?.length > 0 && (
            <div className="mt-5 flex gap-2.5 flex-wrap justify-center">
              {socials.map((soc: any, i: number) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                const palette = [accent, '#FDE047', '#5EEAD4', '#B794F6', '#FB7185'];
                const color = palette[i % palette.length];
                return (
                  <a
                    key={soc.id}
                    href={getSocialHref(soc.platform, soc.url)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => t('social', soc.id)}
                    className={`w-11 h-11 flex items-center justify-center transition-all hover:-translate-y-0.5 ${hoverCls}`}
                    style={{
                      borderRadius: shape === SHAPES.blob ? '50%' : shape,
                      background: '#FFFFFF',
                      color,
                      boxShadow: `4px 4px 0 ${color}`,
                      border: `2px solid ${text}`,
                    }}
                    aria-label={meta?.label || soc.platform}
                  >
                    {Icon && <Icon className="w-[18px] h-[18px]" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {links.map((l: any, i: number) => {
            const palette = [accent, '#5EEAD4', '#FDE047', '#B794F6', '#FB7185'];
            const cardColor = palette[i % palette.length];
            const isCta = i === 0 && s.holoCta;
            return (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => t('link', l.id)}
                className={`group px-5 py-4 transition-all ${hoverCls}`}
                style={{
                  borderRadius: shape,
                  background: isCta
                    ? `linear-gradient(135deg, ${accent}, #5EEAD4, #FDE047, #B794F6)`
                    : '#FFFFFF',
                  backgroundSize: isCta ? '300% 300%' : 'auto',
                  animation: isCta ? 'creator-holo 4s ease infinite' : undefined,
                  color: isCta ? '#FFFFFF' : text,
                  border: `3px solid ${text}`,
                  boxShadow: `6px 6px 0 ${cardColor}`,
                  fontWeight: 700,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[16px] truncate" style={{ fontWeight: 800 }}>
                      {l.title}
                    </div>
                    {l.subtitle && (
                      <div className="text-xs mt-0.5 opacity-70 truncate">{l.subtitle}</div>
                    )}
                  </div>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: isCta ? 'rgba(255,255,255,0.3)' : cardColor,
                      color: isCta ? '#FFFFFF' : text,
                      border: `2px solid ${text}`,
                    }}
                  >
                    <Sparkles className="w-4 h-4" fill="currentColor" />
                  </div>
                </div>
              </a>
            );
          })}

          {banners?.map((b: any) => {
            const inner = (
              <div
                className={`overflow-hidden ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{
                  borderRadius: shape,
                  border: `3px solid ${text}`,
                  boxShadow: `6px 6px 0 ${accent}`,
                }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : (
              <div key={b.id}>{inner}</div>
            );
          })}

          {videos.map((v: any) => (
            <div
              key={v.id}
              className="overflow-hidden"
              style={{
                borderRadius: shape,
                background: '#FFFFFF',
                border: `3px solid ${text}`,
                boxShadow: `6px 6px 0 #5EEAD4`,
              }}
            >
              <div className="relative aspect-video bg-black">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-3 text-sm" style={{ color: text, fontWeight: 700 }}>
                  {v.title}
                </div>
              )}
            </div>
          ))}
        </div>
        {s.footerText && s.footerText.trim() && (
          <div className="mt-6 text-center text-xs font-bold" style={{ color: text, opacity: 0.75 }}>{s.footerText}</div>
        )}
        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
      </div>

      <style jsx>{`
        :global(.creator-float) {
          animation: creator-float 4s ease-in-out infinite;
        }
        :global(.creator-wiggle:hover) {
          animation: creator-wiggle 0.5s ease-in-out;
        }
        :global(.creator-bounce:hover) {
          animation: creator-bounce 0.6s ease-in-out;
        }
        :global(.creator-scale:hover) {
          transform: scale(1.03);
        }
        @keyframes creator-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(8deg); }
        }
        @keyframes creator-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          75% { transform: rotate(2deg); }
        }
        @keyframes creator-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes creator-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes creator-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes creator-holo {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

export default CreatorTheme;
