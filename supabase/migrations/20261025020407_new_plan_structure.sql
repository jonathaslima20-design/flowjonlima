/*
  # Nova estrutura de planos: Free, Pro e Business (pacotes trimestral e anual)

  ## Mudanças
  - Catálogo `plans`:
    - `pro_monthly` vira `pro` e `pro_annual` vira `business` (mesmos ids);
    - `price_cents` passa a ser o preço do pacote trimestral e a nova coluna
      `price_annual_cents` o do anual;
    - Business fica inativo (`is_active = false`) até os recursos dele existirem;
    - novos limites: links e redes ilimitados no Free, `pro_themes`,
      `analytics_days`, `leads`, `pages`.
    - os links de pagamento manuais (`button_url`) são apagados: os valores mudaram.
  - Perfis em `pro_monthly`/`pro_annual` passam para `pro`.
  - `payments`: coluna `period` (`quarterly` | `annual`) e planos `pro`/`business`;
    `grant_paid_plan` libera 3 meses ou 1 ano.
  - Comissão de indicação: sai do trigger em `profiles` (que pagava mesmo quando o
    admin dava o plano manualmente) e passa a ser 30% do primeiro pagamento
    aprovado do indicado, calculada em `grant_paid_plan`.
  - Temas Pro: `admin_settings.pro_only_themes` recebe todos os temas exceto 4
    gratuitos; `protect_profile_columns` impede o Free de escolher tema Pro.
*/

-- ---------------------------------------------------------------------------
-- 1. Catálogo de planos
-- ---------------------------------------------------------------------------
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS price_annual_cents integer;

UPDATE public.plans SET
  name = 'Free',
  billing_period = 'free',
  price_cents = 0,
  price_annual_cents = 0,
  features = '["Links ilimitados","Redes sociais ilimitadas","1 banner e 1 vídeo","4 temas","Analytics dos últimos 7 dias"]'::jsonb,
  limits = '{"links":-1,"socials":-1,"banners":1,"videos":1,"analytics":"basic","analytics_days":7,"pro_themes":false,"custom_domain":false,"pixel_ga":false,"remove_logo":false,"referral":false,"priority_support":false,"early_access":false,"leads":0,"pages":1}'::jsonb
WHERE slug = 'free';

UPDATE public.plans SET
  slug = 'pro',
  name = 'Pro',
  billing_period = 'quarterly',
  price_cents = 8970,          -- R$ 29,90/mês no trimestral
  price_annual_cents = 23880,  -- R$ 19,90/mês no anual
  is_active = true,
  button_label = 'ASSINAR PRO',
  button_url = NULL,
  features = '["Tudo do Free","Todos os temas e personalização completa","Remoção da marca BioFlowzy","Banners e vídeos ilimitados","Analytics completo","Domínio personalizado","Meta Pixel e Google Analytics","Indique e ganhe"]'::jsonb,
  limits = '{"links":-1,"socials":-1,"banners":-1,"videos":-1,"analytics":"advanced","analytics_days":90,"pro_themes":true,"custom_domain":true,"pixel_ga":true,"remove_logo":true,"referral":true,"priority_support":false,"early_access":false,"leads":100,"pages":1}'::jsonb
WHERE slug = 'pro_monthly';

UPDATE public.plans SET
  slug = 'business',
  name = 'Business',
  billing_period = 'quarterly',
  price_cents = 17970,         -- R$ 59,90/mês no trimestral
  price_annual_cents = 47880,  -- R$ 39,90/mês no anual
  is_active = false,           -- lança quando múltiplas páginas e leads existirem
  button_label = 'ASSINAR BUSINESS',
  button_url = NULL,
  features = '["Tudo do Pro","Até 5 páginas","Acesso para clientes e equipe","Leads ilimitados com exportação","Analytics de 1 ano com exportação","Suporte prioritário no WhatsApp"]'::jsonb,
  limits = '{"links":-1,"socials":-1,"banners":-1,"videos":-1,"analytics":"advanced","analytics_days":365,"pro_themes":true,"custom_domain":true,"pixel_ga":true,"remove_logo":true,"referral":true,"priority_support":true,"early_access":true,"leads":-1,"pages":5}'::jsonb
WHERE slug = 'pro_annual';

