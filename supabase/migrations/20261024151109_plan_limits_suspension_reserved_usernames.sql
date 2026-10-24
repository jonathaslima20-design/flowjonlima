/*
  # Fase 2 — Regras de negócio no banco

  ## Problemas corrigidos
  1. Limites de plano (links, banners, vídeos, redes) só eram checados na tela.
  2. Suspensão era só visual: o usuário suspenso seguia editando e com a página no ar.
  3. Não havia nomes de usuário reservados (ex.: "dashboard", "login").
  4. Avisos do Security Advisor: funções internas executáveis pela API e funções
     sem search_path fixo.

  ## Mudanças
  - `effective_plan(uuid)` e `plan_limit(uuid, text)`: plano vigente (expirado = free)
    e limite lido de `plans.limits` (-1 = ilimitado).
  - Trigger `trg_enforce_plan_limit` em links, banners, videos e social_links bloqueia
    INSERT acima do limite e qualquer INSERT de usuário suspenso.
  - `protect_profile_columns` passa a bloquear edições de usuário suspenso e troca
    de username para nome reservado/inválido.
  - `handle_new_user` pula nomes reservados ao gerar o username.
  - `lookup_domain` ignora perfis suspensos ou sem plano com domínio próprio.
  - Revoga EXECUTE de funções de trigger e de RPCs de admin para anon.
*/

-- ---------------------------------------------------------------------------
-- 1. Helpers de plano e suspensão
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.effective_plan(p_profile_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.plan_expires_at IS NOT NULL AND p.plan_expires_at <= now() THEN 'free'
    ELSE COALESCE(p.plan, 'free')
  END
  FROM profiles p
  WHERE p.id = p_profile_id;
$$;

CREATE OR REPLACE FUNCTION public.plan_limit(p_profile_id uuid, p_key text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pl.limits -> p_key
  FROM plans pl
  WHERE pl.slug = public.effective_plan(p_profile_id);
$$;

CREATE OR REPLACE FUNCTION public.is_suspended(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND suspended_at IS NOT NULL);
$$;

CREATE OR REPLACE FUNCTION public.is_reserved_username(p_username text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(p_username) = ANY (ARRAY[
    -- rotas do app
    'admin', 'api', 'dashboard', 'login', 'logout', 'register', 'signup', 'signin',
    'forgot-password', 'reset-password', 'auth', 'callback', 'icon', 'og-image',
    'robots.txt', 'sitemap.xml', 'favicon.ico', '_next', 'static', 'assets', 'public',
    -- institucionais
    'bioflowzy', 'www', 'app', 'help', 'ajuda', 'suporte', 'support', 'contato', 'contact',
    'about', 'sobre', 'blog', 'pricing', 'precos', 'planos', 'plans', 'terms', 'termos',
    'privacy', 'privacidade', 'settings', 'config', 'account', 'conta', 'billing',
    'checkout', 'pagamento', 'status', 'docs', 'root', 'null', 'undefined', 'system'
  ]);
$$;

-- ---------------------------------------------------------------------------
-- 2. Limites de plano e suspensão no conteúdo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_key text := TG_ARGV[0];
  v_limit integer;
  v_count integer;
BEGIN
  -- Funções SECURITY DEFINER e service_role rodam com outro current_user
  IF current_user NOT IN ('authenticated', 'anon') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF public.is_suspended(NEW.profile_id) THEN
    RAISE EXCEPTION 'Conta suspensa' USING ERRCODE = '42501';
  END IF;

  v_limit := (public.plan_limit(NEW.profile_id, v_key))::text::integer;
  IF v_limit IS NULL OR v_limit < 0 THEN
    RETURN NEW;
  END IF;

  -- Serializa inserções do mesmo perfil para a contagem não furar o limite
  PERFORM pg_advisory_xact_lock(hashtext(TG_TABLE_NAME || ':' || NEW.profile_id::text));

  EXECUTE format('SELECT count(*) FROM %I.%I WHERE profile_id = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
    INTO v_count
    USING NEW.profile_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Limite do seu plano atingido (máximo de %). Faça upgrade para adicionar mais.', v_limit
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_plan_limit ON public.links;
CREATE TRIGGER trg_enforce_plan_limit
  BEFORE INSERT ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit('links');

DROP TRIGGER IF EXISTS trg_enforce_plan_limit ON public.banners;
CREATE TRIGGER trg_enforce_plan_limit
  BEFORE INSERT ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit('banners');

DROP TRIGGER IF EXISTS trg_enforce_plan_limit ON public.videos;
CREATE TRIGGER trg_enforce_plan_limit
  BEFORE INSERT ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit('videos');

DROP TRIGGER IF EXISTS trg_enforce_plan_limit ON public.social_links;
CREATE TRIGGER trg_enforce_plan_limit
  BEFORE INSERT ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limit('socials');

-- ---------------------------------------------------------------------------
-- 3. Perfil: suspensão e username
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Funções SECURITY DEFINER (ex.: handle_new_user) e service_role rodam com
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
  THEN
    RAISE EXCEPTION 'Sem permissão para alterar campos protegidos do perfil' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- Mesmo corpo da versão anterior, agora pulando nomes reservados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security TO 'off'
AS $$
DECLARE
  desired_username text;
  final_username text;
  suffix int := 0;
  v_ref_code text;
  v_referrer_id uuid;
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

  INSERT INTO public.profiles (id, username, display_name, referred_by)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
    v_referrer_id
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

-- ---------------------------------------------------------------------------
-- 4. Domínio próprio só para perfis ativos com plano que inclui o recurso
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lookup_domain(p_domain text)
RETURNS TABLE(profile_id uuid, username text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT cd.profile_id, p.username
  FROM custom_domains cd
  JOIN profiles p ON p.id = cd.profile_id
  WHERE cd.domain = lower(p_domain)
    AND cd.verified = true
    AND p.suspended_at IS NULL
    AND COALESCE((public.plan_limit(p.id, 'custom_domain'))::text::boolean, false)
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 5. Security Advisor
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.generate_referral_code() SET search_path = public;
ALTER FUNCTION public.sync_is_pro_from_plan() SET search_path = public;

-- Funções de trigger não devem ser chamadas pela API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_profile_private() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_plan_upgrade_commission() FROM PUBLIC, anon, authenticated;

-- RPCs de admin (já checam is_admin internamente) não precisam ser públicas
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.theme_usage_counts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_detail_counts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.theme_usage_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_detail_counts(uuid) TO authenticated;

-- Helpers novos: só o necessário para as policies/triggers e o app
REVOKE EXECUTE ON FUNCTION public.effective_plan(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.plan_limit(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_suspended(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.plan_limit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_suspended(uuid) TO authenticated;
