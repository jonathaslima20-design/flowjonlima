-- Programa de parceiros (agências, influenciadores, mídia, consultores).
-- Candidatura → aprovação no admin → link /p/<code> + cupom. Clientes atribuídos pelo link, cupom,
-- convite (cliente gerenciado), licença ou manualmente; o vínculo trava no primeiro pagamento.
-- Comissão recorrente por nível (clientes pagantes ativos), com carência antes de liberar,
-- bônus de meta, estorno em reembolso/chargeback e saque por PIX. Teste Pro pelo link do parceiro,
-- licenças no atacado e diretório público de parceiros.

-- ───────────────────────── Configuração ─────────────────────────

INSERT INTO admin_settings (key, value) VALUES ('partner_program', jsonb_build_object(
  'enabled', true,
  'tiers', jsonb_build_array(
    jsonb_build_object('name', 'Parceiro', 'min', 0, 'rate', 25),
    jsonb_build_object('name', 'Prata', 'min', 10, 'rate', 30),
    jsonb_build_object('name', 'Ouro', 'min', 30, 'rate', 35),
    jsonb_build_object('name', 'Diamante', 'min', 100, 'rate', 40)
  ),
  'recurring_months', 0,
  'coupon_discount_pct', 10,
  'hold_days', 30,
  'cookie_days', 60,
  'min_payout_cents', 5000,
  'bonuses', jsonb_build_array(
    jsonb_build_object('clients', 10, 'cents', 15000),
    jsonb_build_object('clients', 30, 'cents', 50000)
  ),
  'trial_days', 14,
  'trial_plan', 'pro',
  'wholesale_enabled', true,
  'wholesale_discount_pct', 40,
  'wholesale_min_qty', 5
))
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS "Public read public settings" ON admin_settings;
CREATE POLICY "Public read public settings" ON admin_settings FOR SELECT TO anon, authenticated
  USING (key = ANY (ARRAY['social_proof', 'pro_only_themes', 'disabled_themes', 'landing_gallery', 'meta_pixel', 'partner_program']));

CREATE OR REPLACE FUNCTION public.partner_setting(p_key text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT value -> p_key FROM admin_settings WHERE key = 'partner_program';
$$;

-- ───────────────────────── Tabelas ─────────────────────────

CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('agency', 'influencer', 'media', 'consultant', 'other')),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  company text NOT NULL DEFAULT '' CHECK (length(company) <= 120),
  document text NOT NULL DEFAULT '' CHECK (document ~ '^([0-9]{11}|[0-9]{14})?$'),
  whatsapp text NOT NULL DEFAULT '',
  channels text NOT NULL DEFAULT '' CHECK (length(channels) <= 500),
  audience text NOT NULL DEFAULT '' CHECK (length(audience) <= 120),
  message text NOT NULL DEFAULT '' CHECK (length(message) <= 1000),
  code text UNIQUE CHECK (code ~ '^[a-z0-9-]{3,30}$'),
  coupon_code text UNIQUE CHECK (coupon_code ~ '^[A-Z0-9]{4,20}$'),
  custom_rate numeric(5,2) CHECK (custom_rate BETWEEN 0 AND 90),
  custom_discount_pct integer CHECK (custom_discount_pct BETWEEN 0 AND 50),
  pix_key text NOT NULL DEFAULT '' CHECK (length(pix_key) <= 140),
  pix_full_name text NOT NULL DEFAULT '' CHECK (length(pix_full_name) <= 140),
  directory_listed boolean NOT NULL DEFAULT false,
  directory_bio text NOT NULL DEFAULT '' CHECK (length(directory_bio) <= 300),
  city text NOT NULL DEFAULT '' CHECK (length(city) <= 80),
  specialties text NOT NULL DEFAULT '' CHECK (length(specialties) <= 200),
  admin_note text NOT NULL DEFAULT '',
  terms_accepted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_partners_status ON partners(status);

-- Clientes atribuídos (um parceiro por conta). trial_until: fim do teste dado pelo link do parceiro
CREATE TABLE public.partner_clients (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('link', 'coupon', 'invite', 'manual', 'license')),
  managed boolean NOT NULL DEFAULT false,
  attributed_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  trial_until timestamptz
);
CREATE INDEX idx_partner_clients_partner ON partner_clients(partner_id);

CREATE TABLE public.partner_clicks (
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date,
  clicks integer NOT NULL DEFAULT 0,
  PRIMARY KEY (partner_id, day)
);

CREATE TABLE public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  pix_key text NOT NULL,
  pix_full_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  admin_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX idx_partner_payouts_partner ON partner_payouts(partner_id);

-- Extrato. status 'pending' = vale (liberado quando available_at passa); pago = payout com status paid
CREATE TABLE public.partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  client_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('commission', 'bonus', 'reversal', 'adjustment')),
  base_cents integer NOT NULL DEFAULT 0,
  rate numeric(5,2),
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reversed')),
  available_at timestamptz NOT NULL DEFAULT now(),
  payout_id uuid REFERENCES partner_payouts(id) ON DELETE SET NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_partner_commissions_partner ON partner_commissions(partner_id);
CREATE UNIQUE INDEX idx_partner_commissions_payment_kind ON partner_commissions(payment_id, kind) WHERE payment_id IS NOT NULL;

CREATE TABLE public.partner_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  plan_slug text NOT NULL CHECK (plan_slug IN ('pro', 'business')),
  period text NOT NULL CHECK (period IN ('quarterly', 'annual')),
  purchase_payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'revoked')),
  assigned_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_partner_licenses_partner ON partner_licenses(partner_id);

CREATE TABLE public.partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  client_name text NOT NULL DEFAULT '' CHECK (length(client_name) <= 120),
  managed boolean NOT NULL DEFAULT true,
  license_id uuid REFERENCES partner_licenses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  accepted_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at timestamptz
);
CREATE INDEX idx_partner_invites_partner ON partner_invites(partner_id);

-- Pagamentos: compra de licenças (kind = 'license') e desconto do cupom
ALTER TABLE payments
  ADD COLUMN kind text NOT NULL DEFAULT 'plan' CHECK (kind IN ('plan', 'license')),
  ADD COLUMN quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 500),
  ADD COLUMN list_cents integer,
  ADD COLUMN discount_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN coupon_code text,
  ADD COLUMN partner_id uuid REFERENCES partners(id) ON DELETE SET NULL;

-- ───────────────────────── RLS ─────────────────────────

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_invites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_partner_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM partners WHERE profile_id = auth.uid();
$$;

-- Parceiro lê o que é dele; escrita só pelas funções abaixo (e pelo admin)
CREATE POLICY "Partner reads own" ON partners FOR SELECT TO authenticated USING (profile_id = auth.uid() OR is_admin());
CREATE POLICY "Admin updates partners" ON partners FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Partner reads own clients" ON partner_clients FOR SELECT TO authenticated USING (partner_id = my_partner_id() OR is_admin());
CREATE POLICY "Partner reads own clicks" ON partner_clicks FOR SELECT TO authenticated USING (partner_id = my_partner_id() OR is_admin());
CREATE POLICY "Partner reads own payouts" ON partner_payouts FOR SELECT TO authenticated USING (partner_id = my_partner_id() OR is_admin());
CREATE POLICY "Partner reads own commissions" ON partner_commissions FOR SELECT TO authenticated USING (partner_id = my_partner_id() OR is_admin());
CREATE POLICY "Partner reads own licenses" ON partner_licenses FOR SELECT TO authenticated USING (partner_id = my_partner_id() OR is_admin());
CREATE POLICY "Partner reads own invites" ON partner_invites FOR SELECT TO authenticated USING (partner_id = my_partner_id() OR is_admin());
CREATE POLICY "Partner deletes own open invites" ON partner_invites FOR DELETE TO authenticated
  USING (partner_id = my_partner_id() AND accepted_at IS NULL);

-- ───────────────────────── Níveis e contagens ─────────────────────────

-- Cliente em teste (plano dado pelo link do parceiro, ainda sem pagamento que estenda o prazo)
CREATE OR REPLACE FUNCTION public.is_on_trial(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM partner_clients pc JOIN profiles p ON p.id = pc.profile_id
    WHERE pc.profile_id = p_profile_id
      AND pc.trial_until IS NOT NULL
      AND p.plan_expires_at IS NOT NULL
      AND p.plan_expires_at <= pc.trial_until
      AND p.plan_expires_at > now()
  );
$$;

