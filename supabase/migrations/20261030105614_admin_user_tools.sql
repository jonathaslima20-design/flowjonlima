/*
  # Ferramentas de gestão de usuários (Admin → Usuários → detalhes)

  1. Tabelas (só admin)
    - `admin_user_notes`: notas internas sobre a conta
    - `admin_user_tags`: etiquetas (VIP, parceiro, problema de pagamento…)

  2. Funções
    - `admin_user_overview(p_profile_id)`: dados da conta (auth.users, profile_private, contagens,
      visitas/cliques 30 dias, pagamentos, indicações, páginas) em um JSON
    - `admin_user_timeline(p_profile_id)`: linha do tempo (cadastro, login, pagamentos, páginas,
      indicações e ações de admin)
    - `admin_revoke_sessions(p_user_id)`: encerra todas as sessões (só service_role, usada pela
      edge function `admin-user`)
*/

-- NOTAS
CREATE TABLE IF NOT EXISTS public.admin_user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_user_notes_profile_idx ON public.admin_user_notes (profile_id, created_at DESC);
ALTER TABLE public.admin_user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read user notes" ON public.admin_user_notes;
CREATE POLICY "Admins read user notes" ON public.admin_user_notes FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "Admins add user notes" ON public.admin_user_notes;
CREATE POLICY "Admins add user notes" ON public.admin_user_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND author_id = auth.uid());
DROP POLICY IF EXISTS "Admins delete user notes" ON public.admin_user_notes;
CREATE POLICY "Admins delete user notes" ON public.admin_user_notes FOR DELETE TO authenticated
  USING (public.is_admin());

-- ETIQUETAS
CREATE TABLE IF NOT EXISTS public.admin_user_tags (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag text NOT NULL CHECK (char_length(btrim(tag)) BETWEEN 1 AND 30 AND tag = lower(btrim(tag))),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, tag)
);
CREATE INDEX IF NOT EXISTS admin_user_tags_tag_idx ON public.admin_user_tags (tag);
ALTER TABLE public.admin_user_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read user tags" ON public.admin_user_tags;
CREATE POLICY "Admins read user tags" ON public.admin_user_tags FOR SELECT TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "Admins add user tags" ON public.admin_user_tags;
CREATE POLICY "Admins add user tags" ON public.admin_user_tags FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins delete user tags" ON public.admin_user_tags;
CREATE POLICY "Admins delete user tags" ON public.admin_user_tags FOR DELETE TO authenticated
  USING (public.is_admin());

