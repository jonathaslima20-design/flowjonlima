'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const monocorpMeta: BioThemeMeta = {
  key: 'monocorp',
  name: 'Mono Corporate',
  description: 'Documento financeiro corporativo: monocromático total, tipografia monospace e estrutura de lista formal.',
  available: true,
  defaults: {
    bg_color: '#FFFFFF',
    button_color: '#0D0D0D',
    text_color: '#0D0D0D',
  },
  palettes: {
    bg: ['#FFFFFF', '#F8F8F8', '#F0F0F0', '#0D0D0D', '#111111', '#1A1A1A'],
    accent: ['#0D0D0D', '#333333', '#666666', '#999999'],
    text: ['#0D0D0D', '#1A1A1A', '#333333', '#FFFFFF'],
  },
  controls: [
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'ibmplex', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'ibmplex', group: 'Tipografia' },
    { key: 'showDocumentHeader', label: 'Cabeçalho de documento', type: 'toggle', default: true, group: 'Layout' },
    { key: 'documentId', label: 'ID do documento', type: 'text', default: 'DOC-001', placeholder: 'Ex: DOC-2025-001', maxLength: 20, group: 'Textos' },
    { key: 'documentDate', label: 'Data do documento', type: 'text', default: '', placeholder: 'Ex: Q1 2025', maxLength: 30, group: 'Textos' },
    { key: 'showDash', label: 'Dash (—) nos links', type: 'toggle', default: true, group: 'Layout' },
    { key: 'showLineNumbers', label: 'Número de linha', type: 'toggle', default: false, group: 'Layout' },
    { key: 'subjectLine', label: 'Linha de assunto', type: 'text', default: '', placeholder: 'Ex: ASSUNTO: Portfólio Profissional', maxLength: 100, group: 'Textos' },
    { key: 'classification', label: 'Classificação do documento', type: 'select', options: [
      { value: '', label: 'Nenhuma' },
      { value: 'PUBLIC', label: 'PUBLIC' },
      { value: 'INTERNAL', label: 'INTERNAL' },
      { value: 'CONFIDENTIAL', label: 'CONFIDENTIAL' },
    ], default: 'PUBLIC', group: 'Textos' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: Page 1 of 1', maxLength: 60, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function MonocorpTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'monocorp', monocorpMeta.controls);
  const bg = profile.bg_color || '#FFFFFF';
  const text = profile.text_color || '#0D0D0D';
  const accent = profile.button_color || '#0D0D0D';
  const titleFamily = getFontStack(s.titleFont, 'var(--font-ibmplex), ui-monospace, monospace');
  const bodyFamily = getFontStack(s.bodyFont, titleFamily);
  const t = (a: string, b: string | null) => track?.(a, b);
  const isDark = bg === '#0D0D0D' || bg === '#111111' || bg === '#1A1A1A';
  const now = new Date();
  const dateStr = s.documentDate || `${now.getFullYear()}`;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFamily }}
    >
      <div className="relative mx-auto px-8 max-w-md pt-12 pb-16">
        {s.showDocumentHeader && (
          <div className="mb-8 pb-4" style={{ borderBottom: `1px solid ${text}` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium" style={{ color: `${text}66` }}>{s.documentId}</p>
                <p className="text-[11px]" style={{ color: `${text}44` }}>{dateStr}</p>
              </div>
              {s.classification && (
                <span
                  className="text-[9px] font-bold tracking-widest px-2 py-0.5"
                  style={{ border: `1px solid ${text}`, color: text }}
                >
                  {s.classification}
                </span>
              )}
            </div>
            {s.subjectLine && s.subjectLine.trim() && (
              <p className="mt-3 text-xs font-medium" style={{ color: text }}>{s.subjectLine}</p>
            )}
          </div>
        )}

        <header className="mb-8">
          <div className="flex items-start gap-5">
            {profile.avatar_url && (
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: profile.avatar_size ?? 72,
                  height: profile.avatar_size ?? 72,
                  borderRadius: '0px',
                  border: `1px solid ${text}`,
                  filter: 'grayscale(100%)',
                }}
              >
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <h1
                className="leading-none tracking-tighter"
                style={{ fontSize: '22px', fontWeight: 700, fontFamily: titleFamily, color: text, textTransform: 'uppercase' }}
              >
                {profile.display_name}
              </h1>
              {profile.bio && (
                <p className="mt-2 text-[12px] leading-relaxed whitespace-pre-line" style={{ color: `${text}BB` }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {socials?.length > 0 && (
            <div className="mt-5 flex items-center gap-4 flex-wrap">
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
                    className="flex items-center gap-1.5 transition-opacity hover:opacity-50"
                    style={{ color: `${text}66` }}
                  >
                    <Icon className="w-[14px] h-[14px]" />
                    <span className="text-[11px]">{meta?.label || soc.platform}</span>
                  </a>
                ) : null;
              })}
            </div>
          )}
        </header>

        <div className="mb-2" style={{ borderTop: `1px solid ${text}33` }} />
        <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: `${text}55` }}>
          LINKS
        </p>

        <div className="flex flex-col">
          {links.map((l: any, i: number) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="group flex items-center gap-3 py-3 transition-opacity hover:opacity-50"
              style={{ borderBottom: `1px solid ${text}14` }}
            >
              {s.showLineNumbers && (
                <span className="text-[11px] w-6 shrink-0 tabular-nums" style={{ color: `${text}44` }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              )}
              {s.showDash && (
                <span className="text-[13px]" style={{ color: `${text}55` }}>—</span>
              )}
              <span className="flex-1 text-[14px] font-medium">{l.title}</span>
              <span className="text-[11px] uppercase tracking-widest opacity-0 group-hover:opacity-40 transition-opacity">
                OPEN
              </span>
            </a>
          ))}
        </div>

        {banners?.map((b: any) => {
          const inner = (
            <div key={b.id} className={`overflow-hidden mt-6 ${BANNER_H[b.size] || BANNER_H.md}`} style={{ border: `1px solid ${text}`, filter: 'grayscale(20%)' }}>
              {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
            </div>
          );
          return b.link_url ? (
            <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
          ) : inner;
        })}

        {videos.map((v: any) => (
          <div key={v.id} className="overflow-hidden mt-6" style={{ border: `1px solid ${text}33` }}>
            <div className="relative aspect-video">
              <VideoEmbed video={v} preview={preview} />
            </div>
            {v.title && (
              <div className="px-3 py-2 text-xs uppercase tracking-wide" style={{ color: `${text}88`, borderTop: `1px solid ${text}14` }}>{v.title}</div>
            )}
          </div>
        ))}

        <div className="mt-8" style={{ borderTop: `1px solid ${text}22` }} />
        {s.footerText && s.footerText.trim() && (
          <p className="mt-3 text-[11px]" style={{ color: `${text}44` }}>{s.footerText}</p>
        )}
        <BioflowzyBadge profile={profile} bgColor={bg} />
      </div>
    </div>
  );
}

export default MonocorpTheme;
