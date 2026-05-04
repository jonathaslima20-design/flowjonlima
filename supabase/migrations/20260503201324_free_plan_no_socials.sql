/*
  # Free plan: remove social links

  1. Changes
    - Update `plans.limits.socials` for slug='free' from 5 to 0.
    - Remove "Links sociais" claims from free features.
  2. Notes
    - No data loss: existing social_links rows are preserved; only new ones are blocked by app-level check.
*/

UPDATE plans
SET limits = jsonb_set(limits, '{socials}', '0'::jsonb, false),
    features = '["3 links","1 banner","1 vídeo","Analytics básico"]'::jsonb
WHERE slug = 'free';
