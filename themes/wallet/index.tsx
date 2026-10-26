'use client';

import { ArrowUpRight } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, alpha, onColor } from '@/themes/_kit';

const DECKS: Record<string, string[]> = {
  vivid: ['#FF3B30', '#FF9500', '#34C759', '#007AFF', '#AF52DE', '#FF2D55'],
  pastel: ['#F8B4B4', '#FCD9A8', '#B5E8C8', '#B4D0F8', '#D5B8F5', '#F8B4D9'],
  mono: ['#1C1C1E', '#2C2C2E', '#3A3A3C', '#48484A', '#636366', '#8E8E93'],
  metal: ['#B8860B', '#8A8D91', '#B87333', '#5E6266', '#D4AF37', '#71706E'],
};

export const walletMeta: BioThemeMeta = {
  key: 'wallet',
  name: 'Wallet',
  description: 'Seus links empilhados como cartões e ingressos numa carteira digital, com detalhes de chip e número.',
  available: true,
  defaults: { bg_color: '#F2F2F7', button_color: '#007AFF', text_color: '#111111' },
  palettes: {
    bg: ['#F2F2F7', '#FFFFFF', '#000000', '#1C1C1E', '#EDE8E0'],
    accent: ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#111111'],
    text: ['#111111', '#000000', '#FFFFFF'],
  },
  controls: [
    { key: 'deck', label: 'Cores dos cartões', type: 'select', options: [
      { value: 'vivid', label: 'Vibrante' }, { value: 'pastel', label: 'Pastel' }, { value: 'mono', label: 'Grafite' }, { value: 'metal', label: 'Metais' },
    ], default: 'vivid', group: 'Cores', category: 'cores' },
    { key: 'overlap', label: 'Sobreposição da pilha', type: 'slider', min: 0, max: 60, step: 5, suffix: 'px', default: 36, group: 'Layout', category: 'layout' },
    { key: 'walletTitle', label: 'Título da carteira', type: 'text', default: 'Carteira', maxLength: 20, group: 'Textos', category: 'textos' },
    footerControl(),
    ...fontControls('manrope', 'manrope'),
  ],
};

export function WalletTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, titleFont, bodyFont, t } = useThemeKit(props, walletMeta, 'var(--font-manrope), system-ui, sans-serif');
  const deck = DECKS[s.deck] || DECKS.vivid;
  const overlap = Number(s.overlap ?? 36);

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-5 pt-12 pb-16">
        <header className="flex items-center gap-4 mb-6">
          <Avatar profile={profile} size={Math.min(profile.avatar_size ?? 64, 72)} />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ opacity: 0.5 }}>{s.walletTitle || 'Carteira'}</p>
            <h1 className="text-[26px] font-extrabold tracking-tight leading-tight" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
          </div>
        </header>
        {profile.bio && <p className="-mt-2 mb-6 text-[15px] leading-relaxed whitespace-pre-line" style={{ opacity: 0.75 }}>{profile.bio}</p>}

        <div className="flex flex-col gap-5">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex gap-2 flex-wrap"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="wl-lift h-10 px-3.5 rounded-full flex items-center gap-2 text-[13px] font-semibold" style={{ background: alpha(text, 0.07) }}>
                    <Icon className="w-4 h-4" />{label}
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col pb-2">
                {links.map((l: any, i: number) => {
                  const c = deck[i % deck.length];
                  const fg = onColor(c);
                  return (
                    <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="wl-card relative block p-5 rounded-[20px] overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${c}, ${alpha(c, 0.78)})`, color: fg, marginTop: i === 0 ? 0 : -overlap, zIndex: i + 1, boxShadow: `0 -1px 0 ${alpha('#FFFFFF', 0.25)} inset, 0 12px 28px -12px ${alpha('#000000', 0.45)}`, minHeight: 120 }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <KitLinkIcon link={l} size={30} radius={8} style={{ background: alpha(fg, 0.18) }} />
                          <span className="font-extrabold text-[16px] truncate" style={{ fontFamily: titleFont }}>{l.title}</span>
                        </div>
                        <ArrowUpRight className="w-5 h-5 shrink-0" />
                      </div>
                      <div className="mt-6 flex items-end justify-between gap-3">
                        <span className="text-[13px] truncate" style={{ opacity: 0.8 }}>{l.subtitle || ''}</span>
                        <span className="text-[11px] font-mono tracking-[0.2em] shrink-0" style={{ opacity: 0.7 }}>•••• {String(1000 + i * 731).slice(-4)}</span>
                      </div>
                      <span aria-hidden className="absolute right-5 top-1/2 -translate-y-1/2 w-9 h-7 rounded-md" style={{ background: `linear-gradient(135deg, ${alpha('#FFE29A', 0.9)}, ${alpha('#C9A227', 0.9)})`, opacity: 0.5 }} />
                    </a>
                  );
                })}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ borderRadius: 20 }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ borderRadius: 20, background: alpha(text, 0.06) }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.wl-card) { transition: transform 260ms cubic-bezier(.2,.8,.2,1); }
        :global(.wl-card:hover) { transform: translateY(-10px); }
        :global(.wl-card:active) { transform: translateY(-4px) scale(0.99); }
        :global(.wl-lift:hover) { filter: brightness(0.95); }
        @media (prefers-reduced-motion: reduce) { :global(.wl-card) { transition: none; } }
      `}</style>
    </div>
  );
}

export default WalletTheme;
