-- Supabase Postgres Best Practices Migration
-- Apply these optimizations to improve query performance and prevent race conditions

-- ============================================================================
-- INDEXES (Query Performance - CRITICAL)
-- ============================================================================

-- 1. Primary key index (usually auto-created, but ensure it exists)
-- Index on id for WHERE id = ? queries (used in updateDiagramLikes, incrementDiagramViews)
CREATE INDEX IF NOT EXISTS community_diagrams_id_idx ON community_diagrams(id);

-- 2. Composite index for cursor-based pagination
-- Supports ORDER BY created_at DESC, id DESC with cursor pagination
-- This is CRITICAL for fetchCommunityDiagrams performance
CREATE INDEX IF NOT EXISTS community_diagrams_created_at_id_idx 
ON community_diagrams(created_at DESC, id DESC);

-- 3. Index on created_at for time-based queries
-- Supports ORDER BY created_at queries
CREATE INDEX IF NOT EXISTS community_diagrams_created_at_idx 
ON community_diagrams(created_at DESC);

-- ============================================================================
-- RPC FUNCTION (Atomic Operations - CRITICAL)
-- ============================================================================

-- Atomic increment function to prevent race conditions
-- Replaces read-then-write pattern in incrementDiagramViews
CREATE OR REPLACE FUNCTION increment_diagram_views(diagram_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE community_diagrams 
  SET views = views + 1 
  WHERE id = diagram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (adjust based on your RLS policy)
-- GRANT EXECUTE ON FUNCTION increment_diagram_views(UUID) TO authenticated;

-- ============================================================================
-- OPTIONAL: Additional Optimizations
-- ============================================================================

-- If you frequently filter by tags, consider a GIN index for array searches
-- CREATE INDEX IF NOT EXISTS community_diagrams_tags_idx 
-- ON community_diagrams USING GIN(tags);

-- If you frequently search by author
-- CREATE INDEX IF NOT EXISTS community_diagrams_author_idx 
-- ON community_diagrams(author);

-- If you frequently filter by likes (for trending/top queries)
-- CREATE INDEX IF NOT EXISTS community_diagrams_likes_idx 
-- ON community_diagrams(likes DESC);

-- ============================================================================
-- CONNECTION POOLING (CRITICAL - Configure in Supabase Dashboard)
-- ============================================================================
-- 
-- Connection pooling should be configured in Supabase Dashboard:
-- 1. Go to Project Settings > Database
-- 2. Enable Connection Pooling
-- 3. Use Transaction mode for most applications
-- 4. Set pool size based on: (CPU cores * 2) + spindle_count
--
-- For Supabase, connection pooling is typically handled automatically,
-- but verify your connection string uses the pooler endpoint:
-- postgresql://[user]:[password]@[host]:6543/[database] (port 6543 = pooler)
-- vs
-- postgresql://[user]:[password]@[host]:5432/[database] (port 5432 = direct)

-- ============================================================================
-- COMMENTS TABLE (Phase 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diagram_id UUID REFERENCES community_diagrams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  author TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_diagram ON comments(diagram_id, created_at DESC);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert" ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- COLLECTIONS TABLES (Phase 2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  curator TEXT DEFAULT 'ArchiGram Team',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  diagram_id UUID REFERENCES community_diagrams(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  UNIQUE(collection_id, diagram_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_coll ON collection_items(collection_id, position);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read collections" ON collections FOR SELECT USING (true);

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read collection items" ON collection_items FOR SELECT USING (true);

-- ============================================================================
-- PROMPTS TABLE (Phase 3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  user_id UUID REFERENCES auth.users(id),
  description TEXT,
  prompt_text TEXT NOT NULL,
  domain TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  result_diagram_code TEXT,
  likes INT DEFAULT 0,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_domain ON prompts(domain);
CREATE INDEX IF NOT EXISTS idx_prompts_likes ON prompts(likes DESC);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can read prompts" ON prompts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can publish prompts" ON prompts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Users can update own prompts" ON prompts FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- PHASE 4: EMAIL SUBSCRIBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscribers_active ON email_subscribers(email) WHERE unsubscribed_at IS NULL;

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON email_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role manages subscribers" ON email_subscribers FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if indexes are being used:
-- EXPLAIN ANALYZE SELECT * FROM community_diagrams ORDER BY created_at DESC LIMIT 50;

-- Check current connections (should be low with pooling):
-- SELECT count(*) FROM pg_stat_activity;

-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'community_diagrams';

-- ============================================================================
-- GITHUB ENRICHMENT: source_url column for deduplication (auto-crawler)
-- ============================================================================

-- Track the GitHub source URL so the crawler can skip already-imported diagrams
ALTER TABLE community_diagrams
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Unique partial index: enforces one row per source URL, ignores rows without a URL
CREATE UNIQUE INDEX IF NOT EXISTS community_diagrams_source_url_idx
  ON community_diagrams(source_url)
  WHERE source_url IS NOT NULL;
