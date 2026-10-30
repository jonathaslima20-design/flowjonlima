/*
  # Último acesso do usuário

  - `profile_private.last_seen_at`: última vez que a pessoa usou o site logada (não só o login,
    que o Supabase só atualiza ao entrar com senha/link). Fica em profile_private porque profiles
    é pública.
  - `touch_last_seen()`: chamada pelo site com a sessão aberta; grava no máximo a cada 2 minutos.
    O site não chama durante "Entrar como o usuário", para o acesso do admin não contar.
  - `admin_last_seen(p_ids)`: último acesso de várias contas (listagem do admin).
  - `admin_user_overview` passa a devolver `last_seen_at`.
  - Contas antigas começam com o último login.
*/

ALTER TABLE public.profile_private ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

UPDATE public.profile_private pp
   SET last_seen_at = u.last_sign_in_at
  FROM auth.users u
 WHERE u.id = pp.profile_id AND pp.last_seen_at IS NULL AND u.last_sign_in_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  -- Só contas (páginas extras não fazem login)
  INSERT INTO profile_private (profile_id, last_seen_at)
  SELECT auth.uid(), now()
  WHERE EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  ON CONFLICT (profile_id) DO UPDATE
    SET last_seen_at = EXCLUDED.last_seen_at
    WHERE profile_private.last_seen_at IS NULL
       OR profile_private.last_seen_at < now() - interval '2 minutes';
END;
$$;

REVOKE ALL ON FUNCTION public.touch_last_seen() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_last_seen(p_ids uuid[])
RETURNS TABLE (profile_id uuid, last_seen_at timestamptz)
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
    SELECT p.id, COALESCE(pp.last_seen_at, u.last_sign_in_at)
      FROM profiles p
      LEFT JOIN profile_private pp ON pp.profile_id = p.id
      LEFT JOIN auth.users u ON u.id = p.id
     WHERE p.id = ANY (p_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_last_seen(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_last_seen(uuid[]) TO authenticated;

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
    'last_seen_at', COALESCE(pp.last_seen_at, u.last_sign_in_at),
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
