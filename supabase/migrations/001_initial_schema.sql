-- ============================================================
-- FORGE — Initial Schema v1
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username          TEXT UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 3 AND 30 AND username ~ '^[a-z0-9_]+$'),
  display_name      TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 50),
  avatar_url        TEXT,
  bio               TEXT CHECK (char_length(bio) <= 200),
  website_url       TEXT,
  linkedin_url      TEXT,
  twitter_handle    TEXT,
  -- "Now" section
  now_objective     TEXT CHECK (char_length(now_objective) <= 120),
  now_needs         TEXT[] DEFAULT '{}',
  now_offers        TEXT[] DEFAULT '{}',
  -- Company info
  company_stage     TEXT CHECK (company_stage IN ('Idea', 'Building', 'Beta', 'Live', 'Scaling', 'Exited')),
  industry          TEXT,
  -- Settings
  is_available      BOOLEAN NOT NULL DEFAULT TRUE,
  open_dms          BOOLEAN NOT NULL DEFAULT FALSE,
  -- Onboarding
  onboarding_done   BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step   INT NOT NULL DEFAULT 0,
  -- Counters (denormalized)
  follower_count    INT NOT NULL DEFAULT 0,
  following_count   INT NOT NULL DEFAULT 0,
  post_count        INT NOT NULL DEFAULT 0,
  -- Reputation
  impact_score      INT NOT NULL DEFAULT 0,
  reputation_tier   TEXT NOT NULL DEFAULT 'Newcomer',
  -- New user boost (72h)
  boost_until       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  slug              TEXT NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  tagline           TEXT CHECK (char_length(tagline) <= 120),
  description       TEXT CHECK (char_length(description) <= 500),
  logo_url          TEXT,
  cover_url         TEXT,
  url               TEXT,
  status            TEXT NOT NULL DEFAULT 'Building' CHECK (status IN ('Idea', 'Building', 'Beta', 'Live', 'Scaling', 'Acquired', 'Closed')),
  industry          TEXT,
  business_model    TEXT,
  is_open_for_collab BOOLEAN NOT NULL DEFAULT FALSE,
  -- Counters
  follower_count    INT NOT NULL DEFAULT 0,
  post_count        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id, slug)
);

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================
CREATE TABLE project_members (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- ============================================================
-- POSTS (Update, Ship Log, Ask placeholder, Bounty placeholder)
-- ============================================================
CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN ('update', 'ship_log', 'ask', 'bounty')),
  -- Main content (used as description for structured posts)
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1500),
  -- Thread
  parent_id       UUID REFERENCES posts(id) ON DELETE CASCADE,
  root_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
  depth           INT NOT NULL DEFAULT 0 CHECK (depth <= 3),
  -- Ship Log fields
  ship_title           TEXT CHECK (char_length(ship_title) <= 80),
  ship_proof_url       TEXT,
  ship_proof_screenshot TEXT,
  ship_metric          TEXT CHECK (char_length(ship_metric) <= 100),
  ship_time_days       INT,
  -- Ask fields
  ask_type        TEXT CHECK (ask_type IN ('Feedback', 'Intro', 'Hiring', 'Advice', 'Resource')),
  ask_title       TEXT CHECK (char_length(ask_title) <= 80),
  ask_offering    TEXT CHECK (char_length(ask_offering) <= 100),
  ask_deadline    TIMESTAMPTZ,
  -- Bounty fields (Phase 2, stored here for schema completeness)
  bounty_title    TEXT,
  bounty_budget_min INT,
  bounty_budget_max INT,
  bounty_deadline  TIMESTAMPTZ,
  bounty_category  TEXT,
  bounty_criteria  TEXT,
  bounty_status    TEXT DEFAULT 'open' CHECK (bounty_status IN ('open', 'in_progress', 'completed', 'cancelled')),
  -- Counters (denormalized for performance)
  accionable_count   INT NOT NULL DEFAULT 0,
  reply_count        INT NOT NULL DEFAULT 0,
  reforge_count      INT NOT NULL DEFAULT 0,
  offer_help_count   INT NOT NULL DEFAULT 0,
  -- Visibility & boost
  is_public          BOOLEAN NOT NULL DEFAULT TRUE,
  boosted_until      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER FOLLOWS
-- ============================================================
CREATE TABLE user_follows (
  follower_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- ============================================================
-- PROJECT FOLLOWS
-- ============================================================
CREATE TABLE project_follows (
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, project_id)
);

-- ============================================================
-- REACTIONS (Accionable, Verified, Reforge)
-- ============================================================
CREATE TABLE reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('accionable', 'verified', 'reforge')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, type)
);

