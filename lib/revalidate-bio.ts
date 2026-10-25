import { supabase } from './supabase';

const lastRun = new Map<string, number>();

// Pede para regenerar a página pública editada no painel (no máximo a cada 5 s por página)
export async function refreshPublicBio(profileId: string) {
  if (Date.now() - (lastRun.get(profileId) ?? 0) < 5000) return;
  lastRun.set(profileId, Date.now());
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  fetch('/api/revalidate-bio', {
    method: 'POST',
    keepalive: true,
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  }).catch(() => {});
}
