/*
  # Add hide_branding column to profiles

  1. Changes
    - Adds `hide_branding` (boolean, default false) to `profiles`
    - Enables Pro Anual users to optionally hide the Bioflowzy branding badge
  2. Notes
    - Default false means branding IS shown by default for everyone
    - Only accounts with the `remove_logo` plan feature (Pro Anual) should be able to flip this toggle via the UI
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hide_branding'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hide_branding boolean NOT NULL DEFAULT false;
  END IF;
END $$;