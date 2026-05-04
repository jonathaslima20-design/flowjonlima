'use client';

import { ArrowUpRight } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const agencyMeta: BioThemeMeta = {
  key: 'agency',
  name: 'Agency Bold',
  description: 'Studio criativo premiado: tipografia display massiva, acento neon, numeracao estilo portfolio e marquee horizontal.',
  available: true,
  defaults: {
    bg_color: '#0A0A0A',
    button_color: '#BEF264',
    text_color: '#FAFAFA',
    border_width: 0,
    shadow_offset: 0,
  },
  palettes: {
    bg: ['#0A0A0A', '#FAF7F0', '#E8DCC4', '#171717', '#1A1A1A', '#F5F5F5'],
    accent: ['#BEF264', '#F97316', '#FB7185', '#3B82F6', '#A855F7', '#10B981'],
    text: ['#FAFAFA', '#0A0A0A', '#E8DCC4', '#1A1A1A'],
  },
  controls: [
    { key: 'titleFont', label: 'Tipografia do titulo', type: 'select', options: [
      { value: 'serif', label: 'Serif display' },
      { value: 'sansBlack', label: 'Sans black' },
      { value: 'mono', label: 'Mono bold' },
      { value: 'mix', label: 'Mix serif+sans' },
    ], default: 'sansBlack', group: 'Tipografia' },
    { key: 'titleSize', label: 'Tamanho do titulo', type: 'select', options: [
      { value: 'xl', label: 'Grande' },
      { value: 'xxl', label: 'Extra grande' },
      { value: 'giant', label: 'Gigante' },
    ], default: 'xxl', group: 'Tipografia' },
    { key: 'topTag', label: 'Tag superior', type: 'select', options: [
      { value: 'studio', label: 'STUDIO' },
      { value: 'agency', label: 'AGENCY' },
      { value: 'creative', label: 'CREATIVE' },
      { value: 'projects', label: 'PROJECTS' },
      { value: 'none', label: 'Sem tag' },
    ], default: 'studio', group: 'Cabecalho' },
    { key: 'numbering', label: 'Numeracao dos links', type: 'select', options: [
      { value: 'zero', label: '001, 002, 003' },
      { value: 'num', label: 'Project nº' },
      { value: 'none', label: 'Sem numeracao' },
    ], default: 'zero', group: 'Layout' },
    { key: 'diagonals', label: 'Linhas diagonais', type: 'toggle', default: true, group: 'Decoracao' },
    { key: 'marquee', label: 'Marquee horizontal', type: 'toggle', default: true, group: 'Decoracao' },
    { key: 'marqueeWords', label: 'Palavras do marquee', type: 'select', options: [
      { value: 'brand', label: 'Brand Design · Strategy · Motion' },
      { value: 'dev', label: 'Code · Design · Systems' },
      { value: 'mkt', label: 'Marketing · Content · Growth' },
      { value: 'art', label: 'Art · Direction · Identity' },
    ], default: 'brand', group: 'Decoracao' },
    { key: 'hoverStyle', label: 'Hover dos links', type: 'select', options: [
      { value: 'underline', label: 'Underline' },
      { value: 'slide', label: 'Slide' },
      { value: 'invert', label: 'Invert' },
      { value: 'arrow', label: 'Seta' },
    ], default: 'slide', group: 'Links' },
    { key: 'customTag', label: 'Texto da tag (personalizado)', type: 'text', default: '', placeholder: 'Deixe vazio para usar preset', maxLength: 24, group: 'Textos' },
    { key: 'customMarquee', label: 'Texto do marquee (personalizado)', type: 'text', default: '', placeholder: 'Ex: BRAND · MOTION · CODE', maxLength: 120, group: 'Textos' },
    { key: 'estLabel', label: 'Rótulo de rodapé (est.)', type: 'text', default: '', placeholder: 'EST. 2024', maxLength: 24, group: 'Textos' },
    { key: 'selectedLabel', label: 'Título da seção de links', type: 'text', default: 'SELECTED LINKS', maxLength: 32, group: 'Textos' },
    { key: 'worksLabel', label: 'Título da seção de mídia', type: 'text', default: 'WORKS & MEDIA', maxLength: 32, group: 'Textos' },
    { key: 'liveBadge', label: 'Badge do avatar', type: 'text', default: 'LIVE', maxLength: 10, group: 'Textos' },
    { key: 'accentCustom', label: 'Cor de destaque (personalizada)', type: 'colorPicker', default: '#BEF264', group: 'Cores' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada de destaque', type: 'toggle', default: false, group: 'Cores' },
    { key: 'titleFontFamily', label: 'Fonte curada do título', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: ALL WORKS RESERVED', maxLength: 60, group: 'Textos' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
  ],
};

const TITLE_SIZES: Record<string, string> = {
  xl: 'text-5xl',
  xxl: 'text-6xl',
  giant: 'text-7xl',
};

const MARQUEE_TEXT: Record<string, string> = {
  brand: 'BRAND DESIGN · STRATEGY · MOTION · IDENTITY',
  dev: 'CODE · DESIGN SYSTEMS · INTERFACES · PRODUCT',
  mkt: 'MARKETING · CONTENT · GROWTH · PERFORMANCE',
  art: 'ART DIRECTION · IDENTITY · EDITORIAL · PRINT',
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

const TAG_TEXT: Record<string, string> = {
  studio: 'STUDIO',
  agency: 'AGENCY',
  creative: 'CREATIVE',
  projects: 'PROJECTS',
};

export function AgencyTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'agency', agencyMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#BEF264');
  const bg = profile.bg_color || '#0A0A0A';
  const text = profile.text_color || '#FAFAFA';
  const t = (a: string, b: string | null) => track?.(a, b);

  const serifFamily = 'var(--font-playfair), Georgia, serif';
  const sansFamily = getFontStack(s.bodyFont, 'var(--font-inter), "Helvetica Neue", Arial, sans-serif');
  const monoFamily = 'ui-monospace, "SF Mono", Menlo, monospace';

  const curatedTitle = s.titleFontFamily && s.titleFontFamily !== 'inter' ? getFontStack(s.titleFontFamily, sansFamily) : null;
  const titleFamily = curatedTitle
    ? curatedTitle
    : s.titleFont === 'serif' ? serifFamily
    : s.titleFont === 'mono' ? monoFamily
    : s.titleFont === 'mix' ? serifFamily
    : sansFamily;
  const titleWeight = s.titleFont === 'serif' ? 600 : s.titleFont === 'mono' ? 700 : 900;

  const titleSizeCls = TITLE_SIZES[s.titleSize] || TITLE_SIZES.xxl;

  const marqueeText = (s.customMarquee && s.customMarquee.trim()) || MARQUEE_TEXT[s.marqueeWords] || MARQUEE_TEXT.brand;
  const marqueeFull = `${marqueeText} · ${marqueeText} · ${marqueeText}`;
  const topTagText = (s.customTag && s.customTag.trim()) || TAG_TEXT[s.topTag] || 'STUDIO';
  const estLabel = (s.estLabel && s.estLabel.trim()) || `EST. ${new Date().getFullYear()}`;
  const selectedLabel = s.selectedLabel || 'SELECTED LINKS';
  const worksLabel = s.worksLabel || 'WORKS & MEDIA';
  const liveBadge = s.liveBadge || 'LIVE';

  const formatLinkIndex = (i: number) => {
    if (s.numbering === 'none') return '';
    if (s.numbering === 'num') return `Project Nº${String(i + 1).padStart(2, '0')}`;
    return String(i + 1).padStart(3, '0');
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: sansFamily,
      }}
    >
      {s.diagonals && (
        <>
          <div
            className="absolute top-0 right-0 w-[140%] h-px origin-top-right pointer-events-none"
            style={{ background: `${accent}40`, transform: 'rotate(-18deg)' }}
            aria-hidden
          />
          <div
            className="absolute bottom-10 left-0 w-[140%] h-px origin-bottom-left pointer-events-none"
            style={{ background: `${text}20`, transform: 'rotate(-12deg)' }}
            aria-hidden
          />
        </>
      )}

      <div className="relative max-w-md mx-auto px-6 pt-[72px] pb-20">
        {s.topTag !== 'none' && (
          <div className="flex items-center justify-between text-[10px] tracking-[0.35em] mb-10">
            <div className="flex items-center gap-2" style={{ color: accent, fontFamily: monoFamily }}>
              <div className="w-2 h-2" style={{ background: accent }} />
              {topTagText}
            </div>
            <div style={{ color: text, opacity: 0.5, fontFamily: monoFamily }}>
              {estLabel}
            </div>
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-end gap-4 mb-6">
            <div
              className="relative overflow-hidden shrink-0"
              style={{
                width: profile.avatar_size ?? 96,
                height: profile.avatar_size ?? 96,
                border: `1px solid ${accent}`,
              }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(30%) contrast(1.1)' }} />
              ) : (
                <div className="w-full h-full" style={{ background: `${accent}22` }} />
              )}
              <div
                className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[8px] tracking-[0.2em]"
                style={{ background: accent, color: bg, fontFamily: monoFamily, fontWeight: 700 }}
              >
                {liveBadge}
              </div>
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="w-full h-px mt-2" style={{ background: `${text}40` }} />
            </div>
          </div>

          <h1
            className={`${titleSizeCls} leading-[0.95] tracking-[-0.04em] break-words`}
            style={{
              color: text,
              fontFamily: titleFamily,
              fontWeight: titleWeight,
            }}
          >
            {s.titleFont === 'mix' ? (
              <>
                <span style={{ fontFamily: serifFamily, fontWeight: 500, fontStyle: 'italic' }}>
                  {profile.display_name?.split(' ')[0] || ''}
                </span>
                {' '}
                <span style={{ fontFamily: sansFamily, fontWeight: 900 }}>
                  {profile.display_name?.split(' ').slice(1).join(' ') || ''}
                </span>
              </>
            ) : (
              profile.display_name || ''
            )}
          </h1>

          {profile.bio && (
            <p
              className="mt-6 text-sm leading-relaxed max-w-sm whitespace-pre-line"
              style={{ color: text, opacity: 0.75 }}
            >
              {profile.bio}
            </p>
          )}

          {s.showSocials !== false && socials?.length > 0 && (
            <div className="mt-6 flex gap-5 flex-wrap">
              {socials.map((soc: any) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return (
                  <a
                    key={soc.id}
                    href={getSocialHref(soc.platform, soc.url)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => t('social', soc.id)}
                    className="text-xs tracking-[0.15em] uppercase transition-colors hover:opacity-60 flex items-center gap-1.5"
                    style={{ color: text, fontFamily: monoFamily }}
                    aria-label={meta?.label || soc.platform}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{meta?.label || soc.platform}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {s.marquee && (
          <div className="relative overflow-hidden my-12 py-3 border-y" style={{ borderColor: `${text}30` }}>
            <div
              className="whitespace-nowrap text-sm tracking-[0.25em] agency-marquee"
              style={{ color: accent, fontFamily: monoFamily, fontWeight: 600 }}
            >
              {marqueeFull} · {marqueeFull}
            </div>
          </div>
        )}

        <div
          className="flex items-center justify-between text-[10px] tracking-[0.3em] mb-4 opacity-60"
          style={{ color: text, fontFamily: monoFamily }}
        >
          <span>{selectedLabel}</span>
          <span>/ {String(links.length).padStart(2, '0')}</span>
        </div>

        <div className="flex flex-col">
          {links.map((l: any, i: number) => {
            const idx = formatLinkIndex(i);
            const baseCls = 'group relative flex items-center gap-4 py-5 border-t transition-colors';
            const invertCls = s.hoverStyle === 'invert' ? 'agency-invert' : '';
            return (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => t('link', l.id)}
                className={`${baseCls} ${invertCls}`}
                style={{
                  borderColor: `${text}30`,
                  color: text,
                  ['--agency-accent' as any]: accent,
                  ['--agency-bg' as any]: bg,
                }}
              >
                {idx && (
                  <span
                    className="text-[10px] tracking-[0.2em] shrink-0 w-16"
                    style={{ color: accent, fontFamily: monoFamily }}
                  >
                    {idx}
                  </span>
                )}
                <div className="flex-1 min-w-0 relative">
                  <div
                    className={`text-xl truncate tracking-tight ${s.hoverStyle === 'slide' ? 'agency-slide' : ''} ${s.hoverStyle === 'underline' ? 'agency-underline' : ''}`}
                    style={{ fontFamily: titleFamily, fontWeight: s.titleFont === 'serif' ? 500 : 700, letterSpacing: '-0.02em' }}
                  >
                    {l.title}
                  </div>
                  {l.subtitle && (
                    <div
                      className="text-[10px] mt-1 tracking-[0.2em] uppercase opacity-50 truncate"
                      style={{ fontFamily: monoFamily }}
                    >
                      {l.subtitle}
                    </div>
                  )}
                </div>
                <ArrowUpRight
                  className={`w-5 h-5 shrink-0 transition-all ${s.hoverStyle === 'arrow' ? 'group-hover:rotate-45' : 'group-hover:translate-x-1 group-hover:-translate-y-1'}`}
                  style={{ color: accent }}
                  strokeWidth={1.5}
                />
              </a>
            );
          })}
          <div className="border-t" style={{ borderColor: `${text}30` }} />
        </div>

        {(banners?.length || videos?.length) ? (
          <div className="mt-12">
            <div
              className="text-[10px] tracking-[0.3em] mb-4 opacity-60"
              style={{ color: text, fontFamily: monoFamily }}
            >
              {worksLabel}
            </div>
            <div className="flex flex-col gap-4">
              {banners?.map((b: any) => {
                const inner = (
                  <div
                    className={`overflow-hidden relative ${BANNER_H[b.size] || BANNER_H.md}`}
                    style={{
                      border: `1px solid ${text}30`,
                    }}
                  >
                    {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover transition-transform hover:scale-105" />}
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
                  style={{ border: `1px solid ${text}30` }}
                >
                  <div className="relative aspect-video bg-black">
                    <VideoEmbed video={v} preview={preview} />
                  </div>
                  {v.title && (
                    <div
                      className="px-4 py-3 text-[10px] tracking-[0.25em] uppercase"
                      style={{ color: text, fontFamily: monoFamily, background: `${text}08` }}
                    >
                      {v.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className="mt-16 pt-6 border-t flex items-center justify-between text-[10px] tracking-[0.3em] opacity-50"
          style={{ borderColor: `${text}30`, color: text, fontFamily: monoFamily }}
        >
          <span>© {new Date().getFullYear()}</span>
          <span>{(s.footerText && s.footerText.trim()) || 'ALL WORKS RESERVED'}</span>
        </div>
        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
      </div>

      <style jsx>{`
        :global(.agency-marquee) {
          animation: agency-marquee 30s linear infinite;
        }
        :global(.agency-underline) {
          background-image: linear-gradient(var(--agency-accent), var(--agency-accent));
          background-size: 0% 2px;
          background-position: 0 100%;
          background-repeat: no-repeat;
          transition: background-size 0.5s ease;
        }
        :global(.group:hover .agency-underline) {
          background-size: 100% 2px;
        }
        :global(.agency-slide) {
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        :global(.group:hover .agency-slide) {
          transform: translateX(8px);
        }
        :global(.agency-invert:hover) {
          background: var(--agency-accent);
          color: var(--agency-bg);
        }
        @keyframes agency-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default AgencyTheme;
