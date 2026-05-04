'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const decoMeta: BioThemeMeta = {
  key: 'deco',
  name: 'Art Deco Luxe',
  description: 'Glamour dourado dos anos 20: linhas geométricas em ouro, fundo obsidiana e brilho Art Déco.',
  available: true,
  defaults: {
    bg_color: '#0C0C0C',
    button_color: '#C9A84C',
    text_color: '#F5E6C8',
  },
  palettes: {
    bg: ['#0C0C0C', '#0A0806', '#141008', '#1A1510', '#F5E6C8', '#FAF4E4'],
    accent: ['#C9A84C', '#E8C96B', '#A88830', '#D4AF37', '#B8860B', '#FFD700'],
    text: ['#F5E6C8', '#FFFFFF', '#E8D5A0', '#0C0C0C'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'playfair', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'cormorant', group: 'Tipografia' },
    { key: 'showOrnaments', label: 'Ornamentos decorativos', type: 'toggle', default: true, group: 'Visual' },
    { key: 'showGeometricLines', label: 'Linhas geométricas Art Deco', type: 'toggle', default: true, group: 'Visual' },
    { key: 'avatarFrame', label: 'Moldura do avatar', type: 'select', options: [
      { value: 'diamond', label: 'Diamante' },
      { value: 'circle', label: 'Círculo' },
      { value: 'square', label: 'Quadrado' },
    ], default: 'diamond', group: 'Layout' },
    { key: 'tagline', label: 'Tagline / Titre', type: 'text', default: '', placeholder: 'Ex: Haute Couture & Design', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: Paris · New York · Milano', maxLength: 80, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function DecoTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'deco', decoMeta.controls);
  const bg = profile.bg_color || '#0C0C0C';
  const text = profile.text_color || '#F5E6C8';
  const accent = profile.button_color || '#C9A84C';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-playfair), Georgia, serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-cormorant), Georgia, serif');
  const t = (a: string, b: string | null) => track?.(a, b);

  const avatarEl = (
    <div className="relative mx-auto mb-6" style={{ width: (profile.avatar_size ?? 88) + 16, height: (profile.avatar_size ?? 88) + 16 }}>
      {s.showGeometricLines && (
        <div
          className="absolute inset-0"
          style={{
            border: `1px solid ${accent}44`,
            borderRadius: s.avatarFrame === 'diamond' ? '0' : s.avatarFrame === 'square' ? '4px' : '50%',
            transform: s.avatarFrame === 'diamond' ? 'rotate(45deg)' : 'none',
          }}
        />
      )}
      <div
        className="absolute inset-2 overflow-hidden"
        style={{
          borderRadius: s.avatarFrame === 'circle' ? '50%' : s.avatarFrame === 'square' ? '2px' : '2px',
          transform: s.avatarFrame === 'diamond' ? 'none' : 'none',
          boxShadow: `0 0 20px ${accent}44`,
          border: `2px solid ${accent}66`,
        }}
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: `${accent}22` }} />
        )}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showGeometricLines && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${accent}44 30%, ${accent}88 50%, ${accent}44 70%, transparent 100%)` }} />
          <div className="absolute bottom-0 left-0 w-full h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${accent}44 30%, ${accent}88 50%, ${accent}44 70%, transparent 100%)` }} />
        </div>
      )}

      <div className="relative mx-auto px-8 max-w-sm pt-14 pb-16">
        <header className="text-center mb-8">
          {s.showOrnaments && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
              <span className="text-[8px] tracking-[0.4em] uppercase font-bold" style={{ color: accent }}>◆◇◆</span>
              <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
            </div>
          )}

          {profile.avatar_url && avatarEl}

          <h1
            className="leading-tight"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              fontFamily: titleFamily,
              color: text,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {profile.display_name}
          </h1>

          {s.tagline && (
            <p className="mt-1.5 text-xs font-medium tracking-[0.25em] uppercase" style={{ color: accent }}>
              {s.tagline}
            </p>
          )}

          {profile.bio && (
            <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line italic" style={{ color: `${text}CC` }}>
              {profile.bio}
            </p>
          )}

          {s.showOrnaments && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${accent}66)` }} />
              <span className="text-[8px]" style={{ color: `${accent}88` }}>◆</span>
              <div className="h-px flex-1" style={{ background: `${accent}44` }} />
              <span className="text-[8px]" style={{ color: `${accent}88` }}>◆</span>
              <div className="h-px w-8" style={{ background: `linear-gradient(90deg, ${accent}66, transparent)` }} />
            </div>
          )}

          {socials?.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-5">
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
                    style={{ color: `${accent}AA` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[16px] h-[16px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </header>

        <div className="flex flex-col gap-2">
          {links.map((l: any) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="group flex items-center gap-3 py-3.5 px-4 transition-all hover:opacity-70"
              style={{
                border: `1px solid ${accent}44`,
                backgroundColor: `${accent}08`,
              }}
            >
              {s.showOrnaments && (
                <span className="text-[8px] shrink-0" style={{ color: accent }}>◆</span>
              )}
              <span
                className="flex-1 text-[16px] uppercase tracking-wider"
                style={{ fontFamily: titleFamily, color: text, letterSpacing: '0.1em', fontWeight: 500 }}
              >
                {l.title}
              </span>
              {s.showOrnaments && (
                <span className="text-[8px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>◆</span>
              )}
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-3 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ border: `1px solid ${accent}44` }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="overflow-hidden mt-3" style={{ border: `1px solid ${accent}44` }}>
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-2 text-xs uppercase tracking-widest text-center" style={{ fontFamily: titleFamily, color: accent }}>
                  {v.title}
                </div>
              )}
            </div>
          ))}
        </div>

        {s.showOrnaments && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${accent}66)` }} />
            <span className="text-[8px] tracking-[0.4em]" style={{ color: `${accent}66` }}>◆◇◆</span>
            <div className="h-px w-8" style={{ background: `linear-gradient(90deg, ${accent}66, transparent)` }} />
          </div>
        )}

        {s.footerText && s.footerText.trim() && (
          <p className="mt-4 text-center text-[11px] tracking-widest uppercase" style={{ color: `${accent}66` }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default DecoTheme;
