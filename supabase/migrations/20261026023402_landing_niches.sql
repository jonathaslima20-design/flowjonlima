/*
  # Exemplos por nicho na landing ("Para quem é")

  Cada nicho tem uma aba na landing com título, descrição, 3 benefícios e um celular com uma
  página de exemplo, no mesmo formato da vitrine de temas do hero. O admin edita tudo em
  Admin → Nichos da landing.

  `demo` guarda a página de exemplo: { profile, links, socials, banners, videos, theme_core, theme_settings }.
*/

CREATE TABLE IF NOT EXISTS public.landing_niches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9-]{2,30}$'),
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 40),
  headline text NOT NULL DEFAULT '' CHECK (char_length(headline) <= 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 400),
  benefits text[] NOT NULL DEFAULT '{}',
  theme_key text NOT NULL,
  demo jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_niches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active niches" ON public.landing_niches;
CREATE POLICY "Public read active niches" ON public.landing_niches
  FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage niches" ON public.landing_niches;
CREATE POLICY "Admins manage niches" ON public.landing_niches
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.landing_niches TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.landing_niches TO authenticated;

INSERT INTO public.landing_niches (key, label, headline, description, benefits, theme_key, demo, position) VALUES
('lojas', 'Lojas', 'Transforme seguidores em clientes',
 'Catálogo, promoções e pedidos pelo WhatsApp num link só, com captura de contatos para vender de novo.',
 ARRAY['Botão de WhatsApp com mensagem pronta', 'Banners para promoções e lançamentos', 'Contatos dos interessados direto no painel'],
 'cupertino',
 '{"profile":{"display_name":"Ateliê Flor de Lis","username":"ateliefloredelis","bio":"Peças artesanais com envio para todo o Brasil 🌸"},"links":[{"id":"l1","title":"Ver catálogo completo","subtitle":"Novidades toda semana","url":"#","is_active":true,"show_icon":false},{"id":"l2","title":"Promoção da semana","subtitle":"Até 30% off","url":"#","is_active":true,"show_icon":false},{"id":"l3","title":"Fazer pedido no WhatsApp","subtitle":"Resposta em minutos","url":"#","is_active":true,"show_icon":false}],"socials":[{"id":"s1","platform":"instagram","url":"#"},{"id":"s2","platform":"whatsapp","url":"#"}],"banners":[],"videos":[],"theme_core":{},"theme_settings":{}}'::jsonb,
 0),
('criadores', 'Criadores', 'Tudo o que você cria, num lugar só',
 'Vídeos, parcerias e redes organizados numa página com a sua cara, e analytics para saber de onde vem o seu público.',
 ARRAY['Vídeos do YouTube e TikTok na própria página', 'Saiba se o público vem do Instagram, TikTok ou WhatsApp', 'Temas exclusivos para combinar com o seu estilo'],
 'aurora',
 '{"profile":{"display_name":"Lu Andrade","username":"luandrade","bio":"Conteúdo sobre rotina, viagens e autocuidado ✨"},"links":[{"id":"l1","title":"Meu vídeo novo","subtitle":"Saiu hoje!","url":"#","is_active":true,"show_icon":false},{"id":"l2","title":"Parcerias e publis","subtitle":"Mídia kit 2026","url":"#","is_active":true,"show_icon":false},{"id":"l3","title":"Meus favoritos","subtitle":"Produtos que eu uso","url":"#","is_active":true,"show_icon":false}],"socials":[{"id":"s1","platform":"instagram","url":"#"},{"id":"s2","platform":"tiktok","url":"#"},{"id":"s3","platform":"youtube","url":"#"}],"banners":[],"videos":[],"theme_core":{},"theme_settings":{}}'::jsonb,
 1),
('profissionais', 'Profissionais liberais', 'Agenda cheia, sem complicação',
 'Psicólogos, advogados, personal trainers e consultores: agendamento, portfólio e depoimentos numa página profissional.',
 ARRAY['Botão de agendamento em destaque', 'Domínio próprio para passar mais credibilidade', 'QR code para cartões de visita'],
 'graphite',
 '{"profile":{"display_name":"Dra. Camila Rocha","username":"dracamilarocha","bio":"Psicóloga clínica • Atendimento online e presencial"},"links":[{"id":"l1","title":"Agendar consulta","subtitle":"Horários desta semana","url":"#","is_active":true,"show_icon":false},{"id":"l2","title":"Como funciona a terapia","subtitle":"Tire suas dúvidas","url":"#","is_active":true,"show_icon":false},{"id":"l3","title":"Depoimentos","subtitle":"O que dizem os pacientes","url":"#","is_active":true,"show_icon":false}],"socials":[{"id":"s1","platform":"instagram","url":"#"},{"id":"s2","platform":"linkedin","url":"#"},{"id":"s3","platform":"whatsapp","url":"#"}],"banners":[],"videos":[],"theme_core":{},"theme_settings":{}}'::jsonb,
 2),
('restaurantes', 'Restaurantes', 'Do Instagram para o pedido em um toque',
 'Cardápio, delivery, reservas e localização num link só, e um QR code para colocar na mesa e na embalagem.',
 ARRAY['Cardápio e delivery sempre atualizados', 'QR code para mesas, balcão e embalagens', 'Contagem regressiva para promoções do dia'],
 'sunset',
 '{"profile":{"display_name":"Brasa Burger","username":"brasaburger","bio":"Hambúrguer artesanal na brasa 🍔 Delivery e salão"},"links":[{"id":"l1","title":"Cardápio","subtitle":"Veja todos os lanches","url":"#","is_active":true,"show_icon":false},{"id":"l2","title":"Pedir no delivery","subtitle":"Entrega em 40 min","url":"#","is_active":true,"show_icon":false},{"id":"l3","title":"Como chegar","subtitle":"Aberto até 23h","url":"#","is_active":true,"show_icon":false}],"socials":[{"id":"s1","platform":"instagram","url":"#"},{"id":"s2","platform":"whatsapp","url":"#"}],"banners":[],"videos":[],"theme_core":{},"theme_settings":{}}'::jsonb,
 3),
('agencias', 'Agências', 'Todas as páginas dos seus clientes num painel',
 'Crie várias páginas, dê acesso de edição aos clientes e receba um relatório mensal com os resultados de cada uma.',
 ARRAY['Até 5 páginas na mesma conta', 'Acesso de clientes e equipe por link de convite', 'Relatório mensal por e-mail e exportação dos dados'],
 'agency',
 '{"profile":{"display_name":"Studio Norte","username":"studionorte","bio":"Marketing digital para pequenos negócios"},"links":[{"id":"l1","title":"Conheça nossos cases","subtitle":"Resultados reais","url":"#","is_active":true,"show_icon":false},{"id":"l2","title":"Solicitar orçamento","subtitle":"Resposta em 24h","url":"#","is_active":true,"show_icon":false},{"id":"l3","title":"Fale com a equipe","subtitle":"WhatsApp comercial","url":"#","is_active":true,"show_icon":false}],"socials":[{"id":"s1","platform":"instagram","url":"#"},{"id":"s2","platform":"linkedin","url":"#"}],"banners":[],"videos":[],"theme_core":{},"theme_settings":{}}'::jsonb,
 4)
ON CONFLICT (key) DO NOTHING;
