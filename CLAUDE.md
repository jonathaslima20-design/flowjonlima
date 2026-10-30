# BioFlowzy

Plataforma de link in bio (bioflowzy.com). Originalmente gerada no Bolt.new (template `nextjs-shadcn`), agora mantida aqui.

## Stack
- Next.js 15.5 (App Router), React 19, TypeScript, Tailwind 3.4 + shadcn/ui (`components/ui`), ícones lucide-react
- Next 15: `params`/`searchParams` de páginas do servidor são `Promise` (usar `await params`)
- `lucide-react` fica na 0.446: versões novas removeram os ícones de marcas (Instagram, YouTube etc.) usados no site
- Supabase (auth, Postgres, storage, RPCs, edge function `fetch-link-icon`) — cliente único em `lib/supabase.ts` usando apenas a anon key; segurança depende de RLS
- Deploy: Netlify com `@netlify/plugin-nextjs` (`netlify.toml`), redireciona `www` → apex

## Comandos
- `npm run dev` — servidor local em http://localhost:3000
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint (`next/core-web-vitals`; `no-img-element` desligada porque as imagens são `unoptimized`). O build do Netlify ignora o lint; quem barra é o CI
- CI (`.github/workflows/ci.yml`): typecheck + lint + build a cada push/PR na main
- Tipos do banco em `lib/database.types.ts` (cliente `supabase` é `SupabaseClient<Database>`); regenerar após cada migration
- `npm run build`
- Para checar o build com o `next dev` rodando, use outra pasta: `NEXT_DIST_DIR=.next-build npx next build` (buildar em `.next` derruba o preview local)

## Variáveis de ambiente (`.env`, não versionado)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`

## Estrutura
- `app/[username]` — página pública do bio
- `app/dashboard/*` — painel do usuário (links, banners, vídeos, socials, customize, analytics, domain, integrations, referral, help, settings)
- `app/admin/*` — painel admin (users, plans, metrics, payments, payouts, themes, landing). `/admin/theme-showcase`, `/admin/niches` e `/admin/testimonials` só redirecionam para `/admin/landing?tab=…`
- Admin → Temas: catálogo do painel (ativo/oculto, Pro, ordem `catalog_order`, demonstração do catálogo com prévia "Como aparece em Aparência"). Admin → Landing page: abas Hero (slides do carrossel com demonstração da landing, animação, prova social), Para quem é (nichos), Galeria de temas e Depoimentos
- `app/api/revalidate-bio` — revalida a página pública após edições no painel
- `middleware.ts` — domínios personalizados: hosts fora de `PRIMARY_SUFFIXES` são resolvidos via RPC `lookup_domain` e reescritos para `/{username}`
- `themes/<nome>` + `themes/registry.ts` — temas visuais do bio; `components/themes`, `components/bio` renderizam
- Temas clássicos: cupertino (padrão e reserva de `getTheme`), atlas, chrome, cyber, creator, agency. Coleção 2026 (16 temas: liquid, bento, kinetic, retroos, sticker, clay, arcade, ticket, receipt, scrapbook, vinyl, chat, noir, memphis, esports, idcard) listada em `themes/collection.ts` e usando o kit `themes/_kit.tsx` (avatar, redes, banners, vídeos, rodapé, rastreio, `alpha`/`onColor`). Raiz de cada tema usa `min-h-[max(100%,100vh)]` para preencher também o celular de prévia; temas com estilos prontos têm a opção "Minhas cores" para respeitar as cores do painel. Temas cujos botões usam paletas, vidro ou tons fixos (clay, memphis, sticker, scrapbook, liquid, esports, retroos, cupertino, chrome, creator) têm o grupo "Botões" do kit (`buttonControls` / `exactButton`: cor exata de fundo e texto); controles `colorPicker` aparecem no painel com campo hex (`ThemeControls`). Removidos em 2026-10-26 (migrations `remove_themes` e `remove_themes_2`): aurora, conversion, prism, cosmos, forest, retrowave, neonlab, glitch, lava, terminal, editorial, kyoto, swiss, botanica, blueprint, gazette, breathe, sunset, brutalist, graphite, spatial, holo, flux, wallet, y2k, hud, papercut, stories
- Fontes extras dos temas (sem preload): Unbounded, Anton, Instrument Serif, Caveat e Press Start 2P (`CURATED_FONTS` em `themes/types.ts`)
- `lib/plans.ts` + `hooks/use-plan.ts` — planos (free / pro / business) e limites por recurso (plano da conta, contagens da página editada)
- `lib/auth-context.tsx` — contexto de autenticação
- `supabase/migrations` — schema completo (perfis, planos, referral/PIX, help center, domínios, temas)

