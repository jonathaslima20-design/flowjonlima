import { ImageResponse } from 'next/server';

export const runtime = 'edge';
export const alt = 'BioFlowzy — Um link para compartilhar tudo o que importa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0033FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 60px)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
            position: 'relative',
          }}
        >
          {/* Logo box */}
          <div
            style={{
              width: '96px',
              height: '96px',
              background: '#FFED00',
              border: '3px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '52px',
            }}
          >
            ⚡
          </div>

          {/* Brand name */}
          <div
            style={{
              fontSize: '88px',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-3px',
              lineHeight: 1,
            }}
          >
            BioFlowzy
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '32px',
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.3,
            }}
          >
            Um link para compartilhar tudo o que importa.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
