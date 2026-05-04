'use client';

import { ExternalLink } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const auroraMeta: BioThemeMeta = {
  key: 'aurora',
  name: 'Aurora Glass',
  description: 'Glassmorphism cinematografico com aurora animada e cards em cristal.',
  available: true,
  defaults: {
    bg_color: '#050B1F',
    button_color: '#7DD3FC',
    text_color: '#F8FAFC',
  },
  palettes: {
    bg: ['#050B1F', '#0B1220', '#0F172A', '#1E1B4B', '#020617', '#111827'],
    accent: ['#7DD3FC', '#F0ABFC', '#FDE68A', '#86EFAC', '#FCA5A5', '#93C5FD'],
    text: ['#F8FAFC', '#FFFFFF', '#E2E8F0', '#CBD5E1'],
  },
  controls: [
    { key: 'blur', label: 'Intensidade do blur', type: 'slider', min: 8, max: 40, step: 1, suffix: 'px', default: 24, group: 'Efeitos' },
    { key: 'saturation', label: 'Saturacao do glass', type: 'slider', min: 100, max: 220, step: 5, suffix: '%', default: 160, group: 'Efeitos' },
    { key: 'auroraSpeed', label: 'Velocidade da aurora', type: 'select', options: [
      { value: 'off', label: 'Parada' },
      { value: 'slow', label: 'Lenta' },
      { value: 'medium', label: 'Media' },
      { value: 'fast', label: 'Rapida' },
    ], default: 'medium', group: 'Aurora' },
    { key: 'gradientAngle', label: 'Angulo do gradiente', type: 'slider', min: 0, max: 360, step: 15, suffix: 'deg', default: 135, group: 'Aurora' },
    { key: 'secondaryColor', label: 'Cor secundaria', type: 'color', palette: ['#F0ABFC', '#FDA4AF', '#FDE68A', '#86EFAC', '#7DD3FC', '#C4B5FD'], default: '#F0ABFC', group: 'Aurora' },
    { key: 'tilt3d', label: 'Tilt 3D nos cards', type: 'toggle', default: true, group: 'Interacoes' },
    { key: 'secondaryCustom', label: 'Cor secundária (hex livre)', type: 'colorPicker', default: '#F0ABFC', group: 'Aurora' },
    { key: 'useSecondaryCustom', label: 'Usar cor personalizada secundária', type: 'toggle', default: false, group: 'Aurora' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#7DD3FC', group: 'Aurora' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada de destaque', type: 'toggle', default: false, group: 'Aurora' },
    { key: 'tagline', label: 'Frase abaixo do nome', type: 'textarea', default: '', placeholder: 'Ex: Designer & Curator', maxLength: 120, rows: 2, group: 'Textos' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: Crafted in glass', maxLength: 80, group: 'Textos' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'glassOpacity', label: 'Opacidade do glass', type: 'slider', min: 4, max: 30, step: 2, suffix: '%', default: 12, group: 'Efeitos' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
    { key: 'cardRadius', label: 'Raio dos cards', type: 'slider', min: 8, max: 32, step: 2, suffix: 'px', default: 16, group: 'Layout' },
  ],
};

const SPEED_MAP: Record<string, string> = { off: '0s', slow: '40s', medium: '22s', fast: '12s' };
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function AuroraTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'aurora', auroraMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#7DD3FC');
  const bg = profile.bg_color || '#050B1F';
  const secondary = s.useSecondaryCustom && s.secondaryCustom ? s.secondaryCustom : (s.secondaryColor || '#F0ABFC');
  const t = (a: string, b: string | null) => track?.(a, b);
  const tiltClass = s.tilt3d ? 'aurora-tilt' : '';

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: bg, color: profile.text_color, ['--aurora-radius' as any]: `${s.cardRadius ?? 16}px` }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `conic-gradient(from ${s.gradientAngle}deg at 50% 40%, ${accent}55, ${secondary}44, transparent 60%, ${accent}33)`,
          filter: 'blur(60px)',
          animation: s.auroraSpeed === 'off' ? 'none' : `aurora-spin ${SPEED_MAP[s.auroraSpeed] || '22s'} linear infinite`,
        }}
        aria-hidden
      />
      <div
        className="absolute -top-32 -left-24 w-[60%] h-[60%] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}66 0%, transparent 70%)`, filter: 'blur(50px)' }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 right-0 w-[70%] h-[60%] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${secondary}55 0%, transparent 70%)`, filter: 'blur(60px)' }}
        aria-hidden
      />

      <div className="relative max-w-md mx-auto px-5 pt-[72px] pb-24" style={{ fontFamily: getFontStack(s.bodyFont, 'var(--font-inter), system-ui') }}>
        <div className="flex flex-col items-center text-center">
          <div className="relative" style={{ width: profile.avatar_size ?? 110, height: profile.avatar_size ?? 110 }}>
            <div
              className="relative w-full h-full rounded-full overflow-hidden"
              style={{ border: '2px solid rgba(255,255,255,0.35)', boxShadow: `0 8px 32px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.5)` }}
            >
              {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
          </div>
          {profile.display_name && (
            <h1 className="mt-5 text-3xl tracking-tight" style={{ color: profile.text_color, fontWeight: 700, letterSpacing: '-0.03em', fontFamily: getFontStack(s.titleFont, 'var(--font-inter), system-ui') }}>
              {profile.display_name}
            </h1>
          )}
          {s.tagline && s.tagline.trim() && (
            <div className="mt-2 text-xs tracking-wider whitespace-pre-line" style={{ color: accent }}>{s.tagline}</div>
          )}
          {profile.bio && <p className="mt-3 text-sm opacity-80 max-w-xs leading-relaxed whitespace-pre-line" style={{ color: profile.text_color }}>{profile.bio}</p>}

          {s.showSocials !== false && socials?.length > 0 && (
            <div className="mt-6 flex gap-2 flex-wrap justify-center">
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
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: `blur(${s.blur}px) saturate(${s.saturation}%)`,
                      WebkitBackdropFilter: `blur(${s.blur}px) saturate(${s.saturation}%)`,
                      border: '1px solid rgba(255,255,255,0.18)',
                      color: profile.text_color,
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

        <div className="flex flex-col gap-3 mt-8">
          {links.map((l: any) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className={`group relative px-5 py-4 rounded-[var(--aurora-radius)] flex items-center justify-between transition-all ${tiltClass}`}
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))`,
                backdropFilter: `blur(${s.blur}px) saturate(${s.saturation}%)`,
                WebkitBackdropFilter: `blur(${s.blur}px) saturate(${s.saturation}%)`,
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)`,
                color: profile.text_color,
              }}
            >
              <span className="font-medium">{l.title}</span>
              <ExternalLink className="w-4 h-4 opacity-60" />
              <span
                className="absolute inset-0 rounded-[var(--aurora-radius)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${accent}22, transparent 60%)` }}
                aria-hidden
              />
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                className={`rounded-[var(--aurora-radius)] overflow-hidden ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{
                  border: '1px solid rgba(255,255,255,0.18)',
                  boxShadow: `0 8px 32px rgba(0,0,0,0.35)`,
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
              className="rounded-[var(--aurora-radius)] overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.18)', boxShadow: `0 8px 32px rgba(0,0,0,0.35)`, background: 'rgba(0,0,0,0.3)' }}
            >
              <div className="relative aspect-video bg-black">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && <div className="p-3 text-sm opacity-90" style={{ color: profile.text_color }}>{v.title}</div>}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <div className="mt-8 text-center text-xs tracking-widest opacity-70" style={{ color: profile.text_color }}>{s.footerText}</div>
        )}
        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
        <div aria-hidden className="h-16" />
      </div>

      <style jsx>{`
        @keyframes aurora-spin { to { transform: rotate(360deg); } }
        :global(.aurora-halo) { animation: aurora-halo-spin 8s linear infinite; }
        @keyframes aurora-halo-spin { to { transform: rotate(360deg); } }
        :global(.aurora-tilt) { transform-style: preserve-3d; transition: transform 200ms ease; }
        :global(.aurora-tilt:hover) { transform: perspective(800px) rotateX(2deg) rotateY(-2deg) translateY(-2px); }
      `}</style>
    </div>
  );
}

export default AuroraTheme;
