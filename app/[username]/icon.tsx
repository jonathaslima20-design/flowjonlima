import { ImageResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Icon({ params }: { params: { username: string } }) {
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
          width: '64px',
          height: '64px',
          background: '#0033FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            width={64}
            height={64}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: '#fff',
              fontFamily: 'sans-serif',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    ),
    { ...size }
  );
}
