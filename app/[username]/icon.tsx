import { ImageResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const size = { width: 128, height: 128 };
export const contentType = 'image/png';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fetchAvatarBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export default async function Icon({ params }: { params: { username: string } }) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, username')
    .eq('username', params.username)
    .maybeSingle();

  const name = profile?.display_name || profile?.username || params.username;
  const avatarBase64 = profile?.avatar_url ? await fetchAvatarBase64(profile.avatar_url) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '128px',
          height: '128px',
          background: '#0033FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {avatarBase64 ? (
          <img
            src={avatarBase64}
            width={128}
            height={128}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: '64px',
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
