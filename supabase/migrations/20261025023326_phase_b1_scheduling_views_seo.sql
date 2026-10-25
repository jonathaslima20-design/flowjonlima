/*
  # Fase B1: agendamento de links, visitas com origem/dispositivo e SEO

  ## Mudanças
  - `links.starts_at` / `links.ends_at`: o link só aparece na página pública dentro
    da janela. Recurso Pro (`scheduling`), aplicado por trigger.
  - `page_views` + RPC `track_view`: registra visitas à página pública com origem
    (instagram, tiktok, google...), dispositivo e país (header do Cloudflare).
    Mesmo esquema do `track_click`: hash do IP, sem guardar o IP, uma visita por
    visitante a cada 30 min e teto por perfil. Só o dono (e admin) lê.
  - `profiles.seo_title` / `seo_description` / `seo_image_url`: título, descrição e
    imagem da prévia de compartilhamento. Recurso Pro (`seo`), aplicado em
    `protect_profile_columns`.
  - Novos limites `scheduling` e `seo` nos planos.
  - Tema padrão de novos perfis: `cupertino` (o antigo `brutalist` está desativado).
*/

-- ---------------------------------------------------------------------------
-- 1. Limites novos
-- ---------------------------------------------------------------------------
UPDATE public.plans
  SET limits = limits || '{"scheduling": false, "seo": false}'::jsonb
  WHERE slug = 'free';
UPDATE public.plans
  SET limits = limits || '{"scheduling": true, "seo": true}'::jsonb
  WHERE slug IN ('pro', 'business');
UPDATE public.plans
  SET features = '["Tudo do Free","Todos os temas e personalização completa","Remoção da marca BioFlowzy","Banners e vídeos ilimitados","Analytics completo: visitas, origem e dispositivo","Agendamento de links","SEO e prévia de compartilhamento","Domínio personalizado","Meta Pixel e Google Analytics","Indique e ganhe"]'::jsonb
  WHERE slug = 'pro';

-- ---------------------------------------------------------------------------
-- 2. Agendamento de links
-- ---------------------------------------------------------------------------
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE public.links DROP CONSTRAINT IF EXISTS links_schedule_order;
ALTER TABLE public.links ADD CONSTRAINT links_schedule_order
  CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at);

CREATE OR REPLACE FUNCTION public.enforce_link_scheduling()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF (NEW.starts_at IS NOT NULL OR NEW.ends_at IS NOT NULL)
     AND (TG_OP = 'INSERT' OR NEW.starts_at IS DISTINCT FROM OLD.starts_at OR NEW.ends_at IS DISTINCT FROM OLD.ends_at)
     AND NOT COALESCE((public.plan_limit(NEW.profile_id, 'scheduling'))::text::boolean, false)
  THEN
    RAISE EXCEPTION 'Agendamento de links está disponível no plano Pro' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_link_scheduling ON public.links;
CREATE TRIGGER trg_enforce_link_scheduling
  BEFORE INSERT OR UPDATE ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_link_scheduling();

-- ---------------------------------------------------------------------------
-- 3. Visitas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_hash text NOT NULL,
  source text NOT NULL DEFAULT 'direto',
  device text NOT NULL DEFAULT 'desktop' CHECK (device IN ('mobile', 'tablet', 'desktop')),
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_views_profile_date_idx ON public.page_views (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_visitor_idx ON public.page_views (visitor_hash, created_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read own page views" ON public.page_views;
CREATE POLICY "Owners read own page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.track_view(p_profile_id uuid, p_source text DEFAULT NULL, p_device text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_headers json;
  v_ip text;
  v_visitor text;
  v_source text;
  v_device text;
  v_country text;
BEGIN
  IF p_profile_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND suspended_at IS NULL) THEN
    RETURN false;
  END IF;

  v_headers := COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::json;
  v_ip := COALESCE(
    NULLIF(v_headers->>'cf-connecting-ip', ''),
    NULLIF(btrim(split_part(v_headers->>'x-forwarded-for', ',', 1)), ''),
    NULLIF(v_headers->>'x-real-ip', ''),
    'unknown'
  );
  v_visitor := md5(v_ip || ':' || p_profile_id::text);
  v_country := NULLIF(upper(left(v_headers->>'cf-ipcountry', 2)), 'XX');

  -- Origem e dispositivo vêm do navegador: normaliza para não guardar lixo
  v_source := lower(left(regexp_replace(COALESCE(p_source, ''), '[^a-zA-Z0-9._-]', '', 'g'), 40));
  IF v_source = '' THEN v_source := 'direto'; END IF;
  v_device := CASE WHEN p_device IN ('mobile', 'tablet', 'desktop') THEN p_device ELSE 'desktop' END;

  PERFORM pg_advisory_xact_lock(hashtext('view:' || v_visitor));

  IF EXISTS (
    SELECT 1 FROM page_views
    WHERE visitor_hash = v_visitor AND created_at > now() - interval '30 minutes'
  ) THEN
    RETURN false;
  END IF;

  IF (SELECT count(*) FROM page_views
      WHERE profile_id = p_profile_id AND created_at > now() - interval '1 minute') >= 1000 THEN
    RETURN false;
  END IF;

  INSERT INTO page_views (profile_id, visitor_hash, source, device, country)
  VALUES (p_profile_id, v_visitor, v_source, v_device, v_country);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.track_view(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_view(uuid, text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. SEO e tema padrão
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seo_image_url text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_seo_lengths;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_seo_lengths
  CHECK (char_length(seo_title) <= 70 AND char_length(seo_description) <= 200);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_seo_image_url_safe;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_seo_image_url_safe
  CHECK (seo_image_url IS NULL OR seo_image_url = '' OR seo_image_url ~* '^https://');

ALTER TABLE public.profiles ALTER COLUMN theme SET DEFAULT 'cupertino';

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

-- ---------------------------------------------------------------------------
-- 5. Resumo de analytics do usuário logado
-- ---------------------------------------------------------------------------
-- Agrega no banco (evita baixar todas as linhas) e limita o período aos dias de
-- histórico do plano. Roda com as permissões do usuário (RLS de page_views/clicks).
CREATE OR REPLACE FUNCTION public.profile_analytics(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_days integer;
  v_since timestamptz;
BEGIN
  IF v_uid IS NULL THEN
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

REVOKE EXECUTE ON FUNCTION public.profile_analytics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_analytics(integer) TO authenticated;
