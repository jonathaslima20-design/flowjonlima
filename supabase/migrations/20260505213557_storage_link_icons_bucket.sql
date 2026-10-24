/*
  # Storage bucket for custom link icons

  1. New Storage
    - Public bucket `link-icons` for user-uploaded icon images.

  2. Security
    - Public SELECT (so icons can be displayed on public bio pages).
    - Authenticated users can insert/update/delete only objects under a path
      prefixed with their own `auth.uid()` (e.g. `<uid>/<link_id>.png`).
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('link-icons', 'link-icons', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read link-icons" ON storage.objects;
CREATE POLICY "Public read link-icons" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'link-icons');

DROP POLICY IF EXISTS "Owners upload link-icons" ON storage.objects;
CREATE POLICY "Owners upload link-icons" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'link-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners update link-icons" ON storage.objects;
CREATE POLICY "Owners update link-icons" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'link-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'link-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners delete link-icons" ON storage.objects;
CREATE POLICY "Owners delete link-icons" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'link-icons'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
