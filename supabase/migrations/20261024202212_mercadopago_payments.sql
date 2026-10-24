/*
  # Pagamentos via Mercado Pago (Checkout Pro, pagamento por período)

  ## Fluxo
  1. Edge function `mp-checkout` cria uma linha `pending` em `payments` e uma
     preferência no Mercado Pago com `external_reference = payments.id`.
  2. Edge function `mp-webhook` recebe a notificação, consulta o pagamento na API
     do Mercado Pago e, se aprovado, chama `grant_paid_plan(payments.id)`.
  3. `grant_paid_plan` libera o plano por 1 mês/1 ano. Se já houver plano pago
     vigente, estende a partir da expiração atual. É idempotente.

  ## Segurança
  - `payments`: usuário lê só os próprios; admin lê todos; ninguém escreve pela API
    (só as edge functions, com service_role).
  - `grant_paid_plan` só pode ser executada por service_role.
  - Também corrige o search_path de `is_reserved_username` (aviso do Advisor).
*/

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_slug text NOT NULL CHECK (plan_slug IN ('pro_monthly', 'pro_annual')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  -- pending | approved | in_process | rejected | cancelled | refunded | charged_back | error
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'mercadopago',
  mp_preference_id text,
  mp_payment_id text UNIQUE,
  mp_status_detail text,
  paid_at timestamptz,
  plan_granted_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_profile_idx ON public.payments(profile_id, created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());

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

  -- Plano pago sem expiração (concedido manualmente pelo admin): só registra o pagamento
  IF v_active AND v_prof.plan_expires_at IS NULL THEN
    UPDATE payments
      SET status = 'approved', paid_at = COALESCE(paid_at, now()), updated_at = now()
      WHERE id = p_payment_id;
    RETURN NULL;
  END IF;

  v_base := CASE WHEN v_active THEN v_prof.plan_expires_at ELSE now() END;
  v_until := v_base + CASE v_pay.plan_slug WHEN 'pro_annual' THEN interval '1 year' ELSE interval '1 month' END;

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

  RETURN v_until;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_paid_plan(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_paid_plan(uuid) TO service_role;

ALTER FUNCTION public.is_reserved_username(text) SET search_path = public;
