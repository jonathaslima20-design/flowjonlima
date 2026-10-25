import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Atualiza na hora a página pública (em cache por 30 s) do usuário logado
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

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', u.user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: 'not found' }, { status: 404 });

  revalidatePath(`/${profile.username}`);
  return NextResponse.json({ ok: true });
}