-- ============================================================
-- OFFER HELPS
-- ============================================================
CREATE TABLE offer_helps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 140),
  is_useful   BOOLEAN,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('reply', 'mention', 'offer_help', 'reaction', 'follow', 'project_follow', 'offer_help_marked_useful')),
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  message     TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_posts_author_created     ON posts (author_id, created_at DESC);
CREATE INDEX idx_posts_type_created       ON posts (type, created_at DESC);
CREATE INDEX idx_posts_project            ON posts (project_id, created_at DESC) WHERE project_id IS NOT NULL;
CREATE INDEX idx_posts_parent             ON posts (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_posts_root               ON posts (root_id) WHERE root_id IS NOT NULL;
CREATE INDEX idx_posts_public_created     ON posts (is_public, created_at DESC);
CREATE INDEX idx_reactions_post           ON reactions (post_id);
CREATE INDEX idx_reactions_user_post      ON reactions (user_id, post_id);
CREATE INDEX idx_offer_helps_post         ON offer_helps (post_id);
CREATE INDEX idx_notifications_user       ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_user_follows_follower    ON user_follows (follower_id);
CREATE INDEX idx_user_follows_following   ON user_follows (following_id);
CREATE INDEX idx_project_follows_follower ON project_follows (follower_id);
CREATE INDEX idx_project_follows_project  ON project_follows (project_id);

-- ============================================================
-- TRIGGERS — Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER posts_updated_at    BEFORE UPDATE ON posts    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGERS — Counters
-- ============================================================

-- Post count on profiles and projects
CREATE OR REPLACE FUNCTION increment_post_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only top-level posts (not replies)
  IF NEW.parent_id IS NULL THEN
    UPDATE profiles SET post_count = post_count + 1 WHERE id = NEW.author_id;
    IF NEW.project_id IS NOT NULL THEN
      UPDATE projects SET post_count = post_count + 1 WHERE id = NEW.project_id;
    END IF;
  ELSE
    -- Increment reply count on parent
    UPDATE posts SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER posts_count_trigger AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION increment_post_count();

-- Accionable count
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'accionable' THEN
      UPDATE posts SET accionable_count = accionable_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.type = 'reforge' THEN
      UPDATE posts SET reforge_count = reforge_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'accionable' THEN
      UPDATE posts SET accionable_count = GREATEST(0, accionable_count - 1) WHERE id = OLD.post_id;
    ELSIF OLD.type = 'reforge' THEN
      UPDATE posts SET reforge_count = GREATEST(0, reforge_count - 1) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER reactions_count_trigger AFTER INSERT OR DELETE ON reactions FOR EACH ROW EXECUTE FUNCTION update_reaction_count();

-- Offer help count
CREATE OR REPLACE FUNCTION update_offer_help_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET offer_help_count = offer_help_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET offer_help_count = GREATEST(0, offer_help_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER offer_helps_count_trigger AFTER INSERT OR DELETE ON offer_helps FOR EACH ROW EXECUTE FUNCTION update_offer_help_count();

-- Follow counts on profiles
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET follower_count  = follower_count  + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    UPDATE profiles SET follower_count  = GREATEST(0, follower_count  - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER user_follows_count_trigger AFTER INSERT OR DELETE ON user_follows FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Project follow count
CREATE OR REPLACE FUNCTION update_project_follow_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET follower_count = follower_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER project_follows_count_trigger AFTER INSERT OR DELETE ON project_follows FOR EACH ROW EXECUTE FUNCTION update_project_follow_count();

-- Auto-create notification on reaction (accionable)
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE post_author UUID;
BEGIN
  SELECT author_id INTO post_author FROM posts WHERE id = NEW.post_id;
  IF post_author <> NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id, message)
    VALUES (post_author, 'reaction', NEW.user_id, NEW.post_id, 'marcó tu post como Accionable');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER reaction_notification AFTER INSERT ON reactions FOR EACH ROW WHEN (NEW.type = 'accionable') EXECUTE FUNCTION notify_on_reaction();

-- Auto-create notification on offer_help
CREATE OR REPLACE FUNCTION notify_on_offer_help()
RETURNS TRIGGER AS $$
DECLARE post_author UUID;
BEGIN
  SELECT author_id INTO post_author FROM posts WHERE id = NEW.post_id;
  IF post_author <> NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, post_id, message)
    VALUES (post_author, 'offer_help', NEW.user_id, NEW.post_id, 'ofreció ayuda en tu post');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER offer_help_notification AFTER INSERT ON offer_helps FOR EACH ROW EXECUTE FUNCTION notify_on_offer_help();

-- Auto-create notification on follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id, message)
  VALUES (NEW.following_id, 'follow', NEW.follower_id, 'empezó a seguirte');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER follow_notification AFTER INSERT ON user_follows FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Auto-create notification on reply
CREATE OR REPLACE FUNCTION notify_on_reply()
RETURNS TRIGGER AS $$
DECLARE parent_author UUID;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO parent_author FROM posts WHERE id = NEW.parent_id;
    IF parent_author <> NEW.author_id THEN
      INSERT INTO notifications (user_id, type, actor_id, post_id, message)
      VALUES (parent_author, 'reply', NEW.author_id, NEW.id, 'respondió a tu post');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER reply_notification AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION notify_on_reply();

