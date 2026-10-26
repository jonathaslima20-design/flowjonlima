/*
  # Origem dos cadastros e métricas de crescimento no admin

  1. `profiles.signup_source` / `signup_campaign`: de onde veio o cadastro (utm_source da primeira
     visita, ex.: "badge" para o selo "feito com BioFlowzy", "instagram", "direto"), gravado por
     `handle_new_user` a partir dos metadados do cadastro
  2. `admin_growth_metrics(p_days)`: ativação, conversão Free → pago, renovação, receita,
     origem dos cadastros, planos vencendo e páginas mais visitadas (só admin)
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_source text,
  ADD COLUMN IF NOT EXISTS signup_campaign text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
AS $$
DECLARE
  desired_username text;
  final_username text;
  suffix int := 0;
  v_ref_code text;
  v_referrer_id uuid;
  v_source text;
  v_campaign text;
BEGIN
  desired_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(NEW.email, '@', 1)
  );
  desired_username := lower(regexp_replace(desired_username, '[^a-z0-9_.-]', '', 'gi'));
  IF desired_username IS NULL OR desired_username = '' THEN
    desired_username := 'user' || substr(NEW.id::text, 1, 8);
  END IF;

  final_username := desired_username;
  WHILE public.is_reserved_username(final_username)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := desired_username || suffix::text;
  END LOOP;

  -- Resolve referral code to referrer UUID
  v_ref_code := NULLIF(TRIM(NEW.raw_user_meta_data->>'referred_by_code'), '');
  IF v_ref_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_ref_code
    LIMIT 1;
  END IF;

  -- Origem do cadastro (vem do navegador: normaliza)
  v_source := NULLIF(lower(left(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'signup_source', ''), '[^a-zA-Z0-9._-]', '', 'g'), 40)), '');
  v_campaign := NULLIF(lower(left(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'signup_campaign', ''), '[^a-zA-Z0-9._-]', '', 'g'), 60)), '');

  INSERT INTO public.profiles (id, username, display_name, referred_by, signup_source, signup_campaign)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
    v_referrer_id,
    COALESCE(v_source, 'direto'),
    v_campaign
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create referral entry if referred
  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, status)
    VALUES (v_referrer_id, NEW.id, 'pending')
    ON CONFLICT (referrer_id, referred_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_growth_metrics(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
  v_since timestamptz := now() - make_interval(days => v_days);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN (
    WITH accounts AS (
      SELECT p.* FROM profiles p WHERE p.owner_id IS NULL AND p.role <> 'admin'
    ),
    approved AS (
      SELECT pay.* FROM payments pay WHERE pay.status = 'approved'
    ),
    first_pay AS (
      SELECT profile_id, min(paid_at) AS first_paid_at,
             (array_agg(plan_granted_until ORDER BY paid_at))[1] AS first_until,
             count(*) AS n
      FROM approved GROUP BY profile_id
    ),
    new_accounts AS (
      SELECT * FROM accounts WHERE created_at >= v_since
    ),
    activation AS (
      SELECT a.id,
             (SELECT count(*) FROM links l
              WHERE l.profile_id = a.id AND COALESCE(l.is_active, true)
                AND l.created_at <= a.created_at + interval '24 hours') >= 3 AS activated
      FROM new_accounts a
      WHERE a.created_at <= now() - interval '24 hours'
    )
    SELECT json_build_object(
      'days', v_days,
      'total_accounts', (SELECT count(*) FROM accounts),
      'signups', (SELECT count(*) FROM new_accounts),
      'signups_by_source', (
        SELECT COALESCE(json_agg(json_build_object('name', src, 'count', n) ORDER BY n DESC), '[]'::json)
        FROM (SELECT COALESCE(signup_source, 'direto') AS src, count(*) AS n FROM new_accounts GROUP BY 1) s
      ),
      'activation', json_build_object(
        'eligible', (SELECT count(*) FROM activation),
        'activated', (SELECT count(*) FROM activation WHERE activated)
      ),
      'paying_accounts', (SELECT count(*) FROM accounts WHERE public.effective_plan(id) <> 'free'),
      'paying_by_plan', (
        SELECT COALESCE(json_agg(json_build_object('name', pl, 'count', n) ORDER BY n DESC), '[]'::json)
        FROM (SELECT public.effective_plan(id) AS pl, count(*) AS n FROM accounts
              WHERE public.effective_plan(id) <> 'free' GROUP BY 1) s
      ),
      'new_customers', (SELECT count(*) FROM first_pay WHERE first_paid_at >= v_since),
      'revenue_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM approved WHERE paid_at >= v_since),
      'payments', (SELECT count(*) FROM approved WHERE paid_at >= v_since),
      'renewal', json_build_object(
        'eligible', (SELECT count(*) FROM first_pay WHERE first_until IS NOT NULL AND first_until < now()),
        'renewed', (SELECT count(*) FROM first_pay WHERE first_until IS NOT NULL AND first_until < now() AND n >= 2)
      ),
      'expiring_soon', (
        SELECT COALESCE(json_agg(json_build_object(
          'username', a.username, 'email', u.email, 'plan', a.plan, 'expires_at', a.plan_expires_at
        ) ORDER BY a.plan_expires_at), '[]'::json)
        FROM accounts a JOIN auth.users u ON u.id = a.id
        WHERE a.plan <> 'free' AND a.plan_expires_at BETWEEN now() AND now() + interval '30 days'
      ),
      'views', (SELECT count(*) FROM page_views WHERE created_at >= v_since),
      'clicks', (SELECT count(*) FROM clicks WHERE created_at >= v_since),
      'active_pages', (SELECT count(DISTINCT profile_id) FROM page_views WHERE created_at >= v_since),
      'top_pages', (
        SELECT COALESCE(json_agg(json_build_object('username', t.username, 'views', t.views, 'clicks', t.clicks) ORDER BY t.views DESC), '[]'::json)
        FROM (
          SELECT p.username,
                 (SELECT count(*) FROM page_views v WHERE v.profile_id = p.id AND v.created_at >= v_since) AS views,
                 (SELECT count(*) FROM clicks c WHERE c.profile_id = p.id AND c.created_at >= v_since) AS clicks
          FROM profiles p
          ORDER BY views DESC
          LIMIT 10
        ) t
        WHERE t.views > 0
      )
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_growth_metrics(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_growth_metrics(integer) TO authenticated;
