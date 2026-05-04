/*
  # BioFlowzy Initial Schema

  1. New Tables
    - `leads` (email capture from landing page)
      - `id` uuid PK, `email` text, `username` text, `created_at` timestamptz
    - `profiles` (bio profile linked to auth.users)
      - `id` uuid PK (references auth.users)
      - `username` text unique, `display_name`, `bio`, `avatar_url` text
      - `theme_color`, `bg_color`, `button_color`, `text_color` text (defaults)
      - `border_width` int default 2, `shadow_offset` int default 4
      - `is_pro` boolean default false, `role` text default 'user'
      - `created_at`, `updated_at` timestamptz
    - `links`: bio links (profile_id, title, url, icon, position, is_active, clicks)
    - `videos`: embedded videos (profile_id, title, url, platform, position)
    - `social_links`: (profile_id, platform, url, position)
    - `banners`: (profile_id, image_url, link_url, position)
    - `plans`: (name, price_cents, features jsonb)
    - `subscriptions`: (profile_id, plan_id, status, current_period_end)
    - `clicks`: analytics tracking (profile_id, entity_type, entity_id, created_at)

  2. Security
    - RLS enabled on all tables.
    - `leads`: anon/auth INSERT; no public SELECT.
    - `profiles`: public SELECT (for public bio pages); owners INSERT/UPDATE/DELETE own.
    - Content tables (links/videos/social_links/banners): public SELECT; owners CRUD own via profile_id = auth.uid().
    - `plans`: public SELECT.
    - `subscriptions`: owners SELECT/INSERT own.
    - `clicks`: anon/auth INSERT (for tracking); owners SELECT own.

  3. Seed
    - Plans: Free, Pro, Business with features list.

  4. Important notes
    - All SELECT policies check ownership via auth.uid().
    - Public SELECT on profiles/content is required for SSR bio rendering.
*/

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  username text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  theme_color text DEFAULT '#FACC15',
  bg_color text DEFAULT '#FFFFFF',
  button_color text DEFAULT '#FACC15',
  text_color text DEFAULT '#000000',
  border_width int DEFAULT 2,
  shadow_offset int DEFAULT 4,
  is_pro boolean DEFAULT false,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view profiles" ON profiles;
CREATE POLICY "Public view profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users delete own profile" ON profiles;
CREATE POLICY "Users delete own profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- LINKS
CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text DEFAULT '',
  url text DEFAULT '',
  icon text DEFAULT '',
  position int DEFAULT 0,
  is_active boolean DEFAULT true,
  clicks int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view links" ON links;
CREATE POLICY "Public view links" ON links FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Owners insert links" ON links;
CREATE POLICY "Owners insert links" ON links FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Owners update links" ON links;
CREATE POLICY "Owners update links" ON links FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Owners delete links" ON links;
CREATE POLICY "Owners delete links" ON links FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- VIDEOS
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text DEFAULT '',
  url text DEFAULT '',
  platform text DEFAULT 'youtube',
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view videos" ON videos;
CREATE POLICY "Public view videos" ON videos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Owners insert videos" ON videos;
CREATE POLICY "Owners insert videos" ON videos FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Owners update videos" ON videos;
CREATE POLICY "Owners update videos" ON videos FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Owners delete videos" ON videos;
CREATE POLICY "Owners delete videos" ON videos FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- SOCIAL LINKS
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform text DEFAULT '',
  url text DEFAULT '',
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view social" ON social_links;
CREATE POLICY "Public view social" ON social_links FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Owners insert social" ON social_links;
CREATE POLICY "Owners insert social" ON social_links FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Owners update social" ON social_links;
CREATE POLICY "Owners update social" ON social_links FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Owners delete social" ON social_links;
CREATE POLICY "Owners delete social" ON social_links FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text DEFAULT '',
  link_url text DEFAULT '',
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view banners" ON banners;
CREATE POLICY "Public view banners" ON banners FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Owners insert banners" ON banners;
CREATE POLICY "Owners insert banners" ON banners FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Owners update banners" ON banners;
CREATE POLICY "Owners update banners" ON banners FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
DROP POLICY IF EXISTS "Owners delete banners" ON banners;
CREATE POLICY "Owners delete banners" ON banners FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- PLANS
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_cents int DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read plans" ON plans;
CREATE POLICY "Public read plans" ON plans FOR SELECT TO anon, authenticated USING (true);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES plans(id),
  status text DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own subs" ON subscriptions;
CREATE POLICY "Users view own subs" ON subscriptions FOR SELECT TO authenticated USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own subs" ON subscriptions;
CREATE POLICY "Users insert own subs" ON subscriptions FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- CLICKS
CREATE TABLE IF NOT EXISTS clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type text DEFAULT 'link',
  entity_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone track click" ON clicks;
CREATE POLICY "Anyone track click" ON clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Owners view clicks" ON clicks;
CREATE POLICY "Owners view clicks" ON clicks FOR SELECT TO authenticated USING (profile_id = auth.uid());

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_links_profile ON links(profile_id, position);
CREATE INDEX IF NOT EXISTS idx_videos_profile ON videos(profile_id, position);
CREATE INDEX IF NOT EXISTS idx_social_profile ON social_links(profile_id, position);
CREATE INDEX IF NOT EXISTS idx_banners_profile ON banners(profile_id, position);
CREATE INDEX IF NOT EXISTS idx_clicks_profile_date ON clicks(profile_id, created_at DESC);

-- SEED PLANS
INSERT INTO plans (name, price_cents, features)
SELECT * FROM (VALUES
  ('Free', 0, '["Até 5 links","Analytics básico","Branding BioFlowzy"]'::jsonb),
  ('Pro', 1990, '["Links ilimitados","Analytics avançado","Remover branding","Temas customizados"]'::jsonb),
  ('Business', 4990, '["Tudo do Pro","Múltiplos perfis","Domínio customizado","Suporte prioritário"]'::jsonb)
) AS v(name, price_cents, features)
WHERE NOT EXISTS (SELECT 1 FROM plans);