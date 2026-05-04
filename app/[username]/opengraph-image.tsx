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
    .select('display_name, bio, avatar_url, username')
    .eq('username', params.username)
    .maybeSingle();

  const name = profile?.display_name || profile?.username || params.username;
  const bio = profile?.bio || 'Confira meus links na BioFlowzy.';
  const avatar = profile?.avatar_url || null;

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
        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            padding: '60px',
          }}
        >
          {/* Avatar */}
          {avatar ? (
            <img
              src={avatar}
              width={160}
              height={160}
              style={{
                border: '5px solid #fff',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '160px',
                height: '160px',
                background: '#fff',
                border: '5px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
                color: '#0033FF',
                fontWeight: 900,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#fff',
              textAlign: 'center',
              lineHeight: 1.1,
              maxWidth: '900px',
            }}
          >
            {name}
          </div>

          {/* Bio */}
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            {bio.length > 100 ? bio.slice(0, 100) + '…' : bio}
          </div>

          {/* Brand badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#fff',
              padding: '8px 20px',
              borderRadius: '0px',
              marginTop: '8px',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#0033FF', letterSpacing: '-0.5px' }}>
              BioFlowzy
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
