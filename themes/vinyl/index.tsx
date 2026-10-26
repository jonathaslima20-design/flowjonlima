'use client';

import { Play, SkipBack, SkipForward, Pause, Heart } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha } from '@/themes/_kit';

export const vinylMeta: BioThemeMeta = {
  key: 'vinyl',
  name: 'Vinyl',
  description: 'Player de música: sua foto girando num disco de vinil, barra de progresso e links como faixas da playlist.',
  available: true,
  defaults: { bg_color: '#121212', button_color: '#1ED760', text_color: '#FFFFFF' },
  palettes: { bg: ['#121212', '#1A0F0A', '#0F1424', '#F4EDE4'], accent: ['#1ED760', '#FF5A36', '#8C6CFF', '#FFC531', '#FF3D7F'], text: ['#FFFFFF', '#F4EDE4', '#121212'] },
  controls: [
    { key: 'record', label: 'Cor do disco', type: 'color', palette: ['#111111', '#7A1F2B', '#1F3A7A', '#C9A227', '#2E7D4F'], default: '#111111', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'playlist', label: 'Nome da playlist', type: 'text', default: 'Minhas faixas', maxLength: 30, group: 'Textos', category: 'textos' },
    { key: 'spin', label: 'Disco girando', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    motionControl(),
    footerControl(),
    ...fontControls('manrope', 'manrope'),
  ],
};

export function VinylTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, vinylMeta, 'var(--font-manrope), system-ui, sans-serif');
  const spinning = s.spin !== false && s.motion !== 'off';
  const record = s.record || '#111111';
  const sub = alpha(text, 0.6);

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, backgroundImage: `linear-gradient(180deg, ${alpha(accent, 0.28)} 0%, transparent 45%)`, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-6 pt-12 pb-16">
        <div className="relative mx-auto w-64 h-64">
          <div className={`absolute inset-0 rounded-full ${spinning ? 'vn-spin' : ''}`} style={{
            background: `repeating-radial-gradient(circle, ${record} 0 2px, ${alpha('#FFFFFF', 0.06)} 2px 3px), radial-gradient(circle, ${record} 0%, ${record} 100%)`,
            boxShadow: `0 20px 50px -20px ${alpha('#000', 0.8)}, inset 0 0 0 6px ${alpha('#000', 0.4)}`,
          }}>
            <div className="absolute inset-[32%] rounded-full overflow-hidden" style={{ boxShadow: `0 0 0 4px ${alpha('#000', 0.4)}` }}>
              {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <span aria-hidden className="absolute left-1/2 top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: bg }} />
            <span aria-hidden className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 30deg, transparent 0 20%, rgba(255,255,255,0.12) 25%, transparent 30% 70%, rgba(255,255,255,0.08) 75%, transparent 80%)' }} />
          </div>
        </div>

        <header className="mt-8 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[26px] font-extrabold tracking-tight truncate" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
            {profile.bio && <p className="mt-0.5 text-[14px] leading-snug whitespace-pre-line" style={{ color: sub }}>{profile.bio}</p>}
          </div>
          <Heart className="w-6 h-6 shrink-0" style={{ color: accent }} fill={accent} />
        </header>

        <div className="mt-5" aria-hidden>
          <div className="h-1 rounded-full" style={{ background: alpha(text, 0.2) }}>
            <div className={`h-full rounded-full relative ${spinning ? 'vn-progress' : ''}`} style={{ width: '38%', background: text }}>
              <span className="absolute -right-1.5 -top-1 w-3 h-3 rounded-full" style={{ background: text }} />
            </div>
          </div>
          <div className="flex justify-between text-[11px] mt-1.5 tabular-nums" style={{ color: sub }}><span>1:24</span><span>3:42</span></div>
          <div className="flex items-center justify-center gap-8 mt-2">
            <SkipBack className="w-6 h-6" fill={text} />
            <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: text, color: bg }}>
              {spinning ? <Pause className="w-6 h-6" fill={bg} /> : <Play className="w-6 h-6 ml-1" fill={bg} />}
            </span>
            <SkipForward className="w-6 h-6" fill={text} />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-5 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="vn-hl" style={{ color: sub }}><Icon className="w-5 h-5" /></a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <section key="links">
                <h2 className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: sub }}>{s.playlist || 'Minhas faixas'}</h2>
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="vn-row group flex items-center gap-4 py-2.5 px-2 -mx-2 rounded-lg">
                    <span className="w-5 text-center text-[14px] tabular-nums" style={{ color: i === 0 ? accent : sub }}>
                      <span className="group-hover:hidden">{i + 1}</span><Play className="w-4 h-4 hidden group-hover:inline" fill={text} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate" style={{ fontFamily: titleFont, color: i === 0 ? accent : text }}>{l.title}</span>
                      <span className="block text-[12px] truncate" style={{ color: sub }}>{l.subtitle || profile.display_name}</span>
                    </span>
                    <span className="text-[12px] tabular-nums" style={{ color: sub }}>{2 + (i % 3)}:{String(10 + ((i * 17) % 50)).padStart(2, '0')}</span>
                  </a>
                ))}
              </section>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ borderRadius: 12 }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ borderRadius: 12, background: alpha(text, 0.06) }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.vn-spin) { animation: vnSpin 6s linear infinite; }
        @keyframes vnSpin { to { transform: rotate(360deg); } }
        :global(.vn-progress) { animation: vnProg 30s linear infinite; }
        @keyframes vnProg { from { width: 5%; } to { width: 100%; } }
        :global(.vn-row:hover) { background: rgba(255,255,255,0.08); }
        :global(.vn-hl:hover) { color: inherit !important; filter: brightness(1.6); }
        @media (prefers-reduced-motion: reduce) { :global(.vn-spin), :global(.vn-progress) { animation: none; } }
      `}</style>
    </div>
  );
}

export default VinylTheme;
