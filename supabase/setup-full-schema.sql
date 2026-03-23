-- ============================================================================
-- ArchiGram.ai — Full schema setup for new Supabase project
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- ============================================================================
-- 1. community_diagrams (core gallery table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_diagrams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  author      TEXT NOT NULL DEFAULT 'anonymous',
  description TEXT NOT NULL DEFAULT '',
  code        TEXT NOT NULL DEFAULT '',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  likes       INT NOT NULL DEFAULT 0,
  views       INT NOT NULL DEFAULT 0,
  source_url  TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS community_diagrams_id_idx ON community_diagrams(id);
CREATE INDEX IF NOT EXISTS community_diagrams_created_at_id_idx ON community_diagrams(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS community_diagrams_created_at_idx ON community_diagrams(created_at DESC);
CREATE INDEX IF NOT EXISTS community_diagrams_user_id_idx ON community_diagrams(user_id, created_at DESC);

-- Unique index for source_url deduplication (crawler)
CREATE UNIQUE INDEX IF NOT EXISTS community_diagrams_source_url_idx
  ON community_diagrams(source_url)
  WHERE source_url IS NOT NULL;

-- Row Level Security
ALTER TABLE community_diagrams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read community diagrams" ON community_diagrams;
CREATE POLICY "Anyone can read community diagrams"
  ON community_diagrams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can publish" ON community_diagrams;
CREATE POLICY "Authenticated users can publish" ON community_diagrams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own diagrams" ON community_diagrams;
CREATE POLICY "Users can update own diagrams" ON community_diagrams
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. increment_diagram_views RPC function (atomic counter)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_diagram_views(diagram_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_diagrams
  SET views = views + 1
  WHERE id = diagram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. user_diagrams (cloud sync for logged-in users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_diagrams (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL DEFAULT 'Untitled',
  code         TEXT NOT NULL DEFAULT '',
  diagram_type TEXT NOT NULL DEFAULT 'mermaid',
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS user_diagrams_user_id_idx
  ON public.user_diagrams (user_id, updated_at DESC);

ALTER TABLE public.user_diagrams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own diagrams" ON public.user_diagrams;
CREATE POLICY "Users can CRUD own diagrams"
  ON public.user_diagrams FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. profiles (public user profiles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  bio         TEXT,
  social_link TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_username_lower_idx ON profiles(lower(username));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
