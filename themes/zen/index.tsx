'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const zenMeta: BioThemeMeta = {
  key: 'zen',
  name: 'Zen Garden',
  description: 'Serenidade japonesa: papel arroz, caligrafia sutil, bamboo sticks e ondas de água no hover.',
  available: true,
  defaults: {
    bg_color: '#F8F5EE',
    button_color: '#8B4513',
    text_color: '#1A1008',
  },
  palettes: {
    bg: ['#F8F5EE', '#FAF8F3', '#FFF8F0', '#F0EDE4', '#1A1008', '#2C1810'],
    accent: ['#8B4513', '#C44B2B', '#4A7C59', '#5C3D8F', '#8B6914', '#2C5F8A'],
    text: ['#1A1008', '#2C1810', '#4A3828', '#FFFFFF'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'fraunces', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'fraunces', group: 'Tipografia' },
    { key: 'showBrush', label: 'Traço de pincel decorativo', type: 'toggle', default: true, group: 'Layout' },
    { key: 'showWave', label: 'Animação de onda no hover', type: 'toggle', default: true, group: 'Layout' },
    { key: 'seasonIcon', label: 'Ícone sazonal', type: 'select', options: [
      { value: 'none', label: 'Nenhum' },
      { value: 'sakura', label: 'Sakura 🌸' },
      { value: 'bamboo', label: 'Bambu 🎋' },
      { value: 'moon', label: 'Lua 🌙' },
      { value: 'wave', label: 'Onda 🌊' },
    ], default: 'sakura', group: 'Decoração' },
    { key: 'tagline', label: 'Subtítulo poético', type: 'text', default: '', placeholder: 'Ex: Criando com intenção', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: 東京 · Tokyo', maxLength: 60, group: 'Textos' },
  ],
};

const SEASON_ICONS: Record<string, string> = {
  sakura: '🌸', bamboo: '🎋', moon: '🌙', wave: '🌊', none: '',
};
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function ZenTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'zen', zenMeta.controls);
  const bg = profile.bg_color || '#F8F5EE';
  const text = profile.text_color || '#1A1008';
  const accent = profile.button_color || '#8B4513';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-fraunces), Georgia, serif');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const t = (a: string, b: string | null) => track?.(a, b);
  const icon = SEASON_ICONS[s.seasonIcon] || '';

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      <div className="relative mx-auto px-8 max-w-sm pt-14 pb-16">
        <header className="text-center mb-10">
          {icon && <div className="text-3xl mb-4">{icon}</div>}

          {profile.avatar_url && (
            <div
              className="mx-auto mb-5 rounded-full overflow-hidden"
              style={{
                width: profile.avatar_size ?? 88,
                height: profile.avatar_size ?? 88,
                boxShadow: `0 0 0 1px ${accent}33, 0 4px 20px ${accent}22`,
              }}
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h1
            className="leading-tight"
            style={{ fontSize: '28px', fontWeight: 300, fontFamily: titleFamily, fontStyle: 'italic', color: text }}
          >
            {profile.display_name}
          </h1>

          {s.tagline && (
            <p className="mt-1.5 text-sm" style={{ color: `${text}77`, fontStyle: 'italic' }}>{s.tagline}</p>
          )}

          {s.showBrush && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <svg width="80" height="6" viewBox="0 0 80 6" fill="none">
                <path d="M2 3 Q20 1 40 3 Q60 5 78 3" stroke={accent} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </div>
          )}

          {profile.bio && (
            <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line" style={{ color: `${text}AA`, fontStyle: 'italic' }}>
              {profile.bio}
            </p>
          )}

          {socials?.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-5">
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

        <div className="flex flex-col gap-1">
          {links.map((l: any) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className={`group flex items-center gap-3 py-4 px-2 transition-all ${s.showWave ? 'zen-link' : 'hover:opacity-60'}`}
              style={{ borderBottom: `1px solid ${accent}22` }}
            >
              <span className="text-[10px]" style={{ color: accent }}>▸</span>
              <span
                className="flex-1 text-[16px] font-light"
                style={{ fontFamily: titleFamily, fontStyle: 'italic', letterSpacing: '0.02em' }}
              >
                {l.title}
              </span>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div key={b.id} className={`overflow-hidden rounded-sm mt-5 ${BANNER_H[b.size] || BANNER_H.md}`} style={{ border: `1px solid ${accent}22` }}>
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="overflow-hidden rounded-sm mt-5" style={{ border: `1px solid ${text}10` }}>
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-3 py-2 text-sm" style={{ fontStyle: 'italic', color: `${text}88` }}>{v.title}</div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-xs" style={{ color: `${text}44`, fontStyle: 'italic', letterSpacing: '0.1em' }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>

      <style jsx>{`
        .zen-link:hover {
          background: linear-gradient(90deg, ${accent}08 0%, transparent 100%);
          padding-left: 12px;
          transition: all 0.4s ease;
        }
        .zen-link {
          transition: all 0.4s ease;
        }
      `}</style>
    </div>
  );
}

export default ZenTheme;