## Segurança do banco
- `profiles` é legível publicamente: nunca guardar dados sensíveis nela. Pix, saldo de comissão e WhatsApp ficam em `profile_private` (só dono/admin)
- WhatsApp: obrigatório no cadastro (`raw_user_meta_data.whatsapp` → `handle_new_user` grava `profile_private.whatsapp` normalizado por `normalize_whatsapp`, só dígitos com DDI); dono edita em Configurações (`WhatsAppAccountSection`), admin abre a conversa em Usuários; helpers em `lib/whatsapp.ts`
- Trigger `trg_protect_profile_columns` bloqueia usuários comuns de alterar `role`, `plan*`, `is_pro`, `suspended_at`, `referred_by`, `referral_code`
- Saque só via RPC `request_payout()` (valor calculado no servidor)
- URLs de links/banners precisam de `http(s)://`, `mailto:` ou `tel:` (CHECK no banco + `lib/url.ts` na tela)
- Limites de plano são aplicados no banco (`trg_enforce_plan_limit`, lendo `plans.limits`); `lib/plans.ts` espelha os mesmos valores para a UI
- Suspensão (`suspended_at`) bloqueia edição/inserção no banco, a página pública (404) e o domínio próprio
- Usernames reservados: `is_reserved_username()` no banco (cadastro chama via RPC)

## Admin → Usuários
- Lista em `app/admin/users`; detalhes em `app/admin/users/[id]` (abas Visão geral, Páginas, Pagamentos, Linha do tempo, Notas). Página extra redireciona para a conta dona
- RPCs (só admin): `admin_user_overview(p_profile_id)` (auth.users, profile_private, contagens, visitas/cliques 30d, pagamentos, indicações, páginas) e `admin_user_timeline(p_profile_id)` (cadastro, login, pagamentos, páginas, indicações e `admin_audit_log`)
- Notas e etiquetas: `admin_user_notes` / `admin_user_tags` (só admin). Troca de plano em `components/admin/users/PlanEditDialog.tsx`
- Ações de conta pela edge function `admin-user` (`lib/admin-user.ts`): `impersonate`, `recovery_link` / `send_recovery`, `revoke_sessions` (RPC `admin_revoke_sessions`, só service_role), `update_email`, `confirm_email`, `delete_user` (bloqueado com pagamento aprovado). Tudo vai para `admin_audit_log`; contas admin não podem ser acessadas nem excluídas
- "Entrar como o usuário" (`lib/impersonation.ts`): a função gera um magic link (`hashed_token`), o painel guarda a sessão do admin em `localStorage.bf_impersonation` e troca com `verifyOtp`; `ImpersonationBanner` (layout raiz) mostra a faixa e volta ao admin em "Voltar ao admin" ou após 1 hora (`signOut({ scope: 'local' })` só encerra a sessão do acesso). Termos (item 8) avisam que o suporte pode acessar a conta
- Redefinição de senha: `/redefinir-senha` (`supabase.auth.updateUser`); `lib/supabase.ts` detecta `type=recovery` na URL e o `AuthProvider` leva para a tela mesmo se o link cair na home
- Último acesso: `profile_private.last_seen_at`, gravado pela RPC `touch_last_seen()` que o `AuthProvider` chama com sessão aberta (ao abrir, a cada 5 min e ao voltar à aba; no banco no máximo a cada 2 min; não conta durante "Entrar como o usuário"). Listagem usa `admin_last_seen(p_ids)`, detalhes `admin_user_overview.last_seen_at` (ambos caem no `last_sign_in_at`); texto relativo em `lib/last-seen.ts`. Exclusão (`DeleteUserDialog`) está na listagem e nos detalhes

