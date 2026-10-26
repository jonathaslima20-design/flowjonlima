/*
  # Landing D2: depoimentos e configurações públicas

  1. Leitura pública de `admin_settings` para chaves sem dados sensíveis: `social_proof`,
     `pro_only_themes` e `disabled_themes`. Antes só o admin lia as listas de temas, então a tela
     de Aparência mostrava temas Pro como liberados para quem é Free (o banco barrava ao salvar),
     e usuários logados não liam o social proof
  2. `landing_testimonials`: depoimentos da landing, editados em Admin → Depoimentos. A seção
     só aparece quando há depoimentos ativos
*/

DROP POLICY IF EXISTS "Public can read social_proof setting" ON public.admin_settings;
DROP POLICY IF EXISTS "Public read public settings" ON public.admin_settings;
CREATE POLICY "Public read public settings" ON public.admin_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('social_proof', 'pro_only_themes', 'disabled_themes'));

CREATE TABLE IF NOT EXISTS public.landing_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  role text NOT NULL DEFAULT '' CHECK (char_length(role) <= 80),
  avatar_url text,
  page_url text,
  quote text NOT NULL CHECK (char_length(quote) BETWEEN 1 AND 400),
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active testimonials" ON public.landing_testimonials;
CREATE POLICY "Public read active testimonials" ON public.landing_testimonials
  FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage testimonials" ON public.landing_testimonials;
CREATE POLICY "Admins manage testimonials" ON public.landing_testimonials
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.landing_testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.landing_testimonials TO authenticated;
