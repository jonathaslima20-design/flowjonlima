'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useOptionalCurrentPage } from '@/lib/page-context';
import { getPlanFor, PlanDefinition, PLANS, ResourceKey, canAdd as canAddFn, limitFor as limitForFn, FeatureFlag, can as canFn } from '@/lib/plans';

export type PlanProfile = {
  id: string;
  plan: string | null;
  plan_expires_at: string | null;
  plan_started_at: string | null;
  referral_code: string | null;
  is_pro: boolean | null;
};

export type ResourceCounts = {
  links: number;
  banners: number;
  videos: number;
  socials: number;
};

export function usePlan() {
  const { userId, ready } = useAuth();
  // `profile`/`accountPlan` são da conta logada (indicação, renovação, nº de páginas).
  // `plan`, `has`, `limitOf` e as contagens seguem a página editada: numa página compartilhada
  // valem o plano e os recursos da conta dona dela
  const pageId = useOptionalCurrentPage()?.pageId ?? userId;
  const [profile, setProfile] = useState<PlanProfile | null>(null);
  const [pageProfile, setPageProfile] = useState<PlanProfile | null>(null);
  const [counts, setCounts] = useState<ResourceCounts>({ links: 0, banners: 0, videos: 0, socials: 0 });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setProfile(null); setPageProfile(null); setLoading(false); return; }
    setLoading(true);
    const target = pageId ?? userId;
    const select = 'id, plan, plan_expires_at, plan_started_at, referral_code, is_pro';
    const [{ data: p }, { data: pg }, links, banners, videos, socials] = await Promise.all([
      supabase.from('profiles').select(select).eq('id', userId).maybeSingle(),
      target === userId ? Promise.resolve({ data: null }) : supabase.from('profiles').select(select).eq('id', target).maybeSingle(),
      supabase.from('links').select('id', { count: 'exact', head: true }).eq('profile_id', target),
      supabase.from('banners').select('id', { count: 'exact', head: true }).eq('profile_id', target),
      supabase.from('videos').select('id', { count: 'exact', head: true }).eq('profile_id', target),
      supabase.from('social_links').select('id', { count: 'exact', head: true }).eq('profile_id', target),
    ]);
    setProfile(p as PlanProfile | null);
    setPageProfile((pg as PlanProfile | null) ?? (p as PlanProfile | null));
    setCounts({
      links: links.count ?? 0,
      banners: banners.count ?? 0,
      videos: videos.count ?? 0,
      socials: socials.count ?? 0,
    });
    setLoading(false);
  }, [userId, pageId]);

  useEffect(() => {
    if (!ready) return;
    reload();
  }, [ready, reload]);

  const accountPlan: PlanDefinition = profile ? getPlanFor(profile) : PLANS.free;
  const plan: PlanDefinition = pageProfile ? getPlanFor(pageProfile) : PLANS.free;

  const canAdd = (resource: ResourceKey): boolean => canAddFn(pageProfile, resource, counts[resource]);
  const limitOf = (resource: ResourceKey): number => limitForFn(pageProfile, resource);
  const has = (feature: FeatureFlag): boolean => canFn(pageProfile, feature);

  return { profile, plan, accountPlan, counts, loading, reload, canAdd, limitOf, has };
}
