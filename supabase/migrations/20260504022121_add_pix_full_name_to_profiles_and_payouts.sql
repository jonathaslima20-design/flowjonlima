/*
  # Add pix_full_name field for Pix withdrawals

  ## Changes
  - `profiles`: adds `pix_full_name` (text) to store the account holder's full name alongside their Pix key
  - `payout_requests`: adds `pix_full_name` (text) to record the holder name at the time of each withdrawal request

  ## Notes
  Both columns default to empty string so existing rows are unaffected.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pix_full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pix_full_name TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payout_requests' AND column_name = 'pix_full_name'
  ) THEN
    ALTER TABLE payout_requests ADD COLUMN pix_full_name TEXT NOT NULL DEFAULT '';
  END IF;
END $$;
