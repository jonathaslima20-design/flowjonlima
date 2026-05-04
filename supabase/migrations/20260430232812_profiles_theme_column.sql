/*
  # Profiles: theme column

  1. Adds `theme` text column (default 'brutalist') to `profiles` table.
  2. Adds `theme_settings` jsonb column (default '{}') for per-theme overrides.
  3. Idempotent — uses IF NOT EXISTS checks. No data loss.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='theme') THEN
    ALTER TABLE profiles ADD COLUMN theme text DEFAULT 'brutalist';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='theme_settings') THEN
    ALTER TABLE profiles ADD COLUMN theme_settings jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
