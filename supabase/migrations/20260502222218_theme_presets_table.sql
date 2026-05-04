/*
  # Theme presets table

  Stores user-saved theme customization presets that can be re-applied to their bio.

  1. New Tables
    - `theme_presets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `theme_key` (text, the theme this preset targets, e.g. 'atlas')
      - `name` (text, user-chosen label)
      - `settings` (jsonb, snapshot of profile-level fields and per-theme settings)
      - `created_at`, `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can only view, insert, update, and delete their own presets

  3. Indexes
    - Composite index on (user_id, theme_key) for fast list-by-theme queries
*/

CREATE TABLE IF NOT EXISTS theme_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_key text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT 'Preset',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS theme_presets_user_theme_idx
  ON theme_presets (user_id, theme_key);

ALTER TABLE theme_presets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'theme_presets' AND policyname = 'Users view own presets'
  ) THEN
    CREATE POLICY "Users view own presets"
      ON theme_presets FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'theme_presets' AND policyname = 'Users insert own presets'
  ) THEN
    CREATE POLICY "Users insert own presets"
      ON theme_presets FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'theme_presets' AND policyname = 'Users update own presets'
  ) THEN
    CREATE POLICY "Users update own presets"
      ON theme_presets FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'theme_presets' AND policyname = 'Users delete own presets'
  ) THEN
    CREATE POLICY "Users delete own presets"
      ON theme_presets FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
