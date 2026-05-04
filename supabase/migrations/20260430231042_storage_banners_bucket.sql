/*
  # Storage bucket for banners
  1. Creates public bucket `banners` for user uploaded banner images.
  2. Policies restrict INSERT/UPDATE/DELETE to authenticated users writing under their own `{auth.uid()}/...` path prefix. Public read access enabled.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read banners bucket" ON storage.objects;
CREATE POLICY "Public read banners bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Owners upload to banners bucket" ON storage.objects;
CREATE POLICY "Owners upload to banners bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners update own banners" ON storage.objects;
CREATE POLICY "Owners update own banners" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners delete own banners" ON storage.objects;
CREATE POLICY "Owners delete own banners" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'banners'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
