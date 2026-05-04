/*
  # Sistema de comissões de indicação e saques via Pix

  ## Resumo
  Implementa o programa "Indique e ganhe" completo: rastreamento de conversões,
  cálculo automático de comissões, cadastro de chave Pix e solicitações de saque.

  ## Novas colunas em `profiles`
  - `pix_key` (text): chave Pix para recebimento de comissões
  - `commission_balance` (integer): saldo acumulado em centavos (ex: 1000 = R$10,00)

  ## Novas colunas em `referrals`
  - `plan_type` (text): plano contratado pelo indicado ('pro_monthly' | 'pro_annual')
  - `commission_value` (integer): valor da comissão em centavos (1000 ou 10000)
  - `commission_status` (text): status da comissão ('pending' | 'paid' | 'cancelled')

  ## Novas tabelas
  - `payout_requests`: solicitações de saque de comissões
    - `id` (uuid PK)
    - `user_id` (uuid FK → profiles)
    - `amount_cents` (integer): valor solicitado em centavos
    - `pix_key` (text): chave Pix usada no momento do saque
    - `status` (text): 'pending' | 'approved' | 'paid' | 'rejected'
    - `admin_note` (text): observações do admin
    - `created_at`, `updated_at` (timestamptz)

  ## Triggers
  - `on_plan_upgrade`: ao mudar o plano de um usuário para pro_monthly ou pro_annual,
    se ele foi indicado, gera comissão automaticamente (R$10 mensal, R$100 anual)
    e atualiza o saldo do referenciador.

  ## Segurança
  - RLS habilitado em `payout_requests`
  - Usuários leem/criam apenas seus próprios saques
  - Admins leem todos os saques
*/

-- Colunas em profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='pix_key'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pix_key text DEFAULT '';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='commission_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN commission_balance integer DEFAULT 0;
  END IF;
END $$;

-- Colunas em referrals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='plan_type'
  ) THEN
    ALTER TABLE referrals ADD COLUMN plan_type text DEFAULT '';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='commission_value'
  ) THEN
    ALTER TABLE referrals ADD COLUMN commission_value integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='commission_status'
  ) THEN
    ALTER TABLE referrals ADD COLUMN commission_status text DEFAULT 'pending';
  END IF;
END $$;

-- Tabela de solicitações de saque
CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  pix_key text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payout_requests_user_idx ON payout_requests(user_id);
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own payout requests" ON payout_requests;
CREATE POLICY "Users read own payout requests"
  ON payout_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users create own payout requests" ON payout_requests;
CREATE POLICY "Users create own payout requests"
  ON payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all payout requests" ON payout_requests;
CREATE POLICY "Admins read all payout requests"
  ON payout_requests FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins update payout requests" ON payout_requests;
CREATE POLICY "Admins update payout requests"
  ON payout_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Trigger: gerar comissão ao upgrade de plano
CREATE OR REPLACE FUNCTION handle_plan_upgrade_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id uuid;
  v_commission_value integer;
  v_referral_id uuid;
BEGIN
  -- Só dispara quando o plano muda de free para pro
  IF OLD.plan = NEW.plan THEN RETURN NEW; END IF;
  IF NEW.plan NOT IN ('pro_monthly', 'pro_annual') THEN RETURN NEW; END IF;
  IF OLD.plan != 'free' THEN RETURN NEW; END IF;

  -- Busca referenciador
  v_referrer_id := NEW.referred_by;
  IF v_referrer_id IS NULL THEN RETURN NEW; END IF;

  -- Calcula comissão
  IF NEW.plan = 'pro_monthly' THEN
    v_commission_value := 1000; -- R$10,00
  ELSE
    v_commission_value := 10000; -- R$100,00
  END IF;

  -- Busca o referral existente
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

  -- Atualiza referral com comissão
  UPDATE referrals
    SET plan_type = NEW.plan,
        commission_value = v_commission_value,
        commission_status = 'pending',
        status = 'converted',
        reward_granted = true
    WHERE id = v_referral_id;

  -- Atualiza saldo do referenciador
  UPDATE profiles
    SET commission_balance = COALESCE(commission_balance, 0) + v_commission_value
    WHERE id = v_referrer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_plan_upgrade_commission ON profiles;
CREATE TRIGGER trg_plan_upgrade_commission
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_plan_upgrade_commission();

-- Política para admins lerem referrals
DROP POLICY IF EXISTS "Users read own referrals as referrer" ON referrals;
CREATE POLICY "Users read own referrals as referrer"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());
