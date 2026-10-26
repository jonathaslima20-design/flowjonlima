'use client';

import { Plane } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl, alpha, onColor } from '@/themes/_kit';

export const ticketMeta: BioThemeMeta = {
  key: 'ticket',
  name: 'Boarding Pass',
  description: 'Cada link é um cartão de embarque: picote, códigos de destino, portão e código de barras.',
  available: true,
  defaults: { bg_color: '#E9EEF3', button_color: '#0B5FFF', text_color: '#0E1726' },
  palettes: {
    bg: ['#E9EEF3', '#F5EFE6', '#101827', '#FFFFFF', '#E8F3EC'],
    accent: ['#0B5FFF', '#E4572E', '#0E9F6E', '#7B3FE4', '#0E1726'],
    text: ['#0E1726', '#111111', '#F3F6FA'],
  },
  controls: [
    { key: 'paper', label: 'Cor do bilhete', type: 'color', palette: ['#FFFFFF', '#FFF8EC', '#F2F7FF', '#1A2233'], default: '#FFFFFF', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'airline', label: 'Nome da companhia', type: 'text', default: 'BIO AIRLINES', maxLength: 20, group: 'Textos', category: 'textos' },
    { key: 'origin', label: 'Código de origem', type: 'text', default: 'BIO', maxLength: 3, group: 'Textos', category: 'textos' },
    { key: 'barcode', label: 'Código de barras', type: 'toggle', default: true, group: 'Layout', category: 'layout' },
    footerControl('Ex: Boa viagem!'),
    ...fontControls('grotesk', 'grotesk'),
  ],
};

function code(title: string) {
  const c = (title || '').normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase();
  return (c + 'XXX').slice(0, 3);
}

const BARS = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 3];

export function TicketTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, ticketMeta, 'var(--font-space-grotesk), sans-serif');
  const paper = s.paper || '#FFFFFF';
  const ink = onColor(paper);
  const notch = `radial-gradient(circle at 0 50%, ${bg} 10px, transparent 10.5px), radial-gradient(circle at 100% 50%, ${bg} 10px, transparent 10.5px)`;
  const origin = (s.origin || 'BIO').toUpperCase().slice(0, 3);

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-5 pt-12 pb-16">
        <header className="rounded-2xl p-5 mb-6 flex items-center gap-4" style={{ background: accent, color: onColor(accent) }}>
          <Avatar profile={profile} size={Math.min(profile.avatar_size ?? 72, 80)} style={{ boxShadow: `0 0 0 3px ${alpha(onColor(accent), 0.5)}` }} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] opacity-80">Passageiro</p>
            <h1 className="text-[24px] font-bold leading-tight truncate" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
            {profile.bio && <p className="text-[13px] leading-snug mt-1 whitespace-pre-line opacity-90">{profile.bio}</p>}
          </div>
        </header>

        <div className="flex flex-col gap-4">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex gap-2 flex-wrap justify-center"
                render={({ Icon, label, attrs }) => (
                  <a {...attrs} aria-label={label} className="tk-lift w-11 h-11 rounded-full flex items-center justify-center" style={{ background: paper, color: ink, boxShadow: `0 6px 16px -10px ${alpha('#000', 0.5)}` }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-4">
                {links.map((l: any, i: number) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="tk-lift block rounded-2xl overflow-hidden" style={{ background: paper, color: ink, boxShadow: `0 10px 24px -16px ${alpha('#000', 0.55)}` }}>
                    <div className="flex items-center justify-between px-4 pt-3 text-[10px] uppercase tracking-[0.2em]" style={{ color: accent }}>
                      <span className="font-bold">{s.airline || 'BIO AIRLINES'}</span><span>Voo BF{String(101 + i * 7)}</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="text-center"><div className="text-[26px] font-bold leading-none" style={{ fontFamily: titleFont }}>{origin}</div><div className="text-[9px] uppercase opacity-60 mt-1">origem</div></div>
                      <div className="flex-1 flex items-center gap-1" style={{ color: accent }}>
                        <span className="flex-1 border-t-2 border-dashed" style={{ borderColor: alpha(ink, 0.25) }} /><Plane className="w-4 h-4" /><span className="flex-1 border-t-2 border-dashed" style={{ borderColor: alpha(ink, 0.25) }} />
                      </div>
                      <div className="text-center"><div className="text-[26px] font-bold leading-none" style={{ fontFamily: titleFont }}>{code(l.title)}</div><div className="text-[9px] uppercase opacity-60 mt-1">destino</div></div>
                    </div>
                    <div className="h-5 relative" style={{ backgroundImage: notch }}>
                      <span className="absolute left-4 right-4 top-1/2 border-t-2 border-dotted" style={{ borderColor: alpha(ink, 0.2) }} />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 pb-3.5">
                      <div className="min-w-0">
                        <div className="font-bold text-[15px] truncate" style={{ fontFamily: titleFont }}>{l.title}</div>
                        <div className="text-[11px] opacity-60 truncate">{l.subtitle || `Portão ${String.fromCharCode(65 + (i % 6))}${i + 1} · Assento ${i + 1}A`}</div>
                      </div>
                      {s.barcode !== false && (
                        <div aria-hidden className="flex items-end h-8 gap-[1.5px] shrink-0">
                          {BARS.map((w, j) => <span key={j} style={{ width: w, height: '100%', background: ink, opacity: 0.85 }} />)}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ borderRadius: 16 }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ borderRadius: 16, background: paper, color: ink }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.tk-lift) { transition: transform 220ms cubic-bezier(.2,.8,.2,1); }
        :global(.tk-lift:hover) { transform: translateY(-3px) rotate(-0.5deg); }
        :global(.tk-lift:active) { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) { :global(.tk-lift) { transition: none; } }
      `}</style>
    </div>
  );
}

export default TicketTheme;