-- VISÃO GERAL DA CONTA
CREATE OR REPLACE FUNCTION public.admin_user_overview(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz := now() - interval '30 days';
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  WITH acct_pages AS (
    SELECT id FROM profiles WHERE id = p_profile_id OR owner_id = p_profile_id
  )
  SELECT jsonb_build_object(
    'email', u.email,
    'email_confirmed_at', u.email_confirmed_at,
    'last_sign_in_at', u.last_sign_in_at,
    'providers', COALESCE(u.raw_app_meta_data -> 'providers', '[]'::jsonb),
    'whatsapp', pp.whatsapp,
    'commission_balance', COALESCE(pp.commission_balance, 0),
    'has_pix', pp.pix_key IS NOT NULL AND pp.pix_key <> '',
    'referred_by', (SELECT r.username FROM profiles r WHERE r.id = p.referred_by),
    'custom_domain', (SELECT jsonb_build_object('domain', d.domain, 'verified', d.verified)
                        FROM custom_domains d WHERE d.profile_id = p_profile_id LIMIT 1),
    'counts', jsonb_build_object(
      'links', (SELECT count(*) FROM links WHERE profile_id IN (SELECT id FROM acct_pages)),
      'socials', (SELECT count(*) FROM social_links WHERE profile_id IN (SELECT id FROM acct_pages)),
      'videos', (SELECT count(*) FROM videos WHERE profile_id IN (SELECT id FROM acct_pages)),
      'banners', (SELECT count(*) FROM banners WHERE profile_id IN (SELECT id FROM acct_pages)),
      'leads', (SELECT count(*) FROM page_leads WHERE profile_id IN (SELECT id FROM acct_pages)),
      'members', (SELECT count(*) FROM page_members WHERE page_id IN (SELECT id FROM acct_pages))
    ),
    'views_30d', (SELECT count(*) FROM page_views WHERE profile_id IN (SELECT id FROM acct_pages) AND created_at >= v_since),
    'clicks_30d', (SELECT count(*) FROM clicks WHERE profile_id IN (SELECT id FROM acct_pages) AND created_at >= v_since),
    'views_total', (SELECT count(*) FROM page_views WHERE profile_id IN (SELECT id FROM acct_pages)),
    'paid_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM payments WHERE profile_id = p_profile_id AND status = 'approved'),
    'payments_approved', (SELECT count(*) FROM payments WHERE profile_id = p_profile_id AND status = 'approved'),
    'referrals', (SELECT count(*) FROM referrals WHERE referrer_id = p_profile_id),
    'referrals_paid', (SELECT count(*) FROM referrals WHERE referrer_id = p_profile_id AND COALESCE(commission_value, 0) > 0),
    'commission_total', (SELECT COALESCE(sum(commission_value), 0) FROM referrals WHERE referrer_id = p_profile_id),
    'pages', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', x.id,
        'username', x.username,
        'display_name', x.display_name,
        'avatar_url', x.avatar_url,
        'theme', x.theme,
        'is_main', x.owner_id IS NULL,
        'created_at', x.created_at,
        'links', (SELECT count(*) FROM links WHERE profile_id = x.id),
        'views_30d', (SELECT count(*) FROM page_views WHERE profile_id = x.id AND created_at >= v_since)
      ) ORDER BY x.owner_id NULLS FIRST, x.created_at)
      FROM profiles x WHERE x.id IN (SELECT id FROM acct_pages)
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN profile_private pp ON pp.profile_id = p.id
  WHERE p.id = p_profile_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_user_overview(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_overview(uuid) TO authenticated;

-- LINHA DO TEMPO
CREATE OR REPLACE FUNCTION public.admin_user_timeline(p_profile_id uuid)
RETURNS TABLE (at timestamptz, kind text, title text, details jsonb, actor text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT * FROM (
    SELECT p.created_at, 'signup'::text, 'Cadastro'::text,
           jsonb_build_object('source', p.signup_source, 'campaign', p.signup_campaign), NULL::text
      FROM profiles p WHERE p.id = p_profile_id
    UNION ALL
    SELECT u.last_sign_in_at, 'login', 'Último login', '{}'::jsonb, NULL
      FROM auth.users u WHERE u.id = p_profile_id AND u.last_sign_in_at IS NOT NULL
    UNION ALL
    SELECT pay.created_at, 'payment_created', 'Pagamento iniciado',
           jsonb_build_object('plan', pay.plan_slug, 'period', pay.period, 'amount_cents', pay.amount_cents, 'status', pay.status, 'provider', pay.provider), NULL
      FROM payments pay WHERE pay.profile_id = p_profile_id
    UNION ALL
    SELECT pay.paid_at, 'payment_approved', 'Pagamento aprovado',
           jsonb_build_object('plan', pay.plan_slug, 'period', pay.period, 'amount_cents', pay.amount_cents, 'until', pay.plan_granted_until), NULL
      FROM payments pay WHERE pay.profile_id = p_profile_id AND pay.paid_at IS NOT NULL
    UNION ALL
    SELECT x.created_at, 'page_created', 'Página extra criada', jsonb_build_object('username', x.username), NULL
      FROM profiles x WHERE x.owner_id = p_profile_id
    UNION ALL
    SELECT r.created_at, 'referral', 'Indicou uma pessoa',
           jsonb_build_object('username', rp.username, 'commission', r.commission_value), NULL
      FROM referrals r LEFT JOIN profiles rp ON rp.id = r.referred_id WHERE r.referrer_id = p_profile_id
    UNION ALL
    SELECT a.created_at, 'admin', a.action, COALESCE(a.details, '{}'::jsonb), ap.username
      FROM admin_audit_log a LEFT JOIN profiles ap ON ap.id = a.admin_id
     WHERE a.target_id = p_profile_id::text
  ) t
  ORDER BY 1 DESC NULLS LAST
  LIMIT 300;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_user_timeline(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_timeline(uuid) TO authenticated;

-- ENCERRAR SESSÕES (edge function admin-user, com service_role)
CREATE OR REPLACE FUNCTION public.admin_revoke_sessions(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revoke_sessions(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_sessions(uuid) TO service_role;

-- Rota nova /redefinir-senha (link de redefinição de senha) não pode virar username
CREATE OR REPLACE FUNCTION public.is_reserved_username(p_username text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT lower(p_username) = ANY (ARRAY[
    -- rotas do app
    'admin', 'api', 'dashboard', 'login', 'logout', 'register', 'signup', 'signin',
    'forgot-password', 'reset-password', 'redefinir-senha', 'auth', 'callback', 'icon', 'og-image',
    'robots.txt', 'sitemap.xml', 'favicon.ico', '_next', 'static', 'assets', 'public',
    'convite', 'convites', 'invite', 'exemplos', 'exemplo', 'examples',
    -- institucionais
    'bioflowzy', 'www', 'app', 'help', 'ajuda', 'suporte', 'support', 'contato', 'contact',
    'about', 'sobre', 'blog', 'pricing', 'precos', 'planos', 'plans', 'terms', 'termos',
    'privacy', 'privacidade', 'settings', 'config', 'account', 'conta', 'billing',
    'checkout', 'pagamento', 'status', 'docs', 'root', 'null', 'undefined', 'system'
  ]);
$function$;
