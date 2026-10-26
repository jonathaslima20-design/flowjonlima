'use client';

import type { CSSProperties } from 'react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha, onColor } from '@/themes/_kit';

export const idcardMeta: BioThemeMeta = {
  key: 'idcard',
  name: 'Carteirinha',
  description: 'O perfil vira uma carteirinha de motorista do Havaí: foto, título em bloco, arco-íris, campos, código de barras e assinatura.',
  available: true,
  defaults: { bg_color: '#D9DEE6', button_color: '#2A55C9', text_color: '#16181D' },
  palettes: {
    bg: ['#D9DEE6', '#EDE6DA', '#1B1F2A', '#CFE3DA', '#F2D7D9'],
    accent: ['#2A55C9', '#C8312B', '#1F8A4C', '#7A3FC8', '#16181D'],
    text: ['#16181D', '#2B2B2B', '#F2F4F8'],
  },
  controls: [
    { key: 'headline', label: 'Título do cartão', type: 'text', default: 'HAWAII', maxLength: 10, group: 'Cabeçalho', category: 'textos' },
    { key: 'subline', label: 'Tipo do documento', type: 'text', default: 'DRIVER LICENSE', maxLength: 24, group: 'Cabeçalho', category: 'textos' },
    { key: 'number', label: 'Número (vazio = gerado pelo @)', type: 'text', default: '', placeholder: '01-47-87441', maxLength: 14, group: 'Cabeçalho', category: 'textos' },
    { key: 'dob', label: 'DOB', type: 'text', default: '06/03/1981', maxLength: 10, group: 'Campos do cartão', category: 'textos' },
    { key: 'exp', label: 'EXP', type: 'text', default: '06/03/2008', maxLength: 10, group: 'Campos do cartão', category: 'textos' },
    { key: 'ht', label: 'HT', type: 'text', default: '5-10', maxLength: 5, group: 'Campos do cartão', category: 'textos' },
    { key: 'wt', label: 'WT', type: 'text', default: '150', maxLength: 5, group: 'Campos do cartão', category: 'textos' },
    { key: 'hair', label: 'HAIR', type: 'text', default: 'BRO', maxLength: 4, group: 'Campos do cartão', category: 'textos' },
    { key: 'eyes', label: 'EYES', type: 'text', default: 'BRO', maxLength: 4, group: 'Campos do cartão', category: 'textos' },
    { key: 'sex', label: 'SEX', type: 'text', default: 'M', maxLength: 2, group: 'Campos do cartão', category: 'textos' },
    { key: 'cty', label: 'CTY', type: 'text', default: '0', maxLength: 3, group: 'Campos do cartão', category: 'textos' },
    { key: 'issue', label: 'ISSUE DATE', type: 'text', default: '06/18/1998', maxLength: 10, group: 'Campos do cartão', category: 'textos' },
    { key: 'class', label: 'CLASS', type: 'text', default: '3', maxLength: 3, group: 'Campos do cartão', category: 'textos' },
    { key: 'card', label: 'Cor do cartão', type: 'color', palette: ['#F3F2EC', '#FFFFFF', '#EEF3F8', '#FBF1E1', '#22262F'], default: '#F3F2EC', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'photoBg', label: 'Fundo da foto', type: 'color', palette: ['#2F3FA0', '#4A6FD8', '#8C99A8', '#B23A3A', '#2E7D5B'], default: '#2F3FA0', allowCustom: true, group: 'Cores', category: 'cores' },
    { key: 'rainbow', label: 'Arco', type: 'select', options: [
      { value: 'rainbow', label: 'Arco-íris' },
      { value: 'accent', label: 'Tons do destaque' },
      { value: 'none', label: 'Sem arco' },
    ], default: 'rainbow', group: 'Aparência', category: 'cores' },
    { key: 'holo', label: 'Brilho holográfico', type: 'toggle', default: true, group: 'Aparência', category: 'efeitos' },
    { key: 'signature', label: 'Assinatura', type: 'toggle', default: true, group: 'Aparência', category: 'layout' },
    { key: 'tilt', label: 'Cartão inclinado', type: 'toggle', default: true, group: 'Aparência', category: 'layout' },
    motionControl(),
    footerControl('Ex: Documento válido em todo o universo'),
    ...fontControls('archivo', 'inter'),
  ],
};

