import { supabase } from '@/lib/supabase';
import { DEMO_PROFILE, DEMO_LINKS, DEMO_SOCIALS } from '@/components/themes/demoData';
import type { ShowcaseDemoData } from '@/lib/theme-showcase';
import type { DemoPageValue } from '@/components/admin/DemoPageEditor';

// Exemplos por nicho da seção "Para quem é" da landing (tabela landing_niches)
export type LandingNiche = {
  id: string;
  key: string;
  label: string;
  headline: string;
  description: string;
  benefits: string[];
  theme_key: string;
  demo: Partial<DemoPageValue>;
  position: number;
  is_active: boolean;
};

export const EMPTY_DEMO: DemoPageValue = {
  profile: {}, links: [], socials: [], banners: [], videos: [], theme_core: {}, theme_settings: {},
};

export function nicheDemoValue(niche: Pick<LandingNiche, 'demo'>): DemoPageValue {
  return { ...EMPTY_DEMO, ...(niche.demo || {}) };
}

// Mesmo formato do carrossel do hero: campos vazios caem nos dados de demonstração padrão
export function nicheDemoFor(niche: Pick<LandingNiche, 'demo'>): ShowcaseDemoData {
  const d = nicheDemoValue(niche);
  const themeCore = d.theme_core || {};
  return {
    profile: { ...DEMO_PROFILE, ...(d.profile || {}), ...themeCore },
    links: d.links?.length ? d.links : DEMO_LINKS,
    socials: d.socials?.length ? d.socials : DEMO_SOCIALS,
    videos: d.videos || [],
    banners: d.banners || [],
    themeCore,
    themeSettings: d.theme_settings || {},
  };
}

export async function fetchLandingNiches(includeInactive = false): Promise<LandingNiche[]> {
  let q = supabase.from('landing_niches').select('*').order('position');
  if (!includeInactive) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as unknown as LandingNiche[];
}
