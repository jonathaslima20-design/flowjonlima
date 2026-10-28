/*
  Public Key do Mercado Pago (checkout transparente com cartão)

  - Mais uma chave no Vault, `mp_public_key`, editável em Admin → Pagamentos
  - A Public Key não é secreta (vai para o navegador para o Card Payment Brick), mas fica junto das outras
    para ser trocada no mesmo lugar; a edge function mp-payment a entrega para usuários logados
*/

CREATE OR REPLACE FUNCTION public.admin_set_payment_secret(p_name text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_value text := btrim(coalesce(p_value, ''));
  v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_name NOT IN ('mp_access_token', 'mp_webhook_secret', 'mp_public_key') THEN
    RAISE EXCEPTION 'invalid secret name';
  END IF;
  IF p_name = 'mp_access_token' AND v_value <> '' AND v_value !~ '^(APP_USR|TEST)-[A-Za-z0-9-]{20,}$' THEN
    RAISE EXCEPTION 'O Access Token deve começar com APP_USR- (produção) ou TEST-.';
  END IF;
  IF p_name = 'mp_public_key' AND v_value <> '' AND v_value !~ '^(APP_USR|TEST)-[A-Za-z0-9-]{20,}$' THEN
    RAISE EXCEPTION 'A Public Key deve começar com APP_USR- (produção) ou TEST-.';
  END IF;
  IF length(v_value) > 500 THEN
    RAISE EXCEPTION 'Valor muito longo.';
  END IF;

  SELECT id INTO v_id FROM vault.secrets WHERE name = p_name;

  IF v_value = '' THEN
    DELETE FROM vault.secrets WHERE id = v_id;
  ELSIF v_id IS NULL THEN
    PERFORM vault.create_secret(v_value, p_name, 'Mercado Pago (Admin → Pagamentos)');
  ELSE
    PERFORM vault.update_secret(v_id, v_value);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_payment_secrets_status()
RETURNS TABLE (name text, is_set boolean, hint text, updated_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT n.name,
         d.id IS NOT NULL,
         CASE WHEN d.id IS NULL THEN NULL
              WHEN n.name IN ('mp_access_token', 'mp_public_key') THEN split_part(d.decrypted_secret, '-', 1) || '-…' || right(d.decrypted_secret, 4)
              ELSE '…' || right(d.decrypted_secret, 4) END,
         d.updated_at
  FROM (VALUES ('mp_access_token'), ('mp_public_key'), ('mp_webhook_secret')) AS n(name)
  LEFT JOIN vault.decrypted_secrets d ON d.name = n.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_payment_secrets()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT coalesce(jsonb_object_agg(name, decrypted_secret), '{}'::jsonb)
  FROM vault.decrypted_secrets
  WHERE name IN ('mp_access_token', 'mp_webhook_secret', 'mp_public_key');
$$;
