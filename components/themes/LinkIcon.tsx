'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { getLibraryIcon } from '@/lib/link-icon-library';

export type LinkIconProps = {
  link: { icon?: string | null; show_icon?: boolean | null; icon_source?: string | null };
  size?: number;
  radius?: number | string;
  fallback: ReactNode;
  containerStyle?: CSSProperties;
  imgStyle?: CSSProperties;
  className?: string;
};

export function LinkIcon({
  link,
  size = 36,
  radius = 12,
  fallback,
  containerStyle,
  imgStyle,
  className,
}: LinkIconProps) {
  const [failed, setFailed] = useState(false);
  const show = !!link?.show_icon && !!link?.icon && !failed && link?.icon_source !== 'none';

  const baseStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: 'hidden',
    flexShrink: 0,
    ...containerStyle,
  };

  // Ícone da biblioteca: desenhado com currentColor, acompanha a cor que o tema dá ao contêiner
  const lib = show ? getLibraryIcon(link.icon) : null;
  if (lib) {
    const Icon = lib.Icon;
    return (
      <div className={className} style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden>
        <span style={{ width: '56%', height: '56%', display: 'flex' }}><Icon className="w-full h-full" /></span>
      </div>
    );
  }

  if (!show) {
    return (
      <div className={className} style={baseStyle} aria-hidden>
        {fallback}
      </div>
    );
  }

  return (
    <div className={className} style={baseStyle} aria-hidden>
      <img
        src={link.icon as string}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          ...imgStyle,
        }}
      />
    </div>
  );
}

// Para temas que desenham o ícone como <img> direto: imagem enviada/detectada ou ícone da biblioteca
export function LinkGlyph({ link, className, style }: { link: { icon?: string | null }; className?: string; style?: CSSProperties }) {
  const lib = getLibraryIcon(link.icon);
  if (lib) {
    const Icon = lib.Icon;
    return (
      <span className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden>
        <span style={{ width: '62%', height: '62%', display: 'flex' }}><Icon className="w-full h-full" /></span>
      </span>
    );
  }
  return (
    <img
      src={link.icon as string}
      alt=""
      className={className}
      style={style}
      referrerPolicy="no-referrer"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

export default LinkIcon;
