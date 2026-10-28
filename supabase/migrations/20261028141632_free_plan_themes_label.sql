-- Card do plano Free: a quantidade de temas grátis muda pelo admin (Admin → Temas), então o texto não cita número
UPDATE public.plans
   SET features = (SELECT jsonb_agg(CASE WHEN f #>> '{}' ~* '^\d+\s+temas$' THEN to_jsonb('Temas grátis'::text) ELSE f END) FROM jsonb_array_elements(features) f)
 WHERE slug = 'free';
