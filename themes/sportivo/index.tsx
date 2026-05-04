'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const sportivoMeta: BioThemeMeta = {
  key: 'sportivo',
  name: 'Sport Energy',
  description: 'Layout atlético dinâmico: listras diagonais, cards de placar, tipografia Archivo Black e cor de equipe.',
  available: true,
  defaults: {
    bg_color: '#0D0D0D',
    button_color: '#22C55E',
    text_color: '#FFFFFF',
  },
  palettes: {
    bg: ['#0D0D0D', '#000000', '#111827', '#1F2937', '#0A1628', '#1A0A0A'],
    accent: ['#22C55E', '#EF4444', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6'],
    text: ['#FFFFFF', '#F9FAFB', '#E5E7EB', '#D1FAE5'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'archivo', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'inter', group: 'Tipografia' },
    { key: 'teamNumber', label: 'Número do atleta', type: 'text', default: '', placeholder: 'Ex: 10', maxLength: 3, group: 'Identidade' },
    { key: 'teamName', label: 'Nome do time / clube', type: 'text', default: '', placeholder: 'Ex: FLAMENGO', maxLength: 30, group: 'Identidade' },
    { key: 'sport', label: 'Modalidade', type: 'text', default: '', placeholder: 'Ex: Football · Futebol', maxLength: 40, group: 'Identidade' },
    { key: 'showStripes', label: 'Listras diagonais', type: 'toggle', default: true, group: 'Visual' },
    { key: 'showNumber', label: 'Mostrar número no fundo', type: 'toggle', default: true, group: 'Visual' },
    { key: 'cardStyle', label: 'Estilo dos cards', type: 'select', options: [
      { value: 'score', label: 'Placar' },
      { value: 'skew', label: 'Inclinado' },
      { value: 'solid', label: 'Sólido' },
    ], default: 'score', group: 'Layout' },
    { key: 'tagline', label: 'Tagline', type: 'text', default: '', placeholder: 'Ex: Born to compete', maxLength: 80, group: 'Textos' },
    { key: 'footerText', label: 'Rodapé', type: 'text', default: '', placeholder: 'Ex: 🏆 Champions mindset', maxLength: 60, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function SportivoTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'sportivo', sportivoMeta.controls);
  const bg = profile.bg_color || '#0D0D0D';
  const text = profile.text_color || '#FFFFFF';
  const accent = profile.button_color || '#22C55E';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-archivo-black), Impact, sans-serif');
  const bodyFamily = getFontStack(s.bodyFont, 'var(--font-inter), system-ui, sans-serif');
  const t = (a: string, b: string | null) => track?.(a, b);

  const linkCard = (l: any, i: number) => {
    if (s.cardStyle === 'skew') {
      return (
        <a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => t('link', l.id)}
          className="group flex items-center gap-4 px-5 py-4 transition-all hover:opacity-90"
          style={{
            backgroundColor: `${accent}18`,
            border: `1px solid ${accent}44`,
            borderRadius: '6px',
            transform: 'skewX(-2deg)',
          }}
        >
          <span className="text-[13px] font-black tabular-nums shrink-0" style={{ color: `${accent}88`, fontFamily: titleFamily }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="flex-1 text-[15px] font-bold tracking-tight" style={{ fontFamily: titleFamily, color: text, transform: 'skewX(2deg)', display: 'block' }}>
            {l.title}
          </span>
        </a>
      );
    }
    if (s.cardStyle === 'solid') {
      return (
        <a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          onClick={() => t('link', l.id)}
          className="group flex items-center gap-4 px-5 py-4 transition-all hover:opacity-90"
          style={{ backgroundColor: i === 0 ? accent : `${accent}22`, borderRadius: '6px', color: i === 0 ? bg : text }}
        >
          <span className="flex-1 text-[15px] font-bold" style={{ fontFamily: titleFamily }}>
            {l.title}
          </span>
        </a>
      );
    }
    return (
      <a
        key={l.id}
        href={l.url}
        target="_blank"
        rel="noreferrer"
        onClick={() => t('link', l.id)}
        className="group flex items-center overflow-hidden transition-all hover:opacity-90"
        style={{ backgroundColor: `${text}08`, border: `1px solid ${text}14`, borderRadius: '6px', height: '56px' }}
      >
        <div
          className="h-full flex items-center justify-center px-4 shrink-0 text-xs font-black"
          style={{ backgroundColor: accent, color: bg, fontFamily: titleFamily, minWidth: '48px' }}
        >
          {String(i + 1).padStart(2, '0')}
        </div>
        <span className="flex-1 px-4 text-[15px] font-bold" style={{ fontFamily: titleFamily, color: text }}>
          {l.title}
        </span>
        <span className="px-4 text-xs font-black opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: accent, fontFamily: titleFamily }}>
          →
        </span>
      </a>
    );
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      {s.showStripes && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              ${accent}04 40px,
              ${accent}04 42px
            )`,
          }}
        />
      )}

      {s.showNumber && s.teamNumber && s.teamNumber.trim() && (
        <div
          className="absolute pointer-events-none select-none"
          style={{
            right: '-2%',
            top: '5%',
            fontFamily: titleFamily,
            fontSize: '180px',
            fontWeight: 900,
            color: text,
            opacity: 0.03,
            lineHeight: 1,
            letterSpacing: '-8px',
          }}
        >
          {s.teamNumber}
        </div>
      )}

      <div className="relative mx-auto px-5 max-w-md pt-10 pb-16" style={{ zIndex: 10 }}>
        {(s.teamName || s.sport) && (
          <div className="flex items-center justify-between mb-6">
            {s.teamName && (
              <span
                className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5"
                style={{ backgroundColor: accent, color: bg, fontFamily: titleFamily }}
              >
                {s.teamName}
              </span>
            )}
            {s.sport && (
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: `${text}55` }}>
                {s.sport}
              </span>
            )}
          </div>
        )}

        <header className="flex items-start gap-5 mb-8">
          {profile.avatar_url && (
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: profile.avatar_size ?? 80,
                height: profile.avatar_size ?? 80,
                border: `3px solid ${accent}`,
                borderRadius: '8px',
              }}
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 pt-1">
            <h1
              className="leading-none uppercase tracking-tighter"
              style={{ fontSize: '24px', fontWeight: 900, fontFamily: titleFamily, color: text }}
            >
              {profile.display_name}
            </h1>
            {s.tagline && (
              <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{s.tagline}</p>
            )}
            {profile.bio && (
              <p className="mt-2 text-[13px] leading-snug whitespace-pre-line" style={{ color: `${text}AA` }}>
                {profile.bio}
              </p>
            )}
          </div>
        </header>

        {socials?.length > 0 && (
          <div className="mb-6 flex items-center gap-4">
            {socials.map((soc: any) => {
              const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
              const Icon = meta?.icon;
              return Icon ? (
                <a
                  key={soc.id}
                  href={getSocialHref(soc.platform, soc.url)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => t('social', soc.id)}
                  className="transition-opacity hover:opacity-50"
                  style={{ color: `${text}66` }}
                  aria-label={meta?.label}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </a>
              ) : null;
            })}
          </div>
        )}

        <div
          className="mb-4 pb-2 text-[10px] font-black uppercase tracking-widest"
          style={{ borderBottom: `2px solid ${accent}`, color: `${text}55` }}
        >
          LINKS
        </div>

        <div className="flex flex-col gap-2">
          {links.map((l: any, i: number) => linkCard(l, i))}

          {banners?.map((b: any) => {
            const inner = (
              <div
                key={b.id}
                className={`overflow-hidden mt-3 ${BANNER_H[b.size] || BANNER_H.md}`}
                style={{ border: `2px solid ${accent}33`, borderRadius: '6px' }}
              >
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? (
              <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
            ) : inner;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="overflow-hidden mt-3" style={{ border: `2px solid ${accent}33`, borderRadius: '6px' }}>
              <div className="relative aspect-video">
                <VideoEmbed video={v} preview={preview} />
              </div>
              {v.title && (
                <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ fontFamily: titleFamily, color: accent }}>
                  {v.title}
                </div>
              )}
            </div>
          ))}
        </div>

        {s.footerText && s.footerText.trim() && (
          <p className="mt-10 text-sm font-bold uppercase tracking-wider" style={{ color: `${accent}66`, fontFamily: titleFamily }}>
            {s.footerText}
          </p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default SportivoTheme;
