/*
  # Link Icons Feature (og:image / favicon auto + custom upload)

  1. Changes to `links` table
    - `icon_source` (text) - 'none' | 'auto' | 'custom', default 'none'
    - `show_icon` (boolean) - toggle if icon should replace theme's default leading element, default false
    - `icon_fetched_at` (timestamptz) - last time auto-detection ran
    - `icon` column already exists and stores the image URL

  2. Storage
    - New public bucket `link-icons` for user-uploaded custom icons
    - Policies: authenticated users can upload/update/delete their own files;
      public read access (icons must be visible on public bio pages)

  3. Notes
    - Existing links keep default behavior (show_icon=false) so nothing changes visually
    - No destructive operations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'links' AND column_name = 'icon_source'
  ) THEN
    ALTER TABLE links ADD COLUMN icon_source text DEFAULT 'none';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'links' AND column_name = 'show_icon'
  ) THEN
    ALTER TABLE links ADD COLUMN show_icon boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'links' AND column_name = 'icon_fetched_at'
  ) THEN
    ALTER TABLE links ADD COLUMN icon_fetched_at timestamptz;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('link-icons', 'link-icons', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read link icons" ON storage.objects;
CREATE POLICY "Public read link icons"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'link-icons');

DROP POLICY IF EXISTS "Users upload own link icons" ON storage.objects;
CREATE POLICY "Users upload own link icons"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'link-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own link icons" ON storage.objects;
CREATE POLICY "Users update own link icons"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'link-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'link-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own link icons" ON storage.objects;
CREATE POLICY "Users delete own link icons"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'link-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
