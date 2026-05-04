/*
  # Landing Carousel Settings

  Creates a singleton settings row to control the landing page theme carousel:
  speed of auto-advance, transition duration, scale, translate offset, dim opacity,
  drag enabling, and whether to pause on hover.

  1. New Tables
    - `landing_carousel_settings`
      - `id` (int, pk, singleton with value 1)
      - `auto_advance_ms` (int) - ms between slides
      - `transition_ms` (int) - animation duration between slides
      - `scale_active` (numeric) - scale of active slide
      - `scale_inactive` (numeric) - scale of adjacent slides
      - `translate_percent` (int) - horizontal offset percent between slides
      - `inactive_opacity` (numeric) - opacity of adjacent slides
      - `drag_enabled` (bool) - allow mouse/touch drag
      - `pause_on_hover` (bool) - pause auto-advance on hover
      - `updated_at`, `updated_by`

  2. Security
    - RLS enabled
    - Everyone (anon+authenticated) can SELECT (it drives the public landing)
    - Only admins can UPDATE/INSERT
    - No delete policy (singleton is permanent)
*/

CREATE TABLE IF NOT EXISTS landing_carousel_settings (
  id int PRIMARY KEY DEFAULT 1,
  auto_advance_ms int NOT NULL DEFAULT 5000,
  transition_ms int NOT NULL DEFAULT 700,
  scale_active numeric NOT NULL DEFAULT 1.0,
  scale_inactive numeric NOT NULL DEFAULT 0.88,
  translate_percent int NOT NULL DEFAULT 20,
  inactive_opacity numeric NOT NULL DEFAULT 0.5,
  drag_enabled boolean NOT NULL DEFAULT true,
  pause_on_hover boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT singleton_row CHECK (id = 1)
);

INSERT INTO landing_carousel_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE landing_carousel_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read carousel settings" ON landing_carousel_settings;
CREATE POLICY "Anyone can read carousel settings"
  ON landing_carousel_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert carousel settings" ON landing_carousel_settings;
CREATE POLICY "Admins can insert carousel settings"
  ON landing_carousel_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update carousel settings" ON landing_carousel_settings;
CREATE POLICY "Admins can update carousel settings"
  ON landing_carousel_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
