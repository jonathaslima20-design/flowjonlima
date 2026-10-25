/*
  # Gestão de saques pelo admin

  ## Mudanças
  - `admin_resolve_payout(saque, ação, observação)`, só para admins:
    - `paid`: marca o saque como pago e as comissões pendentes do usuário como pagas;
    - `rejected`: marca como recusado e devolve o valor ao saldo do usuário
      (`profile_private.commission_balance`), tudo na mesma transação;
    - só resolve saques pendentes (evita pagar/recusar duas vezes);
    - registra a ação em `admin_audit_log`.
  - Remove a policy de UPDATE direto de admins em `payout_requests`: alterar o
    status sem devolver o saldo deixaria os valores inconsistentes.
*/

CREATE OR REPLACE FUNCTION public.admin_resolve_payout(p_payout_id uuid, p_action text, p_note text DEFAULT '')
RETURNS public.payout_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout payout_requests;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('paid', 'rejected') THEN
    RAISE EXCEPTION 'Ação inválida: %', p_action;
  END IF;

  SELECT * INTO v_payout FROM payout_requests WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saque não encontrado';
  END IF;
  IF v_payout.status <> 'pending' THEN
    RAISE EXCEPTION 'Este saque já foi resolvido (%)', v_payout.status;
  END IF;

  UPDATE payout_requests
    SET status = p_action,
        admin_note = COALESCE(NULLIF(btrim(p_note), ''), admin_note),
        updated_at = now()
    WHERE id = p_payout_id
    RETURNING * INTO v_payout;

  IF p_action = 'rejected' THEN
    INSERT INTO profile_private (profile_id, commission_balance)
    VALUES (v_payout.user_id, v_payout.amount_cents)
    ON CONFLICT (profile_id) DO UPDATE
      SET commission_balance = profile_private.commission_balance + EXCLUDED.commission_balance,
          updated_at = now();
  ELSE
    UPDATE referrals
      SET commission_status = 'paid'
      WHERE referrer_id = v_payout.user_id
        AND commission_value > 0
        AND commission_status = 'pending';
  END IF;

  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (
    auth.uid(),
    CASE p_action WHEN 'paid' THEN 'payout_paid' ELSE 'payout_rejected' END,
    'payout',
    p_payout_id::text,
    jsonb_build_object('amount_cents', v_payout.amount_cents, 'user_id', v_payout.user_id, 'note', p_note)
  );

  RETURN v_payout;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_resolve_payout(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_payout(uuid, text, text) TO authenticated;

DROP POLICY IF EXISTS "Admins update payout requests" ON public.payout_requests;
