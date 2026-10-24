/*
  # Tracking de cliques com validação e limite

  ## Problema
  Qualquer pessoa podia inserir cliques direto em `clicks` (policy INSERT aberta para
  anon) para qualquer perfil e qualquer entidade, inflando os analytics de terceiros.

  ## Mudanças
  - Remove a policy de INSERT aberta em `clicks`; a única forma de registrar é a RPC.
  - `track_click(profile, tipo, entidade)`:
    - valida o tipo e que a entidade existe, está ativa e pertence ao perfil;
    - ignora perfis suspensos;
    - identifica o visitante por hash do IP (cf-connecting-ip / x-forwarded-for),
      sem guardar o IP;
    - ignora repetição do mesmo visitante na mesma entidade em 30 s, mais de 30
      cliques do mesmo visitante no perfil em 10 min e mais de 600 cliques no perfil
      por minuto;
    - incrementa `links.clicks` para cliques em links.
  - Coluna `visitor_hash` + índice para os limites.
*/

ALTER TABLE public.clicks ADD COLUMN IF NOT EXISTS visitor_hash text;
CREATE INDEX IF NOT EXISTS idx_clicks_visitor ON public.clicks (visitor_hash, created_at DESC);

DROP POLICY IF EXISTS "Anyone track click" ON public.clicks;

CREATE OR REPLACE FUNCTION public.track_click(p_profile_id uuid, p_entity_type text, p_entity_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_headers json;
  v_ip text;
  v_visitor text;
  v_ok boolean;
BEGIN
  IF p_profile_id IS NULL OR p_entity_type NOT IN ('link', 'social', 'banner', 'video') THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id AND suspended_at IS NULL) THEN
    RETURN false;
  END IF;

  -- A entidade precisa existir, estar ativa e pertencer ao perfil
  v_ok := CASE p_entity_type
    WHEN 'link'   THEN EXISTS (SELECT 1 FROM links        WHERE id = p_entity_id AND profile_id = p_profile_id AND is_active)
    WHEN 'social' THEN EXISTS (SELECT 1 FROM social_links WHERE id = p_entity_id AND profile_id = p_profile_id AND is_active)
    WHEN 'banner' THEN EXISTS (SELECT 1 FROM banners      WHERE id = p_entity_id AND profile_id = p_profile_id AND is_active)
    WHEN 'video'  THEN EXISTS (SELECT 1 FROM videos       WHERE id = p_entity_id AND profile_id = p_profile_id AND is_active)
  END;
  IF NOT v_ok THEN
    RETURN false;
  END IF;

  -- IP do visitante vem dos headers que o PostgREST repassa; só o hash é guardado
  v_headers := COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::json;
  v_ip := COALESCE(
    NULLIF(v_headers->>'cf-connecting-ip', ''),
    NULLIF(btrim(split_part(v_headers->>'x-forwarded-for', ',', 1)), ''),
    NULLIF(v_headers->>'x-real-ip', ''),
    'unknown'
  );
  v_visitor := md5(v_ip || ':' || p_profile_id::text);

  PERFORM pg_advisory_xact_lock(hashtext('track:' || v_visitor));

  IF EXISTS (
    SELECT 1 FROM clicks
    WHERE visitor_hash = v_visitor AND entity_id = p_entity_id
      AND created_at > now() - interval '30 seconds'
  ) THEN
    RETURN false;
  END IF;

  IF (SELECT count(*) FROM clicks
      WHERE visitor_hash = v_visitor AND created_at > now() - interval '10 minutes') >= 30 THEN
    RETURN false;
  END IF;

  IF (SELECT count(*) FROM clicks
      WHERE profile_id = p_profile_id AND created_at > now() - interval '1 minute') >= 600 THEN
    RETURN false;
  END IF;

  INSERT INTO clicks (profile_id, entity_type, entity_id, visitor_hash)
  VALUES (p_profile_id, p_entity_type, p_entity_id, v_visitor);

  IF p_entity_type = 'link' THEN
    UPDATE links SET clicks = COALESCE(clicks, 0) + 1 WHERE id = p_entity_id;
  END IF;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.track_click(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_click(uuid, text, uuid) TO anon, authenticated;
