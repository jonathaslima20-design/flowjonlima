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
- `app/admin/*` — painel admin (users, plans, themes, theme-showcase)
- `app/api/` — `domains`, `domains/verify` (domínio próprio), `track` (analytics)
- `middleware.ts` — domínios personalizados: hosts fora de `PRIMARY_SUFFIXES` são resolvidos via RPC `lookup_domain` e reescritos para `/{username}`
- `themes/<nome>` + `themes/registry.ts` — temas visuais do bio; `components/themes`, `components/bio` renderizam
- `lib/plans.ts` + `hooks/use-plan.ts` — planos (free / pro_monthly / pro_annual) e limites por recurso
- `lib/auth-context.tsx` — contexto de autenticação
- `supabase/migrations` — schema completo (perfis, planos, referral/PIX, help center, domínios, temas)

## Segurança do banco
- `profiles` é legível publicamente: nunca guardar dados sensíveis nela. Pix e saldo de comissão ficam em `profile_private` (só dono/admin)
- Trigger `trg_protect_profile_columns` bloqueia usuários comuns de alterar `role`, `plan*`, `is_pro`, `suspended_at`, `referred_by`, `referral_code`
- Saque só via RPC `request_payout()` (valor calculado no servidor)
- URLs de links/banners precisam de `http(s)://`, `mailto:` ou `tel:` (CHECK no banco + `lib/url.ts` na tela)
- Limites de plano são aplicados no banco (`trg_enforce_plan_limit`, lendo `plans.limits`); `lib/plans.ts` espelha os mesmos valores para a UI
- Suspensão (`suspended_at`) bloqueia edição/inserção no banco, a página pública (404) e o domínio próprio
- Usernames reservados: `is_reserved_username()` no banco (cadastro chama via RPC)

## Performance da página pública
- `app/[username]/page.tsx` é ISR (`revalidate = 30` + `generateStaticParams` vazio); o layout do painel chama `/api/revalidate-bio` (via `lib/revalidate-bio.ts`) ao trocar de página ou sair da aba, para o usuário ver as edições na hora
- Fontes dos temas em `app/layout.tsx` têm `preload: false` (só Archivo Black e Space Grotesk, usadas no site, são pré-carregadas)
- Uploads de banner e ícone passam por `lib/compress-image.ts` (WebP, 1600px / 256px)

## Analytics e recursos Pro da página
- Visitas: `page_views` via RPC `track_view` (origem detectada em `lib/visit-source.ts`, dispositivo, país do header `cf-ipcountry`); cliques: `clicks` via `track_click`
- Tela de analytics usa a RPC `profile_analytics(p_days)`, que agrega no banco e limita aos `analytics_days` do plano
- Agendamento: `links.starts_at/ends_at` (trigger exige `scheduling`); a página pública filtra a janela
- SEO: `profiles.seo_title/seo_description/seo_image_url` (exige `seo`); `generateMetadata` ignora os campos se o plano venceu

## Pagamentos (Mercado Pago, Checkout Pro)
- Planos: `free`, `pro`, `business` (Business com `is_active = false` / `available: false` até ter múltiplas páginas e leads)
- Pagamento por período, sem renovação automática: pacote `quarterly` (3 meses, `plans.price_cents`) ou `annual` (1 ano, `plans.price_annual_cents`)
- Comissão de indicação: 30% do primeiro pagamento aprovado do indicado, calculada em `grant_paid_plan`
- Temas Pro: lista em `admin_settings.pro_only_themes` (editável em Admin → Temas); o banco bloqueia a troca para quem não tem `pro_themes`
- `supabase/functions/mp-checkout`: cria linha `pending` em `payments` + preferência (`external_reference = payments.id`); recebe `{ plan, period }` e lê o preço do pacote no banco
- `supabase/functions/mp-webhook` (deploy com `verify_jwt = false`): consulta o pagamento na API do MP e chama `grant_paid_plan()` (só service_role; idempotente; estende a partir da expiração vigente)
- Secrets das edge functions (painel do Supabase): `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `SITE_URL`
- Sem os secrets, o modal de upgrade cai no `plans.button_url` (links mpago.la cadastrados no admin)

## Convenções
- Componentes com hooks precisam de `"use client"`
- Não adicionar bibliotecas de UI/ícones sem necessidade; usar shadcn/ui e Tailwind
- Mudanças de banco: nova migration em `supabase/migrations` (formato `YYYYMMDDHHMMSS_descricao.sql`)
- Push na branch principal publica no Netlify (se o site estiver ligado ao repositório)
