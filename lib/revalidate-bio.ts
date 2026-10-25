import { supabase } from './supabase';

let lastRun = 0;

// Pede para regenerar a página pública do usuário logado (no máximo a cada 5 s)
export async function refreshPublicBio() {
  if (Date.now() - lastRun < 5000) return;
  lastRun = Date.now();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  fetch('/api/revalidate-bio', {
    method: 'POST',
    keepalive: true,
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).catch(() => {});
}