-- ============================================================
-- FOR YOU FEED FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION get_for_you_feed(
  p_user_id   UUID,
  p_cursor    TIMESTAMPTZ DEFAULT NOW(),
  p_limit     INT DEFAULT 20
)
RETURNS TABLE (
  id              UUID,
  author_id       UUID,
  project_id      UUID,
  type            TEXT,
  content         TEXT,
  parent_id       UUID,
  ship_title      TEXT,
  ship_proof_url  TEXT,
  ship_proof_screenshot TEXT,
  ship_metric     TEXT,
  ship_time_days  INT,
  ask_type        TEXT,
  ask_title       TEXT,
  ask_offering    TEXT,
  accionable_count   INT,
  reply_count        INT,
  reforge_count      INT,
  offer_help_count   INT,
  is_public          BOOLEAN,
  created_at         TIMESTAMPTZ,
  score              FLOAT,
  viewer_reacted     BOOLEAN,
  viewer_offered_help BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH following AS (
    SELECT following_id FROM user_follows WHERE follower_id = p_user_id
  ),
  scored AS (
    SELECT
      p.*,
      -- Type weight: ship_log=3, ask=2, update=1, bounty=2
      CASE p.type WHEN 'ship_log' THEN 3.0 WHEN 'ask' THEN 2.0 WHEN 'bounty' THEN 2.0 ELSE 1.0 END AS type_w,
      -- Action weight
      (p.offer_help_count * 3.0 + p.accionable_count * 1.0 + p.reply_count * 2.0) AS action_w,
      -- Recency weight (half-life 4h)
      1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 14400.0) AS recency_w,
      -- Graph weight
      CASE WHEN p.author_id IN (SELECT following_id FROM following) THEN 1.0 ELSE 0.0 END AS graph_w,
      -- New user boost
      CASE WHEN pr.boost_until IS NOT NULL AND pr.boost_until > NOW() THEN 1.5 ELSE 1.0 END AS boost_w,
      -- Viewer interactions
      EXISTS(SELECT 1 FROM reactions r WHERE r.post_id = p.id AND r.user_id = p_user_id AND r.type = 'accionable') AS viewer_reacted,
      EXISTS(SELECT 1 FROM offer_helps oh WHERE oh.post_id = p.id AND oh.user_id = p_user_id) AS viewer_offered_help
    FROM posts p
    JOIN profiles pr ON pr.id = p.author_id
    WHERE p.is_public = TRUE
      AND p.parent_id IS NULL  -- no replies in main feed
      AND p.author_id <> p_user_id
      AND p.created_at < p_cursor
  )
  SELECT
    s.id, s.author_id, s.project_id, s.type, s.content, s.parent_id,
    s.ship_title, s.ship_proof_url, s.ship_proof_screenshot, s.ship_metric, s.ship_time_days,
    s.ask_type, s.ask_title, s.ask_offering,
    s.accionable_count, s.reply_count, s.reforge_count, s.offer_help_count,
    s.is_public, s.created_at,
    (s.type_w * 3.0 + s.action_w * 0.1 + s.recency_w * 2.0 + s.graph_w * 1.5) * s.boost_w AS score,
    s.viewer_reacted,
    s.viewer_offered_help
  FROM scored s
  ORDER BY score DESC, s.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows     ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_follows  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_helps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_public"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"     ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own"     ON profiles FOR UPDATE USING (id = auth.uid());

-- projects
CREATE POLICY "projects_select_public"  ON projects FOR SELECT USING (true);
CREATE POLICY "projects_insert_own"     ON projects FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "projects_update_own"     ON projects FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "projects_delete_own"     ON projects FOR DELETE USING (owner_id = auth.uid());

-- project_members
CREATE POLICY "pm_select_public"   ON project_members FOR SELECT USING (true);
CREATE POLICY "pm_insert_owner"    ON project_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);
CREATE POLICY "pm_delete_owner"    ON project_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- posts
CREATE POLICY "posts_select_public"  ON posts FOR SELECT USING (is_public = true OR author_id = auth.uid());
CREATE POLICY "posts_insert_own"     ON posts FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "posts_update_own"     ON posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "posts_delete_own"     ON posts FOR DELETE USING (author_id = auth.uid());

-- user_follows
CREATE POLICY "uf_select_public"   ON user_follows FOR SELECT USING (true);
CREATE POLICY "uf_insert_own"      ON user_follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "uf_delete_own"      ON user_follows FOR DELETE USING (follower_id = auth.uid());

-- project_follows
CREATE POLICY "pf_select_public"   ON project_follows FOR SELECT USING (true);
CREATE POLICY "pf_insert_own"      ON project_follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "pf_delete_own"      ON project_follows FOR DELETE USING (follower_id = auth.uid());

-- reactions
CREATE POLICY "reactions_select_public" ON reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert_own"    ON reactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reactions_delete_own"    ON reactions FOR DELETE USING (user_id = auth.uid());

-- offer_helps
CREATE POLICY "oh_select"    ON offer_helps FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
);
CREATE POLICY "oh_insert_own" ON offer_helps FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "oh_update_author" ON offer_helps FOR UPDATE USING (
  EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
);

-- notifications
CREATE POLICY "notif_select_own"  ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update_own"  ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notif_insert_system" ON notifications FOR INSERT WITH CHECK (true);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, username, boost_until)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    LOWER(REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      '[^a-z0-9_]', '_', 'g'
    )),
    NOW() + INTERVAL '72 hours'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
