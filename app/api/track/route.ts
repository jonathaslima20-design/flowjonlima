import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile_id, entity_type, entity_id } = body ?? {};
    if (!profile_id) return NextResponse.json({ ok: false }, { status: 400 });

    await supabase.from('clicks').insert({
      profile_id,
      entity_type: entity_type || 'link',
      entity_id: entity_id || null,
    });

    if (entity_type === 'link' && entity_id) {
      await supabase.rpc('increment_link_clicks', { link_id: entity_id }).then(async (r) => {
        if (r.error) {
          const { data: l } = await supabase.from('links').select('clicks').eq('id', entity_id).maybeSingle();
          await supabase.from('links').update({ clicks: (l?.clicks ?? 0) + 1 }).eq('id', entity_id);
        }
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
