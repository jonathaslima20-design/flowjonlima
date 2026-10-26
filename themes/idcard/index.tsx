'use client';

import type { CSSProperties } from 'react';
import type { BioThemeMeta, BioThemeProps } from '@/themes/types';
import { orderedSections } from '@/themes/types';
import { useThemeKit, SocialRow, BannerList, VideoList, KitLinkIcon, ThemeFooter, linkAttrs, fontControls, footerControl, motionControl, alpha, onColor } from '@/themes/_kit';

export const idcardMeta: BioThemeMeta = {
  key: 'idcard',
  name: 'Carteirinha',
  description: 'O perfil vira uma carteirinha plastificada: foto 3x4, título em bloco, arco-íris, código de barras e assinatura.',
  available: true,
  defaults: { bg_color: '#D9DEE6', button_color: '#2A55C9', text_color: '#16181D' },
  palettes: {
    bg: ['#D9DEE6', '#EDE6DA', '#1B1F2A', '#CFE3DA', '#F2D7D9'],
    accent: ['#2A55C9', '#C8312B', '#1F8A4C', '#7A3FC8', '#16181D'],
    text: ['#16181D', '#2B2B2B', '#F2F4F8'],
  },
  controls: [
    { key: 'headline', label: 'Título da carteirinha', type: 'text', default: 'LINKS', placeholder: 'Ex: BIO, CRIADOR, VIP', maxLength: 10, group: 'Textos', category: 'textos' },
    { key: 'subline', label: 'Tipo do documento', type: 'text', default: 'CARTEIRA DE LINKS', maxLength: 24, group: 'Textos', category: 'textos' },
    { key: 'since', label: 'Membro desde', type: 'text', default: '2026', maxLength: 10, group: 'Textos', category: 'textos' },
    { key: 'valid', label: 'Validade', type: 'text', default: 'SEMPRE', maxLength: 10, group: 'Textos', category: 'textos' },
    { key: 'category', label: 'Categoria', type: 'text', default: 'VIP', maxLength: 4, group: 'Textos', category: 'textos' },
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

function shades(hex: string) {
  return [0.95, 0.8, 0.65, 0.5, 0.36, 0.24].map(a => alpha(hex, a));
}

export function IdcardTheme(props: BioThemeProps) {
  const { profile, links, socials, videos, banners, sectionOrder, preview } = props;
  const { s, bg, text, accent, titleFont, bodyFont, t } = useThemeKit(props, idcardMeta);
  const card = s.card || '#F3F2EC';
  const ink = onColor(card);
  const photoBg = s.photoBg || '#2F3FA0';
  const headline = (s.headline || 'LINKS').toUpperCase();
  const stripes = s.rainbow === 'accent' ? shades(accent) : RAINBOW;
  const anim = s.motion !== 'off';
  const name = profile.display_name || profile.username || '';
  const initials = name.split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  // Tamanho do título acompanha a quantidade de letras, como um nome de estado gravado no cartão
  const headSize = Math.min(12.5, 62 / Math.max(headline.length, 3));

  const label: CSSProperties = { fontSize: '2.3cqw', letterSpacing: '0.04em', color: alpha(ink, 0.72) };
  const value: CSSProperties = { fontSize: '2.8cqw', fontWeight: 600, color: ink };
  const stats = [
    { k: 'LINKS', v: links.length },
    { k: 'REDES', v: socials.length },
    { k: 'VÍDEOS', v: videos.length },
    { k: 'BANNERS', v: banners.length },
    { k: 'PAÍS', v: 'BR' },
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
            <div className="absolute" style={{ left: '3.4%', top: '80.5%', width: '40%', lineHeight: 1.18 }}>
              <div className="truncate" style={{ fontSize: '3.3cqw', letterSpacing: '0.05em', color: ink }}>{name.toUpperCase()}</div>
              {profile.username && <div className="truncate" style={{ fontSize: '2.7cqw', color: alpha(ink, 0.8) }}>@{profile.username.toUpperCase()}</div>}
              {profile.bio && <div className="truncate" style={{ fontSize: '2.7cqw', color: alpha(ink, 0.8) }}>{profile.bio.split('\n')[0].toUpperCase()}</div>}
            </div>

            {/* Título em bloco */}
            <div className="absolute flex items-start" style={{ left: '37%', top: '2.2%', right: '3%', gap: '1.6cqw' }}>
              <span
                className="leading-none"
                style={{
                  fontFamily: titleFont, fontSize: `${headSize}cqw`, color: accent, letterSpacing: '-0.01em',
                  // Relevo em degraus com a própria cor escurecida, como letra gravada em plástico
                  textShadow: `-0.12cqw -0.12cqw 0 ${alpha('#FFFFFF', 0.8)}, 0.2cqw 0.2cqw 0 color-mix(in srgb, ${accent} 70%, #000), 0.4cqw 0.4cqw 0 color-mix(in srgb, ${accent} 55%, #000), 0.6cqw 0.6cqw 0.3cqw ${alpha('#000000', 0.2)}`,
                }}
              >{headline}</span>
              <span className="leading-[1.05] uppercase" style={{ fontSize: '3.6cqw', color: accent, marginTop: '0.8cqw', maxWidth: '24cqw' }}>{s.subline || 'CARTEIRA DE LINKS'}</span>
            </div>

            <div className="absolute flex items-baseline" style={{ left: '37%', top: '22%', gap: '2.5cqw' }}>
              <span style={{ ...label, fontSize: '2.9cqw' }}>NÚMERO</span>
              <span style={{ fontSize: '5.4cqw', fontWeight: 700, color: ink, letterSpacing: '0.02em' }}>{docNumber(profile.username || name)}</span>
            </div>

            <div className="absolute flex items-baseline" style={{ left: '37%', top: '35.5%', right: '2.5%', gap: '1.4cqw' }}>
              <span style={{ ...label, fontSize: '2.7cqw' }}>DESDE</span>
              <span style={{ fontSize: '5.2cqw', fontWeight: 800, color: ink, letterSpacing: '-0.02em' }}>{s.since || '2026'}</span>
              <span style={{ ...label, fontSize: '2.7cqw', marginLeft: 'auto' }}>VAL</span>
              <span style={{ fontSize: '5.2cqw', fontWeight: 800, color: ink, letterSpacing: '-0.02em' }}>{s.valid || 'SEMPRE'}</span>
            </div>

            <div className="absolute grid text-center" style={{ left: '37%', right: '2.5%', top: '47.5%', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, rowGap: '0.6cqw' }}>
              {stats.map(x => <span key={x.k} style={label}>{x.k}</span>)}
              {stats.map(x => <span key={x.k} style={{ ...value, color: alpha(ink, 0.9) }}>{x.v}</span>)}
            </div>

            <div className="absolute grid" style={{ left: '37%', right: '2.5%', top: '62.5%', gridTemplateColumns: '1.3fr 1fr 1fr', rowGap: '0.6cqw' }}>
              <span style={label}>EMISSÃO</span><span style={label}>CATEGORIA</span><span style={label}>RESTRIÇÕES</span>
              <span style={value}>{s.since || '2026'}</span><span style={value}>{(s.category || 'VIP').toUpperCase()}</span><span style={value}>NENHUMA</span>
            </div>

            {s.signature !== false && name && (
              <span
                aria-hidden
                className="absolute whitespace-nowrap"
                style={{ left: '42%', top: '73%', fontFamily: 'var(--font-caveat), cursive', fontSize: '7.4cqw', color: alpha(ink, 0.88), transform: 'rotate(-5deg)', transformOrigin: 'left center' }}
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
