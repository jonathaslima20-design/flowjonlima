'use client';

import { ExternalLink } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

const BANNER_HEIGHT: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export const brutalistMeta: BioThemeMeta = {
  key: 'brutalist',
  name: 'Brutalist',
  description: 'Bordas pretas, sombras duras e cores vibrantes. O visual assinatura do BioFlowzy.',
  available: true,
  defaults: {
    bg_color: '#FFFFFF',
    button_color: '#FACC15',
    text_color: '#000000',
    border_width: 2,
    shadow_offset: 4,
  },
  palettes: {
    bg: ['#FFFFFF', '#F1F5F9', '#FACC15', '#BEF264', '#FDA4AF', '#000000'],
    accent: ['#FACC15', '#BEF264', '#2563EB', '#EF4444', '#F97316', '#000000', '#FFFFFF'],
    text: ['#000000', '#111827', '#FFFFFF', '#1E293B'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'archivo', group: 'Tipografia', category: 'tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'grotesk', group: 'Tipografia', category: 'tipografia' },
    { key: 'borderColor', label: 'Cor da borda', type: 'colorPicker', default: '#000000', group: 'Cores', category: 'cores' },
    { key: 'shadowColor', label: 'Cor da sombra', type: 'colorPicker', default: '#000000', group: 'Cores', category: 'cores' },
    { key: 'cardRadius', label: 'Raio dos cards', type: 'slider', min: 0, max: 24, step: 2, suffix: 'px', default: 0, group: 'Layout', category: 'layout' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos', category: 'layout' },
  ],
};

export function BrutalistTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'brutalist', brutalistMeta.controls);
  const borderColor = s.borderColor || '#000';
  const shadowColor = s.shadowColor || '#000';
  const borderStyle = { border: `${profile.border_width || 2}px solid ${borderColor}` };
  const shadowStyle = { boxShadow: `${profile.shadow_offset || 4}px ${profile.shadow_offset || 4}px 0 0 ${shadowColor}` };
  const radius = s.cardRadius || 0;
  const titleFF = getFontStack(s.titleFont, 'var(--font-archivo-black), Impact, sans-serif');
  const bodyFF = getFontStack(s.bodyFont, 'var(--font-space-grotesk), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);

  return (
    <div className="min-h-screen pt-[72px] pb-24 px-4" style={{ backgroundColor: profile.bg_color || '#FFFFFF', fontFamily: bodyFF }}>
      <div className="max-w-md mx-auto">
        <div className="flex flex-col items-center text-center">
          <div
            className="shrink-0 aspect-square rounded-full bg-bioyellow overflow-hidden"
            style={{ width: profile.avatar_size ?? 90, height: profile.avatar_size ?? 90, ...borderStyle, ...shadowStyle }}
          >
            {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
          </div>
          {profile.display_name && (
            <h1 className="text-3xl mt-4" style={{ color: profile.text_color, fontFamily: titleFF }}>
              {profile.display_name}
            </h1>
          )}
          {profile.bio && <p className="mt-3 max-w-xs whitespace-pre-line" style={{ color: profile.text_color }}>{profile.bio}</p>}

          {s.showSocials && socials?.length > 0 && (
            <div className="mt-5 flex gap-2 flex-wrap justify-center">
              {socials.map((s: any) => {
                const meta = SOCIALS_BY_KEY[(s.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return (
                  <a
                    key={s.id}
                    href={getSocialHref(s.platform, s.url)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => t('social', s.id)}
                    className="w-10 h-10 text-white flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] transition-transform"
                    style={{ backgroundColor: meta?.color || '#000', ...borderStyle }}
                    aria-label={meta?.label || s.platform}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 mt-8">
          {links.map((l: any) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="px-4 py-4 flex items-center justify-between font-bold active:translate-x-[2px] active:translate-y-[2px] transition-transform"
              style={{ ...borderStyle, ...shadowStyle, borderRadius: radius, backgroundColor: profile.button_color || '#FACC15', color: profile.text_color }}
            >
              <span>{l.title}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                className={`overflow-hidden ${BANNER_HEIGHT[b.size] || BANNER_HEIGHT.md}`}
                style={{ ...borderStyle, ...shadowStyle, borderRadius: radius }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a
                key={b.id}
                href={b.link_url}
                target="_blank"
                rel="noreferrer"
                onClick={() => t('banner', b.id)}
                className="block active:translate-x-[2px] active:translate-y-[2px] transition-transform"
              >
                {inner}
              </a>
            ) : (
              <div key={b.id}>{inner}</div>
            );
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="bg-white overflow-hidden" style={{ ...borderStyle, ...shadowStyle, borderRadius: radius }}>
              <div className="relative aspect-video bg-black">
                <VideoEmbed video={v} preview={preview} />
                <span className="absolute top-2 left-2 bg-biored text-white text-[10px] font-bold px-2 py-0.5 brutal-border z-10">
                  {(v.platform || 'VIDEO').toUpperCase()}
                </span>
              </div>
              {v.title && <div className="p-3 font-bold text-sm">{v.title}</div>}
            </div>
          ))}
        </div>

        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
        <div aria-hidden className="h-16" />
      </div>
    </div>
  );
}

export default BrutalistTheme;
