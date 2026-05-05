'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';

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

export default LinkIcon;
