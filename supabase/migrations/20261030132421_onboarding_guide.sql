/*
  # Guia inicial do painel ("Sua página está X% pronta")

  - `profile_private.onboarding_shared_at`: clicou em copiar / ver / compartilhar o link no guia
  - `profile_private.onboarding_completed_at`: chegou a 100% (gravado pelo painel)
  - `profile_private.onboarding_dismissed_at`: fechou o guia
  - `onboarding_steps(p)`: regra única dos passos (foto, bio, link ativo com endereço, rede social,
    visual alterado, compartilhou ou já teve tráfego), usada pelo painel e pelo funil do admin
  - `onboarding_status(p_profile_id)`: passos + datas, para o dono da conta (ou admin)
  - `admin_onboarding_funnel(p_days)`: quantos cadastros do período completaram cada passo
    (sem contas admin, como em `admin_growth_metrics`)
*/

ALTER TABLE public.profile_private
  ADD COLUMN IF NOT EXISTS onboarding_shared_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at timestamptz;

-- Interna: sem checagem de acesso (só chamada pelas funções abaixo)
CREATE OR REPLACE FUNCTION public.onboarding_steps(p public.profiles)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'avatar', COALESCE(btrim(p.avatar_url), '') <> '',
    'bio', COALESCE(btrim(p.bio), '') <> '',
    'link', EXISTS (
      SELECT 1 FROM links l
       WHERE l.profile_id = p.id AND l.is_active
         AND btrim(l.url) NOT IN ('', 'https://', 'http://')
    ),
    'social', EXISTS (SELECT 1 FROM social_links s WHERE s.profile_id = p.id),
    'theme', COALESCE(p.theme, 'cupertino') <> 'cupertino'
          OR upper(COALESCE(p.bg_color, '#FFFFFF')) <> '#FFFFFF'
          OR upper(COALESCE(p.button_color, '#FACC15')) <> '#FACC15'
          OR upper(COALESCE(p.text_color, '#000000')) <> '#000000'
          OR COALESCE(p.theme_settings, '{}'::jsonb) <> '{}'::jsonb,
    'shared', (SELECT pp.onboarding_shared_at IS NOT NULL FROM profile_private pp WHERE pp.profile_id = p.id)
          OR EXISTS (SELECT 1 FROM page_views v WHERE v.profile_id = p.id)
          OR EXISTS (SELECT 1 FROM clicks c WHERE c.profile_id = p.id)
  );
$$;

REVOKE ALL ON FUNCTION public.onboarding_steps(public.profiles) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.onboarding_status(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles;
  v_private profile_private;
BEGIN
  IF auth.uid() IS NULL OR (p_profile_id <> auth.uid() AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_private FROM profile_private WHERE profile_id = p_profile_id;
  RETURN jsonb_build_object(
    'steps', public.onboarding_steps(v_profile),
    'created_at', v_profile.created_at,
    'shared_at', v_private.onboarding_shared_at,
    'completed_at', v_private.onboarding_completed_at,
    'dismissed_at', v_private.onboarding_dismissed_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.onboarding_status(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onboarding_status(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_onboarding_funnel(p_days integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
  v_since timestamptz := now() - make_interval(days => v_days);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN (
    WITH accts AS (
      SELECT public.onboarding_steps(p) AS s, pp.onboarding_completed_at, pp.onboarding_dismissed_at
        FROM profiles p
        LEFT JOIN profile_private pp ON pp.profile_id = p.id
       WHERE p.owner_id IS NULL AND p.role <> 'admin' AND p.created_at >= v_since
    )
    SELECT jsonb_build_object(
      'signups', count(*),
      'avatar', count(*) FILTER (WHERE (s->>'avatar')::boolean),
      'bio', count(*) FILTER (WHERE (s->>'bio')::boolean),
      'link', count(*) FILTER (WHERE (s->>'link')::boolean),
      'social', count(*) FILTER (WHERE (s->>'social')::boolean),
      'theme', count(*) FILTER (WHERE (s->>'theme')::boolean),
      'shared', count(*) FILTER (WHERE (s->>'shared')::boolean),
      'completed', count(*) FILTER (WHERE onboarding_completed_at IS NOT NULL),
      'dismissed', count(*) FILTER (WHERE onboarding_dismissed_at IS NOT NULL AND onboarding_completed_at IS NULL)
    )
    FROM accts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_onboarding_funnel(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_onboarding_funnel(integer) TO authenticated;
