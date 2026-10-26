'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl } from '@/themes/_kit';

export const retroosMeta: BioThemeMeta = {
  key: 'retroos',
  name: 'Retro OS',
  description: 'Sua página como um desktop dos anos 90: janelas com barra de título, ícones e barra de tarefas com relógio.',
  available: true,
  defaults: { bg_color: '#008080', button_color: '#000080', text_color: '#000000' },
  palettes: {
    bg: ['#008080', '#3A6EA5', '#5A3F8C', '#C0C0C0', '#2F4F4F', '#D96C8A'],
    accent: ['#000080', '#800080', '#008000', '#A00000', '#000000'],
    text: ['#000000', '#1A1A1A'],
  },
  controls: [
    { key: 'os', label: 'Sistema', type: 'radio', options: [{ value: 'win', label: 'Clássico Windows' }, { value: 'mac', label: 'Clássico Mac' }], default: 'win', group: 'Aparência', category: 'geral' },
    { key: 'windowTitle', label: 'Título da janela de links', type: 'text', default: 'Links.exe', maxLength: 24, group: 'Textos', category: 'textos' },
    { key: 'taskbar', label: 'Barra de tarefas com relógio', type: 'toggle', default: true, group: 'Layout', category: 'layout' },
    footerControl(),
    ...fontControls('ibmplex', 'ibmplex'),
  ],
};

function Clock() {
  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return <span>{now || '12:00'}</span>;
}

export function RetroosTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, accent, titleFont, bodyFont, t } = useThemeKit(props, retroosMeta, 'var(--font-ibmplex), monospace');
  const mac = s.os === 'mac';
  const bevelOut = mac ? { border: '2px solid #000', boxShadow: '2px 2px 0 #000' } : { borderTop: '2px solid #FFF', borderLeft: '2px solid #FFF', borderRight: '2px solid #404040', borderBottom: '2px solid #404040', boxShadow: 'inset -1px -1px 0 #808080, inset 1px 1px 0 #DFDFDF' };
  const bevelIn = mac ? { border: '2px solid #000' } : { borderTop: '2px solid #808080', borderLeft: '2px solid #808080', borderRight: '2px solid #FFF', borderBottom: '2px solid #FFF' };
  const face = mac ? '#FFFFFF' : '#C0C0C0';

  const Window = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="w-full" style={{ background: face, ...bevelOut, padding: mac ? 0 : 2 }}>
      <div className="flex items-center justify-between px-1.5 h-[22px] text-[12px] font-bold"
        style={mac
          ? { background: 'repeating-linear-gradient(0deg, #000 0 1px, #FFF 1px 3px)', borderBottom: '2px solid #000', color: '#000' }
          : { background: `linear-gradient(90deg, ${accent}, #1084D0)`, color: '#FFF' }}>
        {mac ? (
          <>
            <span className="w-3 h-3 bg-white border border-black" />
            <span className="px-2 bg-white">{title}</span>
            <span className="w-3 h-3" />
          </>
        ) : (
          <>
            <span className="truncate">{title}</span>
            <span className="flex gap-0.5">
              {['_', '□', '×'].map(c => <span key={c} className="w-4 h-[14px] flex items-center justify-center text-[10px] text-black" style={{ background: '#C0C0C0', ...bevelOut, borderWidth: 1 }}>{c}</span>)}
            </span>
          </>
        )}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );

  return (
    <div className="min-h-[max(100%,100vh)] text-left relative" style={{ backgroundColor: bg, color: '#000', fontFamily: bodyFont, paddingBottom: s.taskbar !== false ? 40 : 0 }}>
      <div className="max-w-md mx-auto px-4 pt-10 pb-12 flex flex-col gap-4">
        <Window title={`${profile.display_name}.txt`}>
          <div className="flex gap-3 items-start">
            <div style={bevelIn}><Avatar profile={profile} size={Math.min(profile.avatar_size ?? 80, 84)} shape="square" /></div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
              {profile.bio && <p className="mt-1 text-[13px] leading-snug whitespace-pre-line">{profile.bio}</p>}
            </div>
          </div>
        </Window>

        {orderedSections(sectionOrder, {
          socials: socials?.length ? (
            <SocialRow key="socials" socials={socials} t={t} className="grid grid-cols-4 gap-3 px-1"
              render={({ Icon, label, attrs }) => (
                <a {...attrs} aria-label={label} className="ro-icon flex flex-col items-center gap-1 text-white text-[11px]">
                  <span className="w-11 h-11 flex items-center justify-center" style={{ background: face, ...bevelOut, color: '#000' }}><Icon className="w-5 h-5" /></span>
                  <span className="px-1 truncate max-w-full" style={{ textShadow: '1px 1px 0 #000' }}>{label}</span>
                </a>
              )}
            />
          ) : null,
          links: links.length > 0 ? (
            <Window key="links" title={s.windowTitle || 'Links.exe'}>
              <div className="flex flex-col gap-2">
                {links.map((l: any) => (
                  <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="ro-btn flex items-center gap-2 px-2 py-2 text-[14px] font-bold" style={{ background: face, ...bevelOut, borderRadius: mac ? 8 : 0 }}>
                    <KitLinkIcon link={l} size={24} radius={0} style={{ background: mac ? '#FFF' : accent, color: mac ? '#000' : '#FFF' }} />
                    <span className="flex-1 min-w-0 truncate">{l.title}</span>
                    {l.subtitle && <span className="text-[11px] font-normal truncate max-w-[40%]">{l.subtitle}</span>}
                  </a>
                ))}
              </div>
            </Window>
          ) : null,
          banners: banners?.length ? <Window key="banners" title="Imagens"><BannerList banners={banners} t={t} frameStyle={bevelIn} /></Window> : null,
          videos: videos.length ? <Window key="videos" title="Player.exe"><VideoList videos={videos} preview={preview} frameStyle={bevelIn} captionClassName="px-1 pt-2 text-[13px] font-bold" /></Window> : null,
        })}
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} color="#FFF" />
      </div>

      {s.taskbar !== false && (
        <div className="absolute bottom-0 inset-x-0 h-9 flex items-center justify-between px-1.5" style={{ background: face, borderTop: mac ? '2px solid #000' : '2px solid #FFF' }}>
          <span className="flex items-center gap-1 px-2 h-7 text-[12px] font-bold" style={bevelOut}>{mac ? '' : '⊞'} Iniciar</span>
          <span className="px-2 h-7 flex items-center text-[12px]" style={bevelIn}>{preview ? '12:00' : <Clock />}</span>
        </div>
      )}
      <style jsx>{`
        :global(.ro-btn:active) { filter: brightness(0.92); transform: translate(1px, 1px); }
        :global(.ro-icon:hover span:last-child) { background: #000080; }
      `}</style>
    </div>
  );
}

export default RetroosTheme;
