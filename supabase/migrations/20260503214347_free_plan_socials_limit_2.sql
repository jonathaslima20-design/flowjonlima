/*
  # Update free plan social links limit to 2

  ## Summary
  Updates the `plans` table to allow free plan users to have up to 2 social links
  (previously 0 — fully blocked). Also updates the features list displayed in
  the pricing UI to reflect the new benefit.

  ## Changes
  - `plans` table: `limits.socials` for slug='free' changed from 0 to 2
  - `plans` table: `features` for slug='free' updated to include "2 links sociais"

  ## Notes
  - Pro plans remain unlimited (socials: -1)
  - No destructive operations — only UPDATE statements
*/

UPDATE plans
SET
  limits = jsonb_set(limits, '{socials}', '2'::jsonb, false),
  features = '["3 links","2 links sociais","1 banner","1 vídeo","Analytics básico"]'::jsonb
WHERE slug = 'free';
