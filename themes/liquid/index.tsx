'use client';

import { ArrowUpRight } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha, buttonControls, exactButton } from '@/themes/_kit';

export const liquidMeta: BioThemeMeta = {
  key: 'liquid',
  name: 'Liquid Glass',
  description: 'Vidro líquido com refração, reflexos especulares e bolhas de cor em movimento por trás dos botões.',
  available: true,
  defaults: { bg_color: '#0B0B12', button_color: '#7C5CFF', text_color: '#FFFFFF' },
  palettes: {
    bg: ['#0B0B12', '#05060A', '#F4F4F8', '#EDEFF7', '#101826', '#1A0B14'],
    accent: ['#7C5CFF', '#00D4FF', '#FF4D8D', '#22E3A6', '#FFB020', '#FFFFFF'],
    text: ['#FFFFFF', '#F2F2F7', '#0B0B12', '#1C1C24'],
  },
  controls: [
    { key: 'blobB', label: 'Cor da segunda bolha', type: 'color', palette: ['#00D4FF', '#FF4D8D', '#22E3A6', '#FFB020', '#7C5CFF'], default: '#00D4FF', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'blobC', label: 'Cor da terceira bolha', type: 'color', palette: ['#FF4D8D', '#00D4FF', '#22E3A6', '#FFB020', '#7C5CFF'], default: '#FF4D8D', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'blobSize', label: 'Intensidade das bolhas', type: 'slider', min: 20, max: 100, step: 5, suffix: '%', default: 70, group: 'Efeitos', category: 'efeitos' },
    { key: 'frost', label: 'Desfoque do vidro', type: 'slider', min: 8, max: 40, step: 2, suffix: 'px', default: 22, group: 'Efeitos', category: 'efeitos' },
    { key: 'radius', label: 'Arredondamento', type: 'slider', min: 14, max: 40, step: 2, suffix: 'px', default: 28, group: 'Layout', category: 'layout' },
    ...buttonControls('#7C5CFF', '#FFFFFF'),
    motionControl(),
    footerControl(),
    ...fontControls('manrope', 'manrope'),
  ],
};

export function LiquidTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, liquidMeta, 'var(--font-manrope), system-ui, sans-serif');
  const radius = Number(s.radius) || 28;
  const frost = Number(s.frost) || 22;
  const size = (Number(s.blobSize) || 70) / 100;
  const anim = s.motion !== 'off';
  const slow = s.motion === 'subtle' ? 1.8 : 1;
  const eb = exactButton(s);
  const glass = {
    background: `linear-gradient(135deg, ${alpha(text, 0.16)}, ${alpha(text, 0.04)})`,
    backdropFilter: `blur(${frost}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${frost}px) saturate(180%)`,
    boxShadow: `inset 0 1px 0 ${alpha('#FFFFFF', 0.45)}, inset 0 -1px 0 ${alpha('#FFFFFF', 0.08)}, 0 10px 40px -12px ${alpha('#000000', 0.5)}`,
    border: `1px solid ${alpha(text, 0.18)}`,
  };

  return (
    <div className="min-h-[max(100%,100vh)] relative overflow-hidden" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="lq-blob" style={{ width: 420 * size, height: 420 * size, left: '-20%', top: '-8%', background: accent, animationDuration: `${18 * slow}s`, animationPlayState: anim ? 'running' : 'paused' }} />
        <div className="lq-blob" style={{ width: 360 * size, height: 360 * size, right: '-25%', top: '30%', background: s.blobB, animationDuration: `${22 * slow}s`, animationDelay: '-6s', animationPlayState: anim ? 'running' : 'paused' }} />
        <div className="lq-blob" style={{ width: 380 * size, height: 380 * size, left: '-10%', bottom: '-10%', background: s.blobC, animationDuration: `${26 * slow}s`, animationDelay: '-12s', animationPlayState: anim ? 'running' : 'paused' }} />
      </div>

      <div className="relative max-w-md mx-auto px-5 pt-14 pb-20">
        <header className="flex flex-col items-center text-center mb-8">
          <div className="p-1.5 rounded-full" style={glass}>
            <Avatar profile={profile} />
          </div>
          <h1 className="mt-5 text-[28px] font-extrabold tracking-tight" style={{ fontFamily: titleFont, letterSpacing: '-0.03em' }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line max-w-[340px]" style={{ opacity: 0.8 }}>{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-3">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-2.5 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="lq-press w-12 h-12 rounded-full flex items-center justify-center" style={glass}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-3">
                {links.map((l: any) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="lq-press lq-shine relative flex items-center gap-3 px-4 py-3.5 overflow-hidden" style={{ ...glass, borderRadius: radius, ...(eb ? { background: eb.bg, color: eb.fg } : null) }}>
                    <KitLinkIcon link={l} size={38} radius={radius / 2} style={{ background: `linear-gradient(135deg, ${accent}, ${alpha(accent, 0.55)})`, color: '#fff', boxShadow: `0 6px 18px -6px ${accent}` }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] truncate" style={{ opacity: 0.65 }}>{l.subtitle}</span>}
                    </span>
                    <ArrowUpRight className="w-5 h-5 shrink-0" style={{ opacity: 0.7 }} />
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ ...glass, borderRadius: radius, padding: 6 }} frameClassName="[&>img]:rounded-[inherit]" />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ ...glass, borderRadius: radius }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>

        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>

      <style jsx>{`
        :global(.lq-blob) { position: absolute; border-radius: 9999px; filter: blur(70px); opacity: 0.75; animation: lqFloat 20s ease-in-out infinite alternate; }
        @keyframes lqFloat {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 60px) scale(1.15); }
          100% { transform: translate(-30px, 20px) scale(0.9); }
        }
        :global(.lq-press) { transition: transform 260ms cubic-bezier(.2,.9,.3,1.3); }
        :global(.lq-press:hover) { transform: translateY(-2px) scale(1.01); }
        :global(.lq-press:active) { transform: scale(0.97); }
        :global(.lq-shine)::before { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background: radial-gradient(120% 60% at 20% 0%, rgba(255,255,255,0.35), transparent 55%); }
        @media (prefers-reduced-motion: reduce) { :global(.lq-blob) { animation: none; } :global(.lq-press) { transition: none; } }
      `}</style>
    </div>
  );
}

export default LiquidTheme;