-- Clientes pagantes ativos (plano vigente, fora do teste)
CREATE OR REPLACE FUNCTION public.partner_active_clients(p_partner_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM partner_clients pc JOIN profiles p ON p.id = pc.profile_id
  WHERE pc.partner_id = p_partner_id
    AND public.effective_plan(p.id) <> 'free'
    AND NOT (pc.trial_until IS NOT NULL AND p.plan_expires_at IS NOT NULL AND p.plan_expires_at <= pc.trial_until);
$$;

CREATE OR REPLACE FUNCTION public.partner_tier(p_partner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_active integer := public.partner_active_clients(p_partner_id);
  v_custom numeric;
  v_cur jsonb;
  v_next jsonb;
BEGIN
  SELECT custom_rate INTO v_custom FROM partners WHERE id = p_partner_id;
  SELECT t.v INTO v_cur FROM jsonb_array_elements(COALESCE(public.partner_setting('tiers'), '[]')) AS t(v)
    WHERE (t.v->>'min')::int <= v_active ORDER BY (t.v->>'min')::int DESC LIMIT 1;
  SELECT t.v INTO v_next FROM jsonb_array_elements(COALESCE(public.partner_setting('tiers'), '[]')) AS t(v)
    WHERE (t.v->>'min')::int > v_active ORDER BY (t.v->>'min')::int LIMIT 1;
  RETURN jsonb_build_object(
    'active_clients', v_active,
    'name', COALESCE(v_cur->>'name', 'Parceiro'),
    'rate', COALESCE(v_custom, (v_cur->>'rate')::numeric, 25),
    'custom', v_custom IS NOT NULL,
    'next_name', v_next->>'name',
    'next_min', (v_next->>'min')::int,
    'next_rate', (v_next->>'rate')::numeric
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.partner_discount_pct(p_partner_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(custom_discount_pct, (public.partner_setting('coupon_discount_pct'))::text::int, 0)
  FROM partners WHERE id = p_partner_id;
$$;

-- ───────────────────────── Candidatura e perfil do parceiro ─────────────────────────

CREATE OR REPLACE FUNCTION public.apply_partner(
  p_kind text, p_name text, p_company text, p_document text, p_whatsapp text,
  p_channels text, p_audience text, p_message text
)
RETURNS partners
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row partners;
  v_doc text := regexp_replace(COALESCE(p_document, ''), '\D', '', 'g');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Faça login para se candidatar' USING ERRCODE = '42501';
  END IF;
  IF NOT COALESCE((public.partner_setting('enabled'))::text::boolean, false) THEN
    RAISE EXCEPTION 'O programa de parceiros não está recebendo candidaturas no momento';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_uid AND owner_id IS NULL AND suspended_at IS NULL) THEN
    RAISE EXCEPTION 'Conta indisponível' USING ERRCODE = '42501';
  END IF;
  IF length(v_doc) NOT IN (11, 14) THEN
    RAISE EXCEPTION 'Informe um CPF ou CNPJ válido';
  END IF;
  IF public.normalize_whatsapp(p_whatsapp) = '' THEN
    RAISE EXCEPTION 'Informe um WhatsApp válido com DDD';
  END IF;

  SELECT * INTO v_row FROM partners WHERE profile_id = v_uid FOR UPDATE;
  IF FOUND AND v_row.status IN ('pending', 'active', 'suspended') THEN
    RAISE EXCEPTION 'Você já tem uma candidatura (%)', v_row.status;
  END IF;

  INSERT INTO partners (profile_id, kind, name, company, document, whatsapp, channels, audience, message, terms_accepted_at, status)
  VALUES (
    v_uid,
    CASE WHEN p_kind IN ('agency', 'influencer', 'media', 'consultant') THEN p_kind ELSE 'other' END,
    left(btrim(p_name), 120), left(btrim(COALESCE(p_company, '')), 120), v_doc,
    public.normalize_whatsapp(p_whatsapp), left(btrim(COALESCE(p_channels, '')), 500),
    left(btrim(COALESCE(p_audience, '')), 120), left(btrim(COALESCE(p_message, '')), 1000), now(), 'pending'
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    kind = EXCLUDED.kind, name = EXCLUDED.name, company = EXCLUDED.company, document = EXCLUDED.document,
    whatsapp = EXCLUDED.whatsapp, channels = EXCLUDED.channels, audience = EXCLUDED.audience,
    message = EXCLUDED.message, terms_accepted_at = now(), status = 'pending', updated_at = now()
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- Campos que o próprio parceiro edita (PIX, contato e diretório)
CREATE OR REPLACE FUNCTION public.partner_update_profile(p jsonb)
RETURNS partners
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row partners;
BEGIN
  UPDATE partners SET
    whatsapp = CASE WHEN p ? 'whatsapp' AND public.normalize_whatsapp(p->>'whatsapp') <> '' THEN public.normalize_whatsapp(p->>'whatsapp') ELSE whatsapp END,
    channels = COALESCE(left(btrim(p->>'channels'), 500), channels),
    pix_key = COALESCE(left(btrim(p->>'pix_key'), 140), pix_key),
    pix_full_name = COALESCE(left(btrim(p->>'pix_full_name'), 140), pix_full_name),
    directory_listed = COALESCE((p->>'directory_listed')::boolean, directory_listed),
    directory_bio = COALESCE(left(btrim(p->>'directory_bio'), 300), directory_bio),
    city = COALESCE(left(btrim(p->>'city'), 80), city),
    specialties = COALESCE(left(btrim(p->>'specialties'), 200), specialties),
    updated_at = now()
  WHERE profile_id = auth.uid()
  RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Você não é parceiro' USING ERRCODE = '42501';
  END IF;
  RETURN v_row;
END;
$$;

-- ───────────────────────── Atribuição ─────────────────────────

-- Clique no link /p/<code> (anônimo). Devolve se o código é válido
CREATE OR REPLACE FUNCTION public.track_partner_click(p_code text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM partners WHERE code = lower(btrim(p_code)) AND status = 'active';
  IF v_id IS NULL THEN RETURN false; END IF;
  INSERT INTO partner_clicks (partner_id, day, clicks) VALUES (v_id, current_date, 1)
  ON CONFLICT (partner_id, day) DO UPDATE SET clicks = partner_clicks.clicks + 1;
  RETURN true;
END;
$$;

-- Liga a conta ao parceiro. Não troca um vínculo travado (já houve pagamento) e bloqueia
-- autoindicação (mesma conta ou mesmo WhatsApp do parceiro). Vínculo pelo link não substitui outro.
CREATE OR REPLACE FUNCTION public.partner_attach(p_profile_id uuid, p_partner_id uuid, p_source text, p_managed boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_partner partners;
  v_cur partner_clients;
  v_wa text;
BEGIN
  SELECT * INTO v_partner FROM partners WHERE id = p_partner_id AND status = 'active';
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_partner.profile_id = p_profile_id THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND owner_id IS NULL) THEN RETURN false; END IF;
  SELECT whatsapp INTO v_wa FROM profile_private WHERE profile_id = p_profile_id;
  IF COALESCE(v_wa, '') <> '' AND (v_wa = v_partner.whatsapp
     OR v_wa = (SELECT whatsapp FROM profile_private WHERE profile_id = v_partner.profile_id)) THEN
    RETURN false;
  END IF;

  SELECT * INTO v_cur FROM partner_clients WHERE profile_id = p_profile_id FOR UPDATE;
  IF FOUND THEN
    IF v_cur.partner_id = p_partner_id THEN
      IF p_managed AND NOT v_cur.managed THEN
        UPDATE partner_clients SET managed = true WHERE profile_id = p_profile_id;
      END IF;
    ELSIF v_cur.locked_at IS NOT NULL OR p_source = 'link' THEN
      RETURN false;
    ELSE
      UPDATE partner_clients
        SET partner_id = p_partner_id, source = p_source, managed = p_managed, attributed_at = now()
        WHERE profile_id = p_profile_id;
    END IF;
  ELSE
    -- Quem já pagou antes sem parceiro não passa a gerar comissão
    IF p_source IN ('link', 'coupon', 'invite')
       AND EXISTS (SELECT 1 FROM payments WHERE profile_id = p_profile_id AND status = 'approved' AND kind = 'plan') THEN
      RETURN false;
    END IF;
    INSERT INTO partner_clients (profile_id, partner_id, source, managed)
    VALUES (p_profile_id, p_partner_id, p_source, p_managed);
  END IF;

  IF p_managed THEN
    INSERT INTO page_members (page_id, user_id) VALUES (p_profile_id, v_partner.profile_id)
    ON CONFLICT (page_id, user_id) DO NOTHING;
  END IF;
  RETURN true;
END;
$$;

-- Teste do plano pago para quem chega pelo parceiro (uma vez por WhatsApp)
CREATE OR REPLACE FUNCTION public.partner_start_trial(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_days integer := COALESCE((public.partner_setting('trial_days'))::text::int, 0);
  v_plan text := COALESCE(public.partner_setting('trial_plan') #>> '{}', 'pro');
  v_wa text;
  v_until timestamptz;
BEGIN
  IF v_days <= 0 OR v_plan NOT IN ('pro', 'business') THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM partner_clients WHERE profile_id = p_profile_id AND trial_until IS NULL) THEN RETURN; END IF;
  IF public.effective_plan(p_profile_id) <> 'free' THEN RETURN; END IF;
  SELECT whatsapp INTO v_wa FROM profile_private WHERE profile_id = p_profile_id;
  IF COALESCE(v_wa, '') = '' OR EXISTS (
    SELECT 1 FROM partner_clients pc JOIN profile_private pp ON pp.profile_id = pc.profile_id
    WHERE pc.trial_until IS NOT NULL AND pp.whatsapp = v_wa AND pc.profile_id <> p_profile_id
  ) THEN
    RETURN;
  END IF;

  v_until := now() + make_interval(days => v_days);
  UPDATE profiles SET plan = v_plan, plan_started_at = now(), plan_expires_at = v_until WHERE id = p_profile_id;
  UPDATE partner_clients SET trial_until = v_until WHERE profile_id = p_profile_id;
END;
$$;

-- Aplica um convite de parceiro (cadastro novo ou conta existente)
CREATE OR REPLACE FUNCTION public.partner_use_invite(p_profile_id uuid, p_token text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_inv partner_invites;
BEGIN
  SELECT * INTO v_inv FROM partner_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND OR v_inv.accepted_at IS NOT NULL OR v_inv.expires_at <= now() THEN RETURN false; END IF;
  IF NOT public.partner_attach(p_profile_id, v_inv.partner_id, 'invite', v_inv.managed) THEN RETURN false; END IF;
  UPDATE partner_invites SET accepted_profile_id = p_profile_id, accepted_at = now() WHERE id = v_inv.id;
  IF v_inv.license_id IS NOT NULL THEN
    -- Licença já usada não desfaz o convite
    BEGIN
      PERFORM public.partner_apply_license(v_inv.license_id, p_profile_id);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN true;
END;
$$;

-- Chamada no cadastro (handle_new_user): convite > código do link
CREATE OR REPLACE FUNCTION public.partner_signup(p_profile_id uuid, p_code text, p_invite text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_partner uuid;
  v_ok boolean := false;
BEGIN
  IF NULLIF(btrim(COALESCE(p_invite, '')), '') IS NOT NULL THEN
    v_ok := public.partner_use_invite(p_profile_id, btrim(p_invite));
  END IF;
  IF NOT v_ok AND NULLIF(btrim(COALESCE(p_code, '')), '') IS NOT NULL THEN
    SELECT id INTO v_partner FROM partners WHERE code = lower(btrim(p_code)) AND status = 'active';
    IF v_partner IS NOT NULL THEN
      v_ok := public.partner_attach(p_profile_id, v_partner, 'link', false);
    END IF;
  END IF;
  IF v_ok THEN
    PERFORM public.partner_start_trial(p_profile_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.partner_invite_info(p_token text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'partner', COALESCE(NULLIF(pa.company, ''), pa.name),
    'client_name', i.client_name,
    'managed', i.managed,
    'license', i.license_id IS NOT NULL,
    'valid', i.accepted_at IS NULL AND i.expires_at > now() AND pa.status = 'active'
  )
  FROM partner_invites i JOIN partners pa ON pa.id = i.partner_id
  WHERE i.token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.partner_accept_invite(p_token text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Faça login para aceitar o convite' USING ERRCODE = '42501';
  END IF;
  IF NOT public.partner_use_invite(auth.uid(), p_token) THEN
    RAISE EXCEPTION 'Convite inválido, expirado ou sua conta já está ligada a outro parceiro.';
  END IF;
  RETURN true;
END;
$$;

-- ───────────────────────── Preço no checkout ─────────────────────────

-- Preço de um plano para a conta (só service_role, usado pelas edge functions de pagamento).
-- Desconto do parceiro só no primeiro pagamento: pelo cupom digitado ou pelo parceiro já atribuído.
CREATE OR REPLACE FUNCTION public.checkout_price(p_profile_id uuid, p_plan text, p_period text, p_coupon text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_list integer;
  v_partner partners;
  v_pid uuid;
  v_pc partner_clients;
  v_first boolean;
  v_pct integer := 0;
  v_coupon text := NULLIF(upper(regexp_replace(COALESCE(p_coupon, ''), '[^A-Za-z0-9]', '', 'g')), '');
  v_error text;
BEGIN
  SELECT CASE WHEN p_period = 'annual' THEN price_annual_cents ELSE price_cents END INTO v_list
  FROM plans WHERE slug = p_plan AND is_active;
  IF v_list IS NULL OR v_list <= 0 OR p_period NOT IN ('quarterly', 'annual') THEN
    RETURN jsonb_build_object('error', 'Plano indisponível no momento.');
  END IF;

  v_first := NOT EXISTS (SELECT 1 FROM payments WHERE profile_id = p_profile_id AND status = 'approved' AND kind = 'plan');
  SELECT * INTO v_pc FROM partner_clients WHERE profile_id = p_profile_id;

  IF v_coupon IS NOT NULL THEN
    SELECT * INTO v_partner FROM partners WHERE coupon_code = v_coupon AND status = 'active';
    IF NOT FOUND THEN
      v_error := 'Cupom inválido.';
    ELSIF v_partner.profile_id = p_profile_id OR EXISTS (
      SELECT 1 FROM profile_private pp WHERE pp.profile_id = p_profile_id AND pp.whatsapp <> ''
        AND (pp.whatsapp = v_partner.whatsapp OR pp.whatsapp = (SELECT whatsapp FROM profile_private WHERE profile_id = v_partner.profile_id))
    ) THEN
      v_error := 'Você não pode usar o seu próprio cupom.';
    ELSIF NOT v_first THEN
      v_error := 'O cupom vale só no primeiro pagamento.';
    ELSIF v_pc.profile_id IS NOT NULL AND v_pc.locked_at IS NOT NULL AND v_pc.partner_id <> v_partner.id THEN
      v_error := 'Sua conta já está ligada a outro parceiro.';
    ELSE
      v_pid := v_partner.id;
    END IF;
  END IF;

  IF v_pid IS NULL AND v_error IS NULL AND v_pc.profile_id IS NOT NULL AND v_first THEN
    SELECT * INTO v_partner FROM partners WHERE id = v_pc.partner_id AND status = 'active';
    IF FOUND THEN
      v_pid := v_partner.id;
      v_coupon := v_partner.coupon_code;
    END IF;
  END IF;

  IF v_pid IS NOT NULL THEN
    v_pct := public.partner_discount_pct(v_pid);
  END IF;

  RETURN jsonb_build_object(
    'list_cents', v_list,
    'discount_pct', v_pct,
    'discount_cents', round(v_list * v_pct / 100.0)::int,
    'amount_cents', v_list - round(v_list * v_pct / 100.0)::int,
    'partner_id', v_pid,
    'partner_name', CASE WHEN v_pid IS NOT NULL THEN COALESCE(NULLIF(v_partner.company, ''), v_partner.name) END,
    'coupon_code', CASE WHEN v_pid IS NOT NULL THEN v_coupon END,
    'coupon_error', v_error
  );
END;
$$;

-- Prévia do preço para a tela de checkout (sem o id do parceiro)
CREATE OR REPLACE FUNCTION public.checkout_quote(p_plan text, p_period text, p_coupon text DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.checkout_price(auth.uid(), p_plan, p_period, p_coupon) - 'partner_id'
  WHERE auth.uid() IS NOT NULL;
$$;

-- Licenças no atacado (parceiro ativo): quantidade mínima e desconto da configuração
CREATE OR REPLACE FUNCTION public.license_price(p_profile_id uuid, p_plan text, p_period text, p_qty integer)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_partner partners;
  v_list integer;
  v_min integer := COALESCE((public.partner_setting('wholesale_min_qty'))::text::int, 5);
  v_pct integer := COALESCE((public.partner_setting('wholesale_discount_pct'))::text::int, 0);
  v_total integer;
BEGIN
  SELECT * INTO v_partner FROM partners WHERE profile_id = p_profile_id AND status = 'active';
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Só parceiros ativos compram licenças.'); END IF;
  IF NOT COALESCE((public.partner_setting('wholesale_enabled'))::text::boolean, false) THEN
    RETURN jsonb_build_object('error', 'Compra de licenças indisponível no momento.');
  END IF;
  IF p_qty IS NULL OR p_qty < v_min OR p_qty > 500 THEN
    RETURN jsonb_build_object('error', format('Compre de %s a 500 licenças.', v_min));
  END IF;
  SELECT CASE WHEN p_period = 'annual' THEN price_annual_cents ELSE price_cents END INTO v_list
  FROM plans WHERE slug = p_plan AND is_active;
  IF v_list IS NULL OR v_list <= 0 OR p_period NOT IN ('quarterly', 'annual') THEN
    RETURN jsonb_build_object('error', 'Plano indisponível no momento.');
  END IF;
  v_total := round(v_list * p_qty * (100 - v_pct) / 100.0)::int;
  RETURN jsonb_build_object(
    'unit_list_cents', v_list, 'quantity', p_qty, 'discount_pct', v_pct, 'min_qty', v_min,
    'list_cents', v_list * p_qty, 'discount_cents', v_list * p_qty - v_total, 'amount_cents', v_total,
    'partner_id', v_partner.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.license_quote(p_plan text, p_period text, p_qty integer)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.license_price(auth.uid(), p_plan, p_period, p_qty) - 'partner_id'
  WHERE auth.uid() IS NOT NULL;
$$;

-- ───────────────────────── Concessão do plano e comissão ─────────────────────────

-- Estende o plano da conta por um período (regra de troca/renovação de grant_paid_plan).
-- Devolve a nova expiração; NULL quando o mesmo plano já foi dado sem expiração pelo admin.
CREATE OR REPLACE FUNCTION public.apply_plan_period(p_profile_id uuid, p_plan text, p_period text)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_prof profiles;
  v_current text;
  v_active boolean;
  v_old_price integer;
  v_new_price integer;
  v_base timestamptz;
  v_until timestamptz;
BEGIN
  SELECT * INTO v_prof FROM profiles WHERE id = p_profile_id FOR UPDATE;
  v_current := public.effective_plan(v_prof.id);
  v_active := v_current <> 'free';

  IF v_active AND v_prof.plan_expires_at IS NULL AND v_current = p_plan THEN
    RETURN NULL;
  END IF;

  IF v_active AND v_prof.plan_expires_at IS NOT NULL AND v_current <> p_plan THEN
    -- Troca de plano: dias restantes convertidos pelo preço anual de cada plano
    SELECT price_annual_cents INTO v_old_price FROM plans WHERE slug = v_current;
    SELECT price_annual_cents INTO v_new_price FROM plans WHERE slug = p_plan;
    v_base := now() + (v_prof.plan_expires_at - now())
      * (COALESCE(v_old_price, 0)::float8 / GREATEST(COALESCE(v_new_price, 1), 1));
  ELSIF v_active AND v_prof.plan_expires_at IS NOT NULL THEN
    v_base := v_prof.plan_expires_at;
  ELSE
    v_base := now();
  END IF;
  v_until := v_base + CASE p_period WHEN 'annual' THEN interval '1 year' ELSE interval '3 months' END;

  UPDATE profiles
    SET plan = p_plan,
        plan_expires_at = v_until,
        plan_started_at = CASE WHEN v_active AND v_current = p_plan THEN plan_started_at ELSE now() END
    WHERE id = v_prof.id;
  RETURN v_until;
END;
$$;

-- Comissão do parceiro sobre um pagamento aprovado + bônus de meta
CREATE OR REPLACE FUNCTION public.partner_record_commission(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pay payments;
  v_pc partner_clients;
  v_partner partners;
  v_months integer := COALESCE((public.partner_setting('recurring_months'))::text::int, 0);
  v_hold integer := COALESCE((public.partner_setting('hold_days'))::text::int, 30);
  v_rate numeric;
  v_active integer;
  v_bonus jsonb;
BEGIN
  SELECT * INTO v_pay FROM payments WHERE id = p_payment_id;
  IF v_pay.kind <> 'plan' OR COALESCE(v_pay.amount_cents, 0) <= 0 THEN RETURN; END IF;
  SELECT * INTO v_pc FROM partner_clients WHERE profile_id = v_pay.profile_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO v_partner FROM partners WHERE id = v_pc.partner_id AND status = 'active';
  IF NOT FOUND THEN RETURN; END IF;
  IF v_months > 0 AND v_pc.locked_at IS NOT NULL AND v_pc.locked_at + make_interval(months => v_months) < now() THEN
    RETURN;
  END IF;

  v_rate := (public.partner_tier(v_partner.id)->>'rate')::numeric;
  INSERT INTO partner_commissions (partner_id, client_profile_id, payment_id, kind, base_cents, rate, amount_cents, available_at)
  VALUES (v_partner.id, v_pay.profile_id, v_pay.id, 'commission', v_pay.amount_cents, v_rate,
          round(v_pay.amount_cents * v_rate / 100.0)::int, now() + make_interval(days => v_hold))
  ON CONFLICT DO NOTHING;

  v_active := public.partner_active_clients(v_partner.id);
  FOR v_bonus IN SELECT b.v FROM jsonb_array_elements(COALESCE(public.partner_setting('bonuses'), '[]')) AS b(v) LOOP
    IF v_active >= (v_bonus->>'clients')::int AND (v_bonus->>'cents')::int > 0 AND NOT EXISTS (
      SELECT 1 FROM partner_commissions WHERE partner_id = v_partner.id AND kind = 'bonus' AND note = 'meta_' || (v_bonus->>'clients')
    ) THEN
      INSERT INTO partner_commissions (partner_id, kind, amount_cents, available_at, note)
      VALUES (v_partner.id, 'bonus', (v_bonus->>'cents')::int, now() + make_interval(days => v_hold), 'meta_' || (v_bonus->>'clients'));
    END IF;
  END LOOP;
END;
$$;

-- Licença aplicada a um cliente do parceiro (sem comissão: o parceiro já comprou com desconto)
CREATE OR REPLACE FUNCTION public.partner_apply_license(p_license_id uuid, p_profile_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_lic partner_licenses;
  v_until timestamptz;
BEGIN
  SELECT * INTO v_lic FROM partner_licenses WHERE id = p_license_id FOR UPDATE;
  IF NOT FOUND OR v_lic.status <> 'available' THEN
    RAISE EXCEPTION 'Licença indisponível';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM partner_clients WHERE profile_id = p_profile_id AND partner_id = v_lic.partner_id) THEN
    RAISE EXCEPTION 'Essa conta não é sua cliente';
  END IF;
  v_until := public.apply_plan_period(p_profile_id, v_lic.plan_slug, v_lic.period);
  UPDATE partner_licenses SET status = 'assigned', assigned_profile_id = p_profile_id, assigned_at = now() WHERE id = p_license_id;
  UPDATE partner_clients SET locked_at = COALESCE(locked_at, now()), trial_until = NULL WHERE profile_id = p_profile_id;
  RETURN v_until;
END;
$$;

CREATE OR REPLACE FUNCTION public.partner_assign_license(p_license_id uuid, p_profile_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM partner_licenses l JOIN partners pa ON pa.id = l.partner_id
    WHERE l.id = p_license_id AND pa.profile_id = auth.uid() AND pa.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Licença não encontrada' USING ERRCODE = '42501';
  END IF;
  RETURN public.partner_apply_license(p_license_id, p_profile_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_paid_plan(p_payment_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pay payments;
  v_prof profiles;
  v_until timestamptz;
  v_referral_id uuid;
  v_commission integer;
  v_partner_id uuid;
  v_had_approved boolean;
BEGIN
  SELECT * INTO v_pay FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pagamento % não encontrado', p_payment_id;
  END IF;

  -- Idempotente: o webhook pode chegar mais de uma vez
  IF v_pay.plan_granted_until IS NOT NULL THEN
    RETURN v_pay.plan_granted_until;
  END IF;

  -- Compra de licenças pelo parceiro: cria as licenças (plan_granted_until marca como concedido)
  IF v_pay.kind = 'license' THEN
    SELECT id INTO v_partner_id FROM partners WHERE profile_id = v_pay.profile_id;
    INSERT INTO partner_licenses (partner_id, plan_slug, period, purchase_payment_id)
    SELECT COALESCE(v_pay.partner_id, v_partner_id), v_pay.plan_slug, v_pay.period, v_pay.id
    FROM generate_series(1, v_pay.quantity);
    UPDATE payments
      SET status = 'approved', paid_at = COALESCE(paid_at, now()), plan_granted_until = now(), updated_at = now()
      WHERE id = p_payment_id;
    RETURN now();
  END IF;

  SELECT * INTO v_prof FROM profiles WHERE id = v_pay.profile_id;
  v_had_approved := EXISTS (
    SELECT 1 FROM payments WHERE profile_id = v_prof.id AND status = 'approved' AND kind = 'plan' AND id <> p_payment_id
  );

  -- Parceiro do checkout (cupom ou atribuição), antes de marcar o pagamento como aprovado
  IF v_pay.partner_id IS NOT NULL AND NOT v_had_approved THEN
    PERFORM public.partner_attach(v_prof.id, v_pay.partner_id, CASE WHEN v_pay.coupon_code IS NOT NULL THEN 'coupon' ELSE 'link' END, false);
  END IF;

  v_until := public.apply_plan_period(v_prof.id, v_pay.plan_slug, v_pay.period);
  UPDATE payments
    SET status = 'approved',
        paid_at = COALESCE(paid_at, now()),
        plan_granted_until = v_until,
        updated_at = now()
    WHERE id = p_payment_id;

  -- Cliente de parceiro: trava o vínculo e registra a comissão (não gera Indique e ganhe)
  IF EXISTS (SELECT 1 FROM partner_clients WHERE profile_id = v_prof.id) THEN
    UPDATE partner_clients SET locked_at = COALESCE(locked_at, now()) WHERE profile_id = v_prof.id;
    PERFORM public.partner_record_commission(p_payment_id);
    RETURN v_until;
  END IF;

  -- Indique e ganhe: 30% do primeiro pagamento aprovado de quem foi indicado (sem parceiro)
  IF v_prof.referred_by IS NOT NULL AND NOT v_had_approved THEN
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

-- Reembolso ou chargeback (mp-webhook): estorna a comissão e revoga licenças não usadas
CREATE OR REPLACE FUNCTION public.partner_reverse_payment(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_c partner_commissions;
BEGIN
  UPDATE partner_licenses SET status = 'revoked' WHERE purchase_payment_id = p_payment_id AND status = 'available';

  SELECT * INTO v_c FROM partner_commissions WHERE payment_id = p_payment_id AND kind = 'commission' FOR UPDATE;
  IF NOT FOUND OR v_c.status = 'reversed' THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM partner_commissions WHERE payment_id = p_payment_id AND kind = 'reversal') THEN RETURN; END IF;

  IF v_c.payout_id IS NULL AND v_c.available_at > now() THEN
    UPDATE partner_commissions SET status = 'reversed', note = 'estornado (reembolso)' WHERE id = v_c.id;
  ELSE
    INSERT INTO partner_commissions (partner_id, client_profile_id, payment_id, kind, base_cents, amount_cents, note)
    VALUES (v_c.partner_id, v_c.client_profile_id, p_payment_id, 'reversal', v_c.base_cents, -v_c.amount_cents, 'estorno (reembolso/chargeback)');
  END IF;
END;
$$;

-- ───────────────────────── Saldo e saques ─────────────────────────

CREATE OR REPLACE FUNCTION public.partner_balances(p_partner_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'hold', COALESCE(sum(c.amount_cents) FILTER (WHERE c.status = 'pending' AND c.payout_id IS NULL AND c.available_at > now()), 0),
    'available', COALESCE(sum(c.amount_cents) FILTER (WHERE c.status = 'pending' AND c.payout_id IS NULL AND c.available_at <= now()), 0),
    'requested', COALESCE(sum(c.amount_cents) FILTER (WHERE c.status = 'pending' AND po.status = 'pending'), 0),
    'paid', COALESCE(sum(c.amount_cents) FILTER (WHERE c.status = 'pending' AND po.status = 'paid'), 0)
  )
  FROM partner_commissions c LEFT JOIN partner_payouts po ON po.id = c.payout_id
  WHERE c.partner_id = p_partner_id;
$$;

CREATE OR REPLACE FUNCTION public.partner_request_payout()
RETURNS partner_payouts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_partner partners;
  v_amount integer;
  v_min integer := COALESCE((public.partner_setting('min_payout_cents'))::text::int, 5000);
  v_payout partner_payouts;
BEGIN
  SELECT * INTO v_partner FROM partners WHERE profile_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR v_partner.status <> 'active' THEN
    RAISE EXCEPTION 'Parceria inativa' USING ERRCODE = '42501';
  END IF;
  IF btrim(v_partner.pix_key) = '' OR btrim(v_partner.pix_full_name) = '' THEN
    RAISE EXCEPTION 'Cadastre o nome completo e a chave PIX antes de pedir o saque';
  END IF;
  SELECT COALESCE(sum(amount_cents), 0) INTO v_amount FROM partner_commissions
  WHERE partner_id = v_partner.id AND status = 'pending' AND payout_id IS NULL AND available_at <= now();
  IF v_amount < v_min THEN
    RAISE EXCEPTION 'O saldo mínimo para saque é R$ %', to_char(v_min / 100.0, 'FM999G990D00');
  END IF;

  INSERT INTO partner_payouts (partner_id, amount_cents, pix_key, pix_full_name)
  VALUES (v_partner.id, v_amount, v_partner.pix_key, v_partner.pix_full_name)
  RETURNING * INTO v_payout;
  UPDATE partner_commissions SET payout_id = v_payout.id
  WHERE partner_id = v_partner.id AND status = 'pending' AND payout_id IS NULL AND available_at <= now();
  RETURN v_payout;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_resolve_partner_payout(p_payout_id uuid, p_action text, p_note text DEFAULT '')
RETURNS partner_payouts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_payout partner_payouts;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('paid', 'rejected') THEN
    RAISE EXCEPTION 'Ação inválida: %', p_action;
  END IF;
  SELECT * INTO v_payout FROM partner_payouts WHERE id = p_payout_id FOR UPDATE;
  IF NOT FOUND OR v_payout.status <> 'pending' THEN
    RAISE EXCEPTION 'Saque não encontrado ou já resolvido';
  END IF;
  UPDATE partner_payouts
    SET status = p_action, admin_note = COALESCE(NULLIF(btrim(p_note), ''), admin_note), resolved_at = now()
    WHERE id = p_payout_id RETURNING * INTO v_payout;
  IF p_action = 'rejected' THEN
    UPDATE partner_commissions SET payout_id = NULL WHERE payout_id = p_payout_id;
  END IF;
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'partner_payout_' || p_action, 'partner_payout', p_payout_id::text,
          jsonb_build_object('amount_cents', v_payout.amount_cents, 'partner_id', v_payout.partner_id, 'note', p_note));
  RETURN v_payout;
END;
$$;

-- ───────────────────────── Convites e painel do parceiro ─────────────────────────

CREATE OR REPLACE FUNCTION public.partner_create_invite(p_client_name text, p_managed boolean DEFAULT true, p_license_id uuid DEFAULT NULL)
RETURNS partner_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_partner partners;
  v_inv partner_invites;
BEGIN
  SELECT * INTO v_partner FROM partners WHERE profile_id = auth.uid() AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parceria inativa' USING ERRCODE = '42501';
  END IF;
  IF p_license_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM partner_licenses WHERE id = p_license_id AND partner_id = v_partner.id AND status = 'available'
  ) THEN
    RAISE EXCEPTION 'Licença indisponível';
  END IF;
  IF p_license_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM partner_invites WHERE license_id = p_license_id AND accepted_at IS NULL AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Essa licença já está em outro convite aberto';
  END IF;
  INSERT INTO partner_invites (partner_id, client_name, managed, license_id)
  VALUES (v_partner.id, left(btrim(COALESCE(p_client_name, '')), 120), COALESCE(p_managed, true), p_license_id)
  RETURNING * INTO v_inv;
  RETURN v_inv;
END;
$$;

CREATE OR REPLACE FUNCTION public.partner_dashboard()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_partner partners;
BEGIN
  SELECT * INTO v_partner FROM partners WHERE profile_id = auth.uid();
  IF NOT FOUND THEN RETURN NULL; END IF;

  RETURN jsonb_build_object(
    'partner', to_jsonb(v_partner) - 'admin_note',
    'username', (SELECT username FROM profiles WHERE id = v_partner.profile_id),
    'tier', public.partner_tier(v_partner.id),
    'discount_pct', public.partner_discount_pct(v_partner.id),
    'balances', public.partner_balances(v_partner.id),
    'clicks_30d', (SELECT COALESCE(sum(clicks), 0) FROM partner_clicks WHERE partner_id = v_partner.id AND day > current_date - 30),
    'clicks_total', (SELECT COALESCE(sum(clicks), 0) FROM partner_clicks WHERE partner_id = v_partner.id),
    'signups', (SELECT count(*) FROM partner_clients WHERE partner_id = v_partner.id),
    'signups_30d', (SELECT count(*) FROM partner_clients WHERE partner_id = v_partner.id AND attributed_at > now() - interval '30 days'),
    'revenue_cents', (SELECT COALESCE(sum(c.base_cents), 0) FROM partner_commissions c WHERE c.partner_id = v_partner.id AND c.kind = 'commission' AND c.status = 'pending'),
    'monthly', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'), 'cents',
        (SELECT COALESCE(sum(amount_cents), 0) FROM partner_commissions c
         WHERE c.partner_id = v_partner.id AND c.status = 'pending' AND date_trunc('month', c.created_at) = m)) ORDER BY m), '[]')
      FROM generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') m
    ),
    -- WhatsApp do cliente só nas relações diretas (convite, cupom, licença, manual)
    'clients', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'profile_id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
        'plan', public.effective_plan(p.id), 'expires_at', p.plan_expires_at,
        'trial', pc.trial_until IS NOT NULL AND p.plan_expires_at IS NOT NULL AND p.plan_expires_at <= pc.trial_until,
        'source', pc.source, 'managed', pc.managed, 'attributed_at', pc.attributed_at, 'locked_at', pc.locked_at,
        'paid_cents', (SELECT COALESCE(sum(base_cents), 0) FROM partner_commissions c WHERE c.partner_id = v_partner.id AND c.client_profile_id = p.id AND c.kind = 'commission' AND c.status = 'pending'),
        'commission_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM partner_commissions c WHERE c.partner_id = v_partner.id AND c.client_profile_id = p.id AND c.status = 'pending'),
        'whatsapp', CASE WHEN pc.source <> 'link' THEN (SELECT whatsapp FROM profile_private WHERE profile_id = p.id) END
      ) ORDER BY pc.attributed_at DESC)
      FROM partner_clients pc JOIN profiles p ON p.id = pc.profile_id
      WHERE pc.partner_id = v_partner.id
    ), '[]'),
    'commissions', COALESCE((
      SELECT jsonb_agg(x ORDER BY x->>'created_at' DESC) FROM (
        SELECT jsonb_build_object(
          'id', c.id, 'kind', c.kind, 'amount_cents', c.amount_cents, 'base_cents', c.base_cents, 'rate', c.rate,
          'status', CASE WHEN c.status = 'reversed' THEN 'reversed' WHEN po.status = 'paid' THEN 'paid'
                         WHEN po.status = 'pending' THEN 'requested' WHEN c.available_at > now() THEN 'hold' ELSE 'available' END,
          'available_at', c.available_at, 'created_at', c.created_at, 'note', c.note,
          'client', (SELECT username FROM profiles WHERE id = c.client_profile_id)
        ) x
        FROM partner_commissions c LEFT JOIN partner_payouts po ON po.id = c.payout_id
        WHERE c.partner_id = v_partner.id
        ORDER BY c.created_at DESC LIMIT 200
      ) s
    ), '[]'),
    'payouts', COALESCE((SELECT jsonb_agg(to_jsonb(po) ORDER BY po.created_at DESC) FROM partner_payouts po WHERE po.partner_id = v_partner.id), '[]'),
    'invites', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', i.id, 'token', i.token, 'client_name', i.client_name, 'managed', i.managed,
        'license_id', i.license_id, 'created_at', i.created_at, 'expires_at', i.expires_at, 'accepted_at', i.accepted_at,
        'accepted_username', (SELECT username FROM profiles WHERE id = i.accepted_profile_id)) ORDER BY i.created_at DESC)
      FROM partner_invites i WHERE i.partner_id = v_partner.id
    ), '[]'),
    'licenses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', l.id, 'plan_slug', l.plan_slug, 'period', l.period, 'status', l.status,
        'assigned_at', l.assigned_at, 'created_at', l.created_at,
        'assigned_username', (SELECT username FROM profiles WHERE id = l.assigned_profile_id)) ORDER BY l.status, l.created_at)
      FROM partner_licenses l WHERE l.partner_id = v_partner.id AND l.status <> 'revoked'
    ), '[]')
  );
