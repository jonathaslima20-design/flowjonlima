/*
  # Fase B2: captura de leads e QR code

  ## Mudanças
  - `page_leads`: contatos deixados pelos visitantes no formulário da página
    pública (nome, e-mail, WhatsApp, data do consentimento). Só o dono e admins
    leem; o dono pode apagar. Inserção só pela RPC `submit_lead`.
  - `submit_lead`: valida o perfil, exige e-mail ou WhatsApp válido e o
    consentimento, respeita o limite mensal do plano (`leads`: 0 no Free, 100 no
    Pro, ilimitado no Business), descarta repetição do mesmo contato no dia e
    limita envios por visitante (hash do IP, sem guardar o IP).
  - `lead_usage()`: quantos leads o usuário recebeu no mês e o limite do plano.
  - Novo limite `qr_code` (Pro e Business).
*/

UPDATE public.plans SET limits = limits || '{"qr_code": false}'::jsonb WHERE slug = 'free';
UPDATE public.plans SET limits = limits || '{"qr_code": true}'::jsonb WHERE slug IN ('pro', 'business');
UPDATE public.plans
  SET features = '["Tudo do Free","Todos os temas e personalização completa","Remoção da marca BioFlowzy","Banners e vídeos ilimitados","Analytics completo: visitas, origem e dispositivo","Captura de leads (até 100 por mês)","Agendamento de links","QR code da página","SEO e prévia de compartilhamento","Domínio personalizado","Meta Pixel e Google Analytics","Indique e ganhe"]'::jsonb
  WHERE slug = 'pro';

CREATE TABLE IF NOT EXISTS public.page_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '' CHECK (char_length(name) <= 80),
  email text CHECK (email IS NULL OR char_length(email) <= 120),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 20),
  consent_at timestamptz NOT NULL DEFAULT now(),
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS page_leads_profile_date_idx ON public.page_leads (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS page_leads_visitor_idx ON public.page_leads (visitor_hash, created_at DESC);

ALTER TABLE public.page_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read own leads" ON public.page_leads;
CREATE POLICY "Owners read own leads"
  ON public.page_leads FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Owners delete own leads" ON public.page_leads;
CREATE POLICY "Owners delete own leads"
  ON public.page_leads FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.submit_lead(
  p_profile_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_consent boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_headers json;
  v_ip text;
  v_visitor text;
  v_name text := left(btrim(COALESCE(p_name, '')), 80);
  v_email text := NULLIF(lower(btrim(COALESCE(p_email, ''))), '');
  v_phone text := NULLIF(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), '');
  v_limit integer;
BEGIN
  IF p_profile_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND suspended_at IS NULL) THEN
    RAISE EXCEPTION 'Página não encontrada';
  END IF;

  IF NOT COALESCE(p_consent, false) THEN
    RAISE EXCEPTION 'É preciso autorizar o contato';
  END IF;
  IF v_email IS NOT NULL AND (char_length(v_email) > 120 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;
  IF v_phone IS NOT NULL AND char_length(v_phone) NOT BETWEEN 10 AND 15 THEN
    RAISE EXCEPTION 'WhatsApp inválido';
  END IF;
  IF v_email IS NULL AND v_phone IS NULL THEN
    RAISE EXCEPTION 'Informe um e-mail ou WhatsApp';
  END IF;

  v_limit := COALESCE((public.plan_limit(p_profile_id, 'leads'))::text::integer, 0);
  IF v_limit = 0 THEN
    RAISE EXCEPTION 'Esta página não está recebendo contatos no momento';
  END IF;

  v_headers := COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::json;
  v_ip := COALESCE(
    NULLIF(v_headers->>'cf-connecting-ip', ''),
    NULLIF(btrim(split_part(v_headers->>'x-forwarded-for', ',', 1)), ''),
    NULLIF(v_headers->>'x-real-ip', ''),
    'unknown'
  );
  v_visitor := md5(v_ip || ':' || p_profile_id::text);

  PERFORM pg_advisory_xact_lock(hashtext('lead:' || p_profile_id::text));

  IF (SELECT count(*) FROM page_leads
      WHERE visitor_hash = v_visitor AND created_at > now() - interval '10 minutes') >= 3 THEN
    RAISE EXCEPTION 'Muitos envios. Tente novamente em alguns minutos';
  END IF;

  -- Mesmo contato no mesmo dia: considera enviado sem duplicar
  IF EXISTS (
    SELECT 1 FROM page_leads
    WHERE profile_id = p_profile_id AND created_at > now() - interval '1 day'
      AND ((v_email IS NOT NULL AND email = v_email) OR (v_phone IS NOT NULL AND phone = v_phone))
  ) THEN
    RETURN true;
  END IF;

  IF v_limit > 0 AND (SELECT count(*) FROM page_leads
      WHERE profile_id = p_profile_id AND created_at >= date_trunc('month', now())) >= v_limit THEN
    RAISE EXCEPTION 'Esta página atingiu o limite de contatos deste mês';
  END IF;

  INSERT INTO page_leads (profile_id, name, email, phone, visitor_hash)
  VALUES (p_profile_id, v_name, v_email, v_phone, v_visitor);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_lead(uuid, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lead(uuid, text, text, text, boolean) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.lead_usage()
RETURNS json
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT json_build_object(
    'used', (SELECT count(*) FROM page_leads WHERE profile_id = auth.uid() AND created_at >= date_trunc('month', now())),
    'limit', COALESCE((public.plan_limit(auth.uid(), 'leads'))::text::integer, 0)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.lead_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lead_usage() TO authenticated;
