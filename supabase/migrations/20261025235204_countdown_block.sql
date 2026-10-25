/*
  # Bloco de contagem regressiva (Business)

  1. `profiles.countdown_title` e `profiles.countdown_ends_at`: o bloco aparece na página
     enquanto `countdown_ends_at` estiver no futuro
  2. Limite `countdown` no plano (só Business)
  3. Trigger impede ativar/alterar o bloco sem o recurso no plano (apagar é sempre permitido)
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS countdown_title text,
  ADD COLUMN IF NOT EXISTS countdown_ends_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_countdown_title_length') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_countdown_title_length CHECK (countdown_title IS NULL OR char_length(countdown_title) <= 80);
  END IF;
END $$;

UPDATE public.plans SET limits = limits || jsonb_build_object('countdown', slug = 'business');

CREATE OR REPLACE FUNCTION public.enforce_countdown_feature()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.countdown_ends_at IS NOT NULL
     AND (NEW.countdown_ends_at IS DISTINCT FROM OLD.countdown_ends_at OR NEW.countdown_title IS DISTINCT FROM OLD.countdown_title)
     AND NOT COALESCE((public.plan_limit(NEW.id, 'countdown'))::text::boolean, false)
  THEN
    RAISE EXCEPTION 'Contagem regressiva está disponível no plano Business' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_countdown ON public.profiles;
CREATE TRIGGER trg_enforce_countdown
  BEFORE UPDATE OF countdown_title, countdown_ends_at ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_countdown_feature();
