/*
  # Lançamento do plano Business

  1. `grant_paid_plan`: ao trocar de plano com o atual ainda vigente (ex.: Pro → Business),
     os dias restantes viram crédito proporcional ao preço anual de cada plano, e o novo
     período começa a contar a partir desse crédito. Renovação do mesmo plano continua
     somando a partir da expiração vigente
  2. Business passa a ser vendido (`is_active = true`)
*/

CREATE OR REPLACE FUNCTION public.grant_paid_plan(p_payment_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pay payments;
  v_prof profiles;
  v_current text;
  v_active boolean;
  v_old_price integer;
  v_new_price integer;
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
  v_current := public.effective_plan(v_prof.id);
  v_active := v_current <> 'free';

  IF v_active AND v_prof.plan_expires_at IS NULL AND v_current = v_pay.plan_slug THEN
    -- Mesmo plano já concedido sem expiração pelo admin: só registra o pagamento
    UPDATE payments
      SET status = 'approved', paid_at = COALESCE(paid_at, now()), updated_at = now()
      WHERE id = p_payment_id;
    v_until := NULL;
  ELSE
    IF v_active AND v_prof.plan_expires_at IS NOT NULL AND v_current <> v_pay.plan_slug THEN
      -- Troca de plano: dias restantes convertidos pelo preço anual de cada plano
      SELECT price_annual_cents INTO v_old_price FROM plans WHERE slug = v_current;
      SELECT price_annual_cents INTO v_new_price FROM plans WHERE slug = v_pay.plan_slug;
      v_base := now() + (v_prof.plan_expires_at - now())
        * (COALESCE(v_old_price, 0)::float8 / GREATEST(COALESCE(v_new_price, 1), 1));
    ELSIF v_active AND v_prof.plan_expires_at IS NOT NULL THEN
      v_base := v_prof.plan_expires_at;
    ELSE
      v_base := now();
    END IF;
    v_until := v_base + CASE v_pay.period WHEN 'annual' THEN interval '1 year' ELSE interval '3 months' END;

    UPDATE profiles
      SET plan = v_pay.plan_slug,
          plan_expires_at = v_until,
          plan_started_at = CASE WHEN v_active AND v_current = v_pay.plan_slug THEN plan_started_at ELSE now() END
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

REVOKE ALL ON FUNCTION public.grant_paid_plan(uuid) FROM public, anon, authenticated;

UPDATE public.plans SET is_active = true WHERE slug = 'business';
