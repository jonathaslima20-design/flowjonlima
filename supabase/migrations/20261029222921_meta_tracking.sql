/*
  Meta Pixel e API de Conversões (CAPI) do site BioFlowzy, configurados em Admin → Rastreamento

  - `admin_settings.meta_pixel` (leitura pública): { pixel_id, enabled, domain_verification }
  - `admin_settings.meta_capi` (só admin): { test_event_code }
  - Token da CAPI no Vault (`meta_capi_token`), gravado por `admin_set_payment_secret` (mesmo cofre das
    chaves do Mercado Pago) e lido pelas edge functions via `get_payment_secrets()` (só service_role)
  - `get_meta_config()` (só service_role): tudo que as edge functions precisam para enviar eventos
  - `payments.meta_context`: fbp/fbc, IP, navegador e URL de quem iniciou o pagamento, gravado só com
    consentimento de marketing; usado para enviar o Purchase pelo servidor quando o pagamento é aprovado
*/

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS meta_context jsonb;

INSERT INTO public.admin_settings (key, value)
VALUES ('meta_pixel', '{"pixel_id": "", "enabled": false, "domain_verification": ""}'::jsonb),
       ('meta_capi', '{"test_event_code": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS "Public read public settings" ON public.admin_settings;
CREATE POLICY "Public read public settings" ON public.admin_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('social_proof', 'pro_only_themes', 'disabled_themes', 'landing_gallery', 'meta_pixel'));

-- Cofre: aceita também o token da CAPI
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
  IF p_name NOT IN ('mp_access_token', 'mp_webhook_secret', 'mp_public_key', 'meta_capi_token') THEN
    RAISE EXCEPTION 'invalid secret name';
  END IF;
  IF p_name = 'mp_access_token' AND v_value <> '' AND v_value !~ '^(APP_USR|TEST)-[A-Za-z0-9-]{20,}$' THEN
    RAISE EXCEPTION 'O Access Token deve começar com APP_USR- (produção) ou TEST-.';
  END IF;
  IF p_name = 'mp_public_key' AND v_value <> '' AND v_value !~ '^(APP_USR|TEST)-[A-Za-z0-9-]{20,}$' THEN
    RAISE EXCEPTION 'A Public Key deve começar com APP_USR- (produção) ou TEST-.';
  END IF;
  IF p_name = 'meta_capi_token' AND v_value <> '' AND v_value !~ '^[A-Za-z0-9]{50,}$' THEN
    RAISE EXCEPTION 'Token de acesso da API de Conversões inválido.';
  END IF;
  IF length(v_value) > 1000 THEN
    RAISE EXCEPTION 'Valor muito longo.';
  END IF;

  SELECT id INTO v_id FROM vault.secrets WHERE name = p_name;

  IF v_value = '' THEN
    DELETE FROM vault.secrets WHERE id = v_id;
  ELSIF v_id IS NULL THEN
    PERFORM vault.create_secret(v_value, p_name, 'Admin BioFlowzy');
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
  FROM (VALUES ('mp_access_token'), ('mp_public_key'), ('mp_webhook_secret'), ('meta_capi_token')) AS n(name)
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
  WHERE name IN ('mp_access_token', 'mp_webhook_secret', 'mp_public_key', 'meta_capi_token');
$$;

CREATE OR REPLACE FUNCTION public.get_meta_config()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT jsonb_build_object(
    'pixel_id', coalesce((SELECT value->>'pixel_id' FROM admin_settings WHERE key = 'meta_pixel'), ''),
    'enabled', coalesce((SELECT (value->>'enabled')::boolean FROM admin_settings WHERE key = 'meta_pixel'), false),
    'test_event_code', coalesce((SELECT value->>'test_event_code' FROM admin_settings WHERE key = 'meta_capi'), ''),
    'token', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'meta_capi_token'), '')
  );
$$;

REVOKE ALL ON FUNCTION public.get_meta_config() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_meta_config() TO service_role;
