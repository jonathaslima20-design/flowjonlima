'use client';

import { useEffect, useState } from 'react';
import { SOCIALS_BY_KEY, getSocialHref } from '@/lib/socials';
import type { BioThemeProps, BioThemeMeta } from '@/themes/types';
import { getThemeSettings, getFontStack } from '@/themes/types';
import { BioflowzyBadge } from '@/components/bio/BioflowzyBadge';
import { VideoEmbed } from '@/components/themes/VideoEmbed';

export const cyberMeta: BioThemeMeta = {
  key: 'cyber',
  name: 'Cyber Terminal',
  description: 'Console hacker futurista: prompts, scanlines CRT, typewriter e glitch no hover.',
  available: true,
  defaults: {
    bg_color: '#030712',
    button_color: '#22D3EE',
    text_color: '#A7F3D0',
  },
  palettes: {
    bg: ['#030712', '#000000', '#0B0F1A', '#0A1F1C', '#1A0F1F', '#0F0A1F'],
    accent: ['#22D3EE', '#4ADE80', '#FBBF24', '#F472B6', '#A78BFA', '#F87171'],
    text: ['#A7F3D0', '#7DD3FC', '#FDE68A', '#FBCFE8', '#FFFFFF'],
  },
  controls: [
    { key: 'scanlines', label: 'Scanlines CRT', type: 'toggle', default: true, group: 'Efeitos' },
    { key: 'flicker', label: 'Flicker', type: 'slider', min: 0, max: 100, step: 5, suffix: '%', default: 30, group: 'Efeitos' },
    { key: 'typewriter', label: 'Efeito typewriter', type: 'toggle', default: true, group: 'Efeitos' },
    { key: 'glitch', label: 'Glitch no hover', type: 'slider', min: 0, max: 100, step: 5, suffix: '%', default: 50, group: 'Efeitos' },
    { key: 'promptColor', label: 'Cor do prompt', type: 'select', options: [
      { value: 'phosphor', label: 'Phosphor Green' },
      { value: 'amber', label: 'Amber' },
      { value: 'cyan', label: 'Cyan' },
      { value: 'accent', label: 'Usar cor do botao' },
    ], default: 'phosphor', group: 'Prompt' },
    { key: 'statusBar', label: 'Barra de status', type: 'toggle', default: true, group: 'Layout' },
    { key: 'avatarMode', label: 'Avatar', type: 'select', options: [
      { value: 'photo', label: 'Foto' },
      { value: 'pixel', label: 'Pixelado' },
      { value: 'ascii', label: 'ASCII Frame' },
    ], default: 'pixel', group: 'Avatar' },
    { key: 'cursor', label: 'Cursor piscante', type: 'toggle', default: true, group: 'Prompt' },
    { key: 'bootCmd', label: 'Comando de boot', type: 'text', default: './boot --init', maxLength: 60, group: 'Textos' },
    { key: 'userLabel', label: 'Rótulo do perfil', type: 'text', default: 'USER_PROFILE', maxLength: 32, group: 'Textos' },
    { key: 'linksCmd', label: 'Comando de listagem', type: 'text', default: 'ls ./links --sort=priority', maxLength: 60, group: 'Textos' },
    { key: 'accentCustom', label: 'Cor de destaque (hex livre)', type: 'colorPicker', default: '#22D3EE', group: 'Cores' },
    { key: 'useAccentCustom', label: 'Usar cor personalizada', type: 'toggle', default: false, group: 'Cores' },
    { key: 'promptCustom', label: 'Cor do prompt (hex livre)', type: 'colorPicker', default: '#4ADE80', group: 'Cores' },
    { key: 'usePromptCustom', label: 'Usar prompt personalizado', type: 'toggle', default: false, group: 'Cores' },
    { key: 'titleFont', label: 'Fonte do título', type: 'fontFamily', default: 'jetbrains', group: 'Tipografia' },
    { key: 'bodyFont', label: 'Fonte do corpo', type: 'fontFamily', default: 'jetbrains', group: 'Tipografia' },
    { key: 'footerText', label: 'Texto do rodapé', type: 'text', default: '', placeholder: 'Ex: -- EOF --', maxLength: 60, group: 'Textos' },
    { key: 'showSocials', label: 'Mostrar redes sociais', type: 'toggle', default: true, group: 'Elementos' },
    { key: 'statusText', label: 'Texto da status bar', type: 'text', default: 'CONN: SECURE / TLS 1.3', maxLength: 40, group: 'Textos' },
  ],
};

