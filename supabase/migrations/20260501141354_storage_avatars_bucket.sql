/*
  # Storage bucket for avatars

  1. New Storage
    - Creates public bucket `avatars` for user uploaded profile avatar images.
  2. Security
    - Public read access.
    - INSERT/UPDATE/DELETE restricted to authenticated users operating under their own `{auth.uid()}/...` path prefix.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read avatars bucket" ON storage.objects;
CREATE POLICY "Public read avatars bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Owners upload to avatars bucket" ON storage.objects;
CREATE POLICY "Owners upload to avatars bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners update own avatars" ON storage.objects;
CREATE POLICY "Owners update own avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners delete own avatars" ON storage.objects;
CREATE POLICY "Owners delete own avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
