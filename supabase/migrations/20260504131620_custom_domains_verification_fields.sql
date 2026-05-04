/*
  # Custom domains: verification workflow + lookup RPC

  1. Alteracoes em `custom_domains`
    - Adiciona colunas: `verification_token`, `status`, `last_checked_at`, `error_message`
    - CHECK constraint para status em ('pending','verified','failed')
    - CHECK de formato basico do dominio (lowercase, pontos, hifens)
    - UNIQUE em `profile_id` garantindo um dominio por perfil

  2. Nova funcao RPC `public.lookup_domain(p_domain text)`
    - Retorna profile_id e username para dominios verificados
    - SECURITY DEFINER para permitir leitura controlada via anon/auth
    - Nao vaza tokens nem status

  3. Seguranca
    - RLS da tabela ja existente mantem restricao por owner
    - RPC limita leitura ao que o middleware precisa
*/

ALTER TABLE custom_domains
  ADD COLUMN IF NOT EXISTS verification_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex');

ALTER TABLE custom_domains
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

ALTER TABLE custom_domains
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

ALTER TABLE custom_domains
  ADD COLUMN IF NOT EXISTS error_message text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_domains_status_check'
  ) THEN
    ALTER TABLE custom_domains
      ADD CONSTRAINT custom_domains_status_check
      CHECK (status IN ('pending','verified','failed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_domains_domain_format_check'
  ) THEN
    ALTER TABLE custom_domains
      ADD CONSTRAINT custom_domains_domain_format_check
      CHECK (domain ~* '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'custom_domains_profile_unique'
  ) THEN
    ALTER TABLE custom_domains
      ADD CONSTRAINT custom_domains_profile_unique UNIQUE (profile_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.lookup_domain(p_domain text)
RETURNS TABLE(profile_id uuid, username text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cd.profile_id, p.username
  FROM custom_domains cd
  JOIN profiles p ON p.id = cd.profile_id
  WHERE cd.domain = lower(p_domain)
    AND cd.verified = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_domain(text) TO anon, authenticated;
