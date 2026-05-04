/*
  # Admin Infrastructure

  1. New Tables
    - `admin_settings` — key/value store for global admin configuration (disabled themes, pro-only themes, etc.)
    - `admin_audit_log` — audit trail of all admin actions

  2. Modified Tables
    - `profiles` — add `suspended_at` timestamptz (null = active, set = suspended)
    - `plans` — add `is_active` boolean default true (soft disable without deleting)

  3. Security
    - `admin_settings`: only admins can read/write (checked via profiles.role join)
    - `admin_audit_log`: admins insert + select; no public access
    - `profiles.suspended_at`: admins can update any profile
    - `plans`: admins can insert/update/delete

  4. Notes
    - Admin check uses a helper function to avoid repetition in policies
    - audit log records: admin_id, action text, target_type, target_id, details jsonb
*/

-- ADMIN SETTINGS
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read settings" ON admin_settings;
CREATE POLICY "Admins read settings" ON admin_settings FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins insert settings" ON admin_settings;
CREATE POLICY "Admins insert settings" ON admin_settings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins update settings" ON admin_settings;
CREATE POLICY "Admins update settings" ON admin_settings FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ADMIN AUDIT LOG
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins insert audit log" ON admin_audit_log;
CREATE POLICY "Admins insert audit log" ON admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins read audit log" ON admin_audit_log;
CREATE POLICY "Admins read audit log" ON admin_audit_log FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ADD suspended_at TO profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN suspended_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- ADD is_active TO plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE plans ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- ALLOW ADMINS TO UPDATE ANY PROFILE (for is_pro, role, suspended_at)
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;
CREATE POLICY "Admins update any profile" ON profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ALLOW ADMINS TO MANAGE PLANS
DROP POLICY IF EXISTS "Admins insert plans" ON plans;
CREATE POLICY "Admins insert plans" ON plans FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins update plans" ON plans;
CREATE POLICY "Admins update plans" ON plans FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins delete plans" ON plans;
CREATE POLICY "Admins delete plans" ON plans FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ALLOW ADMINS TO READ LEADS
DROP POLICY IF EXISTS "Admins read leads" ON leads;
CREATE POLICY "Admins read leads" ON leads FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- INDEX
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(suspended_at) WHERE suspended_at IS NOT NULL;

-- SEED DEFAULT ADMIN SETTINGS
INSERT INTO admin_settings (key, value) VALUES
  ('disabled_themes', '[]'::jsonb),
  ('pro_only_themes', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;
