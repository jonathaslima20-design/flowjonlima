/*
  # Sistema de Planos e Permissões

  1. Colunas novas em `profiles`
    - `plan` text (free | pro_monthly | pro_annual), default 'free'
    - `plan_expires_at` timestamptz (null = sem expiração)
    - `plan_started_at` timestamptz
    - `referral_code` text unique (gerado)
    - `referred_by` uuid fk para profiles
    - `meta_pixel_id` text (estrutura apenas)
    - `ga_measurement_id` text (estrutura apenas)

  2. Novas tabelas
    - `custom_domains` — estrutura para domínios personalizados (placeholder)
    - `referrals` — registro de indicações

  3. Mudanças em tabelas existentes
    - `plans`: colunas slug, billing_period, limits
    - Populada com 3 registros: free, pro_monthly, pro_annual

  4. Trigger
    - Mantém `profiles.is_pro` sincronizado com o campo `plan` e expiração.

  5. Backfill
    - Perfis existentes com `is_pro=true` recebem `plan='pro_monthly'`.
    - Referral codes gerados para todos perfis existentes.

  6. Segurança
    - RLS nas novas tabelas; apenas admins podem alterar plano de outros usuários.
    - Usuários leem seu próprio plano/referrals/custom_domains.
*/

-- PROFILE COLUMNS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan') THEN
    ALTER TABLE profiles ADD COLUMN plan text DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN plan_expires_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='plan_started_at') THEN
    ALTER TABLE profiles ADD COLUMN plan_started_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referred_by') THEN
    ALTER TABLE profiles ADD COLUMN referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='meta_pixel_id') THEN
    ALTER TABLE profiles ADD COLUMN meta_pixel_id text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='ga_measurement_id') THEN
    ALTER TABLE profiles ADD COLUMN ga_measurement_id text DEFAULT '';
  END IF;
END $$;

-- PLAN COLUMNS (catalog)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='slug') THEN
    ALTER TABLE plans ADD COLUMN slug text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='billing_period') THEN
    ALTER TABLE plans ADD COLUMN billing_period text DEFAULT 'free';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='limits') THEN
    ALTER TABLE plans ADD COLUMN limits jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS plans_slug_idx ON plans(slug) WHERE slug IS NOT NULL;

-- Seed plans (safe upserts)
INSERT INTO plans (slug, name, price_cents, billing_period, features, limits, is_active)
VALUES
  ('free', 'Free', 0, 'free',
    '["3 links","1 banner","1 video","Analytics básico"]'::jsonb,
    '{"links":3,"banners":1,"videos":1,"socials":5,"analytics":"basic","custom_domain":false,"pixel_ga":false,"priority_support":false,"referral":false,"remove_logo":false,"early_access":false}'::jsonb,
    true)
ON CONFLICT DO NOTHING;

INSERT INTO plans (slug, name, price_cents, billing_period, features, limits, is_active)
VALUES
  ('pro_monthly', 'Pro Mensal', 2900, 'monthly',
    '["Links sociais ilimitados","Links ilimitados","Vídeos ilimitados","Banners ilimitados","Domínio personalizado","Meta Pixel e Google Analytics","Suporte prioritário","Indique e ganhe"]'::jsonb,
    '{"links":-1,"banners":-1,"videos":-1,"socials":-1,"analytics":"advanced","custom_domain":true,"pixel_ga":true,"priority_support":true,"referral":true,"remove_logo":false,"early_access":false}'::jsonb,
    true)
ON CONFLICT DO NOTHING;

INSERT INTO plans (slug, name, price_cents, billing_period, features, limits, is_active)
VALUES
  ('pro_annual', 'Pro Anual', 27900, 'annual',
    '["Tudo do Pro Mensal","Remoção da logo Bioflowzy","Desconto de 20%","Acesso antecipado a novos recursos"]'::jsonb,
    '{"links":-1,"banners":-1,"videos":-1,"socials":-1,"analytics":"advanced","custom_domain":true,"pixel_ga":true,"priority_support":true,"referral":true,"remove_logo":true,"early_access":true}'::jsonb,
    true)
ON CONFLICT DO NOTHING;

-- CUSTOM DOMAINS (placeholder structure)
CREATE TABLE IF NOT EXISTS custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain text NOT NULL,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS custom_domains_domain_idx ON custom_domains(domain);
CREATE INDEX IF NOT EXISTS custom_domains_profile_idx ON custom_domains(profile_id);
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own domains" ON custom_domains;
CREATE POLICY "Users read own domains" ON custom_domains FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own domains" ON custom_domains;
CREATE POLICY "Users insert own domains" ON custom_domains FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users update own domains" ON custom_domains;
CREATE POLICY "Users update own domains" ON custom_domains FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own domains" ON custom_domains;
CREATE POLICY "Users delete own domains" ON custom_domains FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all domains" ON custom_domains;
CREATE POLICY "Admins read all domains" ON custom_domains FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  reward_granted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_id);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own referrals" ON referrals;
CREATE POLICY "Users read own referrals" ON referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all referrals" ON referrals;
CREATE POLICY "Admins read all referrals" ON referrals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Generate referral code function
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Unique referral code enforcement
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Backfill: referral codes
DO $$
DECLARE
  r record;
  code text;
  tries int;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE referral_code IS NULL LOOP
    tries := 0;
    LOOP
      code := generate_referral_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = code);
      tries := tries + 1;
      IF tries > 10 THEN EXIT; END IF;
    END LOOP;
    UPDATE profiles SET referral_code = code WHERE id = r.id;
  END LOOP;
END $$;

-- Backfill: plan for existing is_pro users
UPDATE profiles SET plan = 'pro_monthly', plan_started_at = COALESCE(plan_started_at, now())
  WHERE is_pro = true AND (plan IS NULL OR plan = 'free');

UPDATE profiles SET plan = 'free' WHERE plan IS NULL;

-- Trigger: keep is_pro in sync with plan
CREATE OR REPLACE FUNCTION sync_is_pro_from_plan() RETURNS trigger AS $$
BEGIN
  NEW.is_pro := (NEW.plan IN ('pro_monthly','pro_annual'))
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_is_pro ON profiles;
CREATE TRIGGER trg_sync_is_pro BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_is_pro_from_plan();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_expires ON profiles(plan_expires_at) WHERE plan_expires_at IS NOT NULL;
