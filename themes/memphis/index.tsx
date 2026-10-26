'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, onColor } from '@/themes/_kit';

const SETS: Record<string, string[]> = {
  classic: ['#FF4F9A', '#FFD23F', '#3BCEAC', '#5B5FFF', '#FF7A3D'],
  pastel: ['#FFA8C5', '#FFE48F', '#9EEAD8', '#A9B4FF', '#FFC09F'],
  primary: ['#E63946', '#FFD60A', '#1D4ED8', '#111111', '#FFFFFF'],
};

export const memphisMeta: BioThemeMeta = {
  key: 'memphis',
  name: 'Memphis',
  description: 'Design Memphis dos anos 80: rabiscos, triângulos, bolinhas, cores vibrantes e sombras listradas.',
  available: true,
  defaults: { bg_color: '#FFF8EE', button_color: '#111111', text_color: '#111111' },
  palettes: { bg: ['#FFF8EE', '#FFFFFF', '#F1F5FF', '#111111'], accent: ['#111111', '#5B5FFF', '#FF4F9A'], text: ['#111111', '#FFFFFF'] },
  controls: [
    { key: 'set', label: 'Cores', type: 'select', options: [{ value: 'classic', label: 'Clássico 80s' }, { value: 'pastel', label: 'Pastel' }, { value: 'primary', label: 'Primárias' }], default: 'classic', group: 'Cores', category: 'cores' },
    { key: 'shapes', label: 'Quantidade de formas', type: 'slider', min: 0, max: 12, step: 1, suffix: '', default: 8, group: 'Efeitos', category: 'efeitos' },
    motionControl(),
    footerControl(),
    ...fontControls('archivo', 'grotesk'),
  ],
};

const SHAPES = [
  { k: 'tri', l: '6%', t: '4%', r: 15, s: 46 }, { k: 'squig', l: '70%', t: '3%', r: 0, s: 80 }, { k: 'dots', l: '82%', t: '22%', r: 0, s: 56 },
  { k: 'circle', l: '4%', t: '26%', r: 0, s: 28 }, { k: 'zig', l: '74%', t: '44%', r: -10, s: 70 }, { k: 'tri', l: '8%', t: '58%', r: -30, s: 34 },
  { k: 'circle', l: '86%', t: '66%', r: 0, s: 22 }, { k: 'squig', l: '2%', t: '80%', r: 20, s: 70 }, { k: 'dots', l: '78%', t: '86%', r: 0, s: 48 },
  { k: 'zig', l: '30%', t: '94%', r: 5, s: 60 }, { k: 'tri', l: '60%', t: '74%', r: 40, s: 26 }, { k: 'circle', l: '40%', t: '1%', r: 0, s: 18 },
];

function Shape({ k, color, size }: { k: string; color: string; size: number }) {
  if (k === 'tri') return <svg width={size} height={size} viewBox="0 0 40 40"><path d="M20 4 L36 34 H4 Z" fill={color} stroke="#111" strokeWidth="2.5" /></svg>;
  if (k === 'circle') return <svg width={size} height={size} viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="6" /></svg>;
  if (k === 'dots') return <svg width={size} height={size} viewBox="0 0 40 40">{[0, 1, 2, 3].flatMap(x => [0, 1, 2, 3].map(y => <circle key={`${x}${y}`} cx={5 + x * 10} cy={5 + y * 10} r="2.2" fill={color} />))}</svg>;
  if (k === 'zig') return <svg width={size} height={size / 3} viewBox="0 0 60 20"><path d="M2 16 L12 4 L22 16 L32 4 L42 16 L52 4 L58 12" fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" /></svg>;
  return <svg width={size} height={size / 3} viewBox="0 0 60 20"><path d="M2 10 C 10 0, 18 20, 26 10 S 42 0, 50 10 S 58 16, 58 10" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" /></svg>;
}

export function MemphisTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, memphisMeta, 'var(--font-archivo-black), Impact, sans-serif');
  const C = SETS[s.set] || SETS.classic;
  const count = Number(s.shapes ?? 8);
  const anim = s.motion !== 'off';
  const ink = accent;
  const stripes = (c: string) => `repeating-linear-gradient(45deg, ${c} 0 3px, transparent 3px 7px)`;

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative overflow-hidden" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      {SHAPES.slice(0, count).map((sh, i) => (
        <span key={i} aria-hidden className={`absolute pointer-events-none ${anim ? 'mp-float' : ''}`} style={{ left: sh.l, top: sh.t, transform: `rotate(${sh.r}deg)`, animationDelay: `${i * 0.4}s` }}>
          <Shape k={sh.k} color={C[i % C.length]} size={sh.s} />
        </span>
      ))}
      <div className="relative max-w-md mx-auto px-6 pt-16 pb-16">
        <header className="flex flex-col items-center text-center mb-9">
          <div className="relative">
            <span aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rounded-full" style={{ backgroundImage: stripes(C[3]) }} />
            <div className="relative rounded-full p-1" style={{ background: C[1], border: `3px solid ${ink}` }}><Avatar profile={profile} /></div>
          </div>
          <h1 className="mt-7 text-[32px] uppercase leading-none px-3 py-2 -rotate-2" style={{ fontFamily: titleFont, background: C[0], color: onColor(C[0]), border: `3px solid ${ink}` }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-5 text-[15px] font-semibold leading-relaxed whitespace-pre-line">{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-5">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-3 flex-wrap"
                render={({ Icon, label, attrs, index }) => (
                  <a {...attrs} aria-label={label} className="mp-press relative w-12 h-12" >
                    <span aria-hidden className="absolute inset-0 translate-x-1.5 translate-y-1.5" style={{ backgroundImage: stripes(ink) }} />
                    <span className="relative w-full h-full flex items-center justify-center" style={{ background: C[(index + 2) % C.length], color: onColor(C[(index + 2) % C.length]), border: `3px solid ${ink}` }}><Icon className="w-5 h-5" /></span>
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-5 pr-2">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="mp-press relative block">
                    <span aria-hidden className="absolute inset-0 translate-x-2 translate-y-2" style={{ backgroundImage: stripes(C[(i + 3) % C.length]) }} />
                    <span className="relative flex items-center gap-3 px-4 py-3.5" style={{ background: i % 2 ? '#FFFFFF' : C[i % C.length], color: i % 2 ? '#111' : onColor(C[i % C.length]), border: `3px solid ${ink}` }}>
                      <KitLinkIcon link={l} size={34} radius={0} style={{ background: '#FFF', color: '#111', border: `2px solid ${ink}` }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[16px] uppercase truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                        {l.subtitle && <span className="block text-[12px] font-semibold truncate opacity-80">{l.subtitle}</span>}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-5" frameStyle={{ border: `3px solid ${ink}`, boxShadow: `8px 8px 0 ${C[2]}` }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} className="flex flex-col gap-5" frameStyle={{ border: `3px solid ${ink}`, boxShadow: `8px 8px 0 ${C[3]}`, background: '#FFF' }} captionClassName="px-3 py-2 uppercase text-[#111]" captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.mp-float) { animation: mpFloat 6s ease-in-out infinite alternate; }
        @keyframes mpFloat { to { translate: 0 -10px; } }
        :global(.mp-press) { transition: transform 140ms; }
        :global(.mp-press:hover) { transform: translate(-2px, -2px); }
        :global(.mp-press:active) { transform: translate(4px, 4px); }
        @media (prefers-reduced-motion: reduce) { :global(.mp-float) { animation: none; } }
      `}</style>
    </div>
  );
}

export default MemphisTheme;
