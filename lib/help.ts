import { supabase } from '@/lib/supabase';

export type HelpCategory = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  published: boolean;
};

export type HelpArticle = {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  sort_order: number;
  published: boolean;
};

export async function fetchHelpCategories(): Promise<HelpCategory[]> {
  const { data } = await supabase
    .from('help_categories')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true });
  return (data as HelpCategory[]) || [];
}

export async function fetchHelpCategoryBySlug(slug: string): Promise<HelpCategory | null> {
  const { data } = await supabase
    .from('help_categories')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  return (data as HelpCategory) || null;
}

export async function fetchHelpArticles(categoryId?: string): Promise<HelpArticle[]> {
  let q = supabase
    .from('help_articles')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true });
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data } = await q;
  return (data as HelpArticle[]) || [];
}

export async function fetchHelpArticle(categoryId: string, slug: string): Promise<HelpArticle | null> {
  const { data } = await supabase
    .from('help_articles')
    .select('*')
    .eq('category_id', categoryId)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  return (data as HelpArticle) || null;
}

export async function searchHelpArticles(query: string): Promise<HelpArticle[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q.replace(/[%_]/g, '')}%`;
  const { data } = await supabase
    .from('help_articles')
    .select('*')
    .eq('published', true)
    .or(`title.ilike.${like},summary.ilike.${like},body.ilike.${like}`)
    .order('sort_order', { ascending: true })
    .limit(20);
  return (data as HelpArticle[]) || [];
}
