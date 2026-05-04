'use client';

import { ExternalLink } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const prismMeta: BioThemeMeta = {
  key: 'prism',
  name: 'Prism',
  description: 'Holografico iridescente com tilt 3D, shimmer e grain noise.',
  available: true,
  defaults: {
    bg_color: '#0A0618',
    button_color: '#A5F3FC',
    text_color: '#F8FAFC',
  },
  palettes: {
    bg: ['#0A0618', '#0F0820', '#1A0B2E', '#0C0C1D', '#06050F', '#120A24'],
    accent: ['#A5F3FC', '#FBCFE8', '#C4B5FD', '#FDE68A', '#FCA5A5', '#86EFAC'],
    text: ['#F8FAFC', '#FFFFFF', '#E9D5FF', '#CBD5E1'],
  },
  controls: [
    { key: 'shimmer', label: 'Intensidade do shimmer', type: 'slider', min: 0, max: 100, step: 5, suffix: '%', default: 70, group: 'Holografico' },
    { key: 'tiltAmount', label: 'Angulo do tilt 3D', type: 'slider', min: 0, max: 15, step: 1, suffix: 'deg', default: 6, group: 'Interacao' },
    { key: 'grain', label: 'Grain noise', type: 'toggle', default: true, group: 'Textura' },
    { key: 'secondary', label: 'Cor secundaria', type: 'color', palette: ['#FBCFE8', '#C4B5FD', '#A5F3FC', '#FDE68A', '#86EFAC', '#FCA5A5'], default: '#FBCFE8', group: 'Holografico' },
    { key: 'shape', label: 'Forma dos cards', type: 'select', options: [
      { value: 'rounded', label: 'Arredondado' },
      { value: 'pill', label: 'Pilula' },
      { value: 'squared', label: 'Quadrado' },
    ], default: 'rounded', group: 'Cards' },
    { key: 'secondaryCustom', label: 'Cor secundária (hex livre)', type: 'colorPicker', default: '#FBCFE8', group: 'Holografico' },
    { key: 'useSecondaryCustom', label: 'Usar cor secundária personalizada', type: 'toggle', default: false, group: 'Holografico' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#A5F3FC', group: 'Holografico' },
    { key: 'useAccentCustom', label: 'Usar cor de destaque personalizada', type: 'toggle', default: false, group: 'Holografico' },
    { key: 'tagline', label: 'Frase abaixo do nome', type: 'textarea', default: '', placeholder: 'Ex: Holographic Creator', maxLength: 120, rows: 2, group: 'Textos' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: Crafted in light', maxLength: 80, group: 'Textos' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function PrismTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'prism', prismMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#A5F3FC');
  const bg = profile.bg_color || '#0A0618';
  const text = profile.text_color || '#F8FAFC';
  const secondary = s.useSecondaryCustom && s.secondaryCustom ? s.secondaryCustom : (s.secondary || '#FBCFE8');
  const t = (a: string, b: string | null) => track?.(a, b);
  const radius = s.shape === 'pill' ? '9999px' : s.shape === 'squared' ? '6px' : '20px';

  const iridescent = `linear-gradient(135deg, ${accent}cc, ${secondary}cc, #FDE68Acc, ${accent}cc)`;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: bg, color: text, fontFamily: getFontStack(s.bodyFont, 'system-ui') }}>
      <div className="absolute inset-0 pointer-events-none prism-bg" aria-hidden
        style={{ background: `conic-gradient(from 0deg at 50% 30%, ${accent}33, ${secondary}33, #FDE68A22, ${accent}33)`, filter: 'blur(90px)', opacity: s.shimmer / 100 }} />
      {s.grain && <div className="absolute inset-0 pointer-events-none prism-grain" aria-hidden />}

      <div className="relative max-w-md mx-auto px-5 pt-[72px] pb-24">
        <div className="flex flex-col items-center text-center">
          <div className="relative rounded-full overflow-hidden prism-halo" style={{ width: profile.avatar_size ?? 112, height: profile.avatar_size ?? 112 }}>
            <div className="absolute inset-[-4px] rounded-full" style={{ background: iridescent, animation: 'prism-rotate 6s linear infinite' }} aria-hidden />
            <div className="absolute inset-[2px] rounded-full overflow-hidden" style={{ background: bg }}>
              {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
          </div>
          {profile.display_name && (
            <h1 className="mt-6 text-4xl font-bold tracking-tight prism-title" style={{
              fontFamily: getFontStack(s.titleFont, 'system-ui'),
              backgroundImage: iridescent,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              backgroundSize: '200% 200%',
            }}>
              {profile.display_name}
            </h1>
          )}
          {profile.bio && <p className="mt-3 text-sm opacity-80 max-w-xs leading-relaxed whitespace-pre-line">{profile.bio}</p>}

          {s.showSocials !== false && socials?.length > 0 && (
            <div className="mt-6 flex gap-2 flex-wrap justify-center">
              {socials.map((soc: any) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return (
                  <a key={soc.id} href={getSocialHref(soc.platform, soc.url)} target="_blank" rel="noreferrer" onClick={() => t('social', soc.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 prism-social"
                    style={{ border: `1px solid ${accent}55`, color: text, background: 'rgba(255,255,255,0.05)' }}>
                    {Icon && <Icon className="w-4 h-4" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {links.map((l: any) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer" onClick={() => t('link', l.id)}
              className="relative group px-5 py-4 flex items-center justify-between prism-card"
              style={{ borderRadius: radius, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: text, ['--tilt' as any]: `${s.tiltAmount}deg` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ borderRadius: radius, background: iridescent, backgroundSize: '200% 200%', animation: 'prism-flow 3s ease infinite', mixBlendMode: 'overlay' }} aria-hidden />
              <span className="relative font-medium">{l.title}</span>
              <ExternalLink className="relative w-4 h-4 opacity-60" />
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div className={`overflow-hidden prism-card ${BANNER_H[b.size] || BANNER_H.md}`} style={{ borderRadius: radius, border: '1px solid rgba(255,255,255,0.15)', ['--tilt' as any]: `${s.tiltAmount}deg` }}>
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a> : <div key={b.id}>{inner}</div>;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="overflow-hidden prism-card" style={{ borderRadius: radius, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', ['--tilt' as any]: `${s.tiltAmount}deg` }}>
              <div className="relative aspect-video bg-black">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && <div className="p-3 text-sm opacity-90">{v.title}</div>}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <div className="mt-8 text-center text-xs tracking-widest opacity-70">{s.footerText}</div>
        )}
        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
      </div>

      <style jsx>{`
        :global(.prism-title) { animation: prism-flow 4s ease infinite; }
        :global(.prism-card) { transition: transform 300ms ease, box-shadow 300ms ease; transform-style: preserve-3d; }
        :global(.prism-card:hover) { transform: perspective(700px) rotateX(calc(var(--tilt) * -0.5)) rotateY(var(--tilt)) translateY(-2px); box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        :global(.prism-grain) {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.15 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          opacity: 0.25; mix-blend-mode: overlay;
        }
        @keyframes prism-rotate { to { transform: rotate(360deg); } }
        @keyframes prism-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.prism-title), :global(.prism-bg) { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export default PrismTheme;
