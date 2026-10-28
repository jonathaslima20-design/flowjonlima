import { supabase } from './supabase';

let lastRun = 0;

// Pede para regenerar a landing depois de edições no admin (no máximo a cada 5 s, salvo `force`)
export async function refreshLanding(force = false): Promise<void> {
  if (!force && Date.now() - lastRun < 5000) return;
  lastRun = Date.now();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  await fetch('/api/revalidate-landing', {
    method: 'POST',
    keepalive: true,
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).catch(() => {});
}
