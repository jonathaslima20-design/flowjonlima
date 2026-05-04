/*
  # Add Meta Pixel and Google Analytics toggles to profiles

  1. Changes
    - `profiles.meta_pixel_enabled` (boolean, default true) - toggle Pixel on/off without clearing the ID
    - `profiles.ga_enabled` (boolean, default true) - toggle GA on/off without clearing the ID

  2. Notes
    - `meta_pixel_id` and `ga_measurement_id` already exist in profiles
    - Defaults mean existing users with IDs configured will immediately start firing events
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'meta_pixel_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN meta_pixel_enabled boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ga_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ga_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;
