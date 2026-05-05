/*
  # Enrich existing theme_showcase_presets link arrays with auto icons

  1. Purpose
    - Existing showcase presets (catalog_links / landing_links) were stored as plain
      link objects without icon fields. Themes now render icons via LinkIcon, so the
      vitrines don't reflect the native look until each demo link has icon data.

  2. Changes
    - For every row in `theme_showcase_presets`, map over catalog_links and landing_links
      and, for entries missing `icon_source`, add defaults:
        * show_icon: true
        * icon_source: 'auto'
        * icon: derived from the link url's host via Google S2 favicons when the URL
          looks like a real http(s) URL, else empty string (themes fall back gracefully)
    - Idempotent: entries that already contain `icon_source` are left untouched so
      admin-edited presets are preserved.
    - No schema changes, no destructive operations, no RLS changes.

  3. Security
    - Data-only update. RLS policies on theme_showcase_presets remain unchanged.
*/

DO $$
DECLARE
  r RECORD;
  new_catalog jsonb;
  new_landing jsonb;
BEGIN
  FOR r IN SELECT theme_key, catalog_links, landing_links FROM theme_showcase_presets LOOP
    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN (elem ? 'icon_source') THEN elem
        ELSE elem
          || jsonb_build_object('show_icon', true, 'icon_source', 'auto')
          || jsonb_build_object(
               'icon',
               CASE
                 WHEN (elem->>'url') ~* '^https?://[^/]+' THEN
                   'https://www.google.com/s2/favicons?domain=' ||
                   regexp_replace(elem->>'url', '^https?://([^/]+).*$', '\1') ||
                   '&sz=128'
                 ELSE ''
               END
             )
      END
    ), '[]'::jsonb)
    INTO new_catalog
    FROM jsonb_array_elements(COALESCE(r.catalog_links, '[]'::jsonb)) elem;

    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN (elem ? 'icon_source') THEN elem
        ELSE elem
          || jsonb_build_object('show_icon', true, 'icon_source', 'auto')
          || jsonb_build_object(
               'icon',
               CASE
                 WHEN (elem->>'url') ~* '^https?://[^/]+' THEN
                   'https://www.google.com/s2/favicons?domain=' ||
                   regexp_replace(elem->>'url', '^https?://([^/]+).*$', '\1') ||
                   '&sz=128'
                 ELSE ''
               END
             )
      END
    ), '[]'::jsonb)
    INTO new_landing
    FROM jsonb_array_elements(COALESCE(r.landing_links, '[]'::jsonb)) elem;

    UPDATE theme_showcase_presets
       SET catalog_links = new_catalog,
           landing_links = new_landing,
           updated_at = now()
     WHERE theme_key = r.theme_key;
  END LOOP;
END $$;