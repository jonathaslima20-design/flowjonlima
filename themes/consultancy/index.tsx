'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const consultancyMeta: BioThemeMeta = {
  key: 'consultancy',
  name: 'Consultancy',
  description: 'McKinsey-like: grid tipografico rigoroso, selo Confidential e condensed bold.',
  available: true,
  defaults: {
    bg_color: '#FAFAF7',
    button_color: '#E11D22',
    text_color: '#0A0A0A',
  },
  palettes: {
    bg: ['#FAFAF7', '#F5F5F0', '#FFFFFF', '#0A0A0A', '#F0EEE8', '#1A1A1A'],
    accent: ['#E11D22', '#D70000', '#005EB8', '#0A0A0A', '#A10000', '#F59E0B'],
    text: ['#0A0A0A', '#1A1A1A', '#FAFAF7', '#FFFFFF'],
  },
  controls: [
    { key: 'sealColor', label: 'Cor do selo', type: 'color', palette: ['#E11D22', '#D70000', '#005EB8', '#0A0A0A', '#F59E0B', '#A10000'], default: '#E11D22', group: 'Selo' },
    { key: 'numbering', label: 'Numeracao dos topicos', type: 'select', options: [
      { value: 'numeric', label: 'Numerico 01.' }, { value: 'decimal', label: 'Decimal 1.0' }, { value: 'letter', label: 'Letra A.' },
    ], default: 'decimal', group: 'Layout' },
    { key: 'heroAlign', label: 'Alinhamento do hero', type: 'radio', options: [
      { value: 'left', label: 'Esquerda' }, { value: 'center', label: 'Centro' },
    ], default: 'left', group: 'Layout' },
    { key: 'stamp', label: 'Estampa Confidential', type: 'toggle', default: true, group: 'Selo' },
    { key: 'reportLabel', label: 'Texto do cabeçalho', type: 'text', default: 'Report 01', maxLength: 32, group: 'Textos' },
    { key: 'usageLabel', label: 'Uso (direita do cabeçalho)', type: 'text', default: 'Internal Use', maxLength: 32, group: 'Textos' },
    { key: 'roleLabel', label: 'Cargo / função', type: 'text', default: 'Partner · Strategy', maxLength: 40, group: 'Textos' },
    { key: 'stampText', label: 'Texto da estampa', type: 'text', default: 'Confidential', maxLength: 24, group: 'Textos' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#E11D22', group: 'Selo' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada', type: 'toggle', default: false, group: 'Selo' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'footerRight', label: 'Texto do rodapé (direita)', type: 'text', default: 'Strictly Private', maxLength: 40, group: 'Textos' },
    { key: 'sectionLabel', label: 'Título da seção de links', type: 'text', default: 'Key Resources', maxLength: 40, group: 'Textos' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function ConsultancyTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'consultancy', consultancyMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (s.sealColor || '#E11D22');
  const bg = profile.bg_color || '#FAFAF7';
  const text = profile.text_color || '#0A0A0A';
  const t = (a: string, b: string | null) => track?.(a, b);

  const numberOf = (i: number) => {
    if (s.numbering === 'numeric') return String(i + 1).padStart(2, '0') + '.';
    if (s.numbering === 'letter') return String.fromCharCode(65 + i) + '.';
    return `${i + 1}.0`;
  };

  const alignClass = s.heroAlign === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: bg, color: text, fontFamily: getFontStack(s.bodyFont, '"Helvetica Neue", Arial, sans-serif') }}>
      {s.stamp && (
        <div className="fixed top-24 right-4 z-10 pointer-events-none rotate-[-12deg]" aria-hidden>
          <div className="px-3 py-1 text-[10px] tracking-[0.4em] uppercase font-bold" style={{ border: `2px solid ${accent}`, color: accent, opacity: 0.4 }}>{s.stampText || 'Confidential'}</div>
        </div>
      )}

      <div className="max-w-md mx-auto px-6 pt-[72px] pb-24">
        <div className="flex items-center justify-between text-[10px] tracking-[0.4em] uppercase opacity-70 mb-12 pb-4 border-b-2" style={{ borderColor: text }}>
          <span>{s.reportLabel || 'Report 01'}</span>
          <span className="font-bold" style={{ color: accent }}>&mdash;</span>
          <span>{s.usageLabel || 'Internal Use'}</span>
        </div>

        <div className={`flex flex-col ${alignClass}`}>
          <div className="rounded-none overflow-hidden" style={{ width: profile.avatar_size ?? 96, height: profile.avatar_size ?? 96, border: `2px solid ${text}` }}>
            {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover grayscale" />}
          </div>
          <div className="mt-6 text-[10px] tracking-[0.5em] uppercase" style={{ color: accent, fontWeight: 700 }}>{s.roleLabel || 'Partner · Strategy'}</div>
          <h1 className="mt-2 text-5xl leading-[0.9] tracking-tight" style={{ fontWeight: 900, letterSpacing: '-0.035em', fontStretch: 'condensed', fontFamily: getFontStack(s.titleFont, 'inherit') }}>
            {profile.display_name}
          </h1>
          {profile.bio && (
            <p className={`mt-5 text-[15px] leading-relaxed max-w-sm whitespace-pre-line ${s.heroAlign === 'center' ? 'mx-auto' : ''}`} style={{ opacity: 0.85 }}>
              {profile.bio}
            </p>
          )}

          {s.showSocials !== false && socials?.length > 0 && (
            <div className={`mt-6 flex gap-5 flex-wrap ${s.heroAlign === 'center' ? 'justify-center' : ''}`}>
              {socials.map((soc: any) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return (
                  <a key={soc.id} href={getSocialHref(soc.platform, soc.url)} target="_blank" rel="noreferrer" onClick={() => t('social', soc.id)}
                    className="transition-colors hover:opacity-60" style={{ color: text }}>
                    {Icon && <Icon className="w-5 h-5" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-12 flex items-baseline gap-3 pb-2 border-b" style={{ borderColor: text }}>
          <div className="text-[10px] tracking-[0.5em] uppercase font-bold" style={{ color: accent }}>Section</div>
          <div className="flex-1 text-xs tracking-[0.4em] uppercase opacity-60">{s.sectionLabel || 'Key Resources'}</div>
          <div className="text-[10px] opacity-60">{String(links.length).padStart(2, '0')}</div>
        </div>

        <div className="mt-2 flex flex-col">
          {links.map((l: any, i: number) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer" onClick={() => t('link', l.id)}
              className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-5 py-5 border-b transition-all hover:bg-black/[0.03]"
              style={{ borderColor: `${text}33`, color: text }}>
              <div className="text-xs tracking-widest" style={{ color: accent, fontWeight: 700 }}>{numberOf(i)}</div>
              <div>
                <div className="text-xl leading-tight" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>{l.title}</div>
                <div className="mt-1 text-[10px] tracking-[0.3em] uppercase opacity-60">Case Study &middot; Open Access</div>
              </div>
              <span className="text-xs tracking-widest transition-transform group-hover:translate-x-1" style={{ color: accent }}>READ &rarr;</span>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div className={`mt-3 overflow-hidden ${BANNER_H[b.size] || BANNER_H.md}`} style={{ border: `2px solid ${text}` }}>
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a> : <div key={b.id}>{inner}</div>;
          })}

          {videos.map((v: any) => (
            <figure key={v.id} className="mt-3">
              <div className="relative aspect-video overflow-hidden" style={{ border: `2px solid ${text}` }}>
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && <figcaption className="mt-2 text-[10px] tracking-[0.4em] uppercase opacity-70"><span style={{ color: accent, fontWeight: 700 }}>Exhibit &mdash;</span> {v.title}</figcaption>}
            </figure>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t-2 text-[10px] tracking-[0.4em] uppercase opacity-60 flex justify-between" style={{ borderColor: text }}>
          <span>&copy; {new Date().getFullYear()} {profile.display_name || ''}</span>
          <span style={{ color: accent }}>{s.footerRight || 'Strictly Private'}</span>
        </div>

        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
      </div>
    </div>
  );
}

export default ConsultancyTheme;
