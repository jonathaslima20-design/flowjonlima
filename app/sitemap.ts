import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com').replace(/\/$/, '');

// Regenerado a cada hora: páginas do site e as páginas públicas das contas ativas
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/exemplos`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return entries;

  // Só páginas principais: as extras dependem do plano da conta para ficar no ar
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase
    .from('profiles')
    .select('username, updated_at')
    .is('suspended_at', null)
    .is('owner_id', null)
    .order('updated_at', { ascending: false })
    .limit(5000);

  for (const p of data ?? []) {
    entries.push({
      url: `${SITE_URL}/${encodeURIComponent(p.username)}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }
  return entries;
}
