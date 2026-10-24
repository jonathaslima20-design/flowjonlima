/*
  # Add header_padding_top column to profiles

  1. Changes
    - Adds `header_padding_top` integer column to `profiles` to control the
      top padding (in pixels) above the avatar on the public bio page.
    - Defaults to 72px, giving generous breathing room by default.
  2. Notes
    - Safe: uses IF NOT EXISTS. No data loss. Existing rows get default.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'header_padding_top'
  ) THEN
    ALTER TABLE profiles ADD COLUMN header_padding_top integer DEFAULT 72;
  END IF;
END $$;