const RAINBOW = ['#E5322D', '#F28C28', '#F5D327', '#3DB54A', '#2F80ED', '#7B3FB8'];
const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1, 1];

// Número do documento derivado do @, sempre igual para a mesma página
function docNumber(seed: string) {
  let h = 2166136261;
  for (const ch of seed || 'bio') h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const d = String(h).padStart(9, '0').slice(-9);
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
}

// Texto em Arial negrito condensado com largura exata: funciona igual em qualquer aparelho, sem depender de fonte condensada instalada
function Squeeze({ text, perChar, maxW, h, color }: { text: string; perChar: number; maxW: number; h: number; color: string }) {
  if (!text) return null;
  const w = Math.min(maxW, text.length * perChar);
  return (
    <svg aria-label={text} viewBox={`0 0 ${w * 10} ${h * 10}`} className="shrink-0 overflow-visible" style={{ width: `${w}cqw`, height: `${h}cqw` }}>
      <text x="0" y={h * 10 * 0.9} textLength={w * 10} lengthAdjust="spacingAndGlyphs" style={{ fill: color, fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 700, fontSize: h * 10 * 1.22 }}>{text}</text>
    </svg>
  );
}

function shades(hex: string) {
  return [0.95, 0.8, 0.65, 0.5, 0.36, 0.24].map(a => alpha(hex, a));
}

