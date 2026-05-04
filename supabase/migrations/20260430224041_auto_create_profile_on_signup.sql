/*
  # Auto-create profile on signup

  1. Changes
    - Adds `handle_new_user()` function (SECURITY DEFINER) that inserts a profile
      row when a new auth.users row is created.
    - Uses `username` from user metadata (fallback to email prefix + short id).
    - Creates trigger `on_auth_user_created` on auth.users AFTER INSERT.

  2. Security
    - Function runs as definer to bypass RLS during the trigger INSERT.
    - RLS on profiles is unchanged; client INSERT still restricted to auth.uid()=id.

  3. Notes
    - Avoids the "new row violates row-level security policy" error at signup
      caused by the client session not being active immediately after signUp.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_username text;
  final_username text;
  suffix int := 0;
BEGIN
  desired_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(NEW.email, '@', 1)
  );
  desired_username := lower(regexp_replace(desired_username, '[^a-z0-9_.-]', '', 'gi'));
  IF desired_username IS NULL OR desired_username = '' THEN
    desired_username := 'user' || substr(NEW.id::text, 1, 8);
  END IF;

  final_username := desired_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := desired_username || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, final_username, COALESCE(NEW.raw_user_meta_data->>'display_name', final_username))
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();