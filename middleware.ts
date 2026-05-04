import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const config = {
  matcher: ['/((?!_next/|api/|favicon|og-image|.*\\.[a-zA-Z0-9]+$).*)'],
};

const PRIMARY_SUFFIXES = ['bioflowzy.com', 'netlify.app', 'localhost', 'vercel.app'];

type CacheEntry = { username: string | null; expires: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60_000;

function isPrimary(host: string) {
  const h = host.toLowerCase().split(':')[0];
  return PRIMARY_SUFFIXES.some((s) => h === s || h.endsWith(`.${s}`));
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0];
  if (!host || isPrimary(host)) return NextResponse.next();

  const now = Date.now();
  let entry = cache.get(host);
  if (!entry || entry.expires < now) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.next();
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data } = await supabase.rpc('lookup_domain', { p_domain: host });
    const username = Array.isArray(data) && data.length > 0 ? data[0].username : null;
    entry = { username, expires: now + TTL_MS };
    cache.set(host, entry);
  }

  if (!entry.username) return NextResponse.next();

  const url = req.nextUrl.clone();
  if (url.pathname === '/' || url.pathname === '') {
    url.pathname = `/${entry.username}`;
  } else if (!url.pathname.startsWith(`/${entry.username}`)) {
    url.pathname = `/${entry.username}${url.pathname}`;
  }
  return NextResponse.rewrite(url);
}
