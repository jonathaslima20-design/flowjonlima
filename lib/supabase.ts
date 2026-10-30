import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

declare global {
  // eslint-disable-next-line no-var
  var __bioflowzy_supabase: SupabaseClient<Database> | undefined;
}

// Link de redefinição de senha: lido antes de o cliente processar (e limpar) o #access_token da URL
export const openedFromRecoveryLink =
  typeof window !== 'undefined' && /type=recovery/.test(window.location.hash);

export const supabase: SupabaseClient<Database> =
  globalThis.__bioflowzy_supabase ??
  createClient<Database>(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: { params: { eventsPerSecond: 2 } },
  });

if (typeof window !== 'undefined') {
  globalThis.__bioflowzy_supabase = supabase;
}