## Performance da página pública
- `app/[username]/page.tsx` é ISR (`revalidate = 30` + `generateStaticParams` vazio); o layout do painel chama `/api/revalidate-bio` (via `lib/revalidate-bio.ts`) ao trocar de página ou sair da aba, para o usuário ver as edições na hora
- Fontes dos temas em `app/layout.tsx` têm `preload: false` (só Archivo Black e Space Grotesk, usadas no site, são pré-carregadas)
- Uploads de banner e ícone passam por `lib/compress-image.ts` (WebP, 1600px / 256px)
- Ícones dos links: `icon_source` = `none` | `auto` (favicon via `fetch-link-icon`) | `custom` (upload) | `library` (`icon = "lib:<chave>"`, lista em `lib/link-icon-library.tsx`, escolha em `IconLibraryPicker`). Temas desenham com `LinkIcon`/`KitLinkIcon` ou `LinkGlyph` (ícone da biblioteca usa currentColor e segue as cores do tema). Editor de demos tem as mesmas quatro opções (upload no bucket `theme-showcase`)

## Analytics e recursos Pro da página
- Visitas: `page_views` via RPC `track_view` (origem detectada em `lib/visit-source.ts`, dispositivo, país do header `cf-ipcountry`); cliques: `clicks` via `track_click`
- Tela de analytics usa a RPC `profile_analytics(p_days)`, que agrega no banco e limita aos `analytics_days` do plano
- Agendamento: `links.starts_at/ends_at` (trigger exige `scheduling`); a página pública filtra a janela
- SEO: `profiles.seo_title/seo_description/seo_image_url` (exige `seo`); `generateMetadata` ignora os campos se o plano venceu
- Leads: botão é um link com `url = LEAD_FORM_URL` (`lib/leads.ts`); `BioClient` intercepta o clique e abre `LeadFormModal`; envio pela RPC `submit_lead` (limite mensal `leads`), contatos em `page_leads`
- QR code (`components/dashboard/QrCodeCard.tsx`, exige `qr_code`) aponta para `?utm_source=qrcode`
- Contagem regressiva (Business, `countdown`): `profiles.countdown_title/countdown_ends_at`; `orderedSections` (themes/types.ts) insere `<PageCountdown>` antes das seções em todos os temas, com dados do `CountdownProvider` (página pública e prévias); editor em `CountdownCard` na tela de Links
- Modelos por nicho (`components/dashboard/StarterTemplates.tsx`) aparecem no painel enquanto não há links nem redes; usam só temas gratuitos
- Guia inicial ("Sua página está X% pronta", `lib/onboarding.tsx` + `components/dashboard/OnboardingGuide.tsx`): só na página principal da conta logada. Passos calculados no banco por `onboarding_steps` (foto, bio, link ativo com endereço, rede social, visual fora do padrão, compartilhou ou já teve tráfego) via RPC `onboarding_status`; `profile_private.onboarding_shared_at/completed_at/dismissed_at`. Comemoração ao chegar a 100% (só contas com até 30 dias). Enquanto ativo: card de progresso no menu no lugar do convite de upgrade (Free), sem números zerados nem QR bloqueado na Visão geral (QR Free aparece no fim depois do guia). Funil em Admin → Métricas (`admin_onboarding_funnel`)

## Múltiplas páginas (Business)
- Página extra = linha em `profiles` com `owner_id` = perfil principal (NULL = página principal / conta). Conteúdo continua por `profile_id`
- `create_page(username, nome)` cria respeitando `plans.limits.pages`; dono exclui pela policy `owner_id = auth.uid()`
- Plano e suspensão da conta são copiados para as páginas extras (`trg_mirror_account_to_pages`); `owner_id` é campo protegido
- Policies de conteúdo usam `can_manage_page(profile_id)`; `profile_analytics` e `lead_usage` recebem `p_profile_id`
- Painel: `lib/page-context.tsx` (`usePageId()` = página editada, `accountId` = usuário logado). Telas remontam ao trocar de página (`key={pageId}` no layout). Uploads vão na pasta `accountId/` (policies do storage usam `auth.uid()`)
- Página pública de página extra só fica no ar se o plano da conta permitir várias páginas (`isPageLive`); domínio próprio vale só para a página principal
- `profiles.id` não referencia mais `auth.users`: o trigger `on_auth_user_deleted` apaga o perfil principal e as extras caem em cascata

## Equipe / clientes (Business)
- `page_members` (página × usuário) e `page_invites` (token de uso único, 7 dias). Limite `members` no plano (Business 3, contando convites pendentes)
- `is_page_owner(id)` = dono da conta; `can_manage_page(id)` = dono ou membro (só enquanto o plano da página tiver `members` ≠ 0). Membro não troca username, não convida nem exclui
- RPCs `create_page_invite`, `get_page_invite` (anon, para a tela de aceite), `accept_page_invite`; rota `/convite/[token]` (login/cadastro voltam via `?next=`)
- Painel: páginas compartilhadas entram no seletor com `shared: true` (`isOwner` falso). `usePlan().plan/has/limitOf` seguem a página editada; `profile`/`accountPlan` são da conta logada

