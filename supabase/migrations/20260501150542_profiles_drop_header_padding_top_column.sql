/*
  # Drop unused header_padding_top column from profiles

  1. Changes
    - Removes the previously added `header_padding_top` column. The public page
      now uses a fixed default top spacing, so the column is no longer needed.
  2. Notes
    - Safe: uses IF EXISTS. No impact on other columns or data.
*/

ALTER TABLE profiles DROP COLUMN IF EXISTS header_padding_top;
