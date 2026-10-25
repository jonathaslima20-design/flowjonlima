import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Atualiza na hora a página pública (em cache por 30 s) editada pelo usuário logado
export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: req.headers.get('authorization') || '' } },
      auth: { persistSession: false },
    }
  );
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Página principal ou uma das páginas extras da conta
  const body = await req.json().catch(() => ({}));
  const profileId = typeof body?.profileId === 'string' ? body.profileId : u.user.id;
  const { data: profile } = await supabase.from('profiles').select('username, owner_id').eq('id', profileId).maybeSingle();
  if (!profile || (profileId !== u.user.id && profile.owner_id !== u.user.id)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  revalidatePath(`/${profile.username}`);
  return NextResponse.json({ ok: true });
}
