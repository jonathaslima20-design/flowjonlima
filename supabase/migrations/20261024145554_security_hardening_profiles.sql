/*
  # Hardening de segurança — Fase 1

  ## Problemas corrigidos
  1. Usuários podiam alterar campos protegidos do próprio perfil (role, plano,
     validade do plano, is_pro, suspensão, indicação), virando admin ou Pro.
  2. Chave Pix, nome completo e saldo de comissão eram legíveis publicamente
     (profiles tem SELECT público).
  3. O valor do saque era definido pelo navegador e o saldo zerado pelo cliente.
  4. Usuários podiam inserir assinaturas para si mesmos.
  5. URLs de links/banners/redes aceitavam esquemas perigosos (javascript:, data:).

  ## Mudanças
  - Nova tabela `profile_private` (pix_key, pix_full_name, commission_balance),
    legível apenas pelo dono e por admins. Dados migrados e colunas removidas de `profiles`.
  - Trigger `trg_protect_profile_columns` bloqueia alterações de campos protegidos
    por usuários comuns (admins e funções SECURITY DEFINER continuam podendo).
  - Trigger `trg_protect_private_balance` impede o usuário de alterar o próprio saldo.
  - `handle_plan_upgrade_commission` passa a creditar o saldo em `profile_private`.
  - Função `request_payout()` cria o saque com o saldo calculado no servidor.
  - Remove as políticas de INSERT de usuários em `payout_requests` e `subscriptions`.
  - CHECK constraints de URL em `links`, `banners` e `social_links`.
*/

