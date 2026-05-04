/*
  # Add button_label and button_url to plans table

  ## Summary
  Adds two new columns to the `plans` table so admins can configure the CTA button
  text and destination URL for each plan directly from the admin panel, instead of
  having them hardcoded in the frontend components.

  ## Changes
  ### Modified Tables
  - `plans`
    - `button_label` (text, nullable) — display text for the plan's CTA button (e.g. "ASSINAR PRO")
    - `button_url` (text, nullable) — destination URL for the plan's CTA button (e.g. "/register?plan=pro_monthly")

  ## Notes
  - Existing plans are seeded with the values that were previously hardcoded in Pricing.tsx / UpgradeModal.tsx
  - NULL values are handled with fallbacks in the frontend components
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'button_label'
  ) THEN
    ALTER TABLE plans ADD COLUMN button_label text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'button_url'
  ) THEN
    ALTER TABLE plans ADD COLUMN button_url text;
  END IF;
END $$;

-- Seed default values matching what was previously hardcoded
UPDATE plans SET button_label = 'COMEÇAR GRÁTIS', button_url = '/register'
  WHERE slug = 'free' AND button_label IS NULL;

UPDATE plans SET button_label = 'ASSINAR PRO', button_url = '/register?plan=pro_monthly'
  WHERE slug = 'pro_monthly' AND button_label IS NULL;

UPDATE plans SET button_label = 'ASSINAR ANUAL', button_url = '/register?plan=pro_annual'
  WHERE slug = 'pro_annual' AND button_label IS NULL;
