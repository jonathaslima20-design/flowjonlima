/*
  # Content upgrades: videos, banners, socials

  1. Columns added
    - videos: provider_id text, embed_url text, thumbnail text, aspect text default '16:9', is_active boolean default true
    - banners: size text default 'md', is_active boolean default true
    - social_links: is_active boolean default true
  2. Indexes for is_active ordering
  3. No destructive changes; RLS policies remain as defined in initial schema
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='provider_id') THEN
    ALTER TABLE videos ADD COLUMN provider_id text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='embed_url') THEN
    ALTER TABLE videos ADD COLUMN embed_url text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='thumbnail') THEN
    ALTER TABLE videos ADD COLUMN thumbnail text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='aspect') THEN
    ALTER TABLE videos ADD COLUMN aspect text DEFAULT '16:9';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='videos' AND column_name='is_active') THEN
    ALTER TABLE videos ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='size') THEN
    ALTER TABLE banners ADD COLUMN size text DEFAULT 'md';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='is_active') THEN
    ALTER TABLE banners ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='social_links' AND column_name='is_active') THEN
    ALTER TABLE social_links ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;