export function IdcardTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, idcardMeta);
  const card = s.card || '#F3F2EC';
  const ink = onColor(card);
  const photoBg = s.photoBg || '#2F3FA0';
  const headline = (s.headline ?? 'HAWAII').toUpperCase();
  const stripes = s.rainbow === 'accent' ? shades(accent) : RAINBOW;
  const anim = s.motion !== 'off';
  const name = profile.display_name || profile.username || '';
  const initials = name.split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  // Largura do título acompanha a quantidade de letras (HAWAII ocupa ~45% do cartão, como no original)
  const headW = Math.min(42, Math.max(headline.length, 2) * 6.6);
  const deep = `color-mix(in srgb, ${accent} 45%, #000)`;
  const mid = `color-mix(in srgb, ${accent} 62%, #000)`;
  const arial = 'Arial, Helvetica, "Liberation Sans", sans-serif';

  const label: CSSProperties = { fontFamily: arial, fontSize: '2.75cqw', letterSpacing: '0.02em', color: alpha(ink, 0.82) };
  const value: CSSProperties = { fontFamily: arial, fontSize: '2.75cqw', color: alpha(ink, 0.85) };
  const stats = [
    { k: 'HT', v: s.ht }, { k: 'WT', v: s.wt }, { k: 'HAIR', v: s.hair },
    { k: 'EYES', v: s.eyes }, { k: 'SEX', v: s.sex }, { k: 'CTY', v: s.cty },
  ];

  return (
    <div className="min-h-[max(100%,100vh)] text-left" style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}>
      <div className="max-w-md mx-auto px-4 pt-12 pb-16">
        {/* Cartão: tudo em cqw para manter as proporções em qualquer largura */}
        <div className={`ic-card-wrap ${s.tilt !== false ? 'ic-tilt' : ''}`} style={{ perspective: 900 }}>
          <div
            className="ic-card relative w-full overflow-hidden select-none"
            style={{
              containerType: 'inline-size', aspectRatio: '1.586', borderRadius: '4.2cqw', background: card, color: ink,
              boxShadow: `0 1px 0 ${alpha('#FFFFFF', 0.8)} inset, 0 24px 40px -22px ${alpha('#000000', 0.55)}, 0 2px 6px ${alpha('#000000', 0.12)}`,
            }}
          >
            {stripes.length > 0 && s.rainbow !== 'none' && (
              <svg aria-hidden viewBox="0 0 100 63" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <defs><clipPath id="ic-clip"><rect x="34.5" y="0" width="66" height="63" /></clipPath></defs>
                <g clipPath="url(#ic-clip)" fill="none" opacity={0.88}>
                  {stripes.map((c, i) => <circle key={i} cx="36" cy="128" r={111 - i * 2.35} stroke={c} strokeWidth="2.4" />)}
                </g>
              </svg>
            )}

            {/* Foto 3x4 */}
            <div className="absolute overflow-hidden flex items-center justify-center" style={{ left: '1.6%', top: '2.6%', width: '33%', height: '64%', background: photoBg, borderTopLeftRadius: '3cqw' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span style={{ fontFamily: titleFont, fontSize: '12cqw', color: onColor(photoBg), opacity: 0.85 }}>{initials}</span>}
              <span aria-hidden className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 0.3cqw ${alpha('#000000', 0.08)}` }} />
            </div>

            {/* Código de barras e identificação */}
            <div aria-hidden className="absolute flex items-stretch" style={{ left: '3%', top: '68.5%', width: '30.5%', height: '10.5%', gap: '0.35cqw' }}>
              {BARS.map((w, j) => <span key={j} style={{ flex: `${w} 0 0`, background: ink, opacity: j % 7 === 3 ? 0 : 0.9 }} />)}
            </div>
            <div className="absolute" style={{ left: '4.6%', top: '78.5%', width: '41%', lineHeight: 1.22 }}>
              <div className="truncate" style={{ fontFamily: arial, fontSize: '3.6cqw', letterSpacing: '0.06em', color: ink }}>{name.toUpperCase()}</div>
              {profile.username && <div className="truncate" style={{ fontFamily: arial, fontSize: '3.3cqw', letterSpacing: '0.03em', color: alpha(ink, 0.85) }}>@{profile.username.toUpperCase()}</div>}
              {profile.bio && <div className="truncate" style={{ fontFamily: arial, fontSize: '3.3cqw', letterSpacing: '0.03em', color: alpha(ink, 0.85) }}>{profile.bio.split('\n')[0].toUpperCase()}</div>}
            </div>

            {/* Título em bloco com relevo (SVG com largura exata), tipo do documento em Arial fina */}
            <div className="absolute flex items-start" style={{ left: '36%', top: '2.4%', right: '2%', gap: '1.6cqw' }}>
              {headline && (
                <svg aria-label={headline} viewBox={`0 0 ${headW * 10} 112`} className="shrink-0 overflow-visible" style={{ width: `${headW}cqw`, height: '11.2cqw' }}>
                  {[
                    { d: 7, fill: deep }, { d: 5.5, fill: deep }, { d: 4, fill: mid }, { d: 2.5, fill: mid },
                    { d: -1.6, fill: alpha('#FFFFFF', 0.9) }, { d: 0, fill: accent },
                  ].map((l, i) => (
                    <text
                      key={i} x={l.d} y={104 + l.d} textLength={headW * 10} lengthAdjust="spacingAndGlyphs"
                      style={{ fill: l.fill, fontFamily: 'var(--font-archivo-black), "Arial Black", Impact, sans-serif', fontSize: 142 }}
                    >{headline}</text>
                  ))}
                </svg>
              )}
              <span className="uppercase" style={{ fontFamily: arial, fontSize: '3.9cqw', lineHeight: 1.05, color: `color-mix(in srgb, ${accent} 80%, #fff)`, marginTop: '0.3cqw' }}>
                {(s.subline ?? 'DRIVER LICENSE').split(' ').map((w: string, i: number) => <span key={i} className="block whitespace-nowrap">{w}</span>)}
              </span>
            </div>

            <div className="absolute flex items-end" style={{ left: '37%', top: '20.5%', gap: '2.4cqw' }}>
              <span style={{ fontFamily: arial, fontSize: '3.3cqw', lineHeight: 1, letterSpacing: '0.04em', color: alpha(ink, 0.85), paddingBottom: '0.3cqw' }}>NUMBER</span>
              <Squeeze text={(s.number && s.number.trim()) || docNumber(profile.username || name)} perChar={3} maxW={34} h={5.4} color={ink} />
            </div>

            <div className="absolute flex items-end" style={{ left: '37%', top: '33%', right: '2%', gap: '0.9cqw' }}>
              <span style={{ ...label, fontSize: '3.1cqw', lineHeight: 1, paddingBottom: '0.3cqw' }}>DOB</span>
              <Squeeze text={s.dob} perChar={2.3} maxW={23} h={5.6} color={ink} />
              <span style={{ ...label, fontSize: '3.1cqw', lineHeight: 1, paddingBottom: '0.3cqw', marginLeft: 'auto' }}>EXP</span>
              <Squeeze text={s.exp} perChar={2.3} maxW={23} h={5.6} color={ink} />
            </div>

            <div className="absolute grid text-center" style={{ left: '37%', right: '2.5%', top: '46%', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, rowGap: '0.4cqw' }}>
              {stats.map(x => <span key={x.k} style={label}>{x.k}</span>)}
              {stats.map(x => <span key={x.k} style={value}>{x.v}</span>)}
            </div>

            <div className="absolute grid" style={{ left: '37%', right: '2.5%', top: '58.5%', gridTemplateColumns: '1.35fr 0.75fr 0.75fr 1fr', rowGap: '0.4cqw' }}>
              <span style={label}>ISSUE DATE</span><span style={label}>CLASS</span><span style={label}>RESTR</span><span style={label}>ENDORSE</span>
              <span style={value}>{s.issue}</span><span style={{ ...value, paddingLeft: '2cqw' }}>{s.class}</span><span /><span />
            </div>

            {s.signature !== false && name && (
              <span
                aria-hidden
                className="absolute whitespace-nowrap"
                style={{ left: '42%', top: '69%', fontFamily: 'var(--font-caveat), cursive', fontSize: '8cqw', color: alpha(ink, 0.88), transform: 'rotate(-5deg)', transformOrigin: 'left center' }}
              >{name.split(' ')[0]}</span>
            )}

            {/* Plástico: reflexo e película holográfica */}
            <span aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(115deg, ${alpha('#FFFFFF', 0.55)} 0%, transparent 28%, transparent 70%, ${alpha('#FFFFFF', 0.18)} 100%)`, mixBlendMode: 'soft-light' }} />
            {s.holo !== false && (
              <span aria-hidden className={`absolute inset-0 pointer-events-none ${anim ? 'ic-holo' : ''}`} style={{
                backgroundImage: 'linear-gradient(110deg, transparent 30%, rgba(255,0,170,0.16) 40%, rgba(0,220,255,0.16) 48%, rgba(255,240,0,0.14) 56%, transparent 66%)',
                backgroundSize: '250% 100%', backgroundPosition: '100% 0', mixBlendMode: 'screen',
              }} />
            )}
            <span aria-hidden className="absolute inset-0 pointer-events-none" style={{ borderRadius: 'inherit', boxShadow: `inset 0 0 0 0.25cqw ${alpha(ink, 0.08)}` }} />
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          {orderedSections(sectionOrder, {
            socials: (
              <SocialRow key="socials" socials={socials} t={t} className="flex gap-2.5 flex-wrap justify-center"
                render={({ Icon, label: lb, attrs, index }) => (
                  <a {...attrs} aria-label={lb} className="ic-stamp w-12 h-12 rounded-full flex items-center justify-center" style={{
                    background: card, color: ink, border: `2px dashed ${stripes[index % stripes.length] || accent}`, boxShadow: `0 6px 14px -10px ${alpha('#000000', 0.6)}`,
                  }}>
                    <Icon className="w-5 h-5" />
                  </a>
                )}
              />
            ),
            links: links.length > 0 ? (
              <div key="links" className="flex flex-col gap-3">
                {links.map((l: any, i: number) => {
                  const stripe = stripes[i % stripes.length] || accent;
                  return (
                    <a key={l.id} {...linkAttrs(l.url, t, 'link', l.id)} className="ic-link relative flex items-center gap-3 rounded-xl pl-5 pr-3 py-3 overflow-hidden" style={{
                      background: card, color: ink, boxShadow: `0 1px 0 ${alpha('#FFFFFF', 0.7)} inset, 0 10px 22px -16px ${alpha('#000000', 0.6)}`,
                    }}>
                      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-2" style={{ background: stripe }} />
                      {l.show_icon
                        ? <KitLinkIcon link={l} size={38} radius={8} style={{ background: photoBg, color: onColor(photoBg) }} />
                        : <span className="w-[38px] h-[38px] rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: photoBg, color: onColor(photoBg) }}>{String(i + 1).padStart(2, '0')}</span>}
                      <span className="flex-1 min-w-0">
                        <span className="block text-[9px] tracking-[0.18em] uppercase" style={{ color: alpha(ink, 0.6) }}>Campo {String(i + 1).padStart(2, '0')}</span>
                        <span className="block font-bold text-[15px] leading-tight truncate" style={{ fontFamily: titleFont, color: ink }}>{l.title}</span>
                        {l.subtitle && <span className="block text-[12px] truncate" style={{ color: alpha(ink, 0.65) }}>{l.subtitle}</span>}
                      </span>
                      <span aria-hidden className="flex items-stretch h-7 gap-[1.5px] shrink-0 opacity-80">
                        {BARS.slice(i % 9, (i % 9) + 14).map((w, j) => <span key={j} style={{ width: w, background: ink }} />)}
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : null,
            banners: <BannerList key="banners" banners={banners} t={t} frameStyle={{ borderRadius: 14, boxShadow: `0 10px 22px -16px ${alpha('#000000', 0.6)}` }} />,
            videos: <VideoList key="videos" videos={videos} preview={preview} frameStyle={{ borderRadius: 14, background: card, color: ink }} captionStyle={{ fontFamily: titleFont }} />,
          })}
        </div>
        <ThemeFooter profile={profile} bg={bg} text={s.footerText} />
      </div>
      <style jsx>{`
        :global(.ic-card) { transition: transform 500ms cubic-bezier(.2,.8,.2,1); transform-style: preserve-3d; }
        :global(.ic-tilt .ic-card) { transform: rotate(-2deg); }
        :global(.ic-card-wrap:hover .ic-card) { transform: rotateX(6deg) rotateY(-8deg) rotate(0deg); }
        :global(.ic-holo) { animation: ic-holo ${s.motion === 'subtle' ? 9 : 5}s ease-in-out infinite; }
        @keyframes ic-holo { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0% 0; } }
        :global(.ic-link), :global(.ic-stamp) { transition: transform 200ms cubic-bezier(.2,.8,.2,1); }
        :global(.ic-link:hover) { transform: translateY(-2px); }
        :global(.ic-link:active), :global(.ic-stamp:active) { transform: scale(0.97); }
        :global(.ic-stamp:hover) { transform: rotate(-8deg) scale(1.06); }
        @media (prefers-reduced-motion: reduce) {
          :global(.ic-card), :global(.ic-link), :global(.ic-stamp) { transition: none; }
          :global(.ic-holo) { animation: none; }
        }
      `}</style>
    </div>
  );
}

export default IdcardTheme;
