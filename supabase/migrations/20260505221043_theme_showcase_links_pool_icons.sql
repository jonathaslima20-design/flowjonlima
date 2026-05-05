/*
  # Assign curated demo icons to showcase preset links

  1. Purpose
    - Existing presets store placeholder `url: '#'`, so favicon derivation produces
      empty strings. Vitrines need actual icons to visually demonstrate the feature.
    - Assign a rotating pool of tasteful brand icons (via Google S2 favicons) to any
      link entry in catalog_links / landing_links where `icon` is empty.

  2. Changes
    - Update each row of `theme_showcase_presets`, iterating over catalog_links and
      landing_links in order. For entries where icon is '' or NULL, assign the next
      pool icon (by index). Preserves icon_source=auto and show_icon=true.
    - Idempotent: entries with a non-empty `icon` are left untouched.

  3. Security
    - Data-only update. No schema or RLS changes.
*/

DO $$
DECLARE
  r RECORD;
  pool text[] := ARRAY[
    'https://www.google.com/s2/favicons?domain=calendly.com&sz=128',
    'https://www.google.com/s2/favicons?domain=shopify.com&sz=128',
    'https://www.google.com/s2/favicons?domain=substack.com&sz=128',
    'https://www.google.com/s2/favicons?domain=github.com&sz=128',
    'https://www.google.com/s2/favicons?domain=youtube.com&sz=128',
    'https://www.google.com/s2/favicons?domain=spotify.com&sz=128',
    'https://www.google.com/s2/favicons?domain=linkedin.com&sz=128',
    'https://www.google.com/s2/favicons?domain=instagram.com&sz=128'
  ];
  new_catalog jsonb;
  new_landing jsonb;
  i int;
  elem jsonb;
  arr jsonb;
BEGIN
  FOR r IN SELECT theme_key, catalog_links, landing_links FROM theme_showcase_presets LOOP
    new_catalog := '[]'::jsonb;
    i := 0;
    arr := COALESCE(r.catalog_links, '[]'::jsonb);
    FOR elem IN SELECT * FROM jsonb_array_elements(arr) LOOP
      IF COALESCE(elem->>'icon', '') = '' THEN
        new_catalog := new_catalog || jsonb_build_array(
          elem
            || jsonb_build_object('icon', pool[(i % array_length(pool,1)) + 1])
            || jsonb_build_object('show_icon', true, 'icon_source', 'auto')
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
      IF COALESCE(elem->>'icon', '') = '' THEN
        new_landing := new_landing || jsonb_build_array(
          elem
            || jsonb_build_object('icon', pool[(i % array_length(pool,1)) + 1])
            || jsonb_build_object('show_icon', true, 'icon_source', 'auto')
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