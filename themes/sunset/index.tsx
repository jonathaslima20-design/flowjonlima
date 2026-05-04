'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const sunsetMeta: BioThemeMeta = {
  key: 'sunset',
  name: 'Golden Hour',
  description: 'Gradiente sunset cinematográfico: laranja, rosa e dourado com cards em glass flutuante.',
  available: true,
  defaults: {
    bg_color: '#FF6B35',
    button_color: '#FFD700',
    text_color: '#FFFFFF',
  },
  palettes: {
    bg: ['#FF6B35', '#E8445A', '#FF3C6E', '#FF8C42', '#C2185B', '#7B2D8B'],
    accent: ['#FFD700', '#FFFFFF', '#FFB347', '#FF69B4', '#00E5FF', '#ADFF2F'],
    text: ['#FFFFFF', '#FFF8F0', '#FFE0CC', '#1A0A0A'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'syne', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'gradientStyle', label: 'Gradiente', type: 'select', options: [
      { value: 'sunset', label: 'Sunset' },
      { value: 'sunrise', label: 'Sunrise' },
      { value: 'dusk', label: 'Dusk' },
      { value: 'golden', label: 'Golden' },
    ], default: 'sunset', group: 'Visual' },
    { key: 'cardBlur', label: 'Desfoque do card', type: 'slider', min: 4, max: 20, step: 2, suffix: 'px', default: 10, group: 'Visual' },
    { key: 'showRing', label: 'Anel animado no avatar', type: 'toggle', default: true, group: 'Avatar' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Photographer & Storyteller', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: 🌅 Worldwide', maxLength: 60, group: 'Textos' },
  ],
};

const GRADIENTS: Record<string, string> = {
  sunset: 'linear-gradient(135deg, #FF6B35 0%, #E8445A 40%, #C2185B 70%, #7B2D8B 100%)',
  sunrise: 'linear-gradient(135deg, #FFD700 0%, #FF8C42 40%, #FF6B35 70%, #E8445A 100%)',
  dusk: 'linear-gradient(135deg, #2D1B69 0%, #7B2D8B 40%, #E8445A 70%, #FF6B35 100%)',
  golden: 'linear-gradient(135deg, #FFD700 0%, #FF8C42 50%, #FF6B35 100%)',
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function SunsetTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'sunset', sunsetMeta.controls);
  const bg = profile.bg_color || '#FF6B35';
  const text = profile.text_color || '#FFFFFF';
  const accent = profile.button_color || '#FFD700';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-syne), sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-dmsans), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);
  const gradient = GRADIENTS[s.gradientStyle] || GRADIENTS.sunset;
  const blur = s.cardBlur ?? 10;

  return (
    <div
      className="min-h-screen"
      style={{ background: gradient, color: text, fontFamily: bodyFamily }}
    >
      <div className="relative mx-auto px-6 max-w-md pt-16 pb-16">
        <header className="flex flex-col items-center text-center mb-10">
          {profile.avatar_url && (
            <div className="relative mb-5">
              {s.showRing && (
                <div
                  className="absolute inset-0 rounded-full sunset-ring"
                  style={{
                    background: `conic-gradient(${accent}, #FF6B35, #E8445A, ${accent})`,
                    padding: '3px',
                    borderRadius: '50%',
                    width: (profile.avatar_size ?? 88) + 8,
                    height: (profile.avatar_size ?? 88) + 8,
                    top: -4,
                    left: -4,
                  }}
                />
              )}
              <div
                className="relative rounded-full overflow-hidden"
                style={{ width: profile.avatar_size ?? 88, height: profile.avatar_size ?? 88, zIndex: 1 }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
          <h1
            className="leading-none tracking-tight"
            style={{ fontSize: '30px', fontWeight: 800, fontFamily: titleFamily, color: text, textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}
          >
            {profile.display_name}
          </h1>
          {s.tagline && (
            <p className="mt-1.5 text-[14px] font-medium" style={{ color: `${text}CC` }}>{s.tagline}</p>
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
                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: `blur(${blur}px)`, color: text }}
                    aria-label={meta?.label}
                  >
                    <Icon className="w-[16px] h-[16px]" />
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
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: `blur(${blur}px)`,
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '16px',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold truncate" style={{ color: text, fontFamily: titleFamily }}>
                  {l.title}
                </p>
              </div>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: accent }}
              >
                <span style={{ fontSize: '12px', color: '#000' }}>→</span>
              </div>
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-2 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.25)' }}
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
              style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)' }}
            >
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
          <p className="mt-10 text-center text-sm" style={{ color: `${text}88` }}>{s.footerText}</p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>

      <style jsx>{`
        @keyframes sunset-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        :global(.sunset-ring) { animation: sunset-spin 4s linear infinite; }
      `}</style>
    </div>
  );
}

export default SunsetTheme;
