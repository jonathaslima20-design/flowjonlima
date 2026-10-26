-- Remove 17 temas do sistema (código apagado em themes/). Limpa referências no banco.
DO $$
DECLARE
  removed text[] := ARRAY['aurora','conversion','prism','cosmos','forest','retrowave','neonlab','glitch','lava',
                          'editorial','kyoto','swiss','botanica','blueprint','gazette','breathe','terminal'];
BEGIN
  -- Páginas que ainda usassem um deles voltam para o tema padrão
  UPDATE public.profiles SET theme = 'cupertino' WHERE theme = ANY(removed);

  DELETE FROM public.theme_showcase_presets WHERE theme_key = ANY(removed);
  DELETE FROM public.theme_presets WHERE theme_key = ANY(removed);

  -- Nichos da landing: trocam para temas parecidos, sem os ajustes do tema antigo
  UPDATE public.landing_niches SET theme_key = 'creator', demo = jsonb_set(demo, '{theme_settings}', '{}'::jsonb)
    WHERE theme_key = 'aurora';
  UPDATE public.landing_niches SET theme_key = 'bento', demo = jsonb_set(demo, '{theme_settings}', '{}'::jsonb)
    WHERE theme_key = ANY(removed);

  -- Listas em admin_settings (Pro, ocultos, galeria da landing)
  UPDATE public.admin_settings
     SET value = COALESCE((SELECT jsonb_agg(v) FROM jsonb_array_elements_text(value) v WHERE v <> ALL(removed)), '[]'::jsonb),
         updated_at = now()
   WHERE key IN ('pro_only_themes', 'disabled_themes', 'landing_gallery') AND jsonb_typeof(value) = 'array';
END $$;
