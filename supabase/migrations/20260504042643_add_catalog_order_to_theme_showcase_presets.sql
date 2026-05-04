/*
  # Add catalog_order to theme_showcase_presets

  ## Summary
  Adds a `catalog_order` integer column to `theme_showcase_presets` so admins can
  control the display order of themes in the user-facing theme catalog (dashboard
  customize page) via drag-and-drop in the admin Gestão de Temas page.

  ## Changes
  - `theme_showcase_presets`: new column `catalog_order` (integer, default 0)
  - Populates initial values based on the canonical theme registry order
  - Adds index `idx_showcase_catalog_order` for fast ordered queries

  ## Notes
  - Only rows that already exist in the table get explicit order values; new rows
    default to 0 and will appear first until the admin reorders them.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'theme_showcase_presets' AND column_name = 'catalog_order'
  ) THEN
    ALTER TABLE theme_showcase_presets ADD COLUMN catalog_order integer NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_showcase_catalog_order
  ON theme_showcase_presets (catalog_order);

-- Seed initial catalog_order based on the canonical registry order.
-- Themes not yet in the table will default to 0.
UPDATE theme_showcase_presets SET catalog_order = 0  WHERE theme_key = 'brutalist';
UPDATE theme_showcase_presets SET catalog_order = 1  WHERE theme_key = 'aurora';
UPDATE theme_showcase_presets SET catalog_order = 2  WHERE theme_key = 'atlas';
UPDATE theme_showcase_presets SET catalog_order = 3  WHERE theme_key = 'conversion';
UPDATE theme_showcase_presets SET catalog_order = 4  WHERE theme_key = 'terminal';
UPDATE theme_showcase_presets SET catalog_order = 5  WHERE theme_key = 'chrome';
UPDATE theme_showcase_presets SET catalog_order = 6  WHERE theme_key = 'prism';
UPDATE theme_showcase_presets SET catalog_order = 7  WHERE theme_key = 'cyber';
UPDATE theme_showcase_presets SET catalog_order = 8  WHERE theme_key = 'retrowave';
UPDATE theme_showcase_presets SET catalog_order = 9  WHERE theme_key = 'neonlab';
UPDATE theme_showcase_presets SET catalog_order = 10 WHERE theme_key = 'creator';
UPDATE theme_showcase_presets SET catalog_order = 11 WHERE theme_key = 'agency';
UPDATE theme_showcase_presets SET catalog_order = 12 WHERE theme_key = 'consultancy';
UPDATE theme_showcase_presets SET catalog_order = 13 WHERE theme_key = 'keynote';
UPDATE theme_showcase_presets SET catalog_order = 14 WHERE theme_key = 'graphite';
UPDATE theme_showcase_presets SET catalog_order = 15 WHERE theme_key = 'sunset';
UPDATE theme_showcase_presets SET catalog_order = 16 WHERE theme_key = 'forest';
UPDATE theme_showcase_presets SET catalog_order = 17 WHERE theme_key = 'manga';
UPDATE theme_showcase_presets SET catalog_order = 18 WHERE theme_key = 'bauhaus';
UPDATE theme_showcase_presets SET catalog_order = 19 WHERE theme_key = 'lava';
UPDATE theme_showcase_presets SET catalog_order = 20 WHERE theme_key = 'newspaper';
UPDATE theme_showcase_presets SET catalog_order = 21 WHERE theme_key = 'glitch';
UPDATE theme_showcase_presets SET catalog_order = 22 WHERE theme_key = 'cosmos';