const BANNER_H: Record<string, string> = { sm: 'aspect-[6/1]', md: 'aspect-[3/1]', lg: 'aspect-[5/2]' };

const PROMPT_COLORS: Record<string, string> = {
  phosphor: '#4ADE80',
  amber: '#FBBF24',
  cyan: '#22D3EE',
};

export function CyberTheme({ profile, links, socials, videos, banners, track, preview }: BioThemeProps) {
  const s = getThemeSettings(profile, 'cyber', cyberMeta.controls);
  const accent = s.useAccentCustom && s.accentCustom ? s.accentCustom : (profile.button_color || '#22D3EE');
  const promptColor = s.usePromptCustom && s.promptCustom
    ? s.promptCustom
    : (s.promptColor === 'accent' ? accent : (PROMPT_COLORS[s.promptColor] || '#4ADE80'));
  const t = (a: string, b: string | null) => track?.(a, b);
  const [clock, setClock] = useState('00:00:00');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const cursor = s.cursor ? <span className="cyber-cursor" style={{ backgroundColor: promptColor }} /> : null;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: profile.bg_color || '#030712',
        color: profile.text_color,
        fontFamily: getFontStack(s.bodyFont, 'var(--font-jetbrains), "JetBrains Mono", ui-monospace, monospace'),
      }}
    >
      {s.scanlines && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'multiply',
          }}
          aria-hidden
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, transparent 40%, ${profile.bg_color || '#030712'} 100%)` }}
        aria-hidden
      />
      {s.flicker > 0 && (
        <div
          className="absolute inset-0 pointer-events-none cyber-flicker"
          style={{ opacity: Math.min(0.12, s.flicker / 300) }}
          aria-hidden
        />
      )}

      <div className="relative max-w-md mx-auto px-5 pt-[72px] pb-24 text-sm">
        <div className="flex items-center gap-2 mb-6 text-xs" style={{ color: promptColor }}>
          <span style={{ opacity: 0.7 }}>$</span>
          <span className={s.typewriter ? 'cyber-typewriter' : ''}>{s.bootCmd || './boot --init'}</span>
          {cursor}
        </div>

        <div className="flex items-start gap-4">
          <div
            className="shrink-0 overflow-hidden"
            style={{
              width: profile.avatar_size ?? 96,
              height: profile.avatar_size ?? 96,
              border: `2px solid ${promptColor}`,
              boxShadow: `0 0 16px ${promptColor}66`,
              imageRendering: s.avatarMode === 'pixel' ? 'pixelated' : 'auto',
              filter: s.avatarMode === 'ascii' ? 'grayscale(1) contrast(1.6)' : undefined,
            }}
          >
            {profile.avatar_url && (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" style={{
                imageRendering: s.avatarMode === 'pixel' ? 'pixelated' : 'auto',
              }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] opacity-70" style={{ color: promptColor }}>{s.userLabel || 'USER_PROFILE'}</div>
            <h1
              className="text-2xl mt-1 truncate cyber-glitch"
              style={{ color: profile.text_color, fontWeight: 700, textShadow: `0 0 8px ${accent}55`, fontFamily: getFontStack(s.titleFont, 'inherit') }}
              data-text={profile.display_name || ''}
            >
              {profile.display_name}
            </h1>
            {profile.bio && <div className="mt-2 text-xs leading-relaxed opacity-90 whitespace-pre-line" style={{ color: profile.text_color }}>&gt; {profile.bio}</div>}
          </div>
        </div>

        {s.showSocials !== false && socials?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 text-[10px]">
            {socials.map((soc: any) => {
              const meta = SOCIALS_BY_KEY[(soc.platform || '').toLowerCase()];
              return (
                <a
                  key={soc.id}
                  href={getSocialHref(soc.platform, soc.url)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => t('social', soc.id)}
                  className="px-2 py-1 tracking-wider transition-colors"
                  style={{ border: `1px solid ${promptColor}66`, color: promptColor, background: `${promptColor}10` }}
                >
                  [{(meta?.label || soc.platform).toUpperCase()}]
                </a>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 text-xs" style={{ color: promptColor }}>
          <span style={{ opacity: 0.6 }}>$</span>
          <span>{s.linksCmd || 'ls ./links --sort=priority'}</span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {links.map((l: any, i: number) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => t('link', l.id)}
              className="group px-3 py-3 flex items-center gap-3 transition-all"
              style={{
                border: `1px solid ${accent}44`,
                background: `${accent}08`,
                color: profile.text_color,
              }}
            >
              <span style={{ color: promptColor, fontSize: 11, opacity: 0.8 }}>
                [{String(i + 1).padStart(2, '0')}]
              </span>
              <span
                className={`flex-1 truncate ${s.glitch > 0 ? 'cyber-hover-glitch' : ''}`}
                style={{ color: profile.text_color, fontWeight: 500 }}
                data-text={l.title}
              >
                {l.title}
              </span>
              <span className="text-[10px] tracking-wider opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accent }}>
                EXEC &gt;
              </span>
            </a>
          ))}
        </div>

        {banners?.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            {banners.map((b: any) => {
              const inner = (
                <div
                  className={`overflow-hidden ${BANNER_H[b.size] || BANNER_H.md}`}
                  style={{
                    border: `1px solid ${promptColor}66`,
                  }}
                >
                  {b.image_url && <img src={b.image_url} alt="" className="w-full h-full object-cover" style={{ filter: 'hue-rotate(-10deg) contrast(1.1)' }} />}
                </div>
              );
              return b.link_url ? (
                <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" onClick={() => t('banner', b.id)}>{inner}</a>
              ) : (
                <div key={b.id}>{inner}</div>
              );
            })}
          </div>
        )}

        {videos?.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            {videos.map((v: any) => (
              <div key={v.id} style={{ border: `1px solid ${promptColor}66` }}>
                <div className="relative aspect-video bg-black">
                  <VideoEmbed video={v} preview={preview} />
                </div>
                {v.title && <div className="px-3 py-2 text-xs" style={{ color: profile.text_color }}>&gt; {v.title}</div>}
              </div>
            ))}
          </div>
        )}

        {s.footerText && s.footerText.trim() && (
          <div className="mt-6 text-center text-[10px] tracking-widest" style={{ color: promptColor }}>{s.footerText}</div>
        )}
        <BioflowzyBadge profile={profile} bgColor={profile.bg_color} />
        <div aria-hidden className="h-20" />
      </div>

      {s.statusBar && (
        <div
          className="fixed bottom-0 left-0 right-0 px-4 py-1.5 text-[10px] flex items-center justify-between"
          style={{ backgroundColor: '#000000', borderTop: `1px solid ${promptColor}66`, color: promptColor, fontFamily: 'inherit' }}
        >
          <span>{s.statusText || 'CONN: SECURE / TLS 1.3'}</span>
          <span>{mounted ? clock : '00:00:00'}</span>
          <span>MEM: 42% / CPU: 18%</span>
        </div>
      )}

      <style jsx>{`
        :global(.cyber-cursor) {
          display: inline-block;
          width: 8px;
          height: 14px;
          margin-left: 4px;
          animation: cyber-blink 1s steps(2) infinite;
          vertical-align: middle;
        }
        @keyframes cyber-blink { 50% { opacity: 0; } }
        :global(.cyber-typewriter) {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          animation: cyber-type 1.8s steps(30) 0.2s both;
          max-width: 300px;
        }
        @keyframes cyber-type { from { max-width: 0; } to { max-width: 300px; } }
        :global(.cyber-flicker) { background: rgba(255,255,255,0.6); animation: cyber-flick 3.5s infinite; }
        @keyframes cyber-flick {
          0%,97%,100% { opacity: 0; }
          97.5% { opacity: 0.15; }
          98% { opacity: 0; }
          98.5% { opacity: 0.12; }
        }
        :global(.cyber-glitch) { position: relative; }
        :global(.cyber-glitch::before),
        :global(.cyber-glitch::after) {
          content: attr(data-text);
          position: absolute; inset: 0;
          pointer-events: none;
          opacity: 0.7;
          mix-blend-mode: screen;
        }
        :global(.cyber-glitch::before) { color: #ff0080; transform: translate(1px,0); }
        :global(.cyber-glitch::after) { color: #00e5ff; transform: translate(-1px,0); }
        :global(.cyber-hover-glitch) { position: relative; }
        :global(.cyber-hover-glitch:hover::before),
        :global(.cyber-hover-glitch:hover::after) {
          content: attr(data-text);
          position: absolute; inset: 0;
          opacity: 0.8;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        :global(.cyber-hover-glitch:hover::before) { color: #ff0080; transform: translate(2px, -1px); }
        :global(.cyber-hover-glitch:hover::after) { color: #00e5ff; transform: translate(-2px, 1px); }
      `}</style>
    </div>
  );
}

export default CyberTheme;
