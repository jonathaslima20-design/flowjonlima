'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const sakuraMeta: BioThemeMeta = {
  key: 'sakura',
  name: 'Sakura Bloom',
  description: 'Rosa pétala com pétalas flutuantes em CSS, cards em branco rosado e tipografia Playfair em itálico.',
  available: true,
  defaults: {
    bg_color: '#FFF0F0',
    button_color: '#E8789A',
    text_color: '#3D1A2B',
  },
  palettes: {
    bg: ['#FFF0F0', '#FFF5F8', '#FFF0F5', '#FFFBFE', '#3D1A2B', '#2A0E1E'],
    accent: ['#E8789A', '#F48FB1', '#EC407A', '#F06292', '#BA68C8', '#FF8A65'],
    text: ['#3D1A2B', '#2A0E1E', '#5C2A3C', '#FFFFFF'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'playfair', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'showPetals', label: 'Pétalas flutuantes', type: 'toggle', default: true, group: 'Visual' },
    { key: 'petalCount', label: 'Quantidade de pétalas', type: 'slider', min: 3, max: 10, step: 1, default: 6, group: 'Visual' },
    { key: 'cardRadius', label: 'Raio dos cards', type: 'slider', min: 12, max: 32, step: 4, suffix: 'px', default: 20, group: 'Layout' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Beauty & Lifestyle', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: 🌸 With love', maxLength: 60, group: 'Textos' },
  ],
};

const PETAL_POSITIONS = [
  { top: '8%', left: '5%', delay: '0s', duration: '8s', rotate: '0deg', size: 10 },
  { top: '15%', right: '8%', delay: '1.5s', duration: '9s', rotate: '45deg', size: 8 },
  { top: '30%', left: '3%', delay: '3s', duration: '7s', rotate: '90deg', size: 12 },
  { top: '50%', right: '5%', delay: '0.5s', duration: '10s', rotate: '135deg', size: 9 },
  { top: '70%', left: '8%', delay: '2s', duration: '8.5s', rotate: '180deg', size: 7 },
  { top: '85%', right: '4%', delay: '4s', duration: '9.5s', rotate: '225deg', size: 11 },
  { top: '20%', left: '50%', delay: '2.5s', duration: '11s', rotate: '60deg', size: 8 },
  { top: '60%', left: '45%', delay: '1s', duration: '8s', rotate: '300deg', size: 10 },
  { top: '40%', left: '85%', delay: '3.5s', duration: '9s', rotate: '120deg', size: 7 },
  { top: '75%', left: '30%', delay: '0.8s', duration: '10.5s', rotate: '240deg', size: 9 },
];
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function SakuraTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'sakura', sakuraMeta.controls);
  const bg = profile.bg_color || '#FFF0F0';
  const text = profile.text_color || '#3D1A2B';
  const accent = profile.button_color || '#E8789A';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-playfair), Georgia, serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-dmsans), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);
  const r = s.cardRadius ?? 20;
  const petalCount = Math.min(10, Math.max(3, s.petalCount ?? 6));
  const petals = PETAL_POSITIONS.slice(0, petalCount);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showPetals && petals.map((p, i) => (
        <div
          key={i}
          className="absolute pointer-events-none sakura-petal"
          style={{
            top: p.top,
            left: (p as any).left,
            right: (p as any).right,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: 0.5,
            zIndex: 0,
          }}
        >
          <svg width={p.size * 2} height={p.size * 2} viewBox="0 0 20 20">
            <ellipse cx="10" cy="10" rx="8" ry="10" fill={accent} opacity="0.7" transform={`rotate(${p.rotate}, 10, 10)`} />
            <ellipse cx="10" cy="10" rx="5" ry="8" fill={accent} opacity="0.5" transform={`rotate(${parseInt(p.rotate) + 72}deg, 10px, 10px)`} />
          </svg>
        </div>
      ))}

      <div className="relative mx-auto px-6 max-w-md pt-14 pb-16" style={{ zIndex: 1 }}>
        <header className="flex flex-col items-center text-center mb-10">
          {profile.avatar_url && (
            <div className="relative mb-5">
              <div
                className="rounded-full overflow-hidden relative z-10"
                style={{
                  width: profile.avatar_size ?? 88,
                  height: profile.avatar_size ?? 88,
                  boxShadow: `0 0 0 3px ${bg}, 0 0 0 6px ${accent}66`,
                }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <h1
            style={{ fontSize: '28px', fontWeight: 700, fontFamily: titleFamily, fontStyle: 'italic', color: text }}
          >
            {profile.display_name}
          </h1>

          {s.tagline && (
            <p className="mt-1.5 text-sm font-medium" style={{ color: accent }}>{s.tagline}</p>
          )}

          {profile.bio && (
            <p className="mt-3 text-[14px] max-w-xs leading-relaxed whitespace-pre-line" style={{ color: `${text}AA` }}>
              {profile.bio}
            </p>
          )}

          {socials?.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-3">
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
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: `${accent}18`, color: accent, border: `1px solid ${accent}44` }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[15px] h-[15px]" />
                  </a>
                ) : null;
              })}
            </div>
          )}
        </header>

        <div className="flex flex-col gap-3">
          {links.map((l: any) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="group flex items-center gap-4 px-5 py-4 transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: '#FFFFFF',
                border: `1.5px solid ${accent}33`,
                borderRadius: `${r}px`,
                boxShadow: `0 2px 12px ${accent}14`,
              }}
            >
              <span className="text-[14px]" style={{ color: accent }}>🌸</span>
              <span className="flex-1 text-[15px] font-medium" style={{ fontFamily: titleFamily, fontStyle: 'italic', color: text }}>
                {l.title}
              </span>
              <span className="text-[12px] opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: accent }}>→</span>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ borderRadius: `${r}px`, border: `1.5px solid ${accent}22` }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div
              key={v.id}
              className="overflow-hidden mt-2"
              style={{ borderRadius: `${r}px`, border: `1.5px solid ${accent}22` }}
            >
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-3 text-sm font-medium" style={{ fontFamily: titleFamily, fontStyle: 'italic', color: `${text}AA` }}>
                  {v.title}
                </div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-sm" style={{ color: `${text}55`, fontFamily: titleFamily, fontStyle: 'italic' }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>

      <style jsx>{`
        @keyframes sakura-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0.6; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        :global(.sakura-petal) {
          animation: sakura-fall linear infinite;
        }
      `}</style>
    </div>
  );
}

export default SakuraTheme;
