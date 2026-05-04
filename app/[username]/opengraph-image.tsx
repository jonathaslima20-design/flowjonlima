import { ImageResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'BioFlowzy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Image({ params }: { params: { username: string } }) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, username, bio')
    .eq('username', params.username)
    .maybeSingle();

  const name = profile?.display_name || profile?.username || params.username;
  const bio = profile?.bio || '';
  const avatar = profile?.avatar_url || null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0033FF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            display: 'flex',
            background: '#FFED00',
            padding: '8px 18px',
            fontSize: '22px',
            fontWeight: 900,
            color: '#0033FF',
            letterSpacing: '-0.5px',
          }}
        >
          BioFlowzy
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
          }}
        >
          {avatar ? (
            <div
              style={{
                width: '260px',
                height: '260px',
                display: 'flex',
                overflow: 'hidden',
                border: '6px solid #fff',
                background: '#fff',
              }}
            >
              <img
                src={avatar}
                width={260}
                height={260}
                style={{
                  width: '260px',
                  height: '260px',
                  objectFit: 'cover',
                  transform: 'scale(1.5)',
                  transformOrigin: 'center',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '260px',
                height: '260px',
                background: '#FFED00',
                border: '6px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '140px',
                color: '#0033FF',
                fontWeight: 900,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#fff',
              textAlign: 'center',
              lineHeight: 1.1,
              maxWidth: '1000px',
              letterSpacing: '-1.5px',
            }}
          >
            {name}
          </div>

          {bio ? (
            <div
              style={{
                fontSize: '26px',
                color: 'rgba(255,255,255,0.85)',
                textAlign: 'center',
                maxWidth: '850px',
                lineHeight: 1.35,
              }}
            >
              {bio.length > 90 ? bio.slice(0, 90) + '…' : bio}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              fontSize: '22px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            bioflowzy.com/{params.username}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
