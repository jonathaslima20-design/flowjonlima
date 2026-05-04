'use client';

import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const terminalMeta: BioThemeMeta = {
  key: 'terminal',
  name: 'Terminal Pro',
  description: 'Console hacker moderno com prompt piscante, ASCII banner e syntax highlighting.',
  available: true,
  defaults: {
    bg_color: '#0B0F14',
    button_color: '#22D3EE',
    text_color: '#E6EDF3',
  },
  palettes: {
    bg: ['#0B0F14', '#000000', '#0D1117', '#111827', '#1A1B26', '#0F172A'],
    accent: ['#22D3EE', '#34D399', '#FACC15', '#F472B6', '#A78BFA', '#FB7185'],
    text: ['#E6EDF3', '#F5F5F5', '#A6FFB7', '#D1D5DB'],
  },
  controls: [
    { key: 'prompt', label: 'Simbolo do prompt', type: 'select', options: [
      { value: '$', label: '$' }, { value: '>', label: '>' }, { value: '#', label: '#' }, { value: '~', label: '~' }, { value: '>_', label: '>_' },
    ], default: '$', group: 'Prompt' },
    { key: 'caretColor', label: 'Cor do caret', type: 'color', palette: ['#22D3EE', '#34D399', '#FACC15', '#F472B6', '#A78BFA', '#FB7185'], default: '#34D399', group: 'Prompt' },
    { key: 'ascii', label: 'ASCII banner no topo', type: 'toggle', default: true, group: 'Cabecalho' },
    { key: 'cursorSpeed', label: 'Velocidade do cursor', type: 'select', options: [
      { value: '1.2s', label: 'Rapido' }, { value: '0.9s', label: 'Medio' }, { value: '0.6s', label: 'Piscando' },
    ], default: '0.9s', group: 'Prompt' },
    { key: 'windowTitle', label: 'Título da janela', type: 'text', default: '~/links', maxLength: 40, group: 'Textos' },
    { key: 'asciiBanner', label: 'ASCII banner (personalizado)', type: 'textarea', default: '', placeholder: 'Deixe vazio para usar o padrão', maxLength: 500, rows: 5, group: 'Textos' },
    { key: 'whoamiCmd', label: 'Comando whoami', type: 'text', default: 'whoami', maxLength: 40, group: 'Textos' },
    { key: 'socialsCmd', label: 'Comando socials', type: 'text', default: 'cat socials.json', maxLength: 40, group: 'Textos' },
    { key: 'linksCmd', label: 'Comando links', type: 'text', default: 'ls -la ./links', maxLength: 40, group: 'Textos' },
    { key: 'accentCustom', label: 'Cor do prompt (hex livre)', type: 'colorPicker', default: '#22D3EE', group: 'Cores' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada', type: 'toggle', default: false, group: 'Cores' },
    { key: 'caretCustom', label: 'Cor do caret (hex livre)', type: 'colorPicker', default: '#34D399', group: 'Cores' },
    { key: 'useCaretCustom', label: 'Usar caret personalizado', type: 'toggle', default: false, group: 'Cores' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'jetbrains', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'jetbrains', group: 'Tipografia' },
    { key: 'footerText', label: 'Texto do rodapé (após prompt)', type: 'text', default: '', placeholder: 'Ex: -- EOF --', maxLength: 60, group: 'Textos' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

export function TerminalTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'terminal', terminalMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#22D3EE');
  const bg = profile.bg_color || '#0B0F14';
  const text = profile.text_color || '#E6EDF3';
  const caret = s.useCaretCustom && s.caretCustom ? s.caretCustom : (s.caretColor || '#34D399');
  const t = (a: string, b: string | null) => track?.(a, b);
  const defaultAscii = `  ____  _       _____ _             _
 | __ )(_) ___ |  ___| | _____ ___ | |
 |  _ \\| |/ _ \\| |_  | |/ _ \\ / _ \\| |
 | |_) | | (_) |  _| | | (_) | (_) |_|
 |____/|_|\\___/|_|   |_|\\___/ \\___/(_)`;
  const asciiContent = (s.asciiBanner && s.asciiBanner.trim()) ? s.asciiBanner : defaultAscii;

  return (
    <div className="min-h-screen pt-[72px] pb-24 px-4" style={{ backgroundColor: bg, color: text, fontFamily: getFontStack(s.bodyFont, '"JetBrains Mono", "Fira Code", ui-monospace, monospace') }}>
      <div className="max-w-md mx-auto rounded-lg overflow-hidden" style={{ border: '1px solid #ffffff15', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ background: '#0006', borderColor: '#ffffff10' }}>
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          <div className="flex-1 text-center text-xs opacity-70">{s.windowTitle || '~/links'}</div>
        </div>
        <div className="p-5 text-sm leading-relaxed">
          {s.ascii && (
            <pre className="text-[10px] leading-tight mb-4 opacity-80 whitespace-pre" style={{ color: accent }}>
{asciiContent}
            </pre>
          )}
          <div className="mb-3">
            <span style={{ color: accent }}>{s.prompt} </span>
            <span className="opacity-80">{s.whoamiCmd || 'whoami'}</span>
          </div>
          <div className="flex items-start gap-3 mb-3">
            <div className="rounded overflow-hidden shrink-0" style={{ width: 56, height: 56, border: `1px solid ${accent}66` }}>
              {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              {profile.display_name && <div style={{ color: caret, fontWeight: 700, fontFamily: getFontStack(s.titleFont, 'inherit') }}>{profile.display_name}</div>}
              {profile.bio && <div className="mt-1 opacity-85 text-xs whitespace-pre-line">&quot;{profile.bio}&quot;</div>}
            </div>
          </div>

          {s.showSocials !== false && socials?.length > 0 && (
            <div className="mb-4">
              <div><span style={{ color: accent }}>{s.prompt} </span><span className="opacity-80">{s.socialsCmd || 'cat socials.json'}</span></div>
              <div className="ml-3 mt-1 text-xs opacity-85">
                {'{'}
                {socials.map((soc: any, i: number) => {
                  const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
                  return (
                    <div key={soc.id} className="ml-3">
                      <span style={{ color: '#F472B6' }}>&quot;{meta?.label || soc.platform}&quot;</span>
                      <span className="opacity-60">: </span>
                      <a href={getSocialHref(soc.platform, soc.url)} target="_blank" rel="noreferrer" onClick={() => t('social', soc.id)} style={{ color: caret }} className="hover:underline">
                        &quot;{soc.url}&quot;
                      </a>
                      {i < socials.length - 1 && <span className="opacity-60">,</span>}
                    </div>
                  );
                })}
                {'}'}
              </div>
            </div>
          )}

          <div className="mb-2"><span style={{ color: accent }}>{s.prompt} </span><span className="opacity-80">{s.linksCmd || 'ls -la ./links'}</span></div>
          <div className="flex flex-col gap-2">
            {links.map((l: any, i: number) => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" onClick={() => t('link', l.id)}
                className="group flex items-baseline gap-3 px-2 py-2 rounded hover:bg-white/5 transition-colors">
                <span className="opacity-50 text-xs w-8">{String(i + 1).padStart(3, '0')}</span>
                <span style={{ color: caret }}>&gt;</span>
                <span className="flex-1" style={{ color: text }}>{l.title}</span>
                <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>[open]</span>
              </a>
            ))}
          </div>

          {banners?.map((b: any) => {
            const inner = (
              <div className={`mt-3 rounded overflow-hidden ${BANNER_H[b.size] || BANNER_H.md}`} style={{ border: `1px solid ${accent}44` }}>
                {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
            );
            return b.link_url ? <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a> : <div key={b.id}>{inner}</div>;
          })}

          {videos.map((v: any) => (
            <div key={v.id} className="mt-3">
              <div><span style={{ color: accent }}>{s.prompt} </span><span className="opacity-80">play {v.title || 'video.mp4'}</span></div>
              <div className="mt-1 relative aspect-video overflow-hidden rounded" style={{ border: `1px solid ${accent}44` }}>
                <VideoEmbed video={v} preview={preview} />
              </div>
            </div>
          ))}

          <div className="mt-4"><span style={{ color: accent }}>{s.prompt} </span><span className="term-caret" style={{ background: caret }} /></div>
          {s.footerText && s.footerText.trim() && (
            <div className="mt-3 opacity-60 text-xs">{s.footerText}</div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto"><BioflowzyBadge profile={profile} bgColor={profile.bg_color} /></div>

      <style jsx>{`
        :global(.term-caret) { display: inline-block; width: 9px; height: 16px; vertical-align: middle; animation: term-blink ${s.cursorSpeed} steps(2) infinite; }
        @keyframes term-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { :global(.term-caret) { animation: none; } }
      `}</style>
    </div>
  );
}

export default TerminalTheme;
