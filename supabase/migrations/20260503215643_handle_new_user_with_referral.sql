/*
  # Atualizar handle_new_user para processar código de indicação

  ## Resumo
  Atualiza a trigger function `handle_new_user` para ler o campo `referred_by_code`
  do metadata do usuário recém-criado, resolver para o UUID do referenciador,
  preencher `referred_by` no perfil e inserir automaticamente uma entrada na
  tabela `referrals`.

  ## Mudanças
  - `handle_new_user()`: lê `raw_user_meta_data->>'referred_by_code'`, busca o
    perfil correspondente ao código e preenche `referred_by` na inserção do perfil.
  - Após inserir o perfil, insere em `referrals` se houver referenciador válido.

  ## Notas
  - Usa SECURITY DEFINER para contornar RLS durante a criação do perfil.
  - Ignora erros silenciosamente para não bloquear o cadastro do usuário.
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
  v_ref_code text;
  v_referrer_id uuid;
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

  -- Resolve referral code to referrer UUID
  v_ref_code := NULLIF(TRIM(NEW.raw_user_meta_data->>'referred_by_code'), '');
  IF v_ref_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
      FROM public.profiles
      WHERE referral_code = v_ref_code
      LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, referred_by)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
    v_referrer_id
  )
  ON CONFLICT (id) DO NOTHING;

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
