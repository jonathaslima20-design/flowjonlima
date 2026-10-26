'use client';

import { ChevronUp } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha } from '@/themes/_kit';

const RINGS: Record<string, string> = {
  insta: 'linear-gradient(45deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5)',
  ocean: 'linear-gradient(45deg, #43E97B, #38F9D7, #4FACFE, #00F2FE)',
  fire: 'linear-gradient(45deg, #F9D423, #FF4E50, #FC913A)',
  mono: 'linear-gradient(45deg, #FFFFFF, #9CA3AF, #FFFFFF)',
};

export const storiesMeta: BioThemeMeta = {
  key: 'stories',
  name: 'Stories',
  description: 'Como um story: capa de tela cheia com sua foto, barras de progresso no topo e links como cartões com anel colorido.',
  available: true,
  defaults: { bg_color: '#000000', button_color: '#FFFFFF', text_color: '#FFFFFF' },
  palettes: { bg: ['#000000', '#0F0F14', '#14080E', '#F5F5F5'], accent: ['#FFFFFF', '#FEDA75', '#38F9D7', '#FF4E50'], text: ['#FFFFFF', '#111111'] },
  controls: [
    { key: 'ring', label: 'Anel colorido', type: 'select', options: [{ value: 'insta', label: 'Clássico' }, { value: 'ocean', label: 'Oceano' }, { value: 'fire', label: 'Fogo' }, { value: 'mono', label: 'Prata' }], default: 'insta', group: 'Cores', category: 'cores' },
    { key: 'progress', label: 'Barras de progresso animadas', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    { key: 'cta', label: 'Chamada acima dos links', type: 'text', default: 'Arraste para ver mais', maxLength: 30, group: 'Textos', category: 'textos' },
    motionControl(),
    footerControl(),
    ...fontControls('manrope', 'manrope'),
  ],
};

export function StoriesTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, titleFont, bodyFont, t } = useThemeKit(props, storiesMeta, 'var(--font-manrope), system-ui, sans-serif');
  const ring = RINGS[s.ring] || RINGS.insta;
  const anim = s.motion !== 'off' && s.progress !== false;
  const segments = Math.max(3, Math.min(links.length + 1, 6));

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto">
        <section className="relative h-[520px] overflow-hidden">
          {profile.avatar_url && <img src={profile.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${alpha('#000', 0.55)} 0%, transparent 25%, transparent 50%, ${bg} 100%)` }} />
          <div className="absolute top-3 inset-x-3 flex gap-1" aria-hidden>
            {Array.from({ length: segments }).map((_, i) => (
              <span key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: alpha('#FFFFFF', 0.35) }}>
                <span className={`block h-full bg-white ${anim && i === 0 ? 'sr-fill' : ''}`} style={{ width: i === 0 ? (anim ? undefined : '100%') : '0%' }} />
              </span>
            ))}
          </div>
          <div className="absolute top-7 left-3 flex items-center gap-2 text-white">
            <span className="p-[2px] rounded-full" style={{ backgroundImage: ring }}>
              <span className="block p-[2px] rounded-full bg-black">
                {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
              </span>
            </span>
            <span className="text-[14px] font-semibold drop-shadow">{profile.username || profile.display_name}</span>
            <span className="text-[13px] opacity-70 drop-shadow">agora</span>
          </div>
          <div className="absolute bottom-6 inset-x-5">
            <h1 className="text-[36px] font-extrabold leading-[1.02] tracking-tight drop-shadow" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
            {profile.bio && <p className="mt-2 text-[15px] leading-snug whitespace-pre-line opacity-90">{profile.bio}</p>}
          </div>
        </section>

        <div className="px-5 pb-16">
          {s.cta && (
            <div className={`flex flex-col items-center text-[12px] font-semibold mb-4 ${s.motion !== 'off' ? 'sr-bob' : ''}`} style={{ opacity: 0.8 }}>
              <ChevronUp className="w-5 h-5" />{s.cta}
            </div>
          )}
          <div className="flex flex-col gap-3">
            {orderedSections(sectionOrder, {
              socials: (
                <SocialRow key="socials" socials={socials} t={t} className="flex gap-3 overflow-x-auto pb-1"
                  render={({ Icon, label, attrs }) => (
                    <a {...attrs} className="flex flex-col items-center gap-1.5 shrink-0 w-[64px]">
                      <span className="p-[2.5px] rounded-full" style={{ backgroundImage: ring }}>
                        <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: bg, border: `2px solid ${bg}` }}><Icon className="w-6 h-6" /></span>
                      </span>
                      <span className="text-[11px] truncate max-w-full opacity-80">{label}</span>
                    </a>
                  )}
                />
              ),
              links: links.length > 0 ? (
                <div key="links" className="flex flex-col gap-3">
                  {links.map((l: any) => (
                    <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="sr-tap block p-[2px] rounded-2xl" style={{ backgroundImage: ring }}>
                      <span className="flex items-center gap-3 px-4 py-3.5 rounded-[14px]" style={{ background: bg }}>
                        <KitLinkIcon link={l} size={38} radius={999} style={{ backgroundImage: ring, color: '#FFF' }} />
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                          {l.subtitle && <span className="block text-[13px] truncate opacity-65">{l.subtitle}</span>}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : null,
              banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ borderRadius: 18 }} />,
              videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ borderRadius: 18, background: alpha(text, 0.06) }} captionStyle={{ fontFamily: titleFont }} />,
            })}
          </div>
          <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
        </div>
      </div>
      <style jsx>{`
        :global(.sr-fill) { animation: srFill 5s linear infinite; }
        @keyframes srFill { from { width: 0%; } to { width: 100%; } }
        :global(.sr-bob) { animation: srBob 1.8s ease-in-out infinite; }
        @keyframes srBob { 50% { transform: translateY(-4px); } }
        :global(.sr-tap) { transition: transform 160ms; }
        :global(.sr-tap:active) { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) { :global(.sr-fill), :global(.sr-bob) { animation: none; } }
      `}</style>
    </div>
  );
}

export default StoriesTheme;
