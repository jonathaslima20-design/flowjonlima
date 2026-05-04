/*
  # Help Center (Central de Ajuda)

  1. New Tables
    - `help_categories`
      - `id` (uuid, pk)
      - `slug` (text, unique)
      - `title` (text)
      - `description` (text)
      - `icon` (text) — lucide icon name
      - `sort_order` (int)
      - `published` (bool)
      - `created_at` / `updated_at` (timestamptz)
    - `help_articles`
      - `id` (uuid, pk)
      - `category_id` (uuid, fk -> help_categories)
      - `slug` (text)
      - `title` (text)
      - `summary` (text)
      - `body` (text) — markdown-ish / plain paragraphs
      - `sort_order` (int)
      - `published` (bool)
      - `created_at` / `updated_at` (timestamptz)
      - UNIQUE(category_id, slug)

  2. Security
    - RLS ENABLED on both tables.
    - Public (anon + authenticated) can SELECT only where published = true.
    - Admins (profiles.role = 'admin') can INSERT/UPDATE/DELETE.

  3. Seed
    - Seeds categories covering every dashboard section.
    - Seeds multiple articles per category in Portuguese.

  4. Notes
    - Uses stable slugs for upsert-safe seeding.
    - No destructive operations.
*/

CREATE TABLE IF NOT EXISTS help_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'BookOpen',
  sort_order int DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES help_categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text DEFAULT '',
  body text DEFAULT '',
  sort_order int DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published);

ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='help_categories' AND policyname='Public read published categories') THEN
    CREATE POLICY "Public read published categories"
      ON help_categories FOR SELECT
      TO anon, authenticated
      USING (published = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='help_categories' AND policyname='Admins insert categories') THEN
    CREATE POLICY "Admins insert categories"
      ON help_categories FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='help_categories' AND policyname='Admins update categories') THEN
    CREATE POLICY "Admins update categories"
      ON help_categories FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='help_categories' AND policyname='Admins delete categories') THEN
    CREATE POLICY "Admins delete categories"
      ON help_categories FOR DELETE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='help_articles' AND policyname='Public read published articles') THEN
    CREATE POLICY "Public read published articles"
      ON help_articles FOR SELECT
      TO anon, authenticated
      USING (published = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='help_articles' AND policyname='Admins insert articles') THEN
    CREATE POLICY "Admins insert articles"
      ON help_articles FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='help_articles' AND policyname='Admins update articles') THEN
    CREATE POLICY "Admins update articles"
      ON help_articles FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='help_articles' AND policyname='Admins delete articles') THEN
    CREATE POLICY "Admins delete articles"
      ON help_articles FOR DELETE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

INSERT INTO help_categories (slug, title, description, icon, sort_order) VALUES
  ('primeiros-passos','Primeiros passos','Tudo que voce precisa para comecar sua bio em minutos.','Rocket',1),
  ('links','Links','Adicione, edite e reorganize seus links.','Link2',2),
  ('redes-sociais','Redes sociais','Conecte seus perfis favoritos em um unico lugar.','AtSign',3),
  ('videos','Videos','Incorpore videos do YouTube, TikTok e mais.','Video',4),
  ('banners','Banners','Destaque campanhas e promocoes com imagens.','Image',5),
  ('aparencia','Aparencia','Temas, cores, fontes e tudo que impacta o visual.','Palette',6),
  ('dominio','Dominio personalizado','Use o seu proprio dominio na sua pagina.','Globe',7),
  ('integracoes','Integracoes','Meta Pixel, Google Analytics e TikTok Pixel.','Plug',8),
  ('analytics','Analytics','Acompanhe cliques, visitas e desempenho.','BarChart3',9),
  ('planos','Planos e cobranca','Detalhes dos planos, upgrade e pagamento.','CreditCard',10),
  ('indicacoes','Indique e ganhe','Como funciona o programa de indicacoes.','Gift',11),
  ('conta','Conta e seguranca','Senha, email e protecao da sua conta.','ShieldCheck',12)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

DO $$
DECLARE
  c_start uuid; c_links uuid; c_social uuid; c_video uuid; c_banners uuid;
  c_look uuid; c_domain uuid; c_integ uuid; c_analytics uuid;
  c_plans uuid; c_ref uuid; c_account uuid;
