'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack, orderedSections } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';
import { ChevronRight } from 'lucide-react';

export const cupertinoMeta: BioThemeMeta = {
  key: 'cupertino',
  name: 'Cupertino',
  description: 'Design ultra moderno estilo Apple: glassmorphism, tipografia SF, micro-interações refinadas e hierarquia cristalina.',
  available: true,
  defaults: {
    bg_color: '#F5F5F7',
    button_color: '#0071E3',
    text_color: '#1D1D1F',
  },
  palettes: {
    bg: ['#F5F5F7', '#FFFFFF', '#FBFBFD', '#000000', '#1D1D1F', '#0A0A0A'],
    accent: ['#0071E3', '#5E5CE6', '#30D158', '#FF375F', '#FF9F0A', '#64D2FF'],
    text: ['#1D1D1F', '#000000', '#6E6E73', '#F5F5F7', '#FFFFFF'],
  },
  controls: [
    { key: 'appearance', label: 'Aparência', type: 'radio', options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ], default: 'light', group: 'Aparência', category: 'cores' },
    { key: 'glass', label: 'Efeito glass (blur)', type: 'toggle', default: true, group: 'Aparência', category: 'efeitos' },
    { key: 'tint', label: 'Tint de fundo', type: 'select', options: [
      { value: 'none', label: 'Sem tint' },
      { value: 'warm', label: 'Quente' },
      { value: 'cool', label: 'Frio' },
      { value: 'mesh', label: 'Gradiente mesh' },
    ], default: 'mesh', group: 'Aparência', category: 'efeitos' },
    { key: 'radius', label: 'Arredondamento (px)', type: 'slider', min: 12, max: 28, step: 2, suffix: 'px', default: 20, group: 'Layout', category: 'layout' },
    { key: 'density', label: 'Densidade', type: 'select', options: [
      { value: 'compact', label: 'Compacta' },
      { value: 'regular', label: 'Regular' },
      { value: 'spacious', label: 'Espaçosa' },
    ], default: 'regular', group: 'Layout', category: 'layout' },
    { key: 'showBadge', label: 'Badge verificado', type: 'toggle', default: true, group: 'Layout', category: 'geral' },
    { key: 'badgeText', label: 'Texto do badge', type: 'text', default: 'Verificado', maxLength: 20, group: 'Textos', category: 'textos' },
    { key: 'sectionLabel', label: 'Rótulo da seção', type: 'text', default: 'Links', maxLength: 20, group: 'Textos', category: 'textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: Feito em Cupertino', maxLength: 60, group: 'Textos', category: 'textos' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'inter', group: 'Tipografia', category: 'tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia', category: 'tipografia' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function CupertinoTheme({ profile, links, socials, videos, banners, sectionOrder, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'cupertino', cupertinoMeta.controls);
  const isDark = s.appearance === 'dark';
  const bg = profile.bg_color || (isDark ? '#000000' : '#F5F5F7');
  const text = profile.text_color || (isDark ? '#F5F5F7' : '#1D1D1F');
  const accent = profile.button_color || '#0071E3';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-inter), -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const radius = Number(s.radius) || 20;
  const density = s.density || 'regular';
  const pad = density === 'compact' ? 14 : density === 'spacious' ? 22 : 18;
  const gap = density === 'compact' ? 8 : density === 'spacious' ? 14 : 10;
  const glassBg = isDark ? 'rgba(28,28,30,0.72)' : 'rgba(255,255,255,0.72)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const subText = isDark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const t = (a: string, b: string | null) => track?.(a, b);

  const meshStyle = (() => {
    if (s.tint === 'none') return {};
    if (s.tint === 'warm') return {
      backgroundImage: `radial-gradient(ellipse at 20% 0%, ${accent}22 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, #FF9F0A22 0%, transparent 50%)`,
    };
    if (s.tint === 'cool') return {
      backgroundImage: `radial-gradient(ellipse at 20% 0%, #64D2FF22 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, ${accent}22 0%, transparent 50%)`,
    };
    return {
      backgroundImage: `radial-gradient(at 15% 10%, ${accent}28 0px, transparent 50%), radial-gradient(at 85% 20%, #FF375F1F 0px, transparent 50%), radial-gradient(at 75% 90%, #5E5CE624 0px, transparent 50%), radial-gradient(at 10% 80%, #30D15820 0px, transparent 50%)`,
    };
  })();

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily, ...meshStyle }}
    >
      <div className="max-w-md mx-auto px-5 pt-14 pb-24 relative">
        <header className="text-center mb-8">
          {profile.avatar_url && (
            <div
              className="mx-auto mb-5 relative"
              style={{
                width: profile.avatar_size ?? 96,
                height: profile.avatar_size ?? 96,
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                aria-hidden
                style={{
                  background: `conic-gradient(from 180deg at 50% 50%, ${accent}, #FF375F, #FF9F0A, #30D158, #64D2FF, ${accent})`,
                  filter: 'blur(14px)',
                  opacity: 0.55,
                }}
              />
              <div
                className="relative rounded-full overflow-hidden w-full h-full"
                style={{
                  boxShadow: isDark
                    ? '0 10px 40px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)'
                    : '0 10px 40px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5">
            <h1
              className="tracking-tight"
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: text,
                fontFamily: titleFamily,
                lineHeight: 1.1,
              }}
            >
              {profile.display_name}
            </h1>
            {s.showBadge && (
              <span
                className="inline-flex items-center justify-center rounded-full"
                style={{ width: 18, height: 18, background: accent }}
                aria-label={s.badgeText || 'Verificado'}
              >
                <svg viewBox="0 0 16 16" width="11" height="11" fill="none" aria-hidden>
                  <path d="M4 8.2 6.8 11 12 5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="mt-3.5 text-[15px] leading-[1.45] whitespace-pre-line mx-auto max-w-[340px]" style={{ color: text, opacity: 0.85 }}>
              {profile.bio}
            </p>
          )}

        </header>

        <div
          className="flex flex-col"
          style={{ gap }}
        >
          {orderedSections(sectionOrder, {
            socials: socials?.length > 0 ? (
              <div key="socials" className="flex items-center justify-center gap-2 flex-wrap">
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
                      className="cupertino-chip flex items-center justify-center transition-all"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        background: s.glass ? glassBg : (isDark ? 'rgba(44,44,46,0.9)' : '#FFFFFF'),
                        border: `1px solid ${cardBorder}`,
                        color: text,
                        backdropFilter: s.glass ? 'blur(20px) saturate(180%)' : undefined,
                        WebkitBackdropFilter: s.glass ? 'blur(20px) saturate(180%)' : undefined,
                      }}
                      aria-label={meta?.label}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </a>
                  ) : null;
                })}
              </div>
            ) : null,
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col" style={{ gap }}>
                <div className="mb-2 px-1 flex items-center justify-between">
                  <span className="text-[13px] font-semibold tracking-[-0.01em]" style={{ color: subText, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {s.sectionLabel || 'Links'}
                  </span>
                  <span className="text-[13px] tabular-nums" style={{ color: subText }}>{String(links.length).padStart(2, '0')}</span>
                </div>
                {links.map((l: any) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => t('link', l.id)}
                    className="cupertino-card group flex items-center justify-between transition-all"
                    style={{
                      padding: `${pad}px ${pad + 2}px`,
                      borderRadius: radius,
                      background: s.glass ? glassBg : (isDark ? 'rgba(28,28,30,0.95)' : '#FFFFFF'),
                      border: `1px solid ${cardBorder}`,
                      backdropFilter: s.glass ? 'blur(20px) saturate(180%)' : undefined,
                      WebkitBackdropFilter: s.glass ? 'blur(20px) saturate(180%)' : undefined,
                      boxShadow: isDark
                        ? '0 1px 0 rgba(255,255,255,0.04) inset, 0 6px 24px -10px rgba(0,0,0,0.6)'
                        : '0 1px 0 rgba(255,255,255,0.9) inset, 0 6px 24px -10px rgba(0,0,0,0.12)',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          background: `linear-gradient(135deg, ${accent}, ${accent}AA)`,
                          color: '#fff',
                          boxShadow: `0 4px 12px -2px ${accent}66`,
                        }}
                        aria-hidden
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
                          <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div
                          className="truncate"
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            color: text,
                            fontFamily: titleFamily,
                          }}
                        >
                          {l.title}
                        </div>
                        {l.subtitle && (
                          <div className="truncate mt-0.5 text-[13px]" style={{ color: subText }}>{l.subtitle}</div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="shrink-0 transition-transform group-hover:translate-x-0.5" style={{ width: 18, height: 18, color: subText }} />
                  </a>
                ))}
              </div>
            ) : null,
            banners: banners?.length > 0 ? (
              <div key="banners" className="flex flex-col" style={{ gap }}>
                {banners.map((b: any) => {
                  const inner = (
                    <div
                      className={`overflow-hidden ${BANNER_H[b.size] || BANNER_H.md}`}
                      style={{
                        borderRadius: radius,
                        border: `1px solid ${cardBorder}`,
                        boxShadow: isDark
                          ? '0 6px 24px -10px rgba(0,0,0,0.6)'
                          : '0 6px 24px -10px rgba(0,0,0,0.12)',
                      }}
                    >
                      {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                  );
                  return b.link_url ? (
                    <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
                  ) : <div key={b.id}>{inner}</div>;
                })}
              </div>
            ) : null,
            videos: videos.length > 0 ? (
              <div key="videos" className="flex flex-col" style={{ gap }}>
                {videos.map((v: any) => (
                  <figure
                    key={v.id}
                    className="overflow-hidden"
                    style={{
                      borderRadius: radius,
                      background: s.glass ? glassBg : (isDark ? 'rgba(28,28,30,0.95)' : '#FFFFFF'),
                      border: `1px solid ${cardBorder}`,
                      backdropFilter: s.glass ? 'blur(20px) saturate(180%)' : undefined,
                      WebkitBackdropFilter: s.glass ? 'blur(20px) saturate(180%)' : undefined,
                      boxShadow: isDark
                        ? '0 6px 24px -10px rgba(0,0,0,0.6)'
                        : '0 6px 24px -10px rgba(0,0,0,0.12)',
                    }}
                  >
                    <div className="relative aspect-video">
                      <VideoEmbed video={v} preview={preview} />
                    </div>
                    {v.title && (
                      <figcaption
                        className="px-4 py-3 text-[14px] font-medium tracking-[-0.01em]"
                        style={{ color: text, fontFamily: titleFamily }}
                      >
                        {v.title}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            ) : null,
          })}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-[12px] tracking-[-0.01em]" style={{ color: subText }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>

      <style jsx>{`
        :global(.cupertino-card) {
          transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        :global(.cupertino-card:hover) {
          transform: translateY(-2px);
        }
        :global(.cupertino-card:active) {
          transform: scale(0.985);
          transition-duration: 120ms;
        }
        :global(.cupertino-chip) {
          transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        :global(.cupertino-chip:hover) {
          transform: translateY(-2px) scale(1.04);
        }
        :global(.cupertino-chip:active) {
          transform: scale(0.94);
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.cupertino-card),
          :global(.cupertino-chip) { transition: none; }
          :global(.cupertino-card:hover),
          :global(.cupertino-chip:hover) { transform: none; }
        }
      `}</style>
    </div>
  );
}

export default CupertinoTheme;