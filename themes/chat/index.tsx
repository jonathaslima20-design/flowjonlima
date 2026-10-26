'use client';

import { ChevronLeft, Phone, Video as VideoIcon, CheckCheck } from 'lucide-react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, Avatar, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha, onColor } from '@/themes/_kit';

const STYLES: Record<string, { bg: string; bubble: string; mine: string; header: string; text: string; pattern?: string }> = {
  imessage: { bg: '#FFFFFF', bubble: '#E9E9EB', mine: '#0A84FF', header: 'rgba(249,249,249,0.94)', text: '#111111' },
  whats: { bg: '#EFE7DE', bubble: '#FFFFFF', mine: '#D9FDD3', header: '#F0F2F5', text: '#111B21', pattern: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)' },
  dark: { bg: '#0B0B0C', bubble: '#1F1F22', mine: '#7C5CFF', header: 'rgba(22,22,24,0.94)', text: '#F5F5F7' },
};

export const chatMeta: BioThemeMeta = {
  key: 'chat',
  name: 'Chat',
  description: 'Sua página como uma conversa: cabeçalho de app de mensagens, bio em balão, links como mensagens e “digitando…”.',
  available: true,
  defaults: { bg_color: '#FFFFFF', button_color: '#0A84FF', text_color: '#111111' },
  palettes: { bg: ['#FFFFFF', '#EFE7DE', '#0B0B0C'], accent: ['#0A84FF', '#25D366', '#7C5CFF', '#FF375F'], text: ['#111111', '#111B21', '#F5F5F7'] },
  controls: [
    { key: 'app', label: 'Estilo do app', type: 'select', options: [
      { value: 'imessage', label: 'Mensagens (claro)' }, { value: 'whats', label: 'Conversa verde' }, { value: 'dark', label: 'Escuro' }, { value: 'custom', label: 'Minhas cores' },
    ], default: 'imessage', group: 'Aparência', category: 'geral' },
    { key: 'greeting', label: 'Primeira mensagem', type: 'text', default: 'Oi! Que bom te ver por aqui 👋', maxLength: 80, group: 'Textos', category: 'textos' },
    { key: 'status', label: 'Status', type: 'text', default: 'online', maxLength: 24, group: 'Textos', category: 'textos' },
    { key: 'typing', label: 'Mostrar “digitando…”', type: 'toggle', default: true, group: 'Efeitos', category: 'efeitos' },
    motionControl(),
    footerControl(),
    ...fontControls('inter', 'inter'),
  ],
};

