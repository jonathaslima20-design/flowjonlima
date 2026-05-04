/*
  # Theme Showcase Presets

  1. New Table
    - `theme_showcase_presets` — per-theme custom demo data for both the
      dashboard theme catalog and the landing page carousel. Each theme
      has two independent datasets so admins can tailor what appears on
      the public landing vs. the user-facing catalog.

  2. Columns
    - `theme_key` (text, PK) — matches themes registry key.
    - `catalog_profile`, `catalog_links`, `catalog_socials`,
      `catalog_videos`, `catalog_banners` — jsonb overrides for the catalog.
    - `landing_profile`, `landing_links`, `landing_socials`,
      `landing_videos`, `landing_banners` — jsonb overrides for the landing.
    - `landing_tagline` — optional text caption (admin-side reference).
    - `show_in_catalog` — bool, whether this preset applies in the catalog.
    - `show_in_landing_carousel` — bool, whether this theme appears on
      the landing carousel.
    - `landing_order` — int for carousel ordering.
    - `updated_at`, `updated_by` — audit columns.

  3. Security
    - RLS enabled.
    - SELECT is public (anon + authenticated) so the landing carousel and
      catalog can render without a session.
    - INSERT/UPDATE/DELETE restricted to admins (profiles.role = 'admin').
*/

CREATE TABLE IF NOT EXISTS theme_showcase_presets (
  theme_key text PRIMARY KEY,
  catalog_profile jsonb DEFAULT '{}'::jsonb,
  catalog_links jsonb DEFAULT '[]'::jsonb,
  catalog_socials jsonb DEFAULT '[]'::jsonb,
  catalog_videos jsonb DEFAULT '[]'::jsonb,
  catalog_banners jsonb DEFAULT '[]'::jsonb,
  landing_profile jsonb DEFAULT '{}'::jsonb,
  landing_links jsonb DEFAULT '[]'::jsonb,
  landing_socials jsonb DEFAULT '[]'::jsonb,
  landing_videos jsonb DEFAULT '[]'::jsonb,
  landing_banners jsonb DEFAULT '[]'::jsonb,
  landing_tagline text DEFAULT '',
  show_in_catalog boolean DEFAULT true,
  show_in_landing_carousel boolean DEFAULT false,
  landing_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE theme_showcase_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read showcase presets" ON theme_showcase_presets;
CREATE POLICY "Public can read showcase presets"
  ON theme_showcase_presets FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins insert showcase presets" ON theme_showcase_presets;
CREATE POLICY "Admins insert showcase presets"
  ON theme_showcase_presets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins update showcase presets" ON theme_showcase_presets;
CREATE POLICY "Admins update showcase presets"
  ON theme_showcase_presets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins delete showcase presets" ON theme_showcase_presets;
CREATE POLICY "Admins delete showcase presets"
  ON theme_showcase_presets FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_showcase_landing
  ON theme_showcase_presets(show_in_landing_carousel, landing_order);
