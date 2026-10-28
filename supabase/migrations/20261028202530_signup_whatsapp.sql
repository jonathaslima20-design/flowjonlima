/*
  WhatsApp no cadastro

  - `profile_private.whatsapp`: só dígitos com DDI (ex.: 5511999998888) ou vazio; privado (dono e admin),
    nunca em `profiles`, que é público
  - `handle_new_user` grava o número enviado no cadastro (`raw_user_meta_data.whatsapp`); números do Brasil
    sem DDI (10 ou 11 dígitos) ganham o 55. Um número inválido não impede o cadastro (fica vazio)
  - O dono pode editar em Configurações (policy de UPDATE já existente); o admin abre a conversa em Usuários
*/

ALTER TABLE public.profile_private ADD COLUMN IF NOT EXISTS whatsapp text NOT NULL DEFAULT '';

ALTER TABLE public.profile_private DROP CONSTRAINT IF EXISTS profile_private_whatsapp_format;
ALTER TABLE public.profile_private ADD CONSTRAINT profile_private_whatsapp_format
  CHECK (whatsapp = '' OR whatsapp ~ '^[1-9][0-9]{9,14}$');

CREATE OR REPLACE FUNCTION public.normalize_whatsapp(p_raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN d ~ '^[1-9][0-9]{9,10}$' THEN '55' || d
    WHEN d ~ '^[1-9][0-9]{11,14}$' THEN d
    ELSE ''
  END
  FROM (SELECT regexp_replace(coalesce(p_raw, ''), '\D', '', 'g') AS d) s;
$$;

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
  v_ref_code text;
  v_referrer_id uuid;
  v_source text;
  v_campaign text;
  v_whatsapp text;
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
  WHILE public.is_reserved_username(final_username)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := desired_username || suffix::text;
  END LOOP;

  -- Resolve referral code to referrer UUID
  v_ref_code := NULLIF(TRIM(NEW.raw_user_meta_data->>'referred_by_code'), '');
  IF v_ref_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_ref_code
    LIMIT 1;
  END IF;

  -- Origem do cadastro (vem do navegador: normaliza)
  v_source := NULLIF(lower(left(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'signup_source', ''), '[^a-zA-Z0-9._-]', '', 'g'), 40)), '');
  v_campaign := NULLIF(lower(left(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'signup_campaign', ''), '[^a-zA-Z0-9._-]', '', 'g'), 60)), '');

  INSERT INTO public.profiles (id, username, display_name, referred_by, signup_source, signup_campaign)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
    v_referrer_id,
    COALESCE(v_source, 'direto'),
    v_campaign
  )
  ON CONFLICT (id) DO NOTHING;

  -- WhatsApp vai para os dados privados (a linha é criada pelo trigger de profiles)
  -- (bloco próprio: um erro aqui não desfaz a criação do perfil)
  BEGIN
    v_whatsapp := public.normalize_whatsapp(NEW.raw_user_meta_data->>'whatsapp');
    IF v_whatsapp <> '' THEN
      INSERT INTO public.profile_private (profile_id, whatsapp)
      VALUES (NEW.id, v_whatsapp)
      ON CONFLICT (profile_id) DO UPDATE SET whatsapp = EXCLUDED.whatsapp, updated_at = now();
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Create referral entry if referred
  IF v_referrer_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id, status)
    VALUES (v_referrer_id, NEW.id, 'pending')
    ON CONFLICT (referrer_id, referred_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
