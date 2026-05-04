'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const keynoteMeta: BioThemeMeta = {
  key: 'keynote',
  name: 'Keynote Stage',
  description: 'Palco cinematico com hero enorme, countdown e bandas alternadas.',
  available: true,
  defaults: {
    bg_color: '#0D0D0D',
    button_color: '#EF4444',
    text_color: '#FAFAFA',
  },
  palettes: {
    bg: ['#0D0D0D', '#000000', '#1A1A1A', '#FAFAFA', '#F5F5F5', '#111111'],
    accent: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#FAFAFA'],
    text: ['#FAFAFA', '#FFFFFF', '#0D0D0D', '#171717'],
  },
  controls: [
    { key: 'eventDate', label: 'Data do evento (YYYY-MM-DD)', type: 'select', options: [
      { value: '2026-06-15', label: '15 Jun 2026' },
      { value: '2026-09-01', label: '01 Set 2026' },
      { value: '2026-11-10', label: '10 Nov 2026' },
      { value: '2027-02-20', label: '20 Fev 2027' },
    ], default: '2026-09-01', group: 'Evento' },
    { key: 'countdown', label: 'Mostrar countdown', type: 'toggle', default: true, group: 'Evento' },
    { key: 'bandColor', label: 'Cor da banda', type: 'color', palette: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#FAFAFA'], default: '#EF4444', group: 'Visual' },
    { key: 'chips', label: 'Estilo dos chips', type: 'select', options: [
      { value: 'outline', label: 'Outline' }, { value: 'solid', label: 'Solido' }, { value: 'ghost', label: 'Ghost' },
    ], default: 'outline', group: 'Visual' },
    { key: 'liveLabel', label: 'Rótulo superior', type: 'text', default: 'Live Keynote', maxLength: 32, group: 'Textos' },
    { key: 'seasonLabel', label: 'Rótulo da temporada', type: 'text', default: 'Season 2026', maxLength: 32, group: 'Textos' },
    { key: 'nextStageLabel', label: 'Próximo estágio', type: 'text', default: 'Next Stage', maxLength: 32, group: 'Textos' },
    { key: 'venue', label: 'Local do evento', type: 'text', default: 'Lisbon Convention Center', maxLength: 80, group: 'Textos' },
    { key: 'sessionsLabel', label: 'Rótulo da seção sessions', type: 'text', default: 'Sessions', maxLength: 32, group: 'Textos' },
    { key: 'tagsText', label: 'Chips (separadas por vírgula)', type: 'textarea', default: 'keynote, fireside, workshop, panel, masterclass', maxLength: 200, rows: 2, group: 'Textos' },
    { key: 'accentCustom', label: 'Cor da banda (personalizada)', type: 'colorPicker', default: '#EF4444', group: 'Cores' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada', type: 'toggle', default: false, group: 'Cores' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'grotesk', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'grotesk', group: 'Tipografia' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: See you on stage', maxLength: 80, group: 'Textos' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

function useCountdown(target: string) {
  const [delta, setDelta] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) return setDelta({ d: 0, h: 0, m: 0, s: 0 });
      setDelta({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return delta;
}

export function KeynoteTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'keynote', keynoteMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (s.bandColor || '#EF4444');
  const bg = profile.bg_color || '#0D0D0D';
  const text = profile.text_color || '#FAFAFA';
  const d = useCountdown(s.eventDate);
  const t = (a: string, b: string | null) => track?.(a, b);

  const chipStyle = (i: number) => {
    if (s.chips === 'solid') return { background: accent, color: bg, border: 'none' } as const;
    if (s.chips === 'ghost') return { background: 'transparent', color: text, border: `1px solid ${text}22` } as const;
    return { background: 'transparent', color: accent, border: `1px solid ${accent}` } as const;
  };

  const tags = (s.tagsText && typeof s.tagsText === 'string')
    ? s.tagsText.split(',').map((x: string) => x.trim()).filter(Boolean)
    : ['keynote', 'fireside', 'workshop', 'panel', 'masterclass'];

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: text, fontFamily: getFontStack(s.bodyFont, 'var(--font-space-grotesk), "Helvetica Neue", sans-serif') }}>
      <div className="max-w-md mx-auto px-5 pt-[72px] pb-24">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase opacity-70 mb-8">
          <div className="w-2 h-2 rounded-full keynote-live" style={{ background: accent }} aria-hidden />
          <span>{s.liveLabel || 'Live Keynote'}</span>
          <div className="flex-1 h-px" style={{ background: `${text}22` }} />
          <span>{s.seasonLabel || 'Season 2026'}</span>
        </div>

        <h1 className="uppercase leading-[0.88] tracking-tight" style={{ fontSize: 'clamp(3rem, 12vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: text, fontFamily: getFontStack(s.titleFont, 'inherit') }}>
          {profile.display_name}
        </h1>
        {profile.bio && (
          <p className="mt-4 text-lg leading-snug max-w-md whitespace-pre-line" style={{ opacity: 0.9 }}>{profile.bio}</p>
        )}

        <div className="mt-6 flex gap-2 flex-wrap">
          {tags.map((tag, i) => (
            <span key={tag} className="px-3 py-1 text-[10px] tracking-[0.2em] uppercase rounded-full" style={chipStyle(i)}>#{tag}</span>
          ))}
        </div>

        <div className="mt-8 relative overflow-hidden" style={{ border: `1px solid ${accent}55` }}>
          <div className="absolute inset-0 pointer-events-none" aria-hidden style={{
            background: `repeating-linear-gradient(135deg, transparent 0 20px, ${accent}14 20px 21px)`,
          }} />
          <div className="relative p-5">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: accent }}>
              <Calendar className="w-3 h-3" /> {s.nextStageLabel || 'Next Stage'}
            </div>
            <div className="text-xl tracking-tight" style={{ fontWeight: 700 }}>
              {new Date(s.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
              <MapPin className="w-3 h-3" /> {s.venue || 'Lisbon Convention Center'}
            </div>
            {s.countdown && d && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[{ v: d.d, l: 'Days' }, { v: d.h, l: 'Hrs' }, { v: d.m, l: 'Min' }, { v: d.s, l: 'Sec' }].map((x, i) => (
                  <div key={i} className="text-center p-2" style={{ background: `${text}08`, border: `1px solid ${text}15` }}>
                    <div className="text-2xl tabular-nums" style={{ fontWeight: 700, color: accent }}>{String(x.v).padStart(2, '0')}</div>
                    <div className="text-[9px] tracking-[0.3em] uppercase opacity-60">{x.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="rounded-full overflow-hidden shrink-0" style={{ width: 56, height: 56, border: `2px solid ${accent}` }}>
            {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-70">Speaker</div>
            <div className="font-semibold">{profile.display_name}</div>
          </div>
          {s.showSocials !== false && socials?.length > 0 && (
            <div className="ml-auto flex gap-2">
              {socials.slice(0, 3).map((soc: any) => {
                const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                const Icon = meta?.icon;
                return (
                  <a key={soc.id} href={getSocialHref(soc.platform, soc.url)} target="_blank" rel="noreferrer" onClick={() => t('social', soc.id)}
                    className="w-8 h-8 flex items-center justify-center transition-transform hover:scale-110"
                    style={{ border: `1px solid ${text}22`, color: text }}>
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-3 text-[10px] tracking-[0.4em] uppercase opacity-70">
          <span>{s.sessionsLabel || 'Sessions'}</span>
          <div className="flex-1 h-px" style={{ background: accent }} />
          <span>{String(links.length).padStart(2, '0')}</span>
        </div>

        <div className="mt-4 flex flex-col gap-0">
          {links.map((l: any, i: number) => {
            const alt = i % 2 === 1;
            return (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" onClick={() => t('link', l.id)}
                className="group relative block px-5 py-5 overflow-hidden keynote-band"
                style={{ background: alt ? `${text}05` : 'transparent', borderTop: `1px solid ${text}10` }}>
                <div className="flex items-baseline gap-4">
                  <div className="text-3xl tabular-nums opacity-50" style={{ color: accent, fontWeight: 700 }}>{String(i + 1).padStart(2, '0')}</div>
                  <div className="flex-1">
                    <div className="text-[10px] tracking-[0.4em] uppercase opacity-60">Session</div>
                    <div className="text-xl tracking-tight" style={{ fontWeight: 700 }}>{l.title}</div>
                  </div>
                  <span className="text-xs tracking-[0.3em] uppercase transition-transform group-hover:translate-x-1" style={{ color: accent }}>Join &rarr;</span>
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-0 keynote-fill" style={{ background: accent, opacity: 0.08 }} aria-hidden />
              </a>
            );
          })}

          {banners?.map((b: any) => {
            const inner = (
              <div className={`mt-3 overflow-hidden relative ${BANNER_H[b.size] || BANNER_H.md}`} style={{ border: `1px solid ${accent}55` }}>
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a> : <div key={b.id}>{inner}</div>;
          })}

          {videos.map((v: any) => (
            <figure key={v.id} className="mt-3">
              <div className="relative aspect-video overflow-hidden" style={{ border: `1px solid ${accent}55` }}>
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && <figcaption className="mt-2 text-[10px] tracking-[0.4em] uppercase"><span style={{ color: accent }}>Replay &mdash;</span> <span style={{ color: text, opacity: 0.9 }}>{v.title}</span></figcaption>}
            </figure>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <div className="mt-10 text-center text-[10px] tracking-[0.4em] uppercase" style={{ color: accent }}>{s.footerText}</div>
        )}
        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
      </div>

      <style jsx>{`
        :global(.keynote-live) { animation: keynote-pulse 1.4s ease-in-out infinite; }
        :global(.keynote-fill) { transition: width 500ms ease; }
        :global(.keynote-band:hover .keynote-fill) { width: 100%; }
        @keyframes keynote-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.5; } }
        @media (prefers-reduced-motion: reduce) { :global(.keynote-live) { animation: none; } }
      `}</style>
    </div>
  );
}

export default KeynoteTheme;
