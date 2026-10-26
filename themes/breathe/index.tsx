'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha } from '@/themes/_kit';

const MOODS: Record<string, [string, string, string]> = {
  lavender: ['#E9E4FF', '#FBE7F3', '#E2F1FF'],
  sea: ['#DFF6F2', '#E3EEFF', '#F1FAE8'],
  peach: ['#FFE9DC', '#FFF4D9', '#FCE3EC'],
  dusk: ['#2A2346', '#3B2A4F', '#1F2F4A'],
};

export const breatheMeta: BioThemeMeta = {
  key: 'breathe',
  name: 'Breathe',
  description: 'Calma e bem-estar: degradê suave, um círculo que respira devagar atrás da sua foto e botões arredondados.',
  available: true,
  defaults: { bg_color: '#F6F3FF', button_color: '#7C6BD6', text_color: '#2E2A44' },
  palettes: { bg: ['#F6F3FF', '#F2FBF9', '#FFF7F1', '#221C38'], accent: ['#7C6BD6', '#3FA796', '#E5865C', '#C49BFF'], text: ['#2E2A44', '#1F3B37', '#F3EFFF'] },
  controls: [
    { key: 'mood', label: 'Clima', type: 'select', options: [{ value: 'lavender', label: 'Lavanda' }, { value: 'sea', label: 'Brisa do mar' }, { value: 'peach', label: 'Pêssego' }, { value: 'dusk', label: 'Anoitecer' }], default: 'lavender', group: 'Cores', category: 'cores' },
    { key: 'pace', label: 'Ritmo da respiração', type: 'slider', min: 4, max: 12, step: 1, suffix: 's', default: 8, group: 'Efeitos', category: 'efeitos' },
    { key: 'guide', label: 'Texto “inspire · expire”', type: 'toggle', default: false, group: 'Efeitos', category: 'efeitos' },
    motionControl(),
    footerControl('Ex: respire fundo ✨'),
    ...fontControls('fraunces', 'manrope'),
  ],
};

export function BreatheTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, breatheMeta, 'var(--font-fraunces), Georgia, serif');
  const [a, b, c] = MOODS[s.mood] || MOODS.lavender;
  const pace = (Number(s.pace) || 8) * (s.motion === 'subtle' ? 1.5 : 1);
  const anim = s.motion !== 'off';
  const dark = s.mood === 'dusk';
  const card = { background: dark ? alpha('#FFFFFF', 0.08) : alpha('#FFFFFF', 0.65), border: `1px solid ${alpha(dark ? '#FFFFFF' : '#FFFFFF', dark ? 0.12 : 0.9)}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: `0 10px 30px -18px ${alpha(accent, 0.6)}` };
  const avatar = profile.avatar_size ?? 112;

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, backgroundImage: `linear-gradient(160deg, ${a} 0%, ${b} 50%, ${c} 100%)`, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-6 pt-16 pb-16">
        <header className="flex flex-col items-center text-center mb-10">
          <div className="relative flex items-center justify-center" style={{ width: avatar * 1.9, height: avatar * 1.9 }}>
            {[1.9, 1.55, 1.25].map((k, i) => (
              <span key={i} aria-hidden className={`absolute rounded-full ${anim ? 'br-breathe' : ''}`} style={{ width: avatar * k, height: avatar * k, background: alpha(accent, 0.08 + i * 0.06), animationDuration: `${pace}s`, animationDelay: `${i * 0.25}s` }} />
            ))}
            <Avatar profile={profile} size={avatar} className="relative" style={{ boxShadow: `0 10px 30px -12px ${alpha(accent, 0.7)}` }} />
            {s.guide && anim && (
              <span className="absolute -bottom-1 h-4 w-28 text-center text-[11px] uppercase tracking-[0.35em]" style={{ color: accent }}>
                <span className="br-in absolute inset-0" style={{ animationDuration: `${pace}s` }}>inspire</span>
                <span className="br-out absolute inset-0" style={{ animationDuration: `${pace}s` }}>expire</span>
              </span>
            )}
          </div>
          <h1 className="mt-2 text-[32px] leading-tight" style={{ fontFamily: titleFont, fontWeight: 500 }}>{profile.display_name}</h1>
          {profile.bio && <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line max-w-[330px]" style={{ opacity: 0.75 }}>{profile.bio}</p>}
        </header>

        <div className="flex flex-col gap-3.5">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-3 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="br-soft w-12 h-12 rounded-full flex items-center justify-center" style={{ ...card, color: accent }}><Icon className="w-5 h-5" /></a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-3.5">
                {links.map((l: any) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="br-soft flex items-center gap-4 px-5 py-4 rounded-[28px]" style={card}>
                    <KitLinkIcon link={l} size={38} radius={999} style={{ background: alpha(accent, 0.15), color: accent }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[16px] truncate" style={{ fontFamily: titleFont, fontWeight: 500 }}>{l.title}</span>
                      {l.subtitle && <span className="block text-[13px] truncate" style={{ opacity: 0.6 }}>{l.subtitle}</span>}
                    </span>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-3.5" frameStyle={{ borderRadius: 28 }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} className="flex flex-col gap-3.5" frameStyle={{ ...card, borderRadius: 28 }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={a} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.br-breathe) { animation: brBreathe ease-in-out infinite; }
        @keyframes brBreathe { 0%, 100% { transform: scale(0.82); opacity: 0.6; } 50% { transform: scale(1); opacity: 1; } }
        :global(.br-in) { animation: brIn ease-in-out infinite; }
        :global(.br-out) { animation: brOut ease-in-out infinite; }
        @keyframes brIn { 0%, 42% { opacity: 1; } 50%, 92% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes brOut { 0%, 42% { opacity: 0; } 50%, 92% { opacity: 1; } 100% { opacity: 0; } }
        :global(.br-soft) { transition: transform 400ms cubic-bezier(.2,.8,.2,1); }
        :global(.br-soft:hover) { transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) { :global(.br-breathe) { animation: none; } :global(.br-soft) { transition: none; } }
      `}</style>
    </div>
  );
}

export default BreatheTheme;
