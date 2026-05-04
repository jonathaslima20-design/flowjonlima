/*
  # Social Proof Landing Config

  1. Changes
    - Inserts a default `social_proof` key into `admin_settings` with:
      - `text`: the phrase shown next to avatars on the landing page hero
      - `avatars`: array of up to 4 public image URLs (initially Pexels URLs matching current hardcoded values)

  2. Notes
    - Uses INSERT ... ON CONFLICT DO NOTHING so re-running is safe
    - No new tables — reuses the existing admin_settings key-value store
    - Admins can update this via the admin panel; the landing page reads it at build/request time
*/

INSERT INTO admin_settings (key, value, updated_at)
VALUES (
  'social_proof',
  jsonb_build_object(
    'text', '+12.000 criadores já usam BioFlowzy',
    'avatars', jsonb_build_array(
      'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80',
      'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=80',
      'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=80',
      'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=80'
    )
  ),
  now()
)
ON CONFLICT (key) DO NOTHING;