## Relatório mensal por e-mail (Business)
- Edge function `monthly-report` (deploy com `verify_jwt = false`), envio pelo Resend. Secrets: `RESEND_API_KEY`, `REPORT_FROM` (remetente num domínio verificado no Resend), `SITE_URL`
- pg_cron `monthly-report` chama a função de hora em hora nos dias 1 e 2 (`{ mode: "cron", token }`, token no Vault conferido por `verify_report_cron_token`); cada chamada envia até 40 contas e responde na hora (`EdgeRuntime.waitUntil`)
- `monthly_report_recipients` / `monthly_report_data` (só service_role); `monthly_report_log` evita repetir e reenvia erros até 3x
- `profiles.monthly_report_enabled` (liga/desliga em Configurações, na página principal) e envio de teste (`{ mode: "test" }`, 1 a cada 10 min)

## Landing
- Hero (`components/landing/Hero.tsx`) não deve ter o texto alterado; melhorias da landing entram como seções novas
- Ordem: Hero, Marquee, HowItWorks, NicheShowcase ("Para quem é"), Features, FeatureShowcase, ThemeGallery, BusinessSection, Comparison, Testimonials, Pricing, ReferralCalculator, FAQ, FinalCTA, Footer (+ StickyMobileCTA e StructuredData com schema.org de produto e FAQ)
- Home e `/exemplos` são ISR (`revalidate = 300`); o layout do admin chama `/api/revalidate-landing` (só admin, via `lib/revalidate-landing.ts`) ao sair de Temas/Landing page ou da aba, e o botão "Ver na landing" regenera antes de abrir
- Perguntas do FAQ em `components/landing/faq-data.ts` (usadas também no JSON-LD)
- `app/sitemap.ts` (páginas do site + páginas principais ativas) e `public/robots.txt` (bloqueia /dashboard, /admin, /api, /convite)
- Galeria de temas: seleção e ordem manuais em `admin_settings.landing_gallery` (vazia = automática, ordem do catálogo); cada tema usa a demonstração da landing se houver, senão a do catálogo (`landingOrCatalogDemoFor`). Lê também `pro_only_themes`/`disabled_themes` (leitura pública, assim como `social_proof` e `landing_gallery`)
- Depoimentos: tabela `landing_testimonials` (Admin → Landing page → Depoimentos); a seção some sem depoimentos ativos
- Nichos: tabela `landing_niches` (leitura pública dos ativos, escrita só admin), editados em Admin → Landing page → Para quem é (podem copiar o mockup de um tema ativo do catálogo ou do Hero via `readShowcaseDemo`); o celular usa `ThemeMockup` como o carrossel do hero
- `components/admin/DemoPageEditor.tsx`: editor de página de demonstração compartilhado; `ShowcaseDemoEditor.tsx` o liga às colunas `catalog_*` ou `landing_*` de `theme_showcase_presets`. Abas da landing em `components/admin/landing/`
- Comparativos citam "outras ferramentas", nunca concorrentes pelo nome
- Páginas legais: `/termos` e `/privacidade` (`components/legal/LegalPage.tsx`); dados do responsável (razão social, CNPJ, e-mail) em `lib/legal.ts`, campos vazios não aparecem

