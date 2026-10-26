/*
  # Relatório mensal por e-mail (Business)

  1. `profiles.monthly_report_enabled` (padrão: ligado) e limite `monthly_report` no plano
  2. `monthly_report_log`: cada envio (sent/error/test) por conta e mês, para não repetir
  3. RPCs só para service_role (usadas pela edge function `monthly-report`):
     - `monthly_report_recipients(p_period, p_limit)`: contas Business elegíveis ainda sem envio no mês
     - `monthly_report_data(p_account, p_period)`: números de cada página da conta no mês
     - `verify_report_cron_token(p_token)`: confere o token guardado no Vault
  4. pg_cron chama a função de hora em hora nos dias 1 e 2 de cada mês (lotes; reenvia erros até 3x)
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Preferência e plano --------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_report_enabled boolean NOT NULL DEFAULT true;
UPDATE public.plans SET limits = limits || jsonb_build_object('monthly_report', slug = 'business');

-- 2. Registro dos envios -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monthly_report_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'error', 'test')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_monthly_report_log_profile ON public.monthly_report_log(profile_id, period_start);
ALTER TABLE public.monthly_report_log ENABLE ROW LEVEL SECURITY;
-- Sem policies: só a service_role lê e escreve

-- 3. RPCs da edge function -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.monthly_report_recipients(p_period date, p_limit integer DEFAULT 40)
RETURNS TABLE (profile_id uuid, email text, display_name text, username text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT p.id, u.email::text, p.display_name, p.username
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.owner_id IS NULL
    AND p.suspended_at IS NULL
    AND p.monthly_report_enabled
    AND u.email IS NOT NULL
    AND COALESCE((public.plan_limit(p.id, 'monthly_report'))::text::boolean, false)
    AND NOT EXISTS (
      SELECT 1 FROM monthly_report_log l
      WHERE l.profile_id = p.id AND l.period_start = p_period AND l.status = 'sent'
    )
    AND (SELECT count(*) FROM monthly_report_log l
         WHERE l.profile_id = p.id AND l.period_start = p_period AND l.status = 'error') < 3
  ORDER BY p.created_at
  LIMIT GREATEST(p_limit, 1);
$$;

CREATE OR REPLACE FUNCTION public.monthly_report_data(p_account uuid, p_period date)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Mês no horário de Brasília
  v_start timestamptz := (p_period::timestamp) AT TIME ZONE 'America/Sao_Paulo';
  v_end timestamptz := ((p_period + interval '1 month')::timestamp) AT TIME ZONE 'America/Sao_Paulo';
  v_prev timestamptz := ((p_period - interval '1 month')::timestamp) AT TIME ZONE 'America/Sao_Paulo';
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(page ORDER BY page_order, created), '[]'::json)
    FROM (
      SELECT
        (pr.owner_id IS NOT NULL)::int AS page_order,
        pr.created_at AS created,
        json_build_object(
          'username', pr.username,
          'display_name', pr.display_name,
          'views', (SELECT count(*) FROM page_views v WHERE v.profile_id = pr.id AND v.created_at >= v_start AND v.created_at < v_end),
          'prev_views', (SELECT count(*) FROM page_views v WHERE v.profile_id = pr.id AND v.created_at >= v_prev AND v.created_at < v_start),
          'clicks', (SELECT count(*) FROM clicks c WHERE c.profile_id = pr.id AND c.created_at >= v_start AND c.created_at < v_end),
          'prev_clicks', (SELECT count(*) FROM clicks c WHERE c.profile_id = pr.id AND c.created_at >= v_prev AND c.created_at < v_start),
          'leads', (SELECT count(*) FROM page_leads l WHERE l.profile_id = pr.id AND l.created_at >= v_start AND l.created_at < v_end),
          'top_links', (
            SELECT COALESCE(json_agg(json_build_object('title', t.title, 'clicks', t.n) ORDER BY t.n DESC), '[]'::json)
            FROM (
              SELECT COALESCE(NULLIF(lk.title, ''), 'Link sem título') AS title, count(*) AS n
              FROM clicks c JOIN links lk ON lk.id = c.entity_id
              WHERE c.profile_id = pr.id AND c.entity_type = 'link' AND c.created_at >= v_start AND c.created_at < v_end
              GROUP BY 1 ORDER BY n DESC LIMIT 3
            ) t
          ),
          'top_sources', (
            SELECT COALESCE(json_agg(json_build_object('name', s.source, 'count', s.n) ORDER BY s.n DESC), '[]'::json)
            FROM (
              SELECT source, count(*) AS n FROM page_views v
              WHERE v.profile_id = pr.id AND v.created_at >= v_start AND v.created_at < v_end
              GROUP BY source ORDER BY n DESC LIMIT 3
            ) s
          )
        ) AS page
      FROM profiles pr
      WHERE pr.id = p_account OR pr.owner_id = p_account
    ) pages
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_report_cron_token(p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT p_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'monthly_report_cron_token' AND decrypted_secret = p_token
  );
$$;

REVOKE ALL ON FUNCTION public.monthly_report_recipients(date, integer) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.monthly_report_data(uuid, date) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_report_cron_token(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monthly_report_recipients(date, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.monthly_report_data(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_report_cron_token(text) TO service_role;

-- 4. Agendamento ---------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'monthly_report_cron_token') THEN
    PERFORM vault.create_secret(encode(gen_random_bytes(24), 'hex'), 'monthly_report_cron_token', 'Token do pg_cron para a edge function monthly-report');
  END IF;
END $$;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'monthly-report';
SELECT cron.schedule(
  'monthly-report',
  '5 * 1,2 * *',
  $cron$
  SELECT net.http_post(
    url := 'https://ghdytnynplyhugkpmhoy.supabase.co/functions/v1/monthly-report',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'mode', 'cron',
      'token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'monthly_report_cron_token')
    ),
    timeout_milliseconds := 5000
  );
  $cron$
);
