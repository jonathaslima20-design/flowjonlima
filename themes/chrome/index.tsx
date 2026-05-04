'use client';

import { ChevronRight } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const chromeMeta: BioThemeMeta = {
  key: 'chrome',
  name: 'Chrome',
  description: 'Spatial glass estilo visionOS: blur pesado, sombras profundas e spring bounce.',
  available: true,
  defaults: {
    bg_color: '#0D1117',
    button_color: '#60A5FA',
    text_color: '#F1F5F9',
  },
  palettes: {
    bg: ['#0D1117', '#161B22', '#1E293B', '#0F172A', '#09090B', '#18181B'],
    accent: ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#FB7185'],
    text: ['#F1F5F9', '#FFFFFF', '#E2E8F0', '#CBD5E1'],
  },
  controls: [
    { key: 'blur', label: 'Intensidade do blur', type: 'slider', min: 12, max: 50, step: 2, suffix: 'px', default: 28, group: 'Glass' },
    { key: 'depth', label: 'Profundidade da camada', type: 'slider', min: 0, max: 24, step: 2, suffix: 'px', default: 14, group: 'Glass' },
    { key: 'spring', label: 'Spring bounce', type: 'toggle', default: true, group: 'Animacao' },
    { key: 'highlight', label: 'Highlight superior', type: 'toggle', default: true, group: 'Glass' },
    { key: 'ambient', label: 'Cor ambiente', type: 'color', palette: ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#FB7185'], default: '#60A5FA', group: 'Ambiente' },
    { key: 'ambientCustom', label: 'Cor ambiente (hex livre)', type: 'colorPicker', default: '#60A5FA', group: 'Ambiente' },
    { key: 'useAmbientCustom', label: 'Usar ambiente personalizado', type: 'toggle', default: false, group: 'Ambiente' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#60A5FA', group: 'Ambiente' },
    { key: 'useAccentCustom', label: 'Usar destaque personalizado', type: 'toggle', default: false, group: 'Ambiente' },
    { key: 'tagline', label: 'Frase abaixo do nome', type: 'textarea', default: '', placeholder: 'Ex: Design Engineer', maxLength: 120, rows: 2, group: 'Textos' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: Made with light', maxLength: 80, group: 'Textos' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
    { key: 'cardRadius', label: 'Raio dos cards', type: 'slider', min: 8, max: 32, step: 2, suffix: 'px', default: 16, group: 'Layout' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function ChromeTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'chrome', chromeMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#60A5FA');
  const bg = profile.bg_color || '#0D1117';
  const text = profile.text_color || '#F1F5F9';
  const ambient = s.useAmbientCustom && s.ambientCustom ? s.ambientCustom : (s.ambient || accent);
  const t = (a: string, b: string | null) => track?.(a, b);
  const springTiming = s.spring ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)';

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: bg, color: text, fontFamily: getFontStack(s.bodyFont, 'system-ui') }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${ambient}44, transparent), radial-gradient(ellipse 60% 40% at 20% 100%, ${ambient}22, transparent)` }} />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full pointer-events-none" aria-hidden style={{ background: ambient, filter: 'blur(120px)', opacity: 0.25 }} />

      <div className="relative max-w-md mx-auto px-5 pt-[72px] pb-24">
        <div className="flex flex-col items-center text-center">
          <div className="relative chrome-avatar" style={{ width: profile.avatar_size ?? 112, height: profile.avatar_size ?? 112 }}>
            <div className="relative w-full h-full rounded-full overflow-hidden" style={{
              boxShadow: `0 ${s.depth}px ${s.depth * 2}px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}>
              {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
          </div>
          {profile.display_name && (
            <h1 className="mt-6 text-4xl tracking-tight" style={{ fontWeight: 600, color: text, letterSpacing: '-0.03em', fontFamily: getFontStack(s.titleFont, 'system-ui') }}>
              {profile.display_name}
            </h1>
          )}
          {s.tagline && s.tagline.trim() && (
            <div className="mt-2 text-xs tracking-widest uppercase whitespace-pre-line" style={{ color: accent }}>{s.tagline}</div>
          )}
          {profile.bio && <p className="mt-3 text-[15px] opacity-80 max-w-xs leading-relaxed whitespace-pre-line">{profile.bio}</p>}

          {s.showSocials !== false && socials?.length > 0 && (
            <div className="mt-6 flex gap-2 flex-wrap justify-center">
              {socials.map((soc: any) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return (
                  <a key={soc.id} href={getSocialHref(soc.platform, soc.url)} target="_blank" rel="noreferrer" onClick={() => t('social', soc.id)}
                    className="w-11 h-11 rounded-full flex items-center justify-center chrome-tile"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      backdropFilter: `blur(${s.blur}px) saturate(180%)`,
                      WebkitBackdropFilter: `blur(${s.blur}px) saturate(180%)`,
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: `0 ${s.depth / 2}px ${s.depth}px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)`,
                      color: text,
                    }}>
                    {Icon && <Icon className="w-4 h-4" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {links.map((l: any, i: number) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer" onClick={() => t('link', l.id)}
              className="relative group px-5 py-4 flex items-center justify-between chrome-card overflow-hidden"
              style={{
                borderRadius: s.cardRadius ?? 16,
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: `blur(${s.blur}px) saturate(180%)`,
                WebkitBackdropFilter: `blur(${s.blur}px) saturate(180%)`,
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: `0 ${s.depth}px ${s.depth * 1.5}px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)`,
                color: text,
                transform: `translateZ(0)`,
                animationDelay: `${i * 80}ms`,
              }}>
              {s.highlight && <div className="absolute inset-x-6 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} aria-hidden />}
              <span className="relative font-medium">{l.title}</span>
              <ChevronRight className="relative w-4 h-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div className={`rounded-2xl overflow-hidden chrome-card ${BANNER_H[b.size] || BANNER_H.md}`} style={{
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: `0 ${s.depth}px ${s.depth * 1.5}px rgba(0,0,0,0.4)`,
              }}>
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a> : <div key={b.id}>{inner}</div>;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="rounded-2xl overflow-hidden chrome-card" style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: `0 ${s.depth}px ${s.depth * 1.5}px rgba(0,0,0,0.4)`,
              backdropFilter: `blur(${s.blur}px)`,
              WebkitBackdropFilter: `blur(${s.blur}px)`,
            }}>
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
        :global(.chrome-card), :global(.chrome-tile) {
          transition: transform 500ms ${springTiming}, box-shadow 400ms ease;
          animation: chrome-in 600ms ${springTiming} backwards;
        }
        :global(.chrome-card:hover) { transform: translateY(-3px) scale(1.005); }
        :global(.chrome-tile:hover) { transform: translateY(-2px) scale(1.05); }
        @keyframes chrome-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.chrome-card), :global(.chrome-tile) { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

export default ChromeTheme;
