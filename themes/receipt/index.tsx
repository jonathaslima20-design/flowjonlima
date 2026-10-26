'use client';

import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, ThemeFooter, linkAttrs, fontControls, footerControl, alpha } from '@/themes/_kit';

export const receiptMeta: BioThemeMeta = {
  key: 'receipt',
  name: 'Cupom Fiscal',
  description: 'Uma bobina de papel térmico: itens alinhados com pontilhado, total, código de barras e “volte sempre”.',
  available: true,
  defaults: { bg_color: '#D9D4CC', button_color: '#111111', text_color: '#1A1A1A' },
  palettes: {
    bg: ['#D9D4CC', '#2B2B2B', '#C9D6DF', '#E8D9C5', '#111111'],
    accent: ['#111111', '#C1121F', '#1D4ED8'],
    text: ['#1A1A1A', '#2A2A2A'],
  },
  controls: [
    { key: 'paper', label: 'Cor do papel', type: 'color', palette: ['#FBFAF6', '#FFFFFF', '#FFF9E8', '#F2F7F7'], default: '#FBFAF6', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'store', label: 'Nome da loja', type: 'text', default: '', placeholder: 'Padrão: seu nome', maxLength: 24, group: 'Textos', category: 'textos' },
    { key: 'itemLabel', label: 'Texto ao lado de cada item', type: 'text', default: 'ABRIR', maxLength: 10, group: 'Textos', category: 'textos' },
    { key: 'thanks', label: 'Mensagem final', type: 'text', default: 'OBRIGADO PELA VISITA', maxLength: 30, group: 'Textos', category: 'textos' },
    footerControl(),
    ...fontControls('jetbrains', 'jetbrains'),
  ],
};

export function ReceiptTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, receiptMeta, 'var(--font-jetbrains), monospace');
  const paper = s.paper || '#FBFAF6';
  const zig = (top: boolean) => ({
    height: 12,
    background: `linear-gradient(${top ? '135deg' : '45deg'}, ${paper} 6px, transparent 0) 0 0 / 12px 12px repeat-x, linear-gradient(${top ? '225deg' : '-45deg'}, ${paper} 6px, transparent 0) 0 0 / 12px 12px repeat-x`,
    transform: top ? 'rotate(180deg)' : undefined,
  });
  const dash = `1px dashed ${alpha(text, 0.5)}`;
  const now = new Date();

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-sm mx-auto px-5 pt-12 pb-16">
        <div style={zig(true)} />
        <div className="px-5 py-6" style={{ background: paper, boxShadow: `0 20px 40px -24px ${alpha('#000', 0.5)}` }}>
          <header className="text-center pb-4" style={{ borderBottom: dash }}>
            <div className="flex justify-center mb-3"><Avatar profile={profile} size={64} style={{ filter: 'grayscale(1) contrast(1.2)' }} /></div>
            <h1 className="text-[18px] font-bold uppercase tracking-wider" style={{ fontFamily: titleFont }}>{s.store || profile.display_name}</h1>
            {profile.bio && <p className="mt-1 text-[11px] uppercase leading-relaxed whitespace-pre-line opacity-80">{profile.bio}</p>}
            <p className="mt-2 text-[10px] opacity-60">{now.toLocaleDateString('pt-BR')} · CUPOM Nº {String(profile.username || 'bio').length * 1371}</p>
          </header>

          <div className="flex flex-col gap-5 pt-4">
            {orderedSections(sectionOrder, {
              socials: (
                <SocialRow key="socials" socials={socials} t={t} className="flex justify-center gap-4 flex-wrap"
                  render={({ Icon, label, attrs }) => (
                    <a {...attrs} aria-label={label} className="rc-hl p-1"><Icon className="w-5 h-5" /></a>
                  )}
                />
              ),
              links: links.length > 0 ? (
                <div key="links" className="text-[13px]">
                  <div className="flex justify-between text-[10px] opacity-60 pb-1"><span>QTD ITEM</span><span>AÇÃO</span></div>
                  {links.map((l: any, i: number) => (
                    <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="rc-hl flex items-baseline gap-2 py-2">
                      <span className="opacity-60">{i + 1}x</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-1">
                          <span className="font-bold uppercase truncate">{l.title}</span>
                          <span className="flex-1 border-b border-dotted translate-y-[-3px]" style={{ borderColor: alpha(text, 0.5) }} />
                          <span className="font-bold" style={{ color: accent }}>{s.itemLabel || 'ABRIR'}</span>
                        </span>
                        {l.subtitle && <span className="block text-[10px] uppercase opacity-60 truncate">{l.subtitle}</span>}
                      </span>
                    </a>
                  ))}
                  <div className="flex justify-between font-bold pt-3 mt-2 text-[15px]" style={{ borderTop: dash }}>
                    <span>TOTAL</span><span>{links.length} LINK{links.length === 1 ? '' : 'S'}</span>
                  </div>
                </div>
              ) : null,
              banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ filter: 'grayscale(0.3)' }} />,
              videos: <VideoList key="videos" videos={videos} preview={preview} captionClassName="pt-2 text-[11px] uppercase font-bold" />,
            })}
          </div>

          <div className="mt-6 pt-4 text-center" style={{ borderTop: dash }}>
            <div aria-hidden className="h-10 mx-auto w-48" style={{ background: `repeating-linear-gradient(90deg, ${text} 0 2px, transparent 2px 4px, ${text} 4px 5px, transparent 5px 8px, ${text} 8px 11px, transparent 11px 12px)` }} />
            <p className="mt-3 text-[11px] font-bold tracking-widest">*** {s.thanks || 'OBRIGADO PELA VISITA'} ***</p>
          </div>
        </div>
        <div style={zig(false)} />
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.rc-hl) { transition: background-color 120ms; }
        :global(.rc-hl:hover) { background: rgba(0,0,0,0.06); }
      `}</style>
    </div>
  );
}

export default ReceiptTheme;
