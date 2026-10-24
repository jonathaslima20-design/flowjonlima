/*
  # Link icon options

  1. Changes
    - `links` table gains three optional columns:
      - `show_icon` boolean default false: controls whether the button shows
        an image icon instead of the theme's default visual element.
      - `icon_source` text default 'auto': how the icon URL was obtained.
        Valid values by convention: 'auto' (detected from URL via edge function),
        'custom' (uploaded by the user) or 'none'.
      - `icon_fetched_at` timestamptz: last time the auto-detect ran.
    - Existing `icon` column (already stores a URL) is unchanged.

  2. Security
    - RLS policies already exist on `links`; no changes needed.

  3. Notes
    - Defaults keep current behavior: `show_icon` is false, so existing links
      render exactly as before.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'links' AND column_name = 'show_icon'
  ) THEN
    ALTER TABLE links ADD COLUMN show_icon boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'links' AND column_name = 'icon_source'
  ) THEN
    ALTER TABLE links ADD COLUMN icon_source text DEFAULT 'auto';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'links' AND column_name = 'icon_fetched_at'
  ) THEN
    ALTER TABLE links ADD COLUMN icon_fetched_at timestamptz;
  END IF;
END $$;
