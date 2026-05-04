import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeDomain, isValidDomain } from '@/lib/domain-verify';

export const dynamic = 'force-dynamic';

function clientFromRequest(req: Request) {
  const auth = req.headers.get('authorization') || '';
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: auth } } }
  );
}

export async function GET(req: Request) {
  const supabase = clientFromRequest(req);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data } = await supabase.from('custom_domains').select('*').eq('profile_id', u.user.id).maybeSingle();
  return NextResponse.json({ domain: data });
}

export async function POST(req: Request) {
  const supabase = clientFromRequest(req);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const domain = normalizeDomain(body?.domain ?? '');
  if (!isValidDomain(domain)) {
    return NextResponse.json({ error: 'Dominio invalido. Use o formato exemplo.com ou links.exemplo.com.' }, { status: 400 });
  }

  const { data: taken } = await supabase.from('custom_domains').select('profile_id').eq('domain', domain).maybeSingle();
  if (taken && taken.profile_id !== u.user.id) {
    return NextResponse.json({ error: 'Este dominio ja esta em uso por outra conta.' }, { status: 409 });
  }

  const { data: existing } = await supabase.from('custom_domains').select('*').eq('profile_id', u.user.id).maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('custom_domains')
      .update({ domain, status: 'pending', verified: false, verified_at: null, error_message: null })
      .eq('profile_id', u.user.id)
      .select('*')
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ domain: data });
  }

  const { data, error } = await supabase
    .from('custom_domains')
    .insert({ profile_id: u.user.id, domain, status: 'pending', verified: false })
    .select('*')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ domain: data });
}

export async function DELETE(req: Request) {
  const supabase = clientFromRequest(req);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await supabase.from('custom_domains').delete().eq('profile_id', u.user.id);
  return NextResponse.json({ ok: true });
}
