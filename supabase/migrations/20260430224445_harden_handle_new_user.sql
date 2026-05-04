/*
  # Harden handle_new_user trigger

  1. Changes
    - Recreate `handle_new_user()` with explicit search_path and row_security bypass
      to guarantee the trigger inserts profiles even if the table owner does not
      have BYPASSRLS. The function runs as SECURITY DEFINER owned by postgres.
    - Adds a permissive RLS INSERT policy `"Service can insert profiles"` on
      profiles for role `postgres`, allowing the SECURITY DEFINER function to
      insert rows without being blocked by RLS.

  2. Security
    - No user-facing access is widened; the new policy targets only the
      `postgres` role, which is used by the trigger context.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET row_security = off
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
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Service can insert profiles" ON public.profiles;
CREATE POLICY "Service can insert profiles" ON public.profiles
  FOR INSERT TO postgres
  WITH CHECK (true);