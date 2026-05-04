'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
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
  const [profile, setProfile] = useState<PlanProfile | null>(null);
  const [counts, setCounts] = useState<ResourceCounts>({ links: 0, banners: 0, videos: 0, socials: 0 });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    const { data: p } = await supabase.from('profiles')
      .select('id, plan, plan_expires_at, plan_started_at, referral_code, is_pro')
      .eq('id', userId).maybeSingle();
    setProfile(p as PlanProfile | null);

    const [links, banners, videos, socials] = await Promise.all([
      supabase.from('links').select('id', { count: 'exact', head: true }).eq('profile_id', userId),
      supabase.from('banners').select('id', { count: 'exact', head: true }).eq('profile_id', userId),
      supabase.from('videos').select('id', { count: 'exact', head: true }).eq('profile_id', userId),
      supabase.from('social_links').select('id', { count: 'exact', head: true }).eq('profile_id', userId),
    ]);
    setCounts({
      links: links.count ?? 0,
      banners: banners.count ?? 0,
      videos: videos.count ?? 0,
      socials: socials.count ?? 0,
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    reload();
  }, [ready, reload]);

  const plan: PlanDefinition = profile ? getPlanFor(profile) : PLANS.free;

  const canAdd = (resource: ResourceKey): boolean => canAddFn(profile, resource, counts[resource]);
  const limitOf = (resource: ResourceKey): number => limitForFn(profile, resource);
  const has = (feature: FeatureFlag): boolean => canFn(profile, feature);

  return { profile, plan, counts, loading, reload, canAdd, limitOf, has };
}
