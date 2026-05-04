'use client';

import { Zap } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const neonlabMeta: BioThemeMeta = {
  key: 'neonlab',
  name: 'Neon Lab',
  description: 'Laboratorio neon com grid perspectivado, glow animado e particulas.',
  available: true,
  defaults: {
    bg_color: '#050012',
    button_color: '#FF2D95',
    text_color: '#F5E9FF',
  },
  palettes: {
    bg: ['#050012', '#080018', '#000000', '#0A001A', '#100028', '#120022'],
    accent: ['#FF2D95', '#22E9FF', '#FACC15', '#A855F7', '#00FFA3', '#FF4D4D'],
    text: ['#F5E9FF', '#FFFFFF', '#E0E7FF', '#FFE4F3'],
  },
  controls: [
    { key: 'glow', label: 'Intensidade do glow', type: 'slider', min: 10, max: 60, step: 5, suffix: 'px', default: 30, group: 'Neon' },
    { key: 'grid', label: 'Grid perspectivado', type: 'toggle', default: true, group: 'Fundo' },
    { key: 'flicker', label: 'Velocidade do flicker', type: 'select', options: [
      { value: 'off', label: 'Desligado' },
      { value: 'slow', label: 'Lento' },
      { value: 'medium', label: 'Medio' },
      { value: 'fast', label: 'Rapido' },
    ], default: 'slow', group: 'Neon' },
    { key: 'particles', label: 'Densidade de particulas', type: 'slider', min: 0, max: 40, step: 5, default: 20, group: 'Fundo' },
    { key: 'secondary', label: 'Cor secundaria', type: 'color', palette: ['#22E9FF', '#FACC15', '#A855F7', '#00FFA3', '#FF2D95', '#FF4D4D'], default: '#22E9FF', group: 'Neon' },
    { key: 'secondaryCustom', label: 'Cor secundária (hex livre)', type: 'colorPicker', default: '#22E9FF', group: 'Neon' },
    { key: 'useSecondaryCustom', label: 'Usar cor secundária personalizada', type: 'toggle', default: false, group: 'Neon' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#FF2D95', group: 'Neon' },
    { key: 'useAccentCustom', label: 'Usar cor de destaque personalizada', type: 'toggle', default: false, group: 'Neon' },
    { key: 'tagline', label: 'Frase neon (acima do nome)', type: 'textarea', default: '', placeholder: 'Ex: NEON LAB', maxLength: 80, rows: 2, group: 'Textos' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: SYSTEM ONLINE', maxLength: 60, group: 'Textos' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'grotesk', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
  ],
};

const FLICKER: Record<string, string> = { off: 'none', slow: '6s', medium: '3s', fast: '1.2s' };
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function NeonLabTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'neonlab', neonlabMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#FF2D95');
  const bg = profile.bg_color || '#050012';
  const text = profile.text_color || '#F5E9FF';
  const secondary = s.useSecondaryCustom && s.secondaryCustom ? s.secondaryCustom : (s.secondary || '#22E9FF');
  const t = (a: string, b: string | null) => track?.(a, b);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: bg, color: text, fontFamily: getFontStack(s.bodyFont, 'system-ui') }}>
      {s.grid && (
        <div className="absolute inset-x-0 bottom-0 h-[55vh] pointer-events-none" aria-hidden style={{
          background: `linear-gradient(to top, ${accent}33, transparent), repeating-linear-gradient(to right, transparent 0 80px, ${secondary}44 80px 81px), repeating-linear-gradient(to bottom, transparent 0 80px, ${secondary}44 80px 81px)`,
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        }} />
      )}

      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {Array.from({ length: s.particles }).map((_, i) => {
          const size = 1 + (i % 3);
          const left = (i * 97) % 100;
          const top = (i * 53) % 100;
          const delay = (i * 0.17) % 4;
          const color = i % 3 === 0 ? accent : i % 3 === 1 ? secondary : '#FFE4F3';
          return (
            <div key={i} className="absolute rounded-full neonlab-particle" style={{
              left: `${left}%`, top: `${top}%`, width: size, height: size,
              background: color, boxShadow: `0 0 ${s.glow / 2}px ${color}`,
              animationDelay: `${delay}s`,
            }} />
          );
        })}
      </div>

      <div className="relative max-w-md mx-auto px-5 pt-[72px] pb-24">
        <div className="flex flex-col items-center text-center">
          <div className="relative" style={{ width: profile.avatar_size ?? 110, height: profile.avatar_size ?? 110 }}>
            <div className="absolute inset-[-4px] rounded-full neonlab-flicker" style={{
              background: `conic-gradient(from 0deg, ${accent}, ${secondary}, ${accent})`,
              filter: `blur(${s.glow / 4}px)`,
              animation: `neonlab-rotate 4s linear infinite${s.flicker !== 'off' ? `, neonlab-flicker ${FLICKER[s.flicker]} steps(2) infinite` : ''}`,
            }} aria-hidden />
            <div className="relative w-full h-full rounded-full overflow-hidden" style={{ border: `2px solid ${accent}`, boxShadow: `0 0 ${s.glow}px ${accent}` }}>
              {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
          </div>
          {s.tagline && s.tagline.trim() && (
            <div
              className="mt-4 text-[11px] tracking-[0.5em] uppercase whitespace-pre-line"
              style={{ color: secondary, textShadow: `0 0 8px ${secondary}` }}
            >
              {s.tagline}
            </div>
          )}
          <h1 className="mt-6 text-4xl uppercase tracking-tight" style={{
            fontFamily: getFontStack(s.titleFont, 'var(--font-space-grotesk), monospace'),
            fontWeight: 800,
            color: text,
            textShadow: `0 0 ${s.glow / 3}px ${accent}, 0 0 ${s.glow * 0.6}px ${accent}AA`,
          }}>
            {profile.display_name}
          </h1>
          {profile.bio && <p className="mt-3 text-sm opacity-90 max-w-xs leading-relaxed whitespace-pre-line">{profile.bio}</p>}

          {s.showSocials !== false && socials?.length > 0 && (
            <div className="mt-6 flex gap-2 flex-wrap justify-center">
              {socials.map((soc: any) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return (
                  <a key={soc.id} href={getSocialHref(soc.platform, soc.url)} target="_blank" rel="noreferrer" onClick={() => t('social', soc.id)}
                    className="w-10 h-10 flex items-center justify-center transition-all hover:scale-110"
                    style={{ border: `1px solid ${secondary}`, color: text, boxShadow: `0 0 ${s.glow / 4}px ${secondary}88`, background: '#00000055' }}>
                    {Icon && <Icon className="w-4 h-4" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {links.map((l: any, i: number) => {
            const glowColor = i % 2 === 0 ? accent : secondary;
            return (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" onClick={() => t('link', l.id)}
                className="relative group px-5 py-4 flex items-center justify-between neonlab-card"
                style={{
                  background: '#00000066',
                  border: `1px solid ${glowColor}`,
                  boxShadow: `0 0 ${s.glow / 2}px ${glowColor}55, inset 0 0 ${s.glow / 3}px ${glowColor}22`,
                  color: text,
                }}>
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4" style={{ color: glowColor }} />
                  <span className="font-medium tracking-wide uppercase text-sm" style={{ fontFamily: 'var(--font-space-grotesk), monospace' }}>{l.title}</span>
                </div>
                <span className="text-xs opacity-60" style={{ color: glowColor }}>&gt;&gt;</span>
              </a>
            );
          })}

          {banners?.map((b: any) => {
            const inner = (
              <div className={`overflow-hidden ${BANNER_H[b.size] || BANNER_H.md}`} style={{ border: `1px solid ${accent}`, boxShadow: `0 0 ${s.glow / 2}px ${accent}55` }}>
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a> : <div key={b.id}>{inner}</div>;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="overflow-hidden" style={{ border: `1px solid ${secondary}`, boxShadow: `0 0 ${s.glow / 2}px ${secondary}55`, background: '#00000088' }}>
              <div className="relative aspect-video bg-black">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && <div className="px-3 py-2 text-xs uppercase tracking-wider" style={{ color: text, fontFamily: 'var(--font-space-grotesk), monospace' }}>&gt; {v.title}</div>}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <div className="mt-8 text-center text-[11px] tracking-[0.4em] uppercase" style={{ color: secondary, textShadow: `0 0 8px ${secondary}` }}>{s.footerText}</div>
        )}
        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
      </div>

      <style jsx>{`
        @keyframes neonlab-rotate { to { transform: rotate(360deg); } }
        @keyframes neonlab-flicker { 0%,100%{opacity:1} 45%{opacity:0.85} 50%{opacity:0.4} 55%{opacity:0.9} }
        @keyframes neonlab-particle-drift {
          0%,100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-40px) scale(1.4); opacity: 1; }
        }
        :global(.neonlab-particle) { animation: neonlab-particle-drift 6s ease-in-out infinite; }
        :global(.neonlab-card) { transition: transform 200ms, box-shadow 200ms; }
        :global(.neonlab-card:hover) { transform: translateX(4px); }
        @media (prefers-reduced-motion: reduce) {
          :global(.neonlab-particle), :global(.neonlab-flicker) { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export default NeonLabTheme;
