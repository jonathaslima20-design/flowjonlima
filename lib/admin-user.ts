'use client';

import { supabase } from './supabase';

// Chamada à edge function admin-user (ações de conta do Admin → Usuários)
export async function adminUserAction<T = Record<string, unknown>>(
  action: string,
  profileId: string,
  extra: Record<string, unknown> = {},
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('admin-user', {
    body: { action, profile_id: profileId, ...extra },
  });
  if (!error) return { data: data as T, error: null };
  let message = 'Não foi possível concluir. Tente novamente.';
  try {
    const parsed = await (error as { context?: Response }).context?.json();
    if (parsed?.error) message = parsed.error;
  } catch {}
  return { data: null, error: message };
}
