'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const tideMeta: BioThemeMeta = {
  key: 'tide',
  name: 'Ocean Tide',
  description: 'Profundidade oceânica: ondas SVG animadas, bolhas translúcidas e azul profundo turquesa.',
  available: true,
  defaults: {
    bg_color: '#0A2540',
    button_color: '#00C9C8',
    text_color: '#E0F7FA',
  },
  palettes: {
    bg: ['#0A2540', '#082035', '#051830', '#093050', '#E0F7FA', '#FFFFFF'],
    accent: ['#00C9C8', '#26C6DA', '#00E5FF', '#00B0D6', '#80DEEA', '#4DD0E1'],
    text: ['#E0F7FA', '#FFFFFF', '#B2EBF2', '#0A2540'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'showWaves', label: 'Ondas animadas', type: 'toggle', default: true, group: 'Visual' },
    { key: 'showBubbles', label: 'Bolhas flutuantes', type: 'toggle', default: true, group: 'Visual' },
    { key: 'cardStyle', label: 'Estilo dos cards', type: 'select', options: [
      { value: 'bubble', label: 'Bolha' },
      { value: 'glass', label: 'Vidro' },
      { value: 'solid', label: 'Sólido' },
    ], default: 'bubble', group: 'Layout' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Surf · Dive · Explore', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: 🌊 Pacific Ocean', maxLength: 60, group: 'Textos' },
  ],
};

const BUBBLE_POSITIONS = [
  { bottom: '15%', left: '8%', size: 12, delay: '0s', duration: '6s' },
  { bottom: '25%', right: '10%', size: 8, delay: '1s', duration: '8s' },
  { bottom: '35%', left: '15%', size: 16, delay: '2s', duration: '7s' },
  { bottom: '5%', right: '20%', size: 10, delay: '3s', duration: '9s' },
  { bottom: '45%', left: '5%', size: 6, delay: '0.5s', duration: '5.5s' },
];
const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function TideTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'tide', tideMeta.controls);
  const bg = profile.bg_color || '#0A2540';
  const text = profile.text_color || '#E0F7FA';
  const accent = profile.button_color || '#00C9C8';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-dmsans), system-ui, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const t = (a: string, b: string | null) => track?.(a, b);

  const getCardStyle = () => {
    if (s.cardStyle === 'glass') return { background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.15)`, backdropFilter: 'blur(10px)' };
    if (s.cardStyle === 'solid') return { background: `${accent}22`, border: `1px solid ${accent}44` };
    return { background: 'rgba(255,255,255,0.07)', border: `1px solid ${accent}33`, backdropFilter: 'blur(8px)' };
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showBubbles && BUBBLE_POSITIONS.map((b, i) => (
        <div
          key={i}
          className="absolute pointer-events-none rounded-full tide-bubble"
          style={{
            bottom: b.bottom,
            left: (b as any).left,
            right: (b as any).right,
            width: b.size,
            height: b.size,
            backgroundColor: 'transparent',
            border: `1px solid ${accent}44`,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        />
      ))}

      <div className="relative mx-auto px-6 max-w-md pt-14 pb-24" style={{ zIndex: 10 }}>
        <header className="flex flex-col items-center text-center mb-10">
          {profile.avatar_url && (
            <div
              className="rounded-full overflow-hidden mb-5"
              style={{
                width: profile.avatar_size ?? 88,
                height: profile.avatar_size ?? 88,
                border: `3px solid ${accent}66`,
                boxShadow: `0 0 30px ${accent}33, inset 0 0 20px ${accent}11`,
              }}
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h1
            className="leading-none tracking-tight"
            style={{ fontSize: '26px', fontWeight: 700, fontFamily: titleFamily, color: text }}
          >
            {profile.display_name}
          </h1>

          {s.tagline && (
            <p className="mt-1.5 text-sm font-medium" style={{ color: accent }}>{s.tagline}</p>
          )}

          {profile.bio && (
            <p className="mt-3 text-[14px] max-w-xs leading-relaxed whitespace-pre-line" style={{ color: `${text}BB` }}>
              {profile.bio}
            </p>
          )}

          {socials?.length > 0 && (
            <div className="mt-5 flex items-center justify-center gap-4">
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
                    style={{ ...getCardStyle(), color: accent } as any}
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
              className="group flex items-center gap-4 px-5 py-4 transition-all hover:scale-[1.01]"
              style={{ ...getCardStyle(), borderRadius: '50px' } as any}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: accent, boxShadow: `0 0 6px ${accent}` }}
              />
              <span className="flex-1 text-[15px] font-medium" style={{ color: text }}>{l.title}</span>
              <span className="text-sm opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: accent }}>→</span>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ borderRadius: '16px', border: `1px solid ${accent}33` }}
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
              style={{ borderRadius: '16px', border: `1px solid ${accent}33` }}
            >
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-4 py-3 text-sm font-medium" style={{ color: `${text}BB` }}>{v.title}</div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-center text-sm" style={{ color: `${text}55` }}>{s.footerText}</p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>

      {s.showWaves && (
        <div className="absolute bottom-0 left-0 w-full pointer-events-none overflow-hidden">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full" style={{ height: '60px' }}>
            <path
              className="tide-wave"
              d="M0,40 C240,10 480,70 720,40 C960,10 1200,70 1440,40 L1440,80 L0,80 Z"
              fill={`${accent}22`}
            />
            <path
              className="tide-wave-2"
              d="M0,50 C360,20 720,70 1080,40 C1260,25 1380,55 1440,50 L1440,80 L0,80 Z"
              fill={`${accent}14`}
            />
          </svg>
        </div>
      )}

      <style jsx>{`
        @keyframes tide-wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes tide-rise {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-20px); opacity: 0.2; }
        }
        :global(.tide-wave) { animation: tide-wave 8s linear infinite; }
        :global(.tide-wave-2) { animation: tide-wave 12s linear infinite reverse; }
        :global(.tide-bubble) { animation: tide-rise ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default TideTheme;
