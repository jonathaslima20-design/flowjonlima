/*
  # Remove deprecated themes

  Removes theme_showcase_presets entries for the following themes that are no longer
  available in the codebase:
  - consultancy
  - keynote
  - manga
  - bauhaus
  - newspaper
*/

DELETE FROM theme_showcase_presets
WHERE theme_key IN ('consultancy', 'keynote', 'manga', 'bauhaus', 'newspaper');
