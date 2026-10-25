/*
  # Domínio próprio: escrita só pelo servidor

  Antes, o próprio usuário podia marcar `custom_domains.verified = true` direto pela API,
  e o domínio nunca era adicionado ao Netlify. Agora toda escrita passa pela edge function
  `custom-domain` (service_role), que confere o DNS e cadastra o domínio no site do Netlify.

  1. Usuários só leem a própria linha (policies de insert/update/delete removidas)
  2. `netlify_added`: o domínio está cadastrado como alias no site do Netlify
  3. Domínio único entre contas; domínios da própria plataforma bloqueados
*/

DROP POLICY IF EXISTS "Users insert own domains" ON public.custom_domains;
DROP POLICY IF EXISTS "Users update own domains" ON public.custom_domains;
DROP POLICY IF EXISTS "Users delete own domains" ON public.custom_domains;

ALTER TABLE public.custom_domains
  ADD COLUMN IF NOT EXISTS netlify_added boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_domains_domain_unique') THEN
    ALTER TABLE public.custom_domains ADD CONSTRAINT custom_domains_domain_unique UNIQUE (domain);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'custom_domains_not_platform') THEN
    ALTER TABLE public.custom_domains ADD CONSTRAINT custom_domains_not_platform CHECK (
      domain <> 'bioflowzy.com'
      AND domain !~ '\.(bioflowzy\.com|netlify\.app)$'
    );
  END IF;
END $$;

REVOKE INSERT, UPDATE, DELETE ON public.custom_domains FROM anon, authenticated;
