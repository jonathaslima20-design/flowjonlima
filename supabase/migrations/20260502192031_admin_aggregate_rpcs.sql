/*
  # Admin aggregate RPCs and performance indexes

  1. New RPC functions
    - `admin_dashboard_stats()` - single call returns all dashboard metrics
      (total users, pro users, total clicks, new users last 30 days,
      revenue estimate, theme usage top 8, signups by day, recent users/leads)
    - `theme_usage_counts()` - aggregated theme counts via GROUP BY
    - `user_detail_counts(p_profile_id uuid)` - links/socials/videos/banners
      counts for a single user in one query

  2. Indexes
    - `idx_profiles_role` on profiles(role) for admin lookup
    - `idx_profiles_theme` on profiles(theme) for theme aggregation
    - `idx_profiles_created_at` on profiles(created_at desc)
    - `idx_subscriptions_plan_status` on subscriptions(plan_id, status)
    - `idx_clicks_created_at` on clicks(created_at)

  3. Security
    - All functions are SECURITY DEFINER but internally check auth.uid() role = 'admin'
    - Non-admin callers receive empty results / error
*/

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status ON subscriptions(plan_id, status);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.theme_usage_counts()
RETURNS TABLE(theme text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT COALESCE(p.theme, 'brutalist') AS theme, COUNT(*)::bigint
    FROM profiles p
    GROUP BY COALESCE(p.theme, 'brutalist')
    ORDER BY 2 DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_detail_counts(p_profile_id uuid)
RETURNS TABLE(links_count bigint, socials_count bigint, videos_count bigint, banners_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT
      (SELECT COUNT(*)::bigint FROM links WHERE profile_id = p_profile_id),
      (SELECT COUNT(*)::bigint FROM social_links WHERE profile_id = p_profile_id),
      (SELECT COUNT(*)::bigint FROM videos WHERE profile_id = p_profile_id),
      (SELECT COUNT(*)::bigint FROM banners WHERE profile_id = p_profile_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_total_users bigint;
  v_pro_users bigint;
  v_total_clicks bigint;
  v_new_users_30 bigint;
  v_revenue bigint;
  v_theme_usage jsonb;
  v_signups_by_day jsonb;
  v_recent_users jsonb;
  v_recent_leads jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(*) INTO v_pro_users FROM profiles WHERE is_pro = true;
  SELECT COUNT(*) INTO v_total_clicks FROM clicks;
  SELECT COUNT(*) INTO v_new_users_30 FROM profiles WHERE created_at >= now() - interval '30 days';

  SELECT COALESCE(SUM(p.price_cents), 0) INTO v_revenue
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.status = 'active';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', theme, 'count', count) ORDER BY count DESC), '[]'::jsonb)
  INTO v_theme_usage
  FROM (
    SELECT COALESCE(theme, 'brutalist') AS theme, COUNT(*)::bigint AS count
    FROM profiles
    GROUP BY COALESCE(theme, 'brutalist')
    ORDER BY 2 DESC
    LIMIT 8
  ) t;

  WITH days AS (
    SELECT generate_series(
      (now()::date - interval '29 days')::date,
      now()::date,
      interval '1 day'
    )::date AS d
  ),
  counts AS (
    SELECT created_at::date AS d, COUNT(*)::int AS c
    FROM profiles
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('date', to_char(days.d, 'MM-DD'), 'count', COALESCE(counts.c, 0)) ORDER BY days.d), '[]'::jsonb)
  INTO v_signups_by_day
  FROM days LEFT JOIN counts ON counts.d = days.d;

  SELECT COALESCE(jsonb_agg(to_jsonb(u) ORDER BY u.created_at DESC), '[]'::jsonb)
  INTO v_recent_users
  FROM (
    SELECT id, username, display_name, is_pro, created_at
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 10
  ) u;

  SELECT COALESCE(jsonb_agg(to_jsonb(l) ORDER BY l.created_at DESC), '[]'::jsonb)
  INTO v_recent_leads
  FROM (
    SELECT id, email, username, created_at
    FROM leads
    ORDER BY created_at DESC
    LIMIT 10
  ) l;

  result := jsonb_build_object(
    'totalUsers', v_total_users,
    'proUsers', v_pro_users,
    'totalClicks', v_total_clicks,
    'newUsersLast30', v_new_users_30,
    'revenueEstimate', v_revenue,
    'themeUsage', v_theme_usage,
    'signupsByDay', v_signups_by_day,
    'recentUsers', v_recent_users,
    'recentLeads', v_recent_leads
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.theme_usage_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_detail_counts(uuid) TO authenticated;