BEGIN
  SELECT id INTO c_start FROM help_categories WHERE slug='primeiros-passos';
  SELECT id INTO c_links FROM help_categories WHERE slug='links';
  SELECT id INTO c_social FROM help_categories WHERE slug='redes-sociais';
  SELECT id INTO c_video FROM help_categories WHERE slug='videos';
  SELECT id INTO c_banners FROM help_categories WHERE slug='banners';
  SELECT id INTO c_look FROM help_categories WHERE slug='aparencia';
  SELECT id INTO c_domain FROM help_categories WHERE slug='dominio';
  SELECT id INTO c_integ FROM help_categories WHERE slug='integracoes';
  SELECT id INTO c_analytics FROM help_categories WHERE slug='analytics';
  SELECT id INTO c_plans FROM help_categories WHERE slug='planos';
  SELECT id INTO c_ref FROM help_categories WHERE slug='indicacoes';
  SELECT id INTO c_account FROM help_categories WHERE slug='conta';

  INSERT INTO help_articles (category_id, slug, title, summary, body, sort_order) VALUES
  (c_start,'criando-conta','Como criar sua conta','Faca seu cadastro em menos de um minuto.',
   E'1. Acesse a pagina inicial e clique em "Criar agora".\n2. Escolha seu nome de usuario (ele sera sua URL: bioflowzy.com/seunome).\n3. Informe email e senha e finalize o cadastro.\n4. Voce sera levado direto para o painel.\n\nDica: escolha um nome curto e facil de lembrar, pois ele aparecera em todas as suas divulgacoes.',1),
  (c_start,'montando-bio','Montando sua primeira bio em 5 minutos','Do zero ao primeiro link publicado.',
   E'1. No menu lateral abra "Visao geral" e confira o checklist.\n2. Va em "Aparencia" e escolha um tema que combine com seu estilo.\n3. Em "Links" adicione seus principais destinos (site, WhatsApp, loja).\n4. Em "Redes sociais" conecte seus perfis para aparecerem como icones.\n5. Compartilhe sua URL publica nas suas redes.',2),
  (c_start,'compartilhando','Compartilhando sua pagina','Onde colocar seu link para gerar mais cliques.',
   E'- Coloque sua URL na bio do Instagram, TikTok e YouTube.\n- Use em assinatura de email e cartao de visita.\n- Gere um QR Code a partir da sua URL para eventos presenciais.\n- Ative o Meta Pixel em "Integracoes" para otimizar seus anuncios.',3),

  (c_links,'adicionando-link','Adicionando um novo link','Como cadastrar um link na sua bio.',
   E'1. Abra "Links" no menu lateral.\n2. Clique em "Adicionar link".\n3. Informe titulo (ex.: Meu curso), URL completa e um subtitulo opcional.\n4. Salve. O link aparece instantaneamente na sua bio.',1),
  (c_links,'reordenando','Reordenando seus links','Coloque os mais importantes no topo.',
   E'Clique e arraste o link pelo icone de mover ("grip") ou use os botoes de subir/descer. A ordem na lista e exatamente a ordem que aparece para o visitante.',2),
  (c_links,'destacando','Destacando um link','Chame atencao para ofertas especiais.',
   E'Ao editar um link voce pode marca-lo como destaque. Ele recebera uma cor diferente e, dependendo do tema, animacoes sutis para atrair o olhar.',3),
  (c_links,'limite-links','Limites por plano','Quantos links cada plano permite.',
   E'O plano Gratuito permite uma quantidade reduzida de links. Os planos pagos liberam links ilimitados, destaques e agendamento. Veja detalhes em "Planos e cobranca".',4),

  (c_social,'conectando','Conectando redes sociais','Instagram, TikTok, YouTube e mais.',
   E'1. Va em "Redes sociais".\n2. Escolha a rede desejada.\n3. Cole o link do seu perfil (nao apenas o @).\n4. Salve. Os icones aparecem automaticamente no topo da sua bio.',1),
  (c_social,'ordem-icones','Ordem dos icones','Organize como os icones aparecem.',
   E'A ordem segue a sequencia cadastrada. Arraste para reordenar. Voce tambem pode ocultar um icone temporariamente sem excluir o cadastro.',2),
  (c_social,'icones-nao-aparecem','Meus icones nao aparecem','O que pode estar errado.',
   E'- Confira se o link informado esta completo (com https://).\n- Confira se a rede esta "ativa" e salva.\n- Confira o limite do seu plano: o Gratuito permite ate 2 redes. Veja "Planos e cobranca".',3),

  (c_video,'youtube','Adicionando video do YouTube','Incorpore seu video favorito.',
   E'1. Copie o link do video no YouTube.\n2. Em "Videos" clique em "Adicionar video".\n3. Cole a URL (aceita formato curto youtu.be e o completo).\n4. Salve. O player embed aparece na sua bio.',1),
  (c_video,'tiktok','Videos do TikTok','Como incluir conteudo do TikTok.',
   E'Copie o link direto do video (abra no app, toque em compartilhar > copiar link). Cole o link em "Videos" e salve. Aceita links publicos.',2),
  (c_video,'ordenando-videos','Organizando seus videos','Como escolher o que aparece primeiro.',
   E'A ordem segue a lista em "Videos". Use os botoes de mover ou arraste. Videos que voce quer promover devem ficar no topo.',3),

  (c_banners,'criando-banner','Criando um banner','Destaque campanhas com um visual forte.',
   E'1. Abra "Banners".\n2. Clique em "Novo banner".\n3. Faca upload de uma imagem (recomendado 1200x400).\n4. Informe o link de destino.\n5. Salve. O banner aparece em destaque na sua bio.',1),
  (c_banners,'agendamento','Agendando um banner','Programe inicio e fim da campanha.',
   E'Ao editar um banner voce pode definir data de inicio e termino. Fora desse intervalo ele nao aparece para o visitante, mas fica salvo para reutilizar depois.',2),
  (c_banners,'tamanho-imagem','Tamanho ideal da imagem','Proporcao e peso recomendados.',
   E'Use imagens com proporcao 3:1 (ex.: 1200x400) e menos de 500 KB. Formatos JPG, PNG e WEBP sao aceitos. Evite texto muito pequeno na imagem.',3),

  (c_look,'trocando-tema','Trocando o tema da pagina','Um visual novo em segundos.',
   E'1. Va em "Aparencia".\n2. Navegue pelos temas disponiveis e clique no desejado.\n3. Use a barra lateral para ajustar cores, botoes e fonte.\n4. As mudancas sao salvas automaticamente.',1),
  (c_look,'cores-fontes','Cores e fontes','Personalizando cada detalhe.',
   E'Na area de personalizacao voce encontra paletas pre-definidas e campos para cores customizadas. A fonte principal tambem pode ser alterada, e cada tema tem combinacoes recomendadas.',2),
  (c_look,'avatar','Trocando sua foto de perfil','Como enviar e recortar o avatar.',
   E'Em "Aparencia" ou "Configuracoes" clique em sua foto. Selecione uma imagem (PNG ou JPG, minimo 200x200). Ajuste o recorte redondo e salve.',3),
  (c_look,'plano-free','Limites do plano Gratuito','Quais temas sao exclusivos de planos pagos.',
   E'Alguns temas premium ficam marcados com um cadeado. Para ativa-los faca upgrade do plano. Voce pode preview sem pagar, mas so publica depois do upgrade.',4),

  (c_domain,'o-que-e','O que e um dominio personalizado','Use seudominio.com em vez de bioflowzy.com/voce.',
   E'Com um dominio personalizado seus visitantes acessam diretamente o seu endereco proprio (ex.: maria.com.br). Isso fortalece a sua marca e ajuda no SEO.',1),
  (c_domain,'configurando-cnames','Configurando o CNAME','Passo a passo de DNS.',
   E'1. Em "Dominio" informe o dominio que voce quer usar.\n2. Copie o valor CNAME fornecido.\n3. No seu provedor de dominio (Registro.br, GoDaddy, Hostinger) crie um registro CNAME apontando para esse valor.\n4. Aguarde a verificacao (geralmente poucos minutos ate 24h).',2),
  (c_domain,'ssl','Certificado SSL','Como funciona o HTTPS no seu dominio.',
   E'Assim que o CNAME e verificado, emitimos automaticamente um certificado SSL gratuito. Voce nao precisa fazer nada. Se o cadeado nao aparecer em 1h, volte na pagina e clique em "Re-verificar".',3),
  (c_domain,'problemas-dns','Problemas comuns de DNS','Dominio nao verifica, e agora?',
   E'- Confira se criou CNAME (nao A record).\n- Remova registros conflitantes no nome escolhido.\n- Em provedores brasileiros, use apenas o subdominio (ex.: www).\n- Aguarde a propagacao (ate 24h em casos raros).',4),

  (c_integ,'meta-pixel','Meta Pixel (Facebook/Instagram)','Rastreie conversoes dos seus anuncios.',
   E'1. No Gerenciador de Negocios pegue o ID do seu Pixel (ex.: 123456789).\n2. Em "Integracoes" cole o ID no campo Meta Pixel.\n3. Salve. Todos os cliques e visitas serao enviados para otimizar campanhas.',1),
  (c_integ,'google-analytics','Google Analytics 4','Conecte seu GA4.',
   E'Cole seu ID de medicao (formato G-XXXXXXXXXX) em "Integracoes". Eventos de pageview e clique em links sao disparados automaticamente.',2),
  (c_integ,'tiktok-pixel','TikTok Pixel','Otimize campanhas no TikTok Ads.',
   E'Crie o Pixel no TikTok Events Manager, copie o Pixel ID e cole em "Integracoes". Tambem recomendamos ativar o Match Avancado quando disponivel.',3),
  (c_integ,'desativando','Desativando uma integracao','Pause temporariamente.',
   E'Basta apagar o ID do campo e salvar. Seus dados parados continuam no servico de origem, apenas paramos de enviar novos eventos.',4),

  (c_analytics,'o-que-mede','O que e medido','Entenda os indicadores disponiveis.',
   E'- Visualizacoes: quantas vezes sua pagina foi aberta.\n- Cliques em links: cada link tem sua propria contagem.\n- Origem: de onde vieram (Instagram, Direct, Google, etc.).\n- Dispositivo: Mobile vs Desktop.',1),
  (c_analytics,'periodo','Mudando o periodo','Ver hoje, 7 dias, 30 dias ou customizado.',
   E'Use o seletor de periodo no topo da pagina de Analytics. Periodos mais longos exigem planos pagos. Voce pode exportar um CSV a qualquer momento.',2),
  (c_analytics,'exportar','Exportando dados','Baixe um CSV com tudo.',
   E'Clique em "Exportar" na pagina Analytics. Sera gerado um arquivo com todas as colunas para abrir no Excel ou Google Planilhas.',3),

  (c_plans,'comparar','Comparando os planos','Quais funcoes cada plano oferece.',
   E'Visite a pagina inicial ou o menu "Planos e cobranca" para ver o quadro comparativo. Em geral, o Gratuito libera o essencial, o Pro libera ilimitado e analytics avancado, e planos superiores liberam dominio proprio e integracoes premium.',1),
  (c_plans,'upgrade','Fazendo upgrade','Como mudar de plano.',
   E'1. Abra "Configuracoes" > "Plano".\n2. Selecione o plano desejado.\n3. Complete o pagamento (Pix ou cartao).\n4. As funcionalidades liberam imediatamente apos a confirmacao.',2),
  (c_plans,'nota-fiscal','Nota fiscal e recibos','Como receber comprovante.',
   E'A nota e enviada automaticamente para o email cadastrado em ate 24h. Caso nao receba, confira sua caixa de spam ou entre em contato com o suporte.',3),
  (c_plans,'cancelar','Cancelando um plano','O que acontece com os seus dados.',
   E'Voce pode cancelar a qualquer momento nas Configuracoes. Sua conta continua ativa no plano Gratuito e seus dados ficam preservados. Funcionalidades pagas ficam indisponiveis ate um novo upgrade.',4),

  (c_ref,'como-funciona','Como funciona o programa','Ganhe indicando novos criadores.',
   E'Voce recebe um link unico em "Indique e ganhe". Cada assinante novo que vier pelo seu link gera uma comissao. O valor e creditado no seu saldo, disponivel para saque via Pix.',1),
  (c_ref,'comissao','Valor da comissao','Percentual e regras.',
   E'A comissao padrao e um percentual da primeira mensalidade do indicado. O percentual pode variar conforme promocoes. Veja sempre a pagina "Indique e ganhe" para os numeros atualizados.',2),
  (c_ref,'saque','Solicitando saque via Pix','Como receber suas comissoes.',
   E'1. Cadastre sua chave Pix em "Configuracoes".\n2. Na pagina "Indique e ganhe" clique em "Solicitar saque".\n3. O valor cai em ate 2 dias uteis.',3),

  (c_account,'senha','Trocando a senha','Mantenha sua conta segura.',
   E'Em "Configuracoes" > "Seguranca" defina uma nova senha com pelo menos 8 caracteres, incluindo letras e numeros. Sessoes ativas sao encerradas apos a troca.',1),
  (c_account,'email','Trocando o email','Atualize seu email principal.',
   E'Em "Configuracoes" altere o email. Voce recebera um link de confirmacao no novo endereco. O email antigo deixa de funcionar para login apos a confirmacao.',2),
  (c_account,'excluir','Excluindo a conta','Como remover todos os dados.',
   E'Em "Configuracoes" > "Zona de perigo" clique em excluir conta. A acao e definitiva: links, analytics e dados pessoais sao removidos. Recomendamos exportar seus dados antes.',3),
  (c_account,'nao-recebi-email','Nao recebi o email de confirmacao','O que fazer.',
   E'- Confira a caixa de spam.\n- Adicione @bioflowzy.com aos seus remetentes confiaveis.\n- Clique em "Reenviar email" na tela de login.\n- Se o problema persistir, troque para um email alternativo nas configuracoes.',4)
  ON CONFLICT (category_id, slug) DO UPDATE SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    body = EXCLUDED.body,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();
END $$;
