/*
  # Múltiplas páginas (Business)

  Cada página extra é uma linha em `profiles` com `owner_id` apontando para o perfil principal
  da conta. Assim links, banners, vídeos, redes, temas, analytics e leads continuam ligados a
  `profile_id` sem mudar nenhuma tabela de conteúdo.

  1. `profiles.owner_id` (NULL = página principal). A FK `profiles.id -> auth.users` sai, porque
     páginas extras não são usuários; um trigger em `auth.users` apaga o perfil principal e as
     páginas extras caem em cascata pelo `owner_id`
  2. Plano e suspensão das páginas extras espelham os da conta (trigger `trg_mirror_account_to_pages`),
     então `plan_limit`, `is_suspended` e a UI funcionam sem mudança
  3. `can_manage_page(profile_id)`: dono da página principal ou da extra. Usada nas policies
  4. `create_page()`: cria página extra respeitando o limite `pages` do plano
  5. `profile_analytics` e `lead_usage` recebem a página (`p_profile_id`, padrão = conta)
  6. Painel admin conta apenas contas (páginas principais)
*/

-- 1. Coluna e FKs ------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS owner_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_owner_id_fkey') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_owner_not_self') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_owner_not_self CHECK (owner_id IS NULL OR owner_id <> id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_owner ON public.profiles(owner_id) WHERE owner_id IS NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

CREATE OR REPLACE FUNCTION public.delete_profile_on_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.delete_profile_on_user_delete();

-- 2. Plano e suspensão espelhados ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mirror_account_to_pages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET plan = NEW.plan,
         plan_started_at = NEW.plan_started_at,
         plan_expires_at = NEW.plan_expires_at,
         suspended_at = NEW.suspended_at
   WHERE owner_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_account_to_pages ON public.profiles;
CREATE TRIGGER trg_mirror_account_to_pages
  AFTER UPDATE OF plan, plan_started_at, plan_expires_at, suspended_at ON public.profiles
  FOR EACH ROW
  WHEN (NEW.owner_id IS NULL AND (
    NEW.plan IS DISTINCT FROM OLD.plan
    OR NEW.plan_started_at IS DISTINCT FROM OLD.plan_started_at
    OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
    OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at))
  EXECUTE FUNCTION public.mirror_account_to_pages();

-- Páginas extras não têm código de indicação nem área privada (Pix/saldo são da conta)
CREATE OR REPLACE FUNCTION public.sync_is_pro_from_plan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.is_pro := (NEW.plan IN ('pro', 'business'))
    AND (NEW.plan_expires_at IS NULL OR NEW.plan_expires_at > now());
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.plan IS DISTINCT FROM OLD.plan) THEN
    IF NEW.plan_started_at IS NULL AND NEW.plan <> 'free' THEN
      NEW.plan_started_at := now();
    END IF;
  END IF;
  IF NEW.referral_code IS NULL AND NEW.owner_id IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_profile_private()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    INSERT INTO public.profile_private (profile_id) VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- owner_id passa a ser campo protegido
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Funções SECURITY DEFINER (ex.: handle_new_user, create_page) e service_role rodam com
  -- outro current_user; admins podem editar qualquer campo
  IF current_user NOT IN ('authenticated', 'anon') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT' OR NEW.username IS DISTINCT FROM OLD.username)
     AND (NEW.username !~ '^[a-z0-9_.-]{2,30}$' OR public.is_reserved_username(NEW.username))
  THEN
    RAISE EXCEPTION 'Nome de usuário indisponível' USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'user';
    NEW.plan := 'free';
    NEW.plan_started_at := NULL;
    NEW.plan_expires_at := NULL;
    NEW.is_pro := false;
    NEW.suspended_at := NULL;
    NEW.referred_by := NULL;
    NEW.owner_id := NULL;
    RETURN NEW;
  END IF;

  IF OLD.suspended_at IS NOT NULL THEN
    RAISE EXCEPTION 'Conta suspensa' USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_started_at IS DISTINCT FROM OLD.plan_started_at
     OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
     OR NEW.is_pro IS DISTINCT FROM OLD.is_pro
     OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
  THEN
    RAISE EXCEPTION 'Sem permissão para alterar campos protegidos do perfil' USING ERRCODE = '42501';
  END IF;

  IF NEW.theme IS DISTINCT FROM OLD.theme
     AND public.is_pro_only_theme(NEW.theme)
     AND NOT COALESCE((public.plan_limit(NEW.id, 'pro_themes'))::text::boolean, false)
  THEN
    RAISE EXCEPTION 'Este tema está disponível no plano Pro' USING ERRCODE = '42501';
  END IF;

  IF (NEW.seo_title IS DISTINCT FROM OLD.seo_title
      OR NEW.seo_description IS DISTINCT FROM OLD.seo_description
      OR NEW.seo_image_url IS DISTINCT FROM OLD.seo_image_url)
     AND (COALESCE(NEW.seo_title, '') <> '' OR COALESCE(NEW.seo_description, '') <> '' OR COALESCE(NEW.seo_image_url, '') <> '')
     AND NOT COALESCE((public.plan_limit(NEW.id, 'seo'))::text::boolean, false)
  THEN
    RAISE EXCEPTION 'SEO personalizado está disponível no plano Pro' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Permissão por página ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_page(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_profile_id AND (id = auth.uid() OR owner_id = auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_page(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_manage_page(uuid) TO authenticated;

ALTER POLICY "Users update own profile" ON public.profiles
  USING (auth.uid() = id OR owner_id = auth.uid())
  WITH CHECK (auth.uid() = id OR owner_id = auth.uid());
DROP POLICY IF EXISTS "Owners delete own pages" ON public.profiles;
CREATE POLICY "Owners delete own pages" ON public.profiles
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

ALTER POLICY "Owners insert links" ON public.links WITH CHECK (public.can_manage_page(profile_id));
ALTER POLICY "Owners update links" ON public.links USING (public.can_manage_page(profile_id)) WITH CHECK (public.can_manage_page(profile_id));
ALTER POLICY "Owners delete links" ON public.links USING (public.can_manage_page(profile_id));
ALTER POLICY "Owners insert videos" ON public.videos WITH CHECK (public.can_manage_page(profile_id));
ALTER POLICY "Owners update videos" ON public.videos USING (public.can_manage_page(profile_id)) WITH CHECK (public.can_manage_page(profile_id));
ALTER POLICY "Owners delete videos" ON public.videos USING (public.can_manage_page(profile_id));
ALTER POLICY "Owners insert social" ON public.social_links WITH CHECK (public.can_manage_page(profile_id));
ALTER POLICY "Owners update social" ON public.social_links USING (public.can_manage_page(profile_id)) WITH CHECK (public.can_manage_page(profile_id));
ALTER POLICY "Owners delete social" ON public.social_links USING (public.can_manage_page(profile_id));
ALTER POLICY "Owners insert banners" ON public.banners WITH CHECK (public.can_manage_page(profile_id));
ALTER POLICY "Owners update banners" ON public.banners USING (public.can_manage_page(profile_id)) WITH CHECK (public.can_manage_page(profile_id));
ALTER POLICY "Owners delete banners" ON public.banners USING (public.can_manage_page(profile_id));
ALTER POLICY "Owners view clicks" ON public.clicks USING (public.can_manage_page(profile_id));
ALTER POLICY "Owners read own page views" ON public.page_views USING (public.can_manage_page(profile_id) OR public.is_admin());
ALTER POLICY "Owners read own leads" ON public.page_leads USING (public.can_manage_page(profile_id) OR public.is_admin());
ALTER POLICY "Owners delete own leads" ON public.page_leads USING (public.can_manage_page(profile_id));

-- 4. Criar página extra -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_page(p_username text, p_display_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_account profiles%ROWTYPE;
  v_limit integer;
  v_count integer;
  v_username text := lower(btrim(COALESCE(p_username, '')));
  v_name text := left(btrim(COALESCE(p_display_name, '')), 60);
  v_id uuid := gen_random_uuid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_account FROM profiles WHERE id = v_uid AND owner_id IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta não encontrada' USING ERRCODE = '42501';
  END IF;
  IF v_account.suspended_at IS NOT NULL THEN
    RAISE EXCEPTION 'Conta suspensa' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('pages:' || v_uid::text));

  v_limit := COALESCE((public.plan_limit(v_uid, 'pages'))::text::integer, 1);
  SELECT 1 + count(*) INTO v_count FROM profiles WHERE owner_id = v_uid;
  IF v_limit >= 0 AND v_count >= v_limit THEN
    RAISE EXCEPTION 'Seu plano permite até % página(s). Faça upgrade para o Business para criar mais.', v_limit
      USING ERRCODE = 'P0001';
  END IF;

  IF v_username !~ '^[a-z0-9_.-]{2,30}$' OR public.is_reserved_username(v_username) THEN
    RAISE EXCEPTION 'Endereço inválido. Use de 2 a 30 letras minúsculas, números, ponto, hífen ou _.' USING ERRCODE = '23514';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE username = v_username) THEN
    RAISE EXCEPTION 'Este endereço já está em uso.' USING ERRCODE = '23505';
  END IF;

  INSERT INTO profiles (id, owner_id, username, display_name, theme, plan, plan_started_at, plan_expires_at)
  VALUES (v_id, v_uid, v_username, COALESCE(NULLIF(v_name, ''), v_username), v_account.theme,
          v_account.plan, v_account.plan_started_at, v_account.plan_expires_at);

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_page(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_page(text, text) TO authenticated;

-- 5. Analytics e leads por página ---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.profile_analytics(integer);
CREATE OR REPLACE FUNCTION public.profile_analytics(p_days integer DEFAULT 30, p_profile_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_uid uuid := COALESCE(p_profile_id, auth.uid());
  v_days integer;
  v_since timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_manage_page(v_uid) THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '42501';
  END IF;
  v_days := LEAST(GREATEST(COALESCE(p_days, 30), 1),
                  COALESCE((public.plan_limit(v_uid, 'analytics_days'))::text::integer, 7));
  v_since := date_trunc('day', now()) - make_interval(days => v_days - 1);

  RETURN json_build_object(
    'days', v_days,
    'views', (SELECT count(*) FROM page_views WHERE profile_id = v_uid AND created_at >= v_since),
    'clicks', (SELECT count(*) FROM clicks WHERE profile_id = v_uid AND created_at >= v_since),
    'series', (
      SELECT json_agg(json_build_object('day', to_char(d, 'YYYY-MM-DD'), 'views', COALESCE(v.n, 0), 'clicks', COALESCE(c.n, 0)) ORDER BY d)
      FROM generate_series(v_since, date_trunc('day', now()), interval '1 day') d
      LEFT JOIN (SELECT date_trunc('day', created_at) AS dia, count(*) AS n FROM page_views
                 WHERE profile_id = v_uid AND created_at >= v_since GROUP BY 1) v ON v.dia = d
      LEFT JOIN (SELECT date_trunc('day', created_at) AS dia, count(*) AS n FROM clicks
                 WHERE profile_id = v_uid AND created_at >= v_since GROUP BY 1) c ON c.dia = d
    ),
    'sources', (
      SELECT COALESCE(json_agg(json_build_object('name', source, 'count', n) ORDER BY n DESC), '[]'::json)
      FROM (SELECT source, count(*) n FROM page_views WHERE profile_id = v_uid AND created_at >= v_since
            GROUP BY source ORDER BY n DESC LIMIT 10) s
    ),
    'devices', (
      SELECT COALESCE(json_agg(json_build_object('name', device, 'count', n) ORDER BY n DESC), '[]'::json)
      FROM (SELECT device, count(*) n FROM page_views WHERE profile_id = v_uid AND created_at >= v_since
            GROUP BY device) s
    ),
    'countries', (
      SELECT COALESCE(json_agg(json_build_object('name', country, 'count', n) ORDER BY n DESC), '[]'::json)
      FROM (SELECT COALESCE(country, '??') country, count(*) n FROM page_views WHERE profile_id = v_uid AND created_at >= v_since
            GROUP BY 1 ORDER BY n DESC LIMIT 10) s
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.profile_analytics(integer, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.lead_usage();
CREATE OR REPLACE FUNCTION public.lead_usage(p_profile_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_pid uuid := COALESCE(p_profile_id, auth.uid());
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_manage_page(v_pid) THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '42501';
  END IF;
  RETURN json_build_object(
    'used', (SELECT count(*) FROM page_leads WHERE profile_id = v_pid AND created_at >= date_trunc('month', now())),
    'limit', COALESCE((public.plan_limit(v_pid, 'leads'))::text::integer, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.lead_usage(uuid) TO authenticated;

-- 6. Admin conta só contas ----------------------------------------------------------------------
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

  SELECT COUNT(*) INTO v_total_users FROM profiles WHERE owner_id IS NULL;
  SELECT COUNT(*) INTO v_pro_users FROM profiles WHERE is_pro = true AND owner_id IS NULL;
  SELECT COUNT(*) INTO v_total_clicks FROM clicks;
  SELECT COUNT(*) INTO v_new_users_30 FROM profiles WHERE created_at >= now() - interval '30 days' AND owner_id IS NULL;

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
    SELECT generate_series((now()::date - interval '29 days')::date, now()::date, interval '1 day')::date AS d
  ),
  counts AS (
    SELECT created_at::date AS d, COUNT(*)::int AS c
    FROM profiles
    WHERE created_at >= now() - interval '30 days' AND owner_id IS NULL
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
    WHERE owner_id IS NULL
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
