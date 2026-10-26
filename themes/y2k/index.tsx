'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha } from '@/themes/_kit';

const VIBES: Record<string, { bg: string; btn: string; glow: string }> = {
  bubblegum: { bg: 'radial-gradient(120% 70% at 50% 0%, #FFD1F0 0%, #E7C6FF 40%, #BDE0FE 100%)', btn: 'linear-gradient(180deg, #FFFFFF 0%, #FFC8F0 45%, #FF8AD8 100%)', glow: '#FF5FCB' },
  cyber: { bg: 'radial-gradient(120% 70% at 50% 0%, #C8FFFB 0%, #9AD8FF 45%, #7B6CFF 100%)', btn: 'linear-gradient(180deg, #FFFFFF 0%, #B9F3FF 45%, #5FC8FF 100%)', glow: '#3AA8FF' },
  lime: { bg: 'radial-gradient(120% 70% at 50% 0%, #F5FFC8 0%, #D2FF9A 45%, #8CF5C8 100%)', btn: 'linear-gradient(180deg, #FFFFFF 0%, #E8FFB0 45%, #A8F05A 100%)', glow: '#62D21E' },
  midnight: { bg: 'radial-gradient(120% 70% at 50% 0%, #4B2A88 0%, #1E1450 50%, #0A0A20 100%)', btn: 'linear-gradient(180deg, #F0E6FF 0%, #B79CFF 45%, #6B3CFF 100%)', glow: '#9B6CFF' },
};

export const y2kMeta: BioThemeMeta = {
  key: 'y2k',
  name: 'Y2K Bubble',
  description: 'Estética anos 2000: botões gelatina brilhantes, cromado, estrelinhas piscando e muito degradê.',
  available: true,
  defaults: { bg_color: '#E7C6FF', button_color: '#FF5FCB', text_color: '#2B0A3D' },
  palettes: {
    bg: ['#E7C6FF', '#BDE0FE', '#F5FFC8', '#1E1450'],
    accent: ['#FF5FCB', '#3AA8FF', '#62D21E', '#9B6CFF'],
    text: ['#2B0A3D', '#0A1A3D', '#FFFFFF'],
  },
  controls: [
    { key: 'vibe', label: 'Clima', type: 'select', options: [
      { value: 'bubblegum', label: 'Chiclete' }, { value: 'cyber', label: 'Ciber' }, { value: 'lime', label: 'Limão' }, { value: 'midnight', label: 'Meia-noite' }, { value: 'custom', label: 'Minhas cores' },
    ], default: 'bubblegum', group: 'Cores', category: 'cores' },
    { key: 'sparkles', label: 'Estrelinhas', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    motionControl(),
    footerControl('Ex: ✦ volte sempre ✦'),
    ...fontControls('unbounded', 'manrope'),
  ],
};

const STARS = [
  { l: '8%', t: '6%', s: 22, d: 0 }, { l: '86%', t: '10%', s: 16, d: 0.6 }, { l: '76%', t: '30%', s: 12, d: 1.2 },
  { l: '12%', t: '38%', s: 14, d: 1.8 }, { l: '90%', t: '62%', s: 20, d: 0.3 }, { l: '6%', t: '74%', s: 18, d: 0.9 },
];

export function Y2kTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, y2kMeta, 'var(--font-unbounded), sans-serif');
  const vibe = s.vibe === 'custom'
    ? { bg: `radial-gradient(120% 70% at 50% 0%, ${alpha('#FFFFFF', 0.55)} 0%, transparent 60%)`, btn: `linear-gradient(180deg, #FFFFFF 0%, ${alpha(accent, 0.45)} 45%, ${accent} 100%)`, glow: accent }
    : (VIBES[s.vibe] || VIBES.bubblegum);
  const anim = s.motion !== 'off';
  const jelly = {
    background: vibe.btn,
    border: '2px solid rgba(255,255,255,0.9)',
    boxShadow: `inset 0 -6px 12px rgba(0,0,0,0.12), inset 0 4px 0 rgba(255,255,255,0.9), 0 8px 24px -8px ${vibe.glow}`,
    color: '#2B0A3D',
  };

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative overflow-hidden" style={{ backgroundColor: bg, backgroundImage: vibe.bg, color: text, fontFamily: bodyFont }}>
      {s.sparkles !== false && STARS.map((st, i) => (
        <span key={i} aria-hidden className={`absolute pointer-events-none ${anim ? 'yk-twinkle' : ''}`} style={{ left: st.l, top: st.t, fontSize: st.s, animationDelay: `${st.d}s`, color: '#FFFFFF', textShadow: `0 0 10px ${vibe.glow}` }}>✦</span>
      ))}
      <div className="relative max-w-md mx-auto px-5 pt-14 pb-16">
        <header className="flex flex-col items-center text-center mb-8">
          <div className="p-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #FFFFFF, #C8C8D8 40%, #FFFFFF 60%, #A8A8C0)', boxShadow: `0 0 30px ${vibe.glow}` }}>
            <Avatar profile={profile} />
          </div>
          <h1 className="mt-5 text-[30px] font-black tracking-tight yk-chrome" style={{ fontFamily: titleFont, ['--yk-glow' as any]: vibe.glow }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-2 text-[15px] font-semibold leading-relaxed whitespace-pre-line">{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-3.5">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-3 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="yk-jelly w-12 h-12 rounded-full flex items-center justify-center" style={jelly}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-3.5">
                {links.map((l: any) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="yk-jelly relative flex items-center gap-3 px-5 py-3.5 rounded-full overflow-hidden" style={jelly}>
                    <KitLinkIcon link={l} size={34} radius={999} style={{ background: 'rgba(255,255,255,0.8)', color: '#2B0A3D' }} />
                    <span className="flex-1 min-w-0 text-center pr-8">
                      <span className="block font-black text-[15px] truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[12px] font-semibold truncate" style={{ opacity: 0.7 }}>{l.subtitle}</span>}
                    </span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ borderRadius: 28, border: '3px solid #FFFFFF', boxShadow: `0 8px 24px -8px ${vibe.glow}` }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ borderRadius: 28, border: '3px solid #FFFFFF', background: 'rgba(255,255,255,0.6)' }} captionClassName="px-4 py-2 text-sm font-black text-[#2B0A3D]" />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.yk-chrome) { text-shadow: 0 2px 0 #FFFFFF, 0 4px 0 rgba(255,255,255,0.6), 0 8px 18px var(--yk-glow); }
        :global(.yk-twinkle) { animation: ykTw 2.4s ease-in-out infinite; }
        @keyframes ykTw { 0%, 100% { opacity: 0.2; transform: scale(0.7) rotate(0deg); } 50% { opacity: 1; transform: scale(1.1) rotate(20deg); } }
        :global(.yk-jelly) { transition: transform 300ms cubic-bezier(.3,1.8,.5,1); }
        :global(.yk-jelly:hover) { transform: scale(1.04); }
        :global(.yk-jelly:active) { transform: scale(0.94, 0.9); }
        @media (prefers-reduced-motion: reduce) { :global(.yk-twinkle) { animation: none; } :global(.yk-jelly) { transition: none; } }
      `}</style>
    </div>
  );
}

export default Y2kTheme;
