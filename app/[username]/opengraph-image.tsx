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
    .select('display_name, avatar_url, username')
    .eq('username', params.username)
    .maybeSingle();

  const name = profile?.display_name || profile?.username || params.username;
  const avatar = profile?.avatar_url || null;

  if (avatar) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={avatar}
            width={1200}
            height={630}
            style={{
              width: '1200px',
              height: '630px',
              objectFit: 'contain',
            }}
          />
        </div>
      ),
      { ...size }
    );
  }

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
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              width: '220px',
              height: '220px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '120px',
              color: '#0033FF',
              fontWeight: 900,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 900,
              color: '#fff',
              textAlign: 'center',
              lineHeight: 1.1,
              maxWidth: '1000px',
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: 'flex',
              background: '#FFED00',
              padding: '10px 24px',
              fontSize: '22px',
              fontWeight: 900,
              color: '#0033FF',
              letterSpacing: '-0.5px',
            }}
          >
            BioFlowzy
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