## Aquisição e métricas
- Cookies (LGPD): `lib/consent.ts` (localStorage `bf_consent`: estatísticas / marketing) + `components/shared/CookieConsent.tsx` (variante `site` no layout raiz via `SiteTracking`, variante `bio` no `BioClient`); `CookiePreferencesLink` no rodapé reabre. Pixel/GA dos usuários (`BioAnalytics`) só carregam após o aceite
- Meta do site (Admin → Rastreamento, `app/admin/tracking`): `admin_settings.meta_pixel` (público: pixel_id, enabled, domain_verification → metatag `facebook-domain-verification` em `generateMetadata` do layout raiz), `admin_settings.meta_capi` (test_event_code, só admin), token no Vault `meta_capi_token`. `SiteTracking` carrega o Pixel só em rotas do site (`isSitePath`/`isSiteHost` em `lib/meta-pixel.ts`), fora do /admin, com consentimento de marketing. Eventos: PageView, ViewContent (modal de planos), CompleteRegistration, InitiateCheckout, AddPaymentInfo (Pixel + CAPI pela edge function `meta-events`, mesmo event_id), Purchase (servidor via `_shared/meta.ts` `sendPurchase` no mp-webhook / cartão aprovado no mp-payment, `event_id = purchase_<payments.id>`, usando `payments.meta_context` gravado só com consentimento; navegador repete o mesmo event_id)
- Contatos do rodapé e do suporte em `lib/legal.ts` (WhatsApp, Instagram, e-mail)
- Selo "feito com BioFlowzy" (`components/bio/BioflowzyBadge.tsx`) aponta para `bioflowzy.com/?utm_source=badge&utm_campaign=<username>` (URL absoluta: no domínio próprio, "/" seria a página do usuário)
- `lib/attribution.ts` guarda a origem da primeira visita (30 dias); o cadastro envia `signup_source`/`signup_campaign` e `handle_new_user` grava em `profiles`
- Admin → Métricas: RPC `admin_growth_metrics(p_days)` (ativação, conversão, renovação, receita, origem dos cadastros, planos vencendo, páginas mais visitadas)
- Temas não têm selo de "verificado" (removido de Atlas e Cupertino para não permitir imitar perfis verificados)

## Programa de parceiros
- Regras em `admin_settings.partner_program` (leitura pública; editadas em Admin → Parceiros → Configurações; padrão em `DEFAULT_PROGRAM` de `lib/partner.ts`): níveis por clientes pagantes ativos (25/30/35/40%), `recurring_months` (0 = enquanto pagar), cupom %, carência (`hold_days`), validade do link, saque mínimo, bônus de meta, teste grátis pelo link (`trial_days`/`trial_plan`) e licenças no atacado
- Tabelas: `partners` (candidatura, `code` do link, `coupon_code`, `custom_rate`/`custom_discount_pct`, PIX), `partner_clients` (um parceiro por conta; `source` link/coupon/invite/manual/license, `managed`, `locked_at` no 1º pagamento, `trial_until`), `partner_clicks` (por dia), `partner_commissions` (extrato; status calculado: a liberar / disponível / em saque / paga / estornada), `partner_payouts`, `partner_licenses`, `partner_invites`. Escrita só por RPCs (parceiro lê o que é dele; admin tudo)
- Fluxo: `/parceiros` (landing + candidatura `apply_partner`, precisa de conta) → admin aprova (`admin_set_partner_status` gera código e cupom) → link `/p/<code>` (`track_partner_click`, guarda o código no navegador por `cookie_days`) → cadastro envia `partner_code`/`partner_invite` e `handle_new_user` chama `partner_signup` (atribui e dá o teste, uma vez por WhatsApp)
- Bloqueios: autoindicação (mesma conta ou WhatsApp do parceiro, inclusive no cupom), quem já pagou sem parceiro não é atribuído, vínculo travado não muda (só o admin move)
- Preço: `checkout_price` (service_role) aplica o desconto do parceiro só no 1º pagamento (cupom digitado ou parceiro atribuído); `license_price` para licenças. Usados por `supabase/functions/_shared/pricing.ts` em `mp-payment` e `mp-checkout` (`coupon`, `kind: "license"`, `qty`); a tela de checkout mostra a prévia por `checkout_quote` / `license_quote` (`?kind=license&qty=`)
- `grant_paid_plan` (lógica de prazo em `apply_plan_period`): compra de licenças cria `partner_licenses`; pagamento de cliente de parceiro trava o vínculo e chama `partner_record_commission` (taxa do nível, carência, bônus de meta) e não gera Indique e ganhe. `mp-webhook` chama `partner_reverse_payment` em reembolso/chargeback
- Cliente gerenciado (convite com `managed`): o parceiro vira `page_members` da página do cliente e `can_manage_page` libera mesmo no plano Free do cliente; a página aparece no seletor do parceiro
- Painel do Parceiro em `/dashboard/parceiro` (menu só para quem tem linha em `partners`), dados da RPC `partner_dashboard`; abas Resumo (nível, vencendo em breve), Clientes (convites), Divulgação (link, cupom, QR, textos), Licenças, Comissões e saques (`partner_request_payout`), Perfil (PIX e contato, `partner_update_profile`). WhatsApp do cliente só para origem ≠ link
- Admin → Parceiros (`app/admin/parceiros`): lista/ranking (`admin_partners`), detalhes (`admin_partner_detail`, condições editadas direto em `partners`, `admin_partner_attach`/`detach`, `admin_partner_adjust`), fila de saques (`admin_partner_payouts`, `admin_resolve_partner_payout`)
- `/parceiros` é página de captação de parceiros (perfis, formas de ganhar, níveis, simulador, candidatura); o site não divulga parceiros para clientes (diretório removido em `partner_remove_directory`). Contas em teste do parceiro não contam como pagantes em `admin_growth_metrics` (`is_on_trial`)

