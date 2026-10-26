/*
  # Reserva os endereços da página /exemplos (landing D3)
*/

CREATE OR REPLACE FUNCTION public.is_reserved_username(p_username text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(p_username) = ANY (ARRAY[
    -- rotas do app
    'admin', 'api', 'dashboard', 'login', 'logout', 'register', 'signup', 'signin',
    'forgot-password', 'reset-password', 'auth', 'callback', 'icon', 'og-image',
    'robots.txt', 'sitemap.xml', 'favicon.ico', '_next', 'static', 'assets', 'public',
    'convite', 'convites', 'invite', 'exemplos', 'exemplo', 'examples',
    -- institucionais
    'bioflowzy', 'www', 'app', 'help', 'ajuda', 'suporte', 'support', 'contato', 'contact',
    'about', 'sobre', 'blog', 'pricing', 'precos', 'planos', 'plans', 'terms', 'termos',
    'privacy', 'privacidade', 'settings', 'config', 'account', 'conta', 'billing',
    'checkout', 'pagamento', 'status', 'docs', 'root', 'null', 'undefined', 'system'
  ]);
$$;
