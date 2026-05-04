/*
  # Add avatar_size column to profiles

  1. Changes
    - Adds an `avatar_size` integer column to `profiles` to control the public
      avatar diameter in pixels. Defaults to 90px as specified.
  2. Notes
    - Safe: uses IF NOT EXISTS so re-running is a no-op.
    - No data loss. Existing rows receive the default 90.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_size'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_size integer DEFAULT 90;
  END IF;
END $$;
