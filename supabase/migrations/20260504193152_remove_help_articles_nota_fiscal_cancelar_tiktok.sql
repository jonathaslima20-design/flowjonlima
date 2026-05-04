/*
  # Remove help articles: Nota fiscal, Cancelando um plano, TikTok Pixel

  Changes:
  - Unpublish "Nota fiscal e recibos" article (slug: nota-fiscal, category: planos)
  - Unpublish "Cancelando um plano" article (slug: cancelar, category: planos)
  - Unpublish "TikTok Pixel" article (slug: tiktok-pixel, category: integracoes)
  - Update "integracoes" category description to remove TikTok Pixel reference
  - Update "videos" category description to remove TikTok reference
*/

UPDATE help_articles
SET published = false, updated_at = now()
WHERE slug IN ('nota-fiscal', 'cancelar', 'tiktok-pixel');

UPDATE help_categories
SET description = 'Meta Pixel e Google Analytics para rastrear visitas e conversoes.', updated_at = now()
WHERE slug = 'integracoes';

UPDATE help_categories
SET description = 'Incorpore videos do YouTube, Vimeo e mais.', updated_at = now()
WHERE slug = 'videos';