export function ChatTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, chatMeta);
  // "Minhas cores" usa fundo e texto do painel
  const st = s.app === 'custom'
    ? { bg, bubble: alpha(text, 0.08), mine: accent, header: alpha(bg, 0.92), text }
    : (STYLES[s.app] || STYLES.imessage);
  const mineBg = s.app === 'whats' ? st.mine : accent;
  const mineFg = onColor(mineBg);
  const anim = s.motion !== 'off';
  const bubbleIn = { background: st.bubble, color: st.text, borderRadius: '20px 20px 20px 6px' };

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: st.bg, backgroundImage: st.pattern, backgroundSize: '14px 14px', color: st.text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto pb-16">
        <header className={`sticky top-0 z-10 flex items-center gap-3 px-3 pb-2.5 backdrop-blur ${preview ? "pt-14" : "pt-3"}`} style={{ background: st.header, borderBottom: `1px solid ${alpha(st.text, 0.08)}` }}>
          <ChevronLeft className="w-6 h-6" style={{ color: accent }} />
          <Avatar profile={profile} size={40} />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-[16px] leading-tight truncate" style={{ fontFamily: titleFont }}>{profile.display_name}</h1>
            <p className="text-[12px]" style={{ color: s.status === 'online' ? '#25D366' : alpha(st.text, 0.55) }}>{s.status}</p>
          </div>
          <VideoIcon className="w-5 h-5" style={{ color: accent }} /><Phone className="w-5 h-5" style={{ color: accent }} />
        </header>

        <div className="px-3 pt-5 flex flex-col gap-2">
          <p className="self-center text-[11px] px-2 py-0.5 rounded-md mb-2" style={{ background: alpha(st.text, 0.06), color: alpha(st.text, 0.6) }}>Hoje</p>
          {s.greeting && <div className={`max-w-[80%] px-3.5 py-2 text-[15px] ${anim ? 'ch-in' : ''}`} style={bubbleIn}>{s.greeting}</div>}
          {profile.bio && <div className={`max-w-[80%] px-3.5 py-2 text-[15px] whitespace-pre-line ${anim ? 'ch-in' : ''}`} style={{ ...bubbleIn, animationDelay: '0.15s' }}>{profile.bio}</div>}

          <div className="flex flex-col gap-2 mt-2">
            {orderedSections(sectionOrder, {
              socials: (
                <SocialRow key="socials" socials={socials} t={t} className="flex gap-2 flex-wrap justify-end my-1"
                  render={({ Icon, label, attrs }) => (
                    <a {...attrs} className="ch-tap inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[13px] font-medium" style={{ border: `1px solid ${accent}`, color: accent, background: alpha(accent, 0.06) }}>
                      <Icon className="w-3.5 h-3.5" />{label}
                    </a>
                  )}
                />
              ),
              links: links.length > 0 ? (
                <div key="links" className="flex flex-col gap-2 items-end">
                  {links.map((l: any, i: number) => (
                    <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className={`ch-tap max-w-[85%] w-full overflow-hidden ${anim ? 'ch-in' : ''}`} style={{ background: mineBg, color: mineFg, borderRadius: '20px 20px 6px 20px', animationDelay: `${0.3 + i * 0.1}s` }}>
                      <div className="flex items-center gap-3 p-2.5" style={{ background: alpha(mineFg, 0.1) }}>
                        <KitLinkIcon link={l} size={40} radius={10} style={{ background: alpha(mineFg, 0.15) }} />
                        <div className="min-w-0">
                          <div className="font-semibold text-[15px] truncate" style={{ fontFamily: titleFont }}>{l.title}</div>
                          <div className="text-[12px] truncate opacity-75">{l.subtitle || (l.url || '').replace(/^https?:\/\//, '')}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1 px-3 py-1 text-[11px] opacity-75">
                        {10 + i}:{String(20 + i * 3).padStart(2, '0')}<CheckCheck className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : null,
              banners: <BannerList key="banners" banners={banners} t={t} className="flex flex-col gap-2" frameStyle={{ borderRadius: 18 }} />,
              videos: <VideoList key="videos" videos={videos} preview={preview} className="flex flex-col gap-2" frameStyle={{ ...bubbleIn, borderRadius: 18 }} captionClassName="px-3 py-2 text-[14px] font-medium" />,
            })}
          </div>

          {s.typing !== false && (
            <div className="mt-2 w-16 h-9 flex items-center justify-center gap-1" style={bubbleIn} aria-label="digitando">
              {[0, 1, 2].map(i => <span key={i} className={`w-2 h-2 rounded-full ${anim ? 'ch-dot' : ''}`} style={{ background: alpha(st.text, 0.45), animationDelay: `${i * 0.18}s` }} />)}
            </div>
          )}
        </div>
        <div className="px-3"><ThemeFooter profile={profile} bg={st.bg} text={s.footerText} /></div>
      </div>
      <style jsx>{`
        :global(.ch-in) { animation: chIn 420ms cubic-bezier(.2,.9,.3,1.2) both; }
        @keyframes chIn { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: none; } }
        :global(.ch-dot) { animation: chDot 1.2s ease-in-out infinite; }
        @keyframes chDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }
        :global(.ch-tap:active) { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) { :global(.ch-in), :global(.ch-dot) { animation: none; } }
      `}</style>
    </div>
  );
}

export default ChatTheme;
