/*
  # Acesso de equipe / clientes (Business)

  O dono da conta gera um link de convite para uma página; quem aceita (com a própria conta
  BioFlowzy) passa a editar o conteúdo dessa página, sem acesso a plano, pagamento, domínio,
  indicações ou exclusão da página.

  1. `page_members` (página × usuário) e `page_invites` (token de uso único, validade de 7 dias)
  2. Limite `members` no plano (Business: 3 pessoas por conta, contando convites pendentes)
  3. `can_manage_page` passa a aceitar membros enquanto o plano da conta permitir equipe;
     `is_page_owner` continua só para o dono (usado nas ações de conta)
  4. Membros não trocam o endereço (username) da página
  5. RPCs: `create_page_invite`, `get_page_invite`, `accept_page_invite`
  6. `convite` vira username reservado (rota /convite/[token])
*/

-- 1. Tabelas -----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_page_members_user ON public.page_members(user_id);

CREATE TABLE IF NOT EXISTS public.page_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_page_invites_page ON public.page_invites(page_id);

ALTER TABLE public.page_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_invites ENABLE ROW LEVEL SECURITY;

-- 2. Limite no plano ---------------------------------------------------------------------------
UPDATE public.plans SET limits = limits || jsonb_build_object('members', CASE WHEN slug = 'business' THEN 3 ELSE 0 END);

-- 3. Permissões --------------------------------------------------------------------------------
-- Dono da conta à qual a página pertence (página principal ou extra)
CREATE OR REPLACE FUNCTION public.is_page_owner(p_profile_id uuid)
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

REVOKE ALL ON FUNCTION public.is_page_owner(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_page_owner(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_page(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_page_owner(p_profile_id) OR (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM page_members WHERE page_id = p_profile_id AND user_id = auth.uid())
    AND COALESCE((public.plan_limit(p_profile_id, 'members'))::text::integer, 0) <> 0
    AND NOT public.is_suspended(p_profile_id)
  );
$$;

-- Membros editam o perfil da página (campos de plano/conta seguem protegidos pelo trigger)
ALTER POLICY "Users update own profile" ON public.profiles
  USING (public.can_manage_page(id))
  WITH CHECK (public.can_manage_page(id));

DROP POLICY IF EXISTS "Owners and members read page members" ON public.page_members;
CREATE POLICY "Owners and members read page members" ON public.page_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_page_owner(page_id));
DROP POLICY IF EXISTS "Owners remove members, members leave" ON public.page_members;
CREATE POLICY "Owners remove members, members leave" ON public.page_members
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_page_owner(page_id));

DROP POLICY IF EXISTS "Owners read invites" ON public.page_invites;
CREATE POLICY "Owners read invites" ON public.page_invites
  FOR SELECT TO authenticated USING (public.is_page_owner(page_id));
DROP POLICY IF EXISTS "Owners revoke invites" ON public.page_invites;
CREATE POLICY "Owners revoke invites" ON public.page_invites
  FOR DELETE TO authenticated USING (public.is_page_owner(page_id));

GRANT SELECT, DELETE ON public.page_members, public.page_invites TO authenticated;

-- 4. Membro não troca o endereço da página -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_page_username_from_members()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon')
     AND NOT public.is_admin()
     AND NEW.username IS DISTINCT FROM OLD.username
     AND NOT public.is_page_owner(OLD.id)
  THEN
    RAISE EXCEPTION 'Só o dono da página pode trocar o endereço' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_page_username ON public.profiles;
CREATE TRIGGER trg_protect_page_username
  BEFORE UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_page_username_from_members();

-- 5. Convites ----------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_page_invite(p_page_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_limit integer;
  v_used integer;
  v_token text;
BEGIN
  IF v_uid IS NULL OR NOT public.is_page_owner(p_page_id) THEN
    RAISE EXCEPTION 'Página não encontrada' USING ERRCODE = '42501';
  END IF;
  IF public.is_suspended(v_uid) THEN
    RAISE EXCEPTION 'Conta suspensa' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('members:' || v_uid::text));

  v_limit := COALESCE((public.plan_limit(v_uid, 'members'))::text::integer, 0);
  IF v_limit = 0 THEN
    RAISE EXCEPTION 'Acesso de equipe está disponível no plano Business' USING ERRCODE = '42501';
  END IF;

  -- Pessoas com acesso + convites pendentes, em todas as páginas da conta
  SELECT
    (SELECT count(DISTINCT m.user_id) FROM page_members m JOIN profiles p ON p.id = m.page_id
      WHERE p.id = v_uid OR p.owner_id = v_uid)
    + (SELECT count(*) FROM page_invites i JOIN profiles p ON p.id = i.page_id
      WHERE (p.id = v_uid OR p.owner_id = v_uid) AND i.accepted_at IS NULL AND i.expires_at > now())
  INTO v_used;
  IF v_limit > 0 AND v_used >= v_limit THEN
    RAISE EXCEPTION 'Seu plano permite até % pessoa(s) na equipe (contando convites pendentes).', v_limit
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO page_invites (page_id, created_by) VALUES (p_page_id, v_uid) RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_page_invite(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.create_page_invite(uuid) TO authenticated;

-- Dados públicos da página para a tela de aceite
CREATE OR REPLACE FUNCTION public.get_page_invite(p_token text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'page_id', p.id,
    'username', p.username,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'valid', i.accepted_at IS NULL AND i.expires_at > now() AND p.suspended_at IS NULL
  )
  FROM page_invites i
  JOIN profiles p ON p.id = i.page_id
  WHERE i.token = p_token;
$$;

REVOKE ALL ON FUNCTION public.get_page_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_page_invite(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_page_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_invite page_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Faça login para aceitar o convite' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_uid AND owner_id IS NULL AND suspended_at IS NULL) THEN
    RAISE EXCEPTION 'Conta indisponível' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_invite FROM page_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND OR v_invite.accepted_at IS NOT NULL OR v_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'Convite inválido ou expirado. Peça um novo link.' USING ERRCODE = 'P0001';
  END IF;
  IF public.is_page_owner(v_invite.page_id) THEN
    RAISE EXCEPTION 'Esta página já é sua.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO page_members (page_id, user_id) VALUES (v_invite.page_id, v_uid)
  ON CONFLICT (page_id, user_id) DO NOTHING;
  UPDATE page_invites SET accepted_by = v_uid, accepted_at = now() WHERE id = v_invite.id;
  RETURN v_invite.page_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_page_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_page_invite(text) TO authenticated;

-- 6. Rota /convite -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_reserved_username(p_username text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(p_username) = ANY (ARRAY[
    -- rotas do app
    'admin', 'api', 'dashboard', 'login', 'logout', 'register', 'signup', 'signin',
    'forgot-password', 'reset-password', 'auth', 'callback', 'icon', 'og-image',
    'robots.txt', 'sitemap.xml', 'favicon.ico', '_next', 'static', 'assets', 'public',
    'convite', 'convites', 'invite',
    -- institucionais
    'bioflowzy', 'www', 'app', 'help', 'ajuda', 'suporte', 'support', 'contato', 'contact',
    'about', 'sobre', 'blog', 'pricing', 'precos', 'planos', 'plans', 'terms', 'termos',
    'privacy', 'privacidade', 'settings', 'config', 'account', 'conta', 'billing',
    'checkout', 'pagamento', 'status', 'docs', 'root', 'null', 'undefined', 'system'
  ]);
$$;
