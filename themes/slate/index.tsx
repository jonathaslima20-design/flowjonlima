'use client';

import { ArrowRight } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const slateMeta: BioThemeMeta = {
  key: 'slate',
  name: 'Slate Executive',
  description: 'Minimalismo corporativo absoluto: tipografia limpa, zero ornamento, máxima credibilidade profissional.',
  available: true,
  defaults: {
    bg_color: '#FAFAFA',
    button_color: '#0D0D0D',
    text_color: '#0D0D0D',
  },
  palettes: {
    bg: ['#FAFAFA', '#FFFFFF', '#F5F5F5', '#F0EEE8', '#0D0D0D', '#1A1A1A'],
    accent: ['#0D0D0D', '#1A1A1A', '#374151', '#6B7280', '#2563EB', '#DC2626'],
    text: ['#0D0D0D', '#1A1A1A', '#374151', '#FFFFFF'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'manrope', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'manrope', group: 'Tipografia' },
    { key: 'titleSize', label: 'Tamanho do título', type: 'select', options: [
      { value: 'sm', label: 'Pequeno' },
      { value: 'md', label: 'Médio' },
      { value: 'lg', label: 'Grande' },
    ], default: 'md', group: 'Tipografia' },
    { key: 'showDivider', label: 'Divisor horizontal', type: 'toggle', default: true, group: 'Layout' },
    { key: 'linkStyle', label: 'Estilo dos links', type: 'select', options: [
      { value: 'line', label: 'Linha simples' },
      { value: 'pill', label: 'Pílula sutil' },
      { value: 'block', label: 'Bloco completo' },
    ], default: 'line', group: 'Layout' },
    { key: 'spacing', label: 'Espaçamento', type: 'select', options: [
      { value: 'tight', label: 'Compacto' },
      { value: 'normal', label: 'Normal' },
      { value: 'relaxed', label: 'Arejado' },
    ], default: 'normal', group: 'Layout' },
    { key: 'showRole', label: 'Mostrar cargo/função', type: 'toggle', default: false, group: 'Cabeçalho' },
    { key: 'roleText', label: 'Cargo ou função', type: 'text', default: '', placeholder: 'Ex: CEO & Founder', maxLength: 80, group: 'Cabeçalho' },
    { key: 'showLocation', label: 'Mostrar localização', type: 'toggle', default: false, group: 'Cabeçalho' },
    { key: 'locationText', label: 'Localização', type: 'text', default: '', placeholder: 'Ex: São Paulo, Brasil', maxLength: 60, group: 'Cabeçalho' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: © 2025', maxLength: 60, group: 'Textos' },
  ],
};

const TITLE_SIZES: Record<string, string> = { sm: '20px', md: '26px', lg: '34px' };
const SPACINGS: Record<string, { gap: string; pad: string }> = {
  tight: { gap: 'gap-0', pad: 'py-3' },
  normal: { gap: 'gap-0', pad: 'py-4' },
  relaxed: { gap: 'gap-0', pad: 'py-5' },
};
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function SlateTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'slate', slateMeta.controls);
  const bg = profile.bg_color || '#FAFAFA';
  const text = profile.text_color || '#0D0D0D';
  const accent = profile.button_color || '#0D0D0D';
  const sp = SPACINGS[s.spacing] || SPACINGS.normal;
  const titleSize = TITLE_SIZES[s.titleSize] || TITLE_SIZES.md;
  const titleFamily = getFontStack(s.titleFont, 'var(--font-manrope), system-ui, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const t = (a: string, b: string | null) => track?.(a, b);
  const isDark = bg === '#0D0D0D' || bg === '#1A1A1A';

  const linkEl = (l: any) => {
    if (s.linkStyle === 'pill') {
      return (
        <a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => t('link', l.id)}
          className={`group flex items-center justify-between w-full ${sp.pad} px-5 rounded-full transition-all hover:opacity-70`}
          style={{ border: `1px solid ${text}18`, backgroundColor: `${text}06`, color: text }}
        >
          <span className="text-[15px] font-medium tracking-tight">{l.title}</span>
          <ArrowRight className="w-4 h-4 opacity-40 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
        </a>
      );
    }
    if (s.linkStyle === 'block') {
      return (
        <a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => t('link', l.id)}
          className={`group flex items-center justify-between w-full ${sp.pad} px-5 rounded-lg transition-all hover:opacity-70`}
          style={{ backgroundColor: accent, color: bg }}
        >
          <span className="text-[15px] font-medium tracking-tight">{l.title}</span>
          <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.5} />
        </a>
      );
    }
    return (
      <a
        key={l.id}
        href={l.url}
        target="_blank"
        rel="noreferrer"
        onClick={() => t('link', l.id)}
        className={`group flex items-center justify-between w-full ${sp.pad} transition-all hover:opacity-60`}
        style={{ borderBottom: `1px solid ${text}12`, color: text }}
      >
        <span className="text-[15px] font-medium tracking-tight">{l.title}</span>
        <ArrowRight className="w-4 h-4 opacity-30 group-hover:translate-x-0.5 group-hover:opacity-60 transition-all" strokeWidth={1.5} />
      </a>
    );
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      <div className="relative mx-auto px-8 max-w-md pt-16 pb-16">
        <div className="flex flex-col items-start mb-8">
          {profile.avatar_url && (
            <div
              className="rounded-full overflow-hidden mb-6"
              style={{ width: profile.avatar_size ?? 72, height: profile.avatar_size ?? 72 }}
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <h1
            className="tracking-tight leading-none"
            style={{ fontSize: titleSize, fontWeight: 700, fontFamily: titleFamily, color: text }}
          >
            {profile.display_name}
          </h1>
          {s.showRole && s.roleText && (
            <p className="mt-1 text-sm font-medium" style={{ color: `${text}66` }}>{s.roleText}</p>
          )}
          {s.showLocation && s.locationText && (
            <p className="mt-0.5 text-xs" style={{ color: `${text}44` }}>{s.locationText}</p>
          )}
          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed max-w-xs whitespace-pre-line" style={{ color: `${text}BB` }}>
              {profile.bio}
            </p>
          )}
          {socials?.length > 0 && (
            <div className="mt-5 flex items-center gap-4">
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
                    style={{ color: `${text}88` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </div>

        {s.showDivider && (
          <div className="mb-6" style={{ borderTop: `1px solid ${text}14` }} />
        )}

        <div className="flex flex-col">
          {links.map((l: any) => linkEl(l))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden rounded-lg mt-4 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ border: `1px solid ${text}10` }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="overflow-hidden rounded-lg mt-4" style={{ border: `1px solid ${text}10` }}>
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-3 text-sm font-medium" style={{ color: `${text}CC` }}>{v.title}</div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-xs" style={{ color: `${text}33` }}>{s.footerText}</p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default SlateTheme;
