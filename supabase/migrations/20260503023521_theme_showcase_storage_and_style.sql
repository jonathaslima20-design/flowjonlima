/*
  # Theme Showcase — Storage bucket & theme style columns

  1. Storage
    - Creates public bucket `theme-showcase` for admin-uploaded demo assets
      (avatars, banners, videos, thumbnails) scoped per theme.
    - Public SELECT so landing/catalog can render anonymously.
    - INSERT/UPDATE/DELETE restricted to admins (profiles.role = 'admin').

  2. Modified table
    - `theme_showcase_presets` — adds four jsonb columns to store theme
      style customization per dataset:
        * `catalog_theme_core`      (bg/button/text colors, sizes, etc)
        * `catalog_theme_settings`  (theme-specific controls)
        * `landing_theme_core`
        * `landing_theme_settings`
*/

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('theme-showcase', 'theme-showcase', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read theme-showcase" ON storage.objects;
CREATE POLICY "Public read theme-showcase" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'theme-showcase');

DROP POLICY IF EXISTS "Admins upload theme-showcase" ON storage.objects;
CREATE POLICY "Admins upload theme-showcase" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'theme-showcase'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins update theme-showcase" ON storage.objects;
CREATE POLICY "Admins update theme-showcase" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'theme-showcase'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    bucket_id = 'theme-showcase'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins delete theme-showcase" ON storage.objects;
CREATE POLICY "Admins delete theme-showcase" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'theme-showcase'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- THEME STYLE COLUMNS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'theme_showcase_presets' AND column_name = 'catalog_theme_core') THEN
    ALTER TABLE theme_showcase_presets ADD COLUMN catalog_theme_core jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'theme_showcase_presets' AND column_name = 'catalog_theme_settings') THEN
    ALTER TABLE theme_showcase_presets ADD COLUMN catalog_theme_settings jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'theme_showcase_presets' AND column_name = 'landing_theme_core') THEN
    ALTER TABLE theme_showcase_presets ADD COLUMN landing_theme_core jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'theme_showcase_presets' AND column_name = 'landing_theme_settings') THEN
    ALTER TABLE theme_showcase_presets ADD COLUMN landing_theme_settings jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;
