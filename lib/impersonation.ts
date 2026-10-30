'use client';

import { supabase } from './supabase';
import { adminUserAction } from './admin-user';

// "Entrar como o usuário" (Admin → Usuários). A edge function admin-user gera um token de login do usuário;
// a sessão do admin fica guardada neste navegador e volta com "Voltar ao admin" (ou sozinha após 1 hora).

const KEY = 'bf_impersonation';
export const IMPERSONATION_TTL_MS = 60 * 60 * 1000;

export type ImpersonationState = {
  adminAccessToken: string;
  adminRefreshToken: string;
  adminId: string;
  targetId: string;
  targetUsername: string;
  startedAt: number;
  expiresAt: number;
};

export function readImpersonation(): ImpersonationState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ImpersonationState;
    return s?.adminRefreshToken && s?.targetId ? s : null;
  } catch {
    return null;
  }
}

function clearImpersonation() {
  try { localStorage.removeItem(KEY); } catch { /* sem armazenamento */ }
}

export async function startImpersonation(profileId: string, reason: string): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 'Sessão expirada. Entre de novo.';

  const { data, error } = await adminUserAction<{ token_hash: string; username: string }>('impersonate', profileId, { reason });
  if (error || !data?.token_hash) return error ?? 'Não foi possível entrar na conta.';

  const state: ImpersonationState = {
    adminAccessToken: session.access_token,
    adminRefreshToken: session.refresh_token,
    adminId: session.user.id,
    targetId: profileId,
    targetUsername: data.username ?? '',
    startedAt: Date.now(),
    expiresAt: Date.now() + IMPERSONATION_TTL_MS,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    return 'O navegador bloqueou o armazenamento local; não é possível guardar a sessão do admin.';
  }

  // Sai só desta sessão do admin no navegador (sem revogar o refresh token guardado) e entra como o usuário
  const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
  if (otpError) {
    await supabase.auth.setSession({ access_token: state.adminAccessToken, refresh_token: state.adminRefreshToken });
    clearImpersonation();
    return otpError.message;
  }
  window.location.href = '/dashboard';
  return null;
}

export async function stopImpersonation(reason: 'manual' | 'expired' = 'manual') {
  const state = readImpersonation();
  // Encerra apenas a sessão criada para o acesso (as sessões do próprio usuário continuam)
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  clearImpersonation();
  if (!state) {
    window.location.href = '/login';
    return;
  }
  const { error } = await supabase.auth.setSession({
    access_token: state.adminAccessToken,
    refresh_token: state.adminRefreshToken,
  });
  if (error) {
    window.location.href = '/login?next=' + encodeURIComponent(`/admin/users/${state.targetId}`);
    return;
  }
  await supabase.from('admin_audit_log').insert({
    admin_id: state.adminId,
    action: 'impersonate_end',
    target_type: 'profile',
    target_id: state.targetId,
    details: { reason, minutes: Math.round((Date.now() - state.startedAt) / 60000) },
  });
  window.location.href = `/admin/users/${state.targetId}`;
}
