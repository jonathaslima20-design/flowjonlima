'use client';

import { ArrowRight, Circle, BadgeCheck } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const atlasMeta: BioThemeMeta = {
  key: 'atlas',
  name: 'Atlas Office',
  description: 'SaaS corporativo moderno: paleta azul confiavel, cards limpos e microtipografia estilo Linear e Stripe.',
  available: true,
  defaults: {
    bg_color: '#F7F9FC',
    button_color: '#2563EB',
    text_color: '#0F172A',
    border_width: 1,
    shadow_offset: 0,
  },
  palettes: {
    bg: ['#F7F9FC', '#FFFFFF', '#F1F5F9', '#EFF6FF', '#E0F2FE', '#0F172A'],
    accent: ['#2563EB', '#0E7490', '#059669', '#DC2626', '#0891B2', '#1E40AF'],
    text: ['#0F172A', '#1E293B', '#334155', '#FFFFFF'],
  },
  controls: [
    { key: 'density', label: 'Densidade', type: 'select', options: [
      { value: 'compact', label: 'Compacta' },
      { value: 'default', label: 'Padrao' },
      { value: 'comfortable', label: 'Confortavel' },
    ], default: 'default', group: 'Layout' },
    { key: 'radius', label: 'Raio do card', type: 'slider', min: 4, max: 20, step: 2, suffix: 'px', default: 12, group: 'Layout' },
    { key: 'shadow', label: 'Sombra', type: 'select', options: [
      { value: 'none', label: 'Sem sombra' },
      { value: 'soft', label: 'Suave' },
      { value: 'elevated', label: 'Elevada' },
    ], default: 'soft', group: 'Layout' },
    { key: 'showStatus', label: 'Chip de status', type: 'toggle', default: true, group: 'Cabecalho' },
    { key: 'statusText', label: 'Texto do status', type: 'select', options: [
      { value: 'available', label: 'Disponivel para projetos' },
      { value: 'hiring', label: 'Contratando' },
      { value: 'building', label: 'Construindo algo novo' },
      { value: 'speaking', label: 'Aberto a palestras' },
    ], default: 'available', group: 'Cabecalho' },
    { key: 'verified', label: 'Selo verificado', type: 'toggle', default: true, group: 'Cabecalho' },
    { key: 'cardStyle', label: 'Estilo dos cards', type: 'select', options: [
      { value: 'outline', label: 'Apenas borda' },
      { value: 'filled', label: 'Preenchido suave' },
      { value: 'primary', label: 'Primario destacado' },
    ], default: 'filled', group: 'Links' },
    { key: 'customStatus', label: 'Texto do status (personalizado)', type: 'text', default: '', placeholder: 'Deixe vazio para usar preset', maxLength: 60, group: 'Textos' },
    { key: 'tagline', label: 'Subtítulo abaixo do nome', type: 'textarea', default: '', placeholder: 'Ex: Head of Design @ Acme', maxLength: 120, rows: 2, group: 'Textos' },
    { key: 'statusColorCustom', label: 'Cor do status (personalizada)', type: 'colorPicker', default: '#10B981', group: 'Cores' },
    { key: 'useStatusColorCustom', label: 'Usar cor personalizada de status', type: 'toggle', default: false, group: 'Cores' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#2563EB', group: 'Cores' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada de destaque', type: 'toggle', default: false, group: 'Cores' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'cardBgCustom', label: 'Cor de fundo dos cards', type: 'colorPicker', default: '#FFFFFF', group: 'Cores' },
    { key: 'useCardBgCustom', label: 'Usar cor personalizada de card', type: 'toggle', default: false, group: 'Cores' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: Based in Lisbon', maxLength: 80, group: 'Textos' },
    { key: 'sectionTitle', label: 'Título da seção de links', type: 'text', default: '', placeholder: 'Ex: Links úteis', maxLength: 40, group: 'Textos' },
    { key: 'showVerified', label: 'Mostrar selo verificado', type: 'toggle', default: true, group: 'Elementos' },
  ],
};

const DENSITY: Record<string, { headerPad: string; gap: string; linkPad: string; maxW: string }> = {
  compact: { headerPad: 'pt-[72px] pb-6', gap: 'gap-2', linkPad: 'px-4 py-3', maxW: 'max-w-md' },
  default: { headerPad: 'pt-[72px] pb-8', gap: 'gap-3', linkPad: 'px-5 py-4', maxW: 'max-w-md' },
  comfortable: { headerPad: 'pt-[72px] pb-10', gap: 'gap-4', linkPad: 'px-6 py-5', maxW: 'max-w-lg' },
};

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  available: { text: 'Disponivel para projetos', color: '#10B981' },
  hiring: { text: 'Contratando', color: '#F59E0B' },
  building: { text: 'Construindo algo novo', color: '#2563EB' },
  speaking: { text: 'Aberto a palestras', color: '#8B5CF6' },
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

const SHADOWS: Record<string, string> = {
  none: 'none',
  soft: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
  elevated: '0 4px 6px rgba(15,23,42,0.04), 0 10px 15px rgba(15,23,42,0.08)',
};

export function AtlasTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'atlas', atlasMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#2563EB');
  const bg = profile.bg_color || '#F7F9FC';
  const text = profile.text_color || '#0F172A';
  const d = DENSITY[s.density] || DENSITY.default;
  const presetStatus = STATUS_MAP[s.statusText] || STATUS_MAP.available;
  const status = {
    text: (s.customStatus && s.customStatus.trim()) || presetStatus.text,
    color: s.useStatusColorCustom && s.statusColorCustom ? s.statusColorCustom : presetStatus.color,
  };
  const shadow = SHADOWS[s.shadow] || SHADOWS.soft;
  const t = (a: string, b: string | null) => track?.(a, b);

  const sansFamily = getFontStack(s.bodyFont, 'var(--font-inter), "Helvetica Neue", Arial, sans-serif');
  const titleFamily = getFontStack(s.titleFont, sansFamily);
  const cardBg = s.useCardBgCustom && s.cardBgCustom ? s.cardBgCustom : '#FFFFFF';

  const cardBase = (primary: boolean) => {
    if (primary || s.cardStyle === 'primary') {
      return {
        backgroundColor: accent,
        border: `1px solid ${accent}`,
        color: '#FFFFFF',
      };
    }
    if (s.cardStyle === 'filled') {
      return {
        backgroundColor: cardBg,
        border: `1px solid ${text}14`,
        color: text,
      };
    }
    return {
      backgroundColor: 'transparent',
      border: `1px solid ${text}22`,
      color: text,
    };
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: sansFamily,
        backgroundImage: `radial-gradient(circle at 50% 0%, ${accent}0D, transparent 50%)`,
      }}
    >
      <div className={`relative mx-auto px-5 ${d.maxW}`}>
        <div className={`flex flex-col items-center text-center ${d.headerPad}`}>
          <div
            className="relative overflow-hidden rounded-full"
            style={{
              width: profile.avatar_size ?? 96,
              height: profile.avatar_size ?? 96,
              boxShadow: `0 0 0 4px ${bg}, 0 0 0 5px ${text}14, ${shadow}`,
            }}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: `${accent}22` }} />
            )}
          </div>

          <div className="mt-5 flex items-center gap-1.5">
            <h1
              className="text-2xl tracking-tight"
              style={{ color: text, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: titleFamily }}
            >
              {profile.display_name}
            </h1>
            {s.verified && s.showVerified !== false && (
              <BadgeCheck className="w-[18px] h-[18px]" style={{ color: accent }} fill={`${accent}22`} strokeWidth={2} />
            )}
          </div>

          {s.tagline && s.tagline.trim() && (
            <div className="mt-1 text-xs font-medium whitespace-pre-line" style={{ color: accent }}>
              {s.tagline}
            </div>
          )}

          {profile.bio && (
            <p
              className="mt-3 text-[15px] max-w-sm leading-relaxed whitespace-pre-line"
              style={{ color: `${text}CC` }}
            >
              {profile.bio}
            </p>
          )}

          {s.showStatus && (
            <div
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${status.color}14`,
                color: status.color,
                border: `1px solid ${status.color}33`,
              }}
            >
              <span className="relative flex w-2 h-2">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75 atlas-ping"
                  style={{ backgroundColor: status.color }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: status.color }}
                />
              </span>
              {status.text}
            </div>
          )}

          {socials?.length > 0 && (
            <div
              className="mt-5 inline-flex items-center gap-1 p-1 rounded-full"
              style={{
                backgroundColor: '#FFFFFF',
                border: `1px solid ${text}14`,
                boxShadow: shadow,
              }}
            >
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
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-slate-100"
                    style={{ color: text }}
                    aria-label={meta?.label || soc.platform}
                  >
                    {Icon && <Icon className="w-[17px] h-[17px]" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {s.sectionTitle && s.sectionTitle.trim() && (
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest opacity-70" style={{ color: text }}>
            {s.sectionTitle}
          </div>
        )}
        <div className={`flex flex-col ${d.gap} pb-10`}>
          {links.map((l: any, i: number) => {
            const isPrimary = i === 0 && s.cardStyle !== 'primary';
            const style = cardBase(isPrimary);
            return (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => t('link', l.id)}
                className={`group flex items-center gap-4 ${d.linkPad} transition-all hover:-translate-y-0.5`}
                style={{
                  ...style,
                  borderRadius: s.radius,
                  boxShadow: shadow,
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isPrimary || s.cardStyle === 'primary' ? 'rgba(255,255,255,0.2)' : `${accent}14`,
                    color: isPrimary || s.cardStyle === 'primary' ? '#FFFFFF' : accent,
                  }}
                >
                  <Circle className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[15px] truncate" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                    {l.title}
                  </div>
                  {l.subtitle && (
                    <div
                      className="text-xs mt-0.5 truncate"
                      style={{ opacity: isPrimary || s.cardStyle === 'primary' ? 0.85 : 0.6 }}
                    >
                      {l.subtitle}
                    </div>
                  )}
                </div>
                <ArrowRight
                  className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </a>
            );
          })}

          {banners?.map((b: any) => {
            const inner = (
              <div
                className={`overflow-hidden ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{
                  borderRadius: s.radius,
                  boxShadow: shadow,
                  border: `1px solid ${text}14`,
                  backgroundColor: '#FFFFFF',
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
                borderRadius: s.radius,
                boxShadow: shadow,
                backgroundColor: '#FFFFFF',
                border: `1px solid ${text}14`,
              }}
            >
              <div className="relative aspect-video bg-slate-100">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-3 text-sm" style={{ color: text, fontWeight: 500 }}>
                  {v.title}
                </div>
              )}
            </div>
          ))}
        </div>
        {s.footerText && s.footerText.trim() && (
          <div className="mt-2 mb-6 text-center text-xs opacity-60" style={{ color: text }}>{s.footerText}</div>
        )}
        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
      </div>

      <style jsx>{`
        :global(.atlas-ping) {
          animation: atlas-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes atlas-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default AtlasTheme;