-- ---------------------------------------------------------------------------
-- 1. Dados privados do perfil
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_private (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pix_key text NOT NULL DEFAULT '',
  pix_full_name text NOT NULL DEFAULT '',
  commission_balance integer NOT NULL DEFAULT 0 CHECK (commission_balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own private profile" ON public.profile_private;
CREATE POLICY "Users read own private profile"
  ON public.profile_private FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users update own private profile" ON public.profile_private;
CREATE POLICY "Users update own private profile"
  ON public.profile_private FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Admins update private profiles" ON public.profile_private;
CREATE POLICY "Admins update private profiles"
  ON public.profile_private FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Migra os dados existentes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pix_key'
  ) THEN
    INSERT INTO public.profile_private (profile_id, pix_key, pix_full_name, commission_balance)
    SELECT id,
           COALESCE(pix_key, ''),
           COALESCE(pix_full_name, ''),
           GREATEST(COALESCE(commission_balance, 0), 0)
      FROM public.profiles
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
END $$;

-- Garante uma linha para qualquer perfil que ainda não tenha
INSERT INTO public.profile_private (profile_id)
SELECT id FROM public.profiles
ON CONFLICT (profile_id) DO NOTHING;

-- Cria a linha privada automaticamente para novos perfis
CREATE OR REPLACE FUNCTION public.create_profile_private()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile_private (profile_id) VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_profile_private ON public.profiles;
CREATE TRIGGER trg_create_profile_private
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_private();

-- Usuário pode editar Pix, mas não o próprio saldo
CREATE OR REPLACE FUNCTION public.protect_private_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Funções SECURITY DEFINER e service_role rodam com outro current_user
  IF current_user NOT IN ('authenticated', 'anon') OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.commission_balance IS DISTINCT FROM OLD.commission_balance THEN
    RAISE EXCEPTION 'Sem permissão para alterar o saldo de comissão' USING ERRCODE = '42501';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_private_balance ON public.profile_private;
CREATE TRIGGER trg_protect_private_balance
  BEFORE UPDATE ON public.profile_private
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_private_balance();

-- Comissão de indicação passa a creditar em profile_private
CREATE OR REPLACE FUNCTION public.handle_plan_upgrade_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_commission_value integer;
  v_referral_id uuid;
BEGIN
  -- Só dispara quando o plano muda de free para pro
  IF OLD.plan = NEW.plan THEN RETURN NEW; END IF;
  IF NEW.plan NOT IN ('pro_monthly', 'pro_annual') THEN RETURN NEW; END IF;
  IF OLD.plan != 'free' THEN RETURN NEW; END IF;

  v_referrer_id := NEW.referred_by;
  IF v_referrer_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.plan = 'pro_monthly' THEN
    v_commission_value := 1000; -- R$10,00
  ELSE
    v_commission_value := 10000; -- R$100,00
  END IF;

  SELECT id INTO v_referral_id
    FROM referrals
    WHERE referrer_id = v_referrer_id AND referred_id = NEW.id
    LIMIT 1;

  IF v_referral_id IS NULL THEN RETURN NEW; END IF;

  -- Evita duplicidade: só gera comissão se ainda não foi gerada
  IF EXISTS (
    SELECT 1 FROM referrals
    WHERE id = v_referral_id AND commission_value > 0
  ) THEN RETURN NEW; END IF;

  UPDATE referrals
    SET plan_type = NEW.plan,
        commission_value = v_commission_value,
        commission_status = 'pending',
        status = 'converted',
        reward_granted = true
    WHERE id = v_referral_id;

  INSERT INTO profile_private (profile_id, commission_balance)
  VALUES (v_referrer_id, v_commission_value)
  ON CONFLICT (profile_id) DO UPDATE
    SET commission_balance = profile_private.commission_balance + EXCLUDED.commission_balance,
        updated_at = now();

  RETURN NEW;
END;
$$;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS pix_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pix_full_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS commission_balance;

-- ---------------------------------------------------------------------------
-- 2. Campos protegidos do perfil
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

-- O nome faz este trigger rodar antes de trg_sync_is_pro (ordem alfabética)
DROP TRIGGER IF EXISTS trg_protect_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- 3. Saque calculado no servidor
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_payout()
RETURNS public.payout_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_priv profile_private;
  v_req payout_requests;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_priv FROM profile_private WHERE profile_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;
  IF v_priv.commission_balance < 5000 THEN
    RAISE EXCEPTION 'O saldo mínimo para saque é R$ 50,00';
  END IF;
  IF btrim(v_priv.pix_key) = '' OR btrim(v_priv.pix_full_name) = '' THEN
    RAISE EXCEPTION 'Cadastre seu nome completo e chave Pix antes de solicitar o saque';
  END IF;

  INSERT INTO payout_requests (user_id, amount_cents, pix_key, pix_full_name, status)
  VALUES (auth.uid(), v_priv.commission_balance, v_priv.pix_key, v_priv.pix_full_name, 'pending')
  RETURNING * INTO v_req;

  UPDATE profile_private
    SET commission_balance = 0, updated_at = now()
    WHERE profile_id = auth.uid();

  RETURN v_req;
END;
$$;

REVOKE ALL ON FUNCTION public.request_payout() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_payout() TO authenticated;

DROP POLICY IF EXISTS "Users create own payout requests" ON public.payout_requests;

-- ---------------------------------------------------------------------------
-- 4. Assinaturas só são criadas por admin/servidor
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own subs" ON public.subscriptions;

-- ---------------------------------------------------------------------------
-- 5. Validação de URLs
-- ---------------------------------------------------------------------------
ALTER TABLE public.links DROP CONSTRAINT IF EXISTS links_url_safe;
ALTER TABLE public.links
  ADD CONSTRAINT links_url_safe
  CHECK (url ~* '^(https?://|mailto:|tel:)');

ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_link_url_safe;
ALTER TABLE public.banners
  ADD CONSTRAINT banners_link_url_safe
  CHECK (link_url IS NULL OR link_url = '' OR link_url ~* '^(https?://|mailto:|tel:)');

-- Redes sociais aceitam texto livre (ex.: localização), então bloqueia só
-- esquemas perigosos; navegadores ignoram espaços e controles no esquema
ALTER TABLE public.social_links DROP CONSTRAINT IF EXISTS social_links_url_safe;
ALTER TABLE public.social_links
  ADD CONSTRAINT social_links_url_safe
  CHECK (regexp_replace(url, '[[:space:][:cntrl:]]', '', 'g') !~* '^(javascript|data|vbscript|file):');
