import { supabase } from '@/lib/supabase';
import { fetchAllShowcasePresets, type ShowcasePreset } from '@/lib/theme-showcase';

export type LandingTestimonial = {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  page_url: string | null;
  quote: string;
  position: number;
  is_active: boolean;
};

export type ThemeGalleryData = {
  presets: ShowcasePreset[];
  proOnly: string[];
  disabled: string[];
};

// Temas da galeria da landing: demonstrações do catálogo (Admin → Vitrine) e quais são Pro/ocultos
export async function fetchThemeGallery(): Promise<ThemeGalleryData> {
  const [presets, { data: settings }] = await Promise.all([
    fetchAllShowcasePresets(),
    supabase.from('admin_settings').select('key, value').in('key', ['pro_only_themes', 'disabled_themes']),
  ]);
  const list = (key: string) => {
    const v = settings?.find(r => r.key === key)?.value;
    return Array.isArray(v) ? (v as string[]) : [];
  };
  return { presets, proOnly: list('pro_only_themes'), disabled: list('disabled_themes') };
}

export async function fetchTestimonials(includeInactive = false): Promise<LandingTestimonial[]> {
  let q = supabase.from('landing_testimonials').select('*').order('position');
  if (!includeInactive) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as LandingTestimonial[];
}
