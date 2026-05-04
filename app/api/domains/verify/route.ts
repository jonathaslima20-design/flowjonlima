import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTxt, verifyCname } from '@/lib/domain-verify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function clientFromRequest(req: Request) {
  const auth = req.headers.get('authorization') || '';
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: auth } } }
  );
}

export async function POST(req: Request) {
  const supabase = clientFromRequest(req);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: row } = await supabase.from('custom_domains').select('*').eq('profile_id', u.user.id).maybeSingle();
  if (!row) return NextResponse.json({ error: 'Nenhum dominio cadastrado.' }, { status: 404 });

  const txt = await verifyTxt(row.domain, row.verification_token);
  if (!txt.ok) {
    await supabase.from('custom_domains').update({
      status: 'failed', verified: false, error_message: txt.error, last_checked_at: new Date().toISOString(),
    }).eq('profile_id', u.user.id);
    return NextResponse.json({ ok: false, error: txt.error }, { status: 400 });
  }

  const cname = await verifyCname(row.domain);
  if (!cname.ok) {
    await supabase.from('custom_domains').update({
      status: 'failed', verified: false, error_message: cname.error, last_checked_at: new Date().toISOString(),
    }).eq('profile_id', u.user.id);
    return NextResponse.json({ ok: false, error: cname.error }, { status: 400 });
  }

  const { data: updated } = await supabase.from('custom_domains').update({
    status: 'verified',
    verified: true,
    verified_at: new Date().toISOString(),
    last_checked_at: new Date().toISOString(),
    error_message: null,
  }).eq('profile_id', u.user.id).select('*').maybeSingle();

  return NextResponse.json({ ok: true, domain: updated });
}
