'use client';

import { ArrowRight, ChevronRight, Star, Zap, Clock, Users, Flame } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const conversionMeta: BioThemeMeta = {
  key: 'conversion',
  name: 'Conversion Pro',
  description: 'Landing page de alta conversao: CTA pulsante, prova social, badges de oferta e barra de urgencia.',
  available: true,
  defaults: {
    bg_color: '#FFF8EC',
    button_color: '#EA580C',
    text_color: '#1A0F0A',
    border_width: 2,
    shadow_offset: 4,
  },
  palettes: {
    bg: ['#FFF8EC', '#FFFFFF', '#FEF3C7', '#ECFDF5', '#FEE2E2', '#0A0A0A'],
    accent: ['#EA580C', '#DC2626', '#25D366', '#FACC15', '#EC4899', '#2563EB'],
    text: ['#1A0F0A', '#0A0A0A', '#FFFFFF', '#451A03'],
  },
  controls: [
    { key: 'gradient', label: 'Gradient de fundo', type: 'select', options: [
      { value: 'warm', label: 'Quente (laranja/amarelo)' },
      { value: 'cool', label: 'Frio (verde/azul)' },
      { value: 'bold', label: 'Ousado (rosa/roxo)' },
      { value: 'minimal', label: 'Minimo' },
    ], default: 'warm', group: 'Fundo' },
    { key: 'urgencyBar', label: 'Barra de urgencia', type: 'toggle', default: true, group: 'Urgencia' },
    { key: 'urgencyText', label: 'Texto da urgencia', type: 'select', options: [
      { value: 'limited', label: 'Oferta por tempo limitado' },
      { value: 'vagas', label: 'Vagas limitadas' },
      { value: 'ultimas', label: 'Ultimas unidades' },
      { value: 'hoje', label: 'So hoje!' },
    ], default: 'limited', group: 'Urgencia' },
    { key: 'badge', label: 'Badge do CTA', type: 'select', options: [
      { value: 'mais-vendido', label: 'MAIS VENDIDO' },
      { value: 'oferta', label: 'OFERTA' },
      { value: 'novo', label: 'NOVO' },
      { value: 'exclusivo', label: 'EXCLUSIVO' },
      { value: 'none', label: 'Sem badge' },
    ], default: 'mais-vendido', group: 'CTA' },
    { key: 'pulse', label: 'Pulso no CTA', type: 'select', options: [
      { value: 'off', label: 'Sem pulso' },
      { value: 'soft', label: 'Suave' },
      { value: 'strong', label: 'Forte' },
    ], default: 'soft', group: 'CTA' },
    { key: 'ctaStyle', label: 'Estilo do CTA', type: 'select', options: [
      { value: 'solid', label: 'Solido' },
      { value: 'gradient', label: 'Gradient' },
      { value: 'outline', label: 'Outline destacado' },
    ], default: 'gradient', group: 'CTA' },
    { key: 'ctaIcon', label: 'Icone do CTA', type: 'select', options: [
      { value: 'arrow', label: 'Seta' },
      { value: 'chevron', label: 'Chevron' },
      { value: 'zap', label: 'Raio' },
      { value: 'flame', label: 'Chama' },
    ], default: 'arrow', group: 'CTA' },
    { key: 'socialProof', label: 'Prova social', type: 'select', options: [
      { value: 'alunos', label: 'Estrelas + alunos' },
      { value: 'clientes', label: 'Estrelas + clientes' },
      { value: 'seguidores', label: 'Estrelas + seguidores' },
      { value: 'none', label: 'Sem prova social' },
    ], default: 'alunos', group: 'Prova social' },
    { key: 'socialCount', label: 'Numero da prova social', type: 'select', options: [
      { value: '1k', label: '+1.000' },
      { value: '10k', label: '+10.000' },
      { value: '50k', label: '+50.000' },
      { value: '100k', label: '+100.000' },
    ], default: '10k', group: 'Prova social' },
    { key: 'customUrgency', label: 'Texto de urgência (personalizado)', type: 'text', default: '', placeholder: 'Deixe vazio para usar preset', maxLength: 60, group: 'Textos' },
    { key: 'customSocialLabel', label: 'Rótulo da prova social (personalizado)', type: 'text', default: '', placeholder: 'Ex: alunos ativos', maxLength: 40, group: 'Textos' },
    { key: 'customCount', label: 'Número personalizado', type: 'text', default: '', placeholder: 'Ex: +25.000', maxLength: 20, group: 'Textos' },
    { key: 'ctaLabel', label: 'Rótulo das CTAs', type: 'text', default: '', placeholder: 'Ex: QUERO AGORA', maxLength: 32, group: 'Textos' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#EA580C', group: 'Cores' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada', type: 'toggle', default: false, group: 'Cores' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'showUrgency', label: 'Exibir barra de urgência', type: 'toggle', default: true, group: 'Elementos' },
    { key: 'showSocials', label: 'Exibir redes sociais', type: 'toggle', default: true, group: 'Elementos' },
    { key: 'starColor', label: 'Cor das estrelas', type: 'colorPicker', default: '#FACC15', group: 'Cores' },
  ],
};

const GRADIENTS: Record<string, { bg: string; accent1: string; accent2: string }> = {
  warm: { bg: 'linear-gradient(180deg, #FFEDD5 0%, #FFF8EC 60%)', accent1: '#EA580C', accent2: '#FACC15' },
  cool: { bg: 'linear-gradient(180deg, #D1FAE5 0%, #ECFDF5 60%)', accent1: '#059669', accent2: '#10B981' },
  bold: { bg: 'linear-gradient(180deg, #FCE7F3 0%, #FFF0F5 60%)', accent1: '#EC4899', accent2: '#F97316' },
  minimal: { bg: '#FFFFFF', accent1: '#0A0A0A', accent2: '#EA580C' },
};

const URGENCY_TEXT: Record<string, string> = {
  limited: 'OFERTA POR TEMPO LIMITADO',
  vagas: 'VAGAS LIMITADAS',
  ultimas: 'ULTIMAS UNIDADES',
  hoje: 'SO HOJE!',
};

const SOCIAL_PROOF_LABEL: Record<string, string> = {
  alunos: 'alunos satisfeitos',
  clientes: 'clientes felizes',
  seguidores: 'seguidores ativos',
  none: '',
};

const SOCIAL_COUNT: Record<string, string> = {
  '1k': '+1.000',
  '10k': '+10.000',
  '50k': '+50.000',
  '100k': '+100.000',
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

const CTA_ICONS: Record<string, any> = {
  arrow: ArrowRight,
  chevron: ChevronRight,
  zap: Zap,
  flame: Flame,
};

export function ConversionTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'conversion', conversionMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#EA580C');
  const text = profile.text_color || '#1A0F0A';
  const g = GRADIENTS[s.gradient] || GRADIENTS.warm;
  const t = (a: string, b: string | null) => track?.(a, b);
  const CtaIcon = CTA_ICONS[s.ctaIcon] || ArrowRight;

  const pulseCls = s.pulse === 'strong' ? 'conv-pulse-strong' : s.pulse === 'soft' ? 'conv-pulse-soft' : '';

  const ctaBg = s.ctaStyle === 'gradient'
    ? `linear-gradient(135deg, ${accent}, ${g.accent2})`
    : s.ctaStyle === 'outline'
      ? '#FFFFFF'
      : accent;
  const ctaColor = s.ctaStyle === 'outline' ? accent : '#FFFFFF';
  const ctaBorder = s.ctaStyle === 'outline' ? `3px solid ${accent}` : 'none';

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: profile.bg_color && s.gradient === 'minimal' ? profile.bg_color : g.bg,
        color: text,
        fontFamily: getFontStack(s.bodyFont, 'var(--font-inter), system-ui'),
      }}
    >
      {s.urgencyBar && s.showUrgency !== false && (
        <div
          className="w-full py-2.5 text-center text-xs font-bold tracking-wider flex items-center justify-center gap-2 conv-urgency"
          style={{ background: accent, color: '#FFFFFF' }}
        >
          <Clock className="w-3.5 h-3.5" />
          {(s.customUrgency && s.customUrgency.trim()) || URGENCY_TEXT[s.urgencyText] || URGENCY_TEXT.limited}
          <Flame className="w-3.5 h-3.5" />
        </div>
      )}

      <div className="relative max-w-md mx-auto px-5 pt-[72px] pb-16">
        <div className="flex flex-col items-center text-center">
          <div
            className="relative rounded-full overflow-hidden"
            style={{
              width: profile.avatar_size ?? 112,
              height: profile.avatar_size ?? 112,
              border: `4px solid #FFFFFF`,
              boxShadow: `0 0 0 3px ${accent}, 0 12px 32px rgba(0,0,0,0.15)`,
            }}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: `${accent}22` }} />
            )}
          </div>

          <h1
            className="mt-4 text-3xl leading-tight"
            style={{ color: text, fontWeight: 900, letterSpacing: '-0.03em', fontFamily: getFontStack(s.titleFont, 'var(--font-inter), system-ui') }}
          >
            {profile.display_name}
          </h1>

          {s.socialProof !== 'none' && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="w-4 h-4" fill={s.starColor || '#FACC15'} style={{ color: s.starColor || '#FACC15' }} />
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: text }}>
                <Users className="w-3.5 h-3.5" />
                {(s.customCount && s.customCount.trim()) || SOCIAL_COUNT[s.socialCount] || SOCIAL_COUNT['10k']} {(s.customSocialLabel && s.customSocialLabel.trim()) || SOCIAL_PROOF_LABEL[s.socialProof]}
              </div>
            </div>
          )}

          {profile.bio && (
            <p
              className="mt-4 text-[15px] max-w-sm leading-relaxed whitespace-pre-line"
              style={{ color: text, opacity: 0.85, fontWeight: 500 }}
            >
              {profile.bio}
            </p>
          )}

          {s.showSocials !== false && socials?.length > 0 && (
            <div className="mt-5 flex gap-2 flex-wrap justify-center">
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
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: text,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      border: `2px solid ${text}14`,
                    }}
                    aria-label={meta?.label || soc.platform}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {links.map((l: any, i: number) => {
            const isCta = i === 0;
            if (isCta) {
              return (
                <div key={l.id} className="relative">
                  {s.badge !== 'none' && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-black tracking-widest rounded-full z-10"
                      style={{
                        background: '#FACC15',
                        color: '#0A0A0A',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      {(s.badge || 'mais-vendido').replace('-', ' ').toUpperCase()}
                    </div>
                  )}
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => t('link', l.id)}
                    className={`group flex items-center justify-center gap-2 px-6 py-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:scale-[1.02] ${pulseCls}`}
                    style={{
                      background: ctaBg,
                      color: ctaColor,
                      border: ctaBorder,
                      boxShadow: `0 10px 30px ${accent}55, 0 4px 8px rgba(0,0,0,0.1)`,
                      fontWeight: 800,
                      fontSize: '17px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <span>{l.title}</span>
                    <CtaIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              );
            }
            return (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => t('link', l.id)}
                className="group flex items-center justify-between gap-3 px-5 py-4 rounded-xl transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: text,
                  border: `2px solid ${text}12`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[15px] truncate" style={{ fontWeight: 700 }}>
                    {l.title}
                  </div>
                  {l.subtitle && (
                    <div className="text-xs mt-0.5 opacity-60 truncate">{l.subtitle}</div>
                  )}
                </div>
                <ArrowRight
                  className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1"
                  style={{ color: accent }}
                />
              </a>
            );
          })}

          {banners?.map((b: any) => {
            const inner = (
              <div
                className={`overflow-hidden rounded-xl ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{
                  border: `2px solid ${text}12`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
              className="overflow-hidden rounded-xl"
              style={{
                backgroundColor: '#FFFFFF',
                border: `2px solid ${text}12`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
      </div>

      <style jsx>{`
        :global(.conv-urgency) {
          animation: conv-slide 1s ease-out;
        }
        :global(.conv-pulse-soft) {
          animation: conv-pulse-soft 2.4s ease-in-out infinite;
        }
        :global(.conv-pulse-strong) {
          animation: conv-pulse-strong 1.4s ease-in-out infinite;
        }
        @keyframes conv-pulse-soft {
          0%, 100% { box-shadow: 0 10px 30px ${accent}55, 0 4px 8px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 10px 40px ${accent}AA, 0 6px 12px rgba(0,0,0,0.15); }
        }
        @keyframes conv-pulse-strong {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 30px ${accent}55; }
          50% { transform: scale(1.03); box-shadow: 0 14px 44px ${accent}; }
        }
        @keyframes conv-slide {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ConversionTheme;