-- ---------------------------------------------------------------------------
-- 2. Comissão sai do trigger de perfis (passa para grant_paid_plan)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_plan_upgrade_commission ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_plan_upgrade_commission();

-- ---------------------------------------------------------------------------
-- 3. Perfis e is_pro
-- ---------------------------------------------------------------------------
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
  -- Ensure referral_code exists
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.profiles SET plan = 'pro' WHERE plan IN ('pro_monthly', 'pro_annual');

-- ---------------------------------------------------------------------------
-- 4. Pagamentos por período
-- ---------------------------------------------------------------------------
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS period text NOT NULL DEFAULT 'quarterly';
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_period_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_period_check CHECK (period IN ('quarterly', 'annual'));
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_plan_slug_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_plan_slug_check CHECK (plan_slug IN ('pro', 'business'));

CREATE OR REPLACE FUNCTION public.grant_paid_plan(p_payment_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pay payments;
  v_prof profiles;
  v_active boolean;
  v_base timestamptz;
  v_until timestamptz;
  v_referral_id uuid;
  v_commission integer;
BEGIN
  SELECT * INTO v_pay FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pagamento % não encontrado', p_payment_id;
  END IF;

  -- Idempotente: o webhook pode chegar mais de uma vez
  IF v_pay.plan_granted_until IS NOT NULL THEN
    RETURN v_pay.plan_granted_until;
  END IF;

  SELECT * INTO v_prof FROM profiles WHERE id = v_pay.profile_id FOR UPDATE;
  v_active := public.effective_plan(v_prof.id) <> 'free';

  IF v_active AND v_prof.plan_expires_at IS NULL THEN
    -- Plano pago sem expiração (concedido manualmente pelo admin): só registra o pagamento
    UPDATE payments
      SET status = 'approved', paid_at = COALESCE(paid_at, now()), updated_at = now()
      WHERE id = p_payment_id;
    v_until := NULL;
  ELSE
    v_base := CASE WHEN v_active THEN v_prof.plan_expires_at ELSE now() END;
    v_until := v_base + CASE v_pay.period WHEN 'annual' THEN interval '1 year' ELSE interval '3 months' END;

    UPDATE profiles
      SET plan = v_pay.plan_slug,
          plan_expires_at = v_until,
          plan_started_at = CASE WHEN v_active THEN plan_started_at ELSE now() END
      WHERE id = v_prof.id;

    UPDATE payments
      SET status = 'approved',
          paid_at = COALESCE(paid_at, now()),
          plan_granted_until = v_until,
          updated_at = now()
      WHERE id = p_payment_id;
  END IF;

  -- Comissão: 30% do primeiro pagamento aprovado de quem foi indicado
  IF v_prof.referred_by IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM payments
       WHERE profile_id = v_prof.id AND status = 'approved' AND id <> p_payment_id
     )
  THEN
    SELECT id INTO v_referral_id
      FROM referrals
      WHERE referrer_id = v_prof.referred_by AND referred_id = v_prof.id AND COALESCE(commission_value, 0) = 0
      LIMIT 1;

    IF v_referral_id IS NOT NULL THEN
      v_commission := round(v_pay.amount_cents * 0.30);

      UPDATE referrals
        SET plan_type = v_pay.plan_slug,
            commission_value = v_commission,
            commission_status = 'pending',
            status = 'converted',
            reward_granted = true
        WHERE id = v_referral_id;

      INSERT INTO profile_private (profile_id, commission_balance)
      VALUES (v_prof.referred_by, v_commission)
      ON CONFLICT (profile_id) DO UPDATE
        SET commission_balance = profile_private.commission_balance + EXCLUDED.commission_balance,
            updated_at = now();
    END IF;
  END IF;

  RETURN v_until;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_paid_plan(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_paid_plan(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Temas Pro
-- ---------------------------------------------------------------------------
INSERT INTO public.admin_settings (key, value, updated_at)
VALUES (
  'pro_only_themes',
  '["agency","atlas","chrome","conversion","cosmos","creator","cyber","forest","glitch","lava","neonlab","prism","retrowave","terminal"]'::jsonb,
  now()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

CREATE OR REPLACE FUNCTION public.is_pro_only_theme(p_theme text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_settings
    WHERE key = 'pro_only_themes' AND value ? p_theme
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_pro_only_theme(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pro_only_theme(text) TO authenticated;

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

  RETURN NEW;
END;
$$;
