/*
  # Add section_order column to profiles

  1. Changes
    - Adds `section_order` column (text[]) to `profiles` table
    - Stores the user-chosen order of public-page sections: socials, links, banners, videos
    - Default is `{socials,links,banners,videos}` (current visual order)
  2. Constraints
    - CHECK constraint enforces that the array contains only valid section keys
  3. Security
    - No RLS changes; existing policies cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'section_order'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN section_order text[] NOT NULL DEFAULT ARRAY['socials','links','banners','videos']::text[];
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_section_order_valid'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_section_order_valid
      CHECK (section_order <@ ARRAY['socials','links','banners','videos']::text[]);
  END IF;
END $$;
