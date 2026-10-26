/*
  # Seleção manual da galeria de temas da landing

  `admin_settings.landing_gallery`: lista ordenada de temas da seção "Galeria de temas"
  (Admin → Landing page → Galeria). Vazia = automática. Leitura pública, como as demais
  configurações da landing; escrita continua só para admin.
*/

DROP POLICY IF EXISTS "Public read public settings" ON public.admin_settings;
CREATE POLICY "Public read public settings" ON public.admin_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('social_proof', 'pro_only_themes', 'disabled_themes', 'landing_gallery'));
