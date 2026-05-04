'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const ivoryMeta: BioThemeMeta = {
  key: 'ivory',
  name: 'Ivory & Ink',
  description: 'Cartão de visita impresso em luxo: marfim quente, serifas elegantes e detalhes em ocre refinado.',
  available: true,
  defaults: {
    bg_color: '#FAF8F5',
    button_color: '#C49A3C',
    text_color: '#1A1209',
  },
  palettes: {
    bg: ['#FAF8F5', '#F5F0E8', '#FFFDF8', '#FFF8EE', '#1A1209', '#2C2010'],
    accent: ['#C49A3C', '#A07830', '#8B6914', '#8C7355', '#2C5F8A', '#6B2D2D'],
    text: ['#1A1209', '#2C2010', '#4A3C28', '#FFFFFF'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'cormorant', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'cormorant', group: 'Tipografia' },
    { key: 'nameItalic', label: 'Nome em itálico', type: 'toggle', default: true, group: 'Tipografia' },
    { key: 'showDot', label: 'Ponto decorativo nos links', type: 'toggle', default: true, group: 'Layout' },
    { key: 'showOrnament', label: 'Ornamento decorativo', type: 'toggle', default: true, group: 'Layout' },
    { key: 'titleText', label: 'Título profissional', type: 'text', default: '', placeholder: 'Ex: Advogada Tributarista', maxLength: 80, group: 'Textos' },
    { key: 'companyText', label: 'Empresa / Escritório', type: 'text', default: '', placeholder: 'Ex: Silva & Associados', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: OAB 123456-SP', maxLength: 80, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function IvoryTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'ivory', ivoryMeta.controls);
  const bg = profile.bg_color || '#FAF8F5';
  const text = profile.text_color || '#1A1209';
  const accent = profile.button_color || '#C49A3C';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-cormorant), Georgia, serif');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const t = (a: string, b: string | null) => track?.(a, b);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      <div className="relative mx-auto px-10 max-w-sm pt-16 pb-16">
        <header className="text-center mb-10">
          {profile.avatar_url && (
            <div
              className="mx-auto mb-6 rounded-full overflow-hidden"
              style={{
                width: profile.avatar_size ?? 88,
                height: profile.avatar_size ?? 88,
                boxShadow: `0 0 0 1px ${accent}44, 0 0 0 4px ${bg}, 0 0 0 5px ${accent}22`,
              }}
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" style={{ filter: 'sepia(8%)' }} />
            </div>
          )}

          <h1
            className="leading-none"
            style={{
              fontSize: '32px',
              fontWeight: 400,
              fontFamily: titleFamily,
              fontStyle: s.nameItalic ? 'italic' : 'normal',
              letterSpacing: '0.02em',
              color: text,
            }}
          >
            {profile.display_name}
          </h1>

          {s.titleText && (
            <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.2em]" style={{ color: accent }}>
              {s.titleText}
            </p>
          )}
          {s.companyText && (
            <p className="mt-0.5 text-sm" style={{ color: `${text}88`, fontStyle: 'italic' }}>
              {s.companyText}
            </p>
          )}

          {profile.bio && (
            <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line" style={{ color: `${text}BB`, fontStyle: 'italic' }}>
              {profile.bio}
            </p>
          )}

          {s.showOrnament && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="h-px flex-1" style={{ background: `${accent}40` }} />
              <span style={{ color: accent, fontSize: '10px', letterSpacing: '0.3em' }}>◆</span>
              <div className="h-px flex-1" style={{ background: `${accent}40` }} />
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

        <div className="flex flex-col gap-0">
          {links.map((l: any, i: number) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="group flex items-center gap-3 py-3.5 transition-opacity hover:opacity-60"
              style={{ borderBottom: `1px solid ${text}0F` }}
            >
              {s.showDot && (
                <span style={{ color: accent, fontSize: '7px' }}>◆</span>
              )}
              <span
                className="flex-1 text-[16px]"
                style={{ fontFamily: titleFamily, fontStyle: 'italic', fontWeight: 400, letterSpacing: '0.01em' }}
              >
                {l.title}
              </span>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div key={b.id} className={`overflow-hidden rounded-sm mt-5 ${BANNER_H[b.size] || BANNER_H.md}`} style={{ border: `1px solid ${accent}22` }}>
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" style={{ filter: 'sepia(5%)' }} />}
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
                <div className="px-3 py-2.5 text-sm" style={{ fontStyle: 'italic', color: `${text}AA` }}>{v.title}</div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-xs uppercase tracking-[0.2em]" style={{ color: `${text}44` }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default IvoryTheme;