## Domínio próprio
- Escrita só pela edge function `custom-domain` (`set` / `verify` / `remove`); usuários apenas leem `custom_domains`
- `verify` confere via DNS-over-HTTPS o TXT `_bioflowzy.<host>` com o token e o roteamento (CNAME para `cname.bioflowzy.com` ou A `75.2.60.5`), adiciona o domínio em `domain_aliases` do site no Netlify e marca `verified` + `netlify_added`
- Secrets: `NETLIFY_API_TOKEN`, `NETLIFY_SITE_ID` (sem eles, a verificação responde 503). `cname.bioflowzy.com` é um CNAME (DNS da Hostinger) para o site `*.netlify.app`

## Pagamentos (Mercado Pago, Checkout Pro)
- Planos: `free`, `pro`, `business` (todos à venda; `plans.is_active` e `PLANS[x].available` controlam o que aparece para compra)
- Telas de planos (landing, modal de upgrade, checkout) abrem no Trimestral por padrão
- Pagamento por período, sem renovação automática: pacote `quarterly` (3 meses, `plans.price_cents`) ou `annual` (1 ano, `plans.price_annual_cents`)
- Comissão de indicação: 30% do primeiro pagamento aprovado do indicado, calculada em `grant_paid_plan`
- Temas Pro: lista em `admin_settings.pro_only_themes` (editável em Admin → Temas); o banco bloqueia a troca para quem não tem `pro_themes`
- Checkout transparente em `/dashboard/checkout?plan=&period=` (o modal de upgrade leva para lá): PIX com QR code na tela e cartão pelo Card Payment Brick (SDK `sdk.mercadopago.com/js/v2`, precisa da Public Key); edge function `mp-payment` (`config` / `pix` / `card`) cria o pagamento em `/v1/payments` com `external_reference = payments.id`; cartão aprovado chama `grant_paid_plan` na hora, o resto segue pelo `mp-webhook`. Boleto e cartão sem Public Key caem no Checkout Pro (`mp-checkout`); sem Access Token a página oferece `plans.button_url`
- Aviso de retorno do Checkout Pro (`PaymentReturnNotice`) segue o status do pagamento no banco, não o `?payment=` da URL
- `supabase/functions/mp-checkout`: cria linha `pending` em `payments` + preferência (`external_reference = payments.id`); recebe `{ plan, period }` e lê o preço do pacote no banco
- Troca de plano com o atual vigente (ex.: Pro → Business): `grant_paid_plan` converte os dias restantes pelo preço anual de cada plano e soma o novo período; renovação do mesmo plano soma a partir da expiração
- `supabase/functions/mp-webhook` (deploy com `verify_jwt = false`): consulta o pagamento na API do MP e chama `grant_paid_plan()` (só service_role; idempotente; estende a partir da expiração vigente)
- Chaves do Mercado Pago: Admin → Pagamentos (`PaymentKeysCard`) grava no Vault via `admin_set_payment_secret` (só admin, valor nunca volta à tela; `admin_payment_secrets_status` mostra só o final); `mp-checkout`/`mp-webhook` leem por `get_payment_secrets()` (só service_role) e caem nos secrets `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` das edge functions. `mp-checkout` com `{ action: "check" }` (só admin) testa o token. `SITE_URL` segue como secret
- Sem os secrets, o modal de upgrade cai no `plans.button_url` (links mpago.la cadastrados no admin)

## Convenções
- Componentes com hooks precisam de `"use client"`
- Não adicionar bibliotecas de UI/ícones sem necessidade; usar shadcn/ui e Tailwind
- Mudanças de banco: nova migration em `supabase/migrations` (formato `YYYYMMDDHHMMSS_descricao.sql`)
- Push na branch principal publica no Netlify (se o site estiver ligado ao repositório)
