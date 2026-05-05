/*
  # Backfill real demo URLs into showcase preset links

  1. Purpose
    - Showcase preset links currently store `url: '#'` (placeholder), so the admin
      "Detectar" button would refuse to run. Assign plausible real URLs from a
      curated pool so detection works out of the box.

  2. Changes
    - For each entry in `catalog_links` / `landing_links` where `url = '#'` or empty,
      set the url to a pool entry by index.
    - Idempotent: entries with a non-placeholder url are left untouched.

  3. Security
    - Data-only update. No schema or RLS changes.
*/

DO $$
DECLARE
  r RECORD;
  pool text[] := ARRAY[
    'https://calendly.com',
    'https://shopify.com',
    'https://substack.com',
    'https://github.com',
    'https://youtube.com',
    'https://spotify.com',
    'https://linkedin.com',
    'https://instagram.com'
  ];
  new_catalog jsonb;
  new_landing jsonb;
  i int;
  elem jsonb;
  arr jsonb;
  cur text;
BEGIN
  FOR r IN SELECT theme_key, catalog_links, landing_links FROM theme_showcase_presets LOOP
    new_catalog := '[]'::jsonb;
    i := 0;
    arr := COALESCE(r.catalog_links, '[]'::jsonb);
    FOR elem IN SELECT * FROM jsonb_array_elements(arr) LOOP
      cur := COALESCE(elem->>'url', '');
      IF cur = '' OR cur = '#' THEN
        new_catalog := new_catalog || jsonb_build_array(
          elem || jsonb_build_object('url', pool[(i % array_length(pool,1)) + 1])
        );
      ELSE
        new_catalog := new_catalog || jsonb_build_array(elem);
      END IF;
      i := i + 1;
    END LOOP;

    new_landing := '[]'::jsonb;
    i := 0;
    arr := COALESCE(r.landing_links, '[]'::jsonb);
    FOR elem IN SELECT * FROM jsonb_array_elements(arr) LOOP
      cur := COALESCE(elem->>'url', '');
      IF cur = '' OR cur = '#' THEN
        new_landing := new_landing || jsonb_build_array(
          elem || jsonb_build_object('url', pool[(i % array_length(pool,1)) + 1])
        );
      ELSE
        new_landing := new_landing || jsonb_build_array(elem);
      END IF;
      i := i + 1;
    END LOOP;

    UPDATE theme_showcase_presets
       SET catalog_links = new_catalog,
           landing_links = new_landing,
           updated_at = now()
     WHERE theme_key = r.theme_key;
  END LOOP;
END $$;