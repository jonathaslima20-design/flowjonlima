/*
  # Coleção 2026: 30 temas novos

  24 entram como Pro (lista `admin_settings.pro_only_themes`, editável em Admin → Temas).
  Ficam grátis: bento, swiss, editorial, ticket, chat, breathe.
*/

UPDATE public.admin_settings
SET value = (
  SELECT jsonb_agg(DISTINCT k ORDER BY k)
  FROM (
    SELECT jsonb_array_elements_text(COALESCE(value, '[]'::jsonb)) AS k
    UNION
    SELECT unnest(ARRAY[
      'liquid', 'spatial', 'holo', 'kinetic', 'retroos', 'sticker', 'flux', 'clay',
      'wallet', 'y2k', 'kyoto', 'arcade', 'receipt', 'scrapbook', 'hud', 'vinyl',
      'noir', 'botanica', 'blueprint', 'papercut', 'memphis', 'gazette', 'esports', 'stories'
    ])
  ) keys
),
updated_at = now()
WHERE key = 'pro_only_themes';