END;
$$;

-- Diretório público "Encontre um parceiro"
CREATE OR REPLACE FUNCTION public.partner_directory()
RETURNS TABLE (name text, kind text, city text, specialties text, bio text, username text, avatar_url text, active_clients integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(pa.company, ''), pa.name), pa.kind, pa.city, pa.specialties, pa.directory_bio,
         p.username, p.avatar_url, public.partner_active_clients(pa.id)
  FROM partners pa JOIN profiles p ON p.id = pa.profile_id
  WHERE pa.status = 'active' AND pa.directory_listed AND p.suspended_at IS NULL
  ORDER BY public.partner_active_clients(pa.id) DESC, pa.approved_at;
$$;

-- ───────────────────────── Admin ─────────────────────────

CREATE OR REPLACE FUNCTION public.admin_partners()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', pa.id, 'status', pa.status, 'kind', pa.kind, 'name', pa.name, 'company', pa.company,
      'code', pa.code, 'coupon_code', pa.coupon_code, 'created_at', pa.created_at, 'approved_at', pa.approved_at,
      'username', p.username, 'email', u.email, 'whatsapp', pa.whatsapp, 'audience', pa.audience,
      'tier', public.partner_tier(pa.id),
      'signups', (SELECT count(*) FROM partner_clients WHERE partner_id = pa.id),
      'clicks', (SELECT COALESCE(sum(clicks), 0) FROM partner_clicks WHERE partner_id = pa.id),
      'revenue_cents', (SELECT COALESCE(sum(base_cents), 0) FROM partner_commissions WHERE partner_id = pa.id AND kind = 'commission' AND status = 'pending'),
      'commission_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM partner_commissions WHERE partner_id = pa.id AND status = 'pending'),
      'balances', public.partner_balances(pa.id)
    ) ORDER BY pa.status = 'pending' DESC, pa.created_at DESC)
    FROM partners pa JOIN profiles p ON p.id = pa.profile_id LEFT JOIN auth.users u ON u.id = pa.profile_id
  ), '[]');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_partner_detail(p_partner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_partner partners;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_partner FROM partners WHERE id = p_partner_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'partner', to_jsonb(v_partner),
    'username', (SELECT username FROM profiles WHERE id = v_partner.profile_id),
    'email', (SELECT email FROM auth.users WHERE id = v_partner.profile_id),
    'tier', public.partner_tier(v_partner.id),
    'discount_pct', public.partner_discount_pct(v_partner.id),
    'balances', public.partner_balances(v_partner.id),
    'clicks', (SELECT COALESCE(sum(clicks), 0) FROM partner_clicks WHERE partner_id = v_partner.id),
    'clients', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'profile_id', p.id, 'username', p.username, 'plan', public.effective_plan(p.id), 'expires_at', p.plan_expires_at,
        'trial', pc.trial_until IS NOT NULL AND p.plan_expires_at IS NOT NULL AND p.plan_expires_at <= pc.trial_until,
        'source', pc.source, 'managed', pc.managed, 'attributed_at', pc.attributed_at, 'locked_at', pc.locked_at,
        'paid_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM payments WHERE profile_id = p.id AND status = 'approved' AND kind = 'plan')
      ) ORDER BY pc.attributed_at DESC)
      FROM partner_clients pc JOIN profiles p ON p.id = pc.profile_id WHERE pc.partner_id = v_partner.id
    ), '[]'),
    'commissions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'kind', c.kind, 'amount_cents', c.amount_cents, 'base_cents', c.base_cents, 'rate', c.rate,
        'status', CASE WHEN c.status = 'reversed' THEN 'reversed' WHEN po.status = 'paid' THEN 'paid'
                       WHEN po.status = 'pending' THEN 'requested' WHEN c.available_at > now() THEN 'hold' ELSE 'available' END,
        'available_at', c.available_at, 'created_at', c.created_at, 'note', c.note,
        'client', (SELECT username FROM profiles WHERE id = c.client_profile_id)
      ) ORDER BY c.created_at DESC)
      FROM partner_commissions c LEFT JOIN partner_payouts po ON po.id = c.payout_id WHERE c.partner_id = v_partner.id
    ), '[]'),
    'payouts', COALESCE((SELECT jsonb_agg(to_jsonb(po) ORDER BY po.created_at DESC) FROM partner_payouts po WHERE po.partner_id = v_partner.id), '[]'),
    'licenses', jsonb_build_object(
      'available', (SELECT count(*) FROM partner_licenses WHERE partner_id = v_partner.id AND status = 'available'),
      'assigned', (SELECT count(*) FROM partner_licenses WHERE partner_id = v_partner.id AND status = 'assigned')
    )
  );
