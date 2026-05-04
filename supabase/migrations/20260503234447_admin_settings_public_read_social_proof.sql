/*
  # Allow public read of social_proof admin setting

  1. Changes
    - Adds a SELECT policy on admin_settings that allows anyone (including unauthenticated
      visitors) to read the `social_proof` key.
    - All other keys remain admin-only readable.

  2. Reason
    - The landing page Hero fetches social_proof as a server component with no auth session.
    - Without this policy the anon Supabase client gets 0 rows and falls back to hardcoded defaults.
*/

CREATE POLICY "Public can read social_proof setting"
  ON admin_settings
  FOR SELECT
  TO anon
  USING (key = 'social_proof');
