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
          overflow: 'hidden',
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            width={1200}
            height={630}
            style={{
              width: '1200px',
              height: '630px',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '1200px',
              height: '630px',
              background: '#0033FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '360px',
              color: '#fff',
              fontWeight: 900,
              fontFamily: 'sans-serif',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