END;
$$;

-- Fila de saques de todos os parceiros
CREATE OR REPLACE FUNCTION public.admin_partner_payouts()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(po) || jsonb_build_object(
      'partner_name', COALESCE(NULLIF(pa.company, ''), pa.name),
      'document', pa.document,
      'username', (SELECT username FROM profiles WHERE id = pa.profile_id)
    ) ORDER BY po.status = 'pending' DESC, po.created_at DESC)
    FROM partner_payouts po JOIN partners pa ON pa.id = po.partner_id
  ), '[]');
END;
$$;

-- Aprovar / recusar / suspender. Na aprovação gera o código do link e o cupom
CREATE OR REPLACE FUNCTION public.admin_set_partner_status(p_partner_id uuid, p_status text, p_note text DEFAULT '')
RETURNS partners
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row partners;
  v_base text;
  v_code text;
  v_coupon text;
  v_n integer := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('active', 'rejected', 'suspended', 'pending') THEN
    RAISE EXCEPTION 'Status inválido';
  END IF;
  SELECT * INTO v_row FROM partners WHERE id = p_partner_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Parceiro não encontrado'; END IF;

  IF p_status = 'active' AND v_row.code IS NULL THEN
    SELECT trim(both '-' from left(lower(regexp_replace(
      COALESCE(NULLIF(v_row.company, ''), (SELECT username FROM profiles WHERE id = v_row.profile_id)), '[^a-zA-Z0-9]+', '-', 'g')), 24))
      INTO v_base;
    IF length(COALESCE(v_base, '')) < 3 THEN v_base := 'parceiro'; END IF;
    v_code := v_base;
    WHILE EXISTS (SELECT 1 FROM partners WHERE code = v_code) LOOP
      v_n := v_n + 1; v_code := v_base || '-' || v_n;
    END LOOP;
    v_base := left(upper(regexp_replace(v_base, '[^a-zA-Z0-9]', '', 'g')), 14);
    IF length(v_base) < 2 THEN v_base := 'BIO'; END IF;
    v_coupon := v_base || COALESCE(public.partner_setting('coupon_discount_pct') #>> '{}', '10');
    v_n := 0;
    WHILE EXISTS (SELECT 1 FROM partners WHERE coupon_code = v_coupon) LOOP
      v_n := v_n + 1; v_coupon := v_base || COALESCE(public.partner_setting('coupon_discount_pct') #>> '{}', '10') || v_n;
    END LOOP;
    v_row.code := v_code;
    v_row.coupon_code := left(v_coupon, 20);
  END IF;

  UPDATE partners SET
    status = p_status,
    code = v_row.code,
    coupon_code = v_row.coupon_code,
    approved_at = CASE WHEN p_status = 'active' THEN COALESCE(approved_at, now()) ELSE approved_at END,
    admin_note = CASE WHEN btrim(COALESCE(p_note, '')) <> '' THEN btrim(p_note) ELSE admin_note END,
    updated_at = now()
  WHERE id = p_partner_id RETURNING * INTO v_row;

  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'partner_' || p_status, 'partner', p_partner_id::text, jsonb_build_object('note', p_note));
  RETURN v_row;
END;
$$;

-- Atribuição manual (resolve disputas) e remoção do vínculo
CREATE OR REPLACE FUNCTION public.admin_partner_attach(p_partner_id uuid, p_username text, p_managed boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  SELECT id INTO v_profile FROM profiles WHERE username = lower(btrim(p_username)) AND owner_id IS NULL;
  IF v_profile IS NULL THEN RAISE EXCEPTION 'Conta não encontrada'; END IF;
  -- O admin pode mover um vínculo travado
  DELETE FROM partner_clients WHERE profile_id = v_profile AND partner_id <> p_partner_id;
  IF NOT public.partner_attach(v_profile, p_partner_id, 'manual', COALESCE(p_managed, false)) THEN
    RAISE EXCEPTION 'Não foi possível vincular (parceiro inativo ou autoindicação)';
  END IF;
  UPDATE partner_clients SET source = 'manual',
    locked_at = CASE WHEN EXISTS (SELECT 1 FROM payments WHERE profile_id = v_profile AND status = 'approved' AND kind = 'plan') THEN COALESCE(locked_at, now()) END
  WHERE profile_id = v_profile;
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'partner_attach', 'partner', p_partner_id::text, jsonb_build_object('profile_id', v_profile));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_partner_detach(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pc partner_clients;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  DELETE FROM partner_clients WHERE profile_id = p_profile_id RETURNING * INTO v_pc;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_pc.managed THEN
    DELETE FROM page_members WHERE page_id = p_profile_id AND user_id = (SELECT profile_id FROM partners WHERE id = v_pc.partner_id);
  END IF;
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'partner_detach', 'partner', v_pc.partner_id::text, jsonb_build_object('profile_id', p_profile_id));
END;
$$;

-- Ajuste manual no extrato (positivo ou negativo, liberado na hora)
CREATE OR REPLACE FUNCTION public.admin_partner_adjust(p_partner_id uuid, p_cents integer, p_note text)
RETURNS partner_commissions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row partner_commissions;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(p_cents, 0) = 0 OR btrim(COALESCE(p_note, '')) = '' THEN
    RAISE EXCEPTION 'Informe o valor e o motivo';
  END IF;
  INSERT INTO partner_commissions (partner_id, kind, amount_cents, note)
  VALUES (p_partner_id, 'adjustment', p_cents, left(btrim(p_note), 200))
  RETURNING * INTO v_row;
  INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
  VALUES (auth.uid(), 'partner_adjust', 'partner', p_partner_id::text, jsonb_build_object('cents', p_cents, 'note', p_note));
  RETURN v_row;
END;
$$;

-- ───────────────────────── Integrações com o que já existe ─────────────────────────

-- Parceiro gerencia a página do cliente (convite "gerenciado"), mesmo no plano Free do cliente
CREATE OR REPLACE FUNCTION public.can_manage_page(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_page_owner(p_profile_id) OR (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM page_members WHERE page_id = p_profile_id AND user_id = auth.uid())
    AND NOT public.is_suspended(p_profile_id)
    AND (
      COALESCE((public.plan_limit(p_profile_id, 'members'))::text::integer, 0) <> 0
      OR EXISTS (
        SELECT 1 FROM partner_clients pc JOIN partners pa ON pa.id = pc.partner_id
        WHERE pc.profile_id = p_profile_id AND pc.managed AND pa.profile_id = auth.uid() AND pa.status = 'active'
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_reserved_username(p_username text)
RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public
AS $$
  SELECT lower(p_username) = ANY (ARRAY[
    'admin', 'api', 'dashboard', 'login', 'logout', 'register', 'signup', 'signin',
    'forgot-password', 'reset-password', 'redefinir-senha', 'auth', 'callback', 'icon', 'og-image',
    'robots.txt', 'sitemap.xml', 'favicon.ico', '_next', 'static', 'assets', 'public',
    'convite', 'convites', 'invite', 'exemplos', 'exemplo', 'examples',
    'bioflowzy', 'www', 'app', 'help', 'ajuda', 'suporte', 'support', 'contato', 'contact',
    'about', 'sobre', 'blog', 'pricing', 'precos', 'planos', 'plans', 'terms', 'termos',
    'privacy', 'privacidade', 'settings', 'config', 'account', 'conta', 'billing',
    'checkout', 'pagamento', 'status', 'docs', 'root', 'null', 'undefined', 'system',
    'p', 'parceiro', 'parceiros', 'partner', 'partners', 'afiliados', 'agencias'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
SET row_security TO 'off'
AS $$
DECLARE
  desired_username text;
  final_username text;
  suffix int := 0;
  v_ref_code text;
  v_referrer_id uuid;
  v_source text;
  v_campaign text;
  v_whatsapp text;
BEGIN
  desired_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(NEW.email, '@', 1)
  );
  desired_username := lower(regexp_replace(desired_username, '[^a-z0-9_.-]', '', 'gi'));
  IF desired_username IS NULL OR desired_username = '' THEN
    desired_username := 'user' || substr(NEW.id::text, 1, 8);
  END IF;

  final_username := desired_username;
  WHILE public.is_reserved_username(final_username)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := desired_username || suffix::text;
  END LOOP;

  -- Resolve referral code to referrer UUID
  v_ref_code := NULLIF(TRIM(NEW.raw_user_meta_data->>'referred_by_code'), '');
  IF v_ref_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_ref_code
    LIMIT 1;
  END IF;

  -- Origem do cadastro (vem do navegador: normaliza)
  v_source := NULLIF(lower(left(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'signup_source', ''), '[^a-zA-Z0-9._-]', '', 'g'), 40)), '');
  v_campaign := NULLIF(lower(left(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'signup_campaign', ''), '[^a-zA-Z0-9._-]', '', 'g'), 60)), '');

  INSERT INTO public.profiles (id, username, display_name, referred_by, signup_source, signup_campaign)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
    v_referrer_id,
    COALESCE(v_source, 'direto'),
    v_campaign
  )
  ON CONFLICT (id) DO NOTHING;

  -- WhatsApp vai para os dados privados (a linha é criada pelo trigger de profiles)
  -- (bloco próprio: um erro aqui não desfaz a criação do perfil)
  BEGIN
    v_whatsapp := public.normalize_whatsapp(NEW.raw_user_meta_data->>'whatsapp');
    IF v_whatsapp <> '' THEN
      INSERT INTO public.profile_private (profile_id, whatsapp)
      VALUES (NEW.id, v_whatsapp)
      ON CONFLICT (profile_id) DO UPDATE SET whatsapp = EXCLUDED.whatsapp, updated_at = now();
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Parceiro (link /p/<code> ou convite), depois do WhatsApp por causa da regra antiautoindicação
  BEGIN
    IF NULLIF(NEW.raw_user_meta_data->>'partner_code', '') IS NOT NULL
       OR NULLIF(NEW.raw_user_meta_data->>'partner_invite', '') IS NOT NULL THEN
      PERFORM public.partner_signup(NEW.id, NEW.raw_user_meta_data->>'partner_code', NEW.raw_user_meta_data->>'partner_invite');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Create referral entry if referred
  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, status)
    VALUES (v_referrer_id, NEW.id, 'pending')
    ON CONFLICT (referrer_id, referred_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- Métricas: contas em teste do parceiro não contam como pagantes
CREATE OR REPLACE FUNCTION public.admin_growth_metrics(p_days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
  v_since timestamptz := now() - make_interval(days => v_days);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN (
    WITH accounts AS (
      SELECT p.* FROM profiles p WHERE p.owner_id IS NULL AND p.role <> 'admin'
    ),
    paying AS (
      SELECT a.id, public.effective_plan(a.id) AS pl FROM accounts a
      WHERE public.effective_plan(a.id) <> 'free' AND NOT public.is_on_trial(a.id)
    ),
    approved AS (
      SELECT pay.* FROM payments pay WHERE pay.status = 'approved'
    ),
    first_pay AS (
      SELECT profile_id, min(paid_at) AS first_paid_at,
             (array_agg(plan_granted_until ORDER BY paid_at))[1] AS first_until,
             count(*) AS n
      FROM approved WHERE kind = 'plan' GROUP BY profile_id
    ),
    new_accounts AS (
      SELECT * FROM accounts WHERE created_at >= v_since
    ),
    activation AS (
      SELECT a.id,
             (SELECT count(*) FROM links l
              WHERE l.profile_id = a.id AND COALESCE(l.is_active, true)
                AND l.created_at <= a.created_at + interval '24 hours') >= 3 AS activated
      FROM new_accounts a
      WHERE a.created_at <= now() - interval '24 hours'
    )
    SELECT json_build_object(
      'days', v_days,
      'total_accounts', (SELECT count(*) FROM accounts),
      'signups', (SELECT count(*) FROM new_accounts),
      'signups_by_source', (
        SELECT COALESCE(json_agg(json_build_object('name', src, 'count', n) ORDER BY n DESC), '[]'::json)
        FROM (SELECT COALESCE(signup_source, 'direto') AS src, count(*) AS n FROM new_accounts GROUP BY 1) s
      ),
      'activation', json_build_object(
        'eligible', (SELECT count(*) FROM activation),
        'activated', (SELECT count(*) FROM activation WHERE activated)
      ),
      'paying_accounts', (SELECT count(*) FROM paying),
      'paying_by_plan', (
        SELECT COALESCE(json_agg(json_build_object('name', pl, 'count', n) ORDER BY n DESC), '[]'::json)
        FROM (SELECT pl, count(*) AS n FROM paying GROUP BY 1) s
      ),
      'new_customers', (SELECT count(*) FROM first_pay WHERE first_paid_at >= v_since),
      'revenue_cents', (SELECT COALESCE(sum(amount_cents), 0) FROM approved WHERE paid_at >= v_since),
      'payments', (SELECT count(*) FROM approved WHERE paid_at >= v_since),
      'renewal', json_build_object(
        'eligible', (SELECT count(*) FROM first_pay WHERE first_until IS NOT NULL AND first_until < now()),
        'renewed', (SELECT count(*) FROM first_pay WHERE first_until IS NOT NULL AND first_until < now() AND n >= 2)
      ),
      'expiring_soon', (
        SELECT COALESCE(json_agg(json_build_object(
          'username', a.username, 'email', u.email, 'plan', a.plan, 'expires_at', a.plan_expires_at
        ) ORDER BY a.plan_expires_at), '[]'::json)
        FROM accounts a JOIN auth.users u ON u.id = a.id
        WHERE a.plan <> 'free' AND a.plan_expires_at BETWEEN now() AND now() + interval '30 days'
          AND NOT public.is_on_trial(a.id)
      ),
      'views', (SELECT count(*) FROM page_views WHERE created_at >= v_since),
      'clicks', (SELECT count(*) FROM clicks WHERE created_at >= v_since),
      'active_pages', (SELECT count(DISTINCT profile_id) FROM page_views WHERE created_at >= v_since),
      'top_pages', (
        SELECT COALESCE(json_agg(json_build_object('username', t.username, 'views', t.views, 'clicks', t.clicks) ORDER BY t.views DESC), '[]'::json)
        FROM (
          SELECT p.username,
                 (SELECT count(*) FROM page_views v WHERE v.profile_id = p.id AND v.created_at >= v_since) AS views,
                 (SELECT count(*) FROM clicks c WHERE c.profile_id = p.id AND c.created_at >= v_since) AS clicks
          FROM profiles p
          ORDER BY views DESC
          LIMIT 10
        ) t
        WHERE t.views > 0
      )
    )
  );
END;
$$;

-- ───────────────────────── Permissões ─────────────────────────

-- Internas (chamadas só por outras funções, pelo cadastro ou pelas edge functions)
REVOKE ALL ON FUNCTION public.partner_setting(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_active_clients(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_tier(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_discount_pct(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_attach(uuid, uuid, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_start_trial(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_use_invite(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_signup(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.checkout_price(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.license_price(uuid, text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_plan_period(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_record_commission(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_apply_license(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_reverse_payment(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_balances(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_paid_plan(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_on_trial(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkout_price(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.license_price(uuid, text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.partner_reverse_payment(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_paid_plan(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.track_partner_click(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_partner_click(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_invite_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.partner_invite_info(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.partner_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.partner_directory() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.my_partner_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_partner(text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.partner_update_profile(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.partner_accept_invite(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.checkout_quote(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.license_quote(text, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.partner_assign_license(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.partner_request_payout() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.partner_create_invite(text, boolean, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.partner_dashboard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_partners() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_partner_detail(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_partner_payouts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_partner_status(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_partner_attach(uuid, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_partner_detach(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_partner_adjust(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_resolve_partner_payout(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.my_partner_id(), public.apply_partner(text, text, text, text, text, text, text, text),
  public.partner_update_profile(jsonb), public.partner_accept_invite(text), public.checkout_quote(text, text, text),
  public.license_quote(text, text, integer), public.partner_assign_license(uuid, uuid), public.partner_request_payout(),
  public.partner_create_invite(text, boolean, uuid), public.partner_dashboard(), public.admin_partners(),
  public.admin_partner_detail(uuid), public.admin_partner_payouts(), public.admin_set_partner_status(uuid, text, text),
  public.admin_partner_attach(uuid, text, boolean), public.admin_partner_detach(uuid),
  public.admin_partner_adjust(uuid, integer, text), public.admin_resolve_partner_payout(uuid, text, text)
TO authenticated;
