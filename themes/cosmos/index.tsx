'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const cosmosMeta: BioThemeMeta = {
  key: 'cosmos',
  name: 'Deep Cosmos',
  description: 'Campo estelar e nebulosas: estrelas CSS, aurora borealis nos cards e plasma animado no avatar.',
  available: true,
  defaults: {
    bg_color: '#020009',
    button_color: '#A78BFA',
    text_color: '#E8E0FF',
  },
  palettes: {
    bg: ['#020009', '#050010', '#000005', '#080018', '#020015', '#000008'],
    accent: ['#A78BFA', '#7C3AED', '#60A5FA', '#34D399', '#F472B6', '#FB923C'],
    text: ['#E8E0FF', '#FFFFFF', '#C4B5FD', '#A5B4FC'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'syne', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'dmsans', group: 'Tipografia' },
    { key: 'starCount', label: 'Densidade de estrelas', type: 'slider', min: 20, max: 80, step: 10, default: 40, group: 'Visual' },
    { key: 'showNebula', label: 'Nebulosa no fundo', type: 'toggle', default: true, group: 'Visual' },
    { key: 'showPlasmaRing', label: 'Anel de plasma no avatar', type: 'toggle', default: true, group: 'Avatar' },
    { key: 'auroraStyle', label: 'Estilo aurora dos cards', type: 'select', options: [
      { value: 'purple', label: 'Nebulosa roxa' },
      { value: 'cyan', label: 'Cyan polar' },
      { value: 'cosmic', label: 'Cósmico' },
    ], default: 'purple', group: 'Visual' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Per aspera ad astra', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: 🌌 Somewhere in the cosmos', maxLength: 60, group: 'Textos' },
  ],
};

const AURORA_BORDERS: Record<string, string> = {
  purple: 'linear-gradient(135deg, #A78BFA, #7C3AED, #60A5FA)',
  cyan: 'linear-gradient(135deg, #22D3EE, #0EA5E9, #34D399)',
  cosmic: 'linear-gradient(135deg, #F472B6, #A78BFA, #60A5FA, #34D399)',
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function CosmosTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'cosmos', cosmosMeta.controls);
  const bg = profile.bg_color || '#020009';
  const text = profile.text_color || '#E8E0FF';
  const accent = profile.button_color || '#A78BFA';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-syne), sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-dmsans), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);
  const starCount = Math.max(20, Math.min(80, s.starCount ?? 40));
  const auroraBorder = AURORA_BORDERS[s.auroraStyle] || AURORA_BORDERS.purple;

  const stars = Array.from({ length: starCount }, (_, i) => ({
    x: (i * 37 + i * i * 13 + 7) % 100,
    y: (i * 53 + i * i * 7 + 11) % 100,
    size: ((i * 11) % 3) + 1,
    opacity: 0.3 + ((i * 7) % 7) / 10,
  }));

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: text,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {s.showNebula && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute"
            style={{
              top: '10%',
              left: '-20%',
              width: '70%',
              height: '50%',
              background: `radial-gradient(ellipse, ${accent}12 0%, transparent 70%)`,
              filter: 'blur(40px)',
              borderRadius: '50%',
              transform: 'rotate(-20deg)',
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: '10%',
              right: '-10%',
              width: '60%',
              height: '40%',
              background: `radial-gradient(ellipse, #60A5FA10 0%, transparent 70%)`,
              filter: 'blur(50px)',
              borderRadius: '50%',
            }}
          />
        </div>
      )}

      <div className="relative mx-auto px-6 max-w-md pt-14 pb-16" style={{ zIndex: 10 }}>
        <header className="flex flex-col items-center text-center mb-10">
          {profile.avatar_url && (
            <div className="relative mb-5">
              {s.showPlasmaRing && (
                <div
                  className="absolute inset-0 rounded-full cosmos-plasma"
                  style={{
                    background: auroraBorder,
                    padding: '2px',
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
            style={{ fontSize: '26px', fontWeight: 700, fontFamily: titleFamily, color: text }}
          >
            {profile.display_name}
          </h1>

          {s.tagline && (
            <p className="mt-1.5 text-sm font-medium italic" style={{ color: `${accent}CC` }}>{s.tagline}</p>
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
                    style={{ background: `${accent}18`, border: `1px solid ${accent}33`, color: accent }}
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
              className="group relative flex items-center gap-4 px-5 py-4 overflow-hidden transition-all hover:opacity-90"
              style={{
                background: `rgba(255,255,255,0.05)`,
                borderRadius: '12px',
                border: `1px solid transparent`,
                backgroundClip: 'padding-box',
              }}
            >
              <div
                className="absolute inset-0 -z-10 rounded-xl cosmos-card-border"
                style={{ padding: '1px', background: auroraBorder, borderRadius: '12px' }}
              >
                <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: bg, opacity: 0.85, borderRadius: '11px' }} />
              </div>
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: auroraBorder }}
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
                style={{ borderRadius: '12px', border: `1px solid ${accent}33` }}
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
              style={{ borderRadius: '12px', border: `1px solid ${accent}33` }}
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
          <p className="mt-10 text-center text-sm" style={{ color: `${text}44` }}>{s.footerText}</p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>

      <style jsx>{`
        @keyframes cosmos-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        :global(.cosmos-plasma) { animation: cosmos-rotate 5s linear infinite; border-radius: 50%; }
        :global(.cosmos-card-border) { position: absolute !important; }
      `}</style>
    </div>
  );
}

export default CosmosTheme;
