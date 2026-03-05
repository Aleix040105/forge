-- ============================================================
-- FORGE — Reputation Score Auto-Calculation
-- ============================================================
-- Paste this in Supabase SQL Editor after 001_initial_schema.sql
-- ============================================================

-- Function: recalculate impact_score and reputation_tier for a profile
CREATE OR REPLACE FUNCTION recalculate_reputation(profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ship_count     INT;
  v_accionable_rx  INT;
  v_offer_help_rx  INT;
  v_reforge_rx     INT;
  v_follower_count INT;
  v_score          INT;
  v_tier           TEXT;
BEGIN
  -- Ship logs published by this user
  SELECT COUNT(*) INTO v_ship_count
  FROM posts
  WHERE author_id = profile_id AND type = 'ship_log' AND is_public = TRUE;

  -- Accionables received on all posts
  SELECT COALESCE(SUM(p.accionable_count), 0) INTO v_accionable_rx
  FROM posts p
  WHERE p.author_id = profile_id AND p.is_public = TRUE;

  -- Offer helps received on all posts
  SELECT COALESCE(SUM(p.offer_help_count), 0) INTO v_offer_help_rx
  FROM posts p
  WHERE p.author_id = profile_id AND p.is_public = TRUE;

  -- Reforges received on all posts
  SELECT COALESCE(SUM(p.reforge_count), 0) INTO v_reforge_rx
  FROM posts p
  WHERE p.author_id = profile_id AND p.is_public = TRUE;

  -- Followers
  SELECT follower_count INTO v_follower_count
  FROM profiles
  WHERE id = profile_id;

  -- Score formula:
  --   Ship Log = 10 pts each
  --   Accionable received = 1 pt each
  --   Offer Help received = 3 pts each
  --   Reforge received = 2 pts each
  --   Follower = 2 pts each (capped at 500 pts)
  v_score :=
    (v_ship_count      * 10) +
    (v_accionable_rx   *  1) +
    (v_offer_help_rx   *  3) +
    (v_reforge_rx      *  2) +
    LEAST(v_follower_count * 2, 500);

  -- Tier mapping
  v_tier := CASE
    WHEN v_score >= 1000 THEN 'Legend'
    WHEN v_score >=  500 THEN 'Expert'
    WHEN v_score >=  200 THEN 'Builder'
    WHEN v_score >=   50 THEN 'Member'
    ELSE 'Newcomer'
  END;

  UPDATE profiles
  SET
    impact_score    = v_score,
    reputation_tier = v_tier,
    updated_at      = NOW()
  WHERE id = profile_id;
END;
$$;

-- ── Trigger: new Ship Log ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_recalc_on_ship_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.type = 'ship_log' THEN
    PERFORM recalculate_reputation(NEW.author_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ship_log_reputation ON posts;
CREATE TRIGGER trg_ship_log_reputation
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_on_ship_log();

-- ── Trigger: new Accionable reaction ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_recalc_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_author UUID;
BEGIN
  SELECT author_id INTO v_post_author FROM posts WHERE id = NEW.post_id;
  IF FOUND THEN
    PERFORM recalculate_reputation(v_post_author);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reaction_reputation ON reactions;
CREATE TRIGGER trg_reaction_reputation
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_on_reaction();

-- ── Trigger: new Offer Help ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_recalc_on_offer_help()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_author UUID;
BEGIN
  SELECT author_id INTO v_post_author FROM posts WHERE id = NEW.post_id;
  IF FOUND THEN
    PERFORM recalculate_reputation(v_post_author);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_offer_help_reputation ON offer_helps;
CREATE TRIGGER trg_offer_help_reputation
  AFTER INSERT ON offer_helps
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_on_offer_help();

-- ── Trigger: new Follow ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_recalc_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recalculate_reputation(NEW.following_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalculate_reputation(OLD.following_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_follow_reputation ON user_follows;
CREATE TRIGGER trg_follow_reputation
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION trg_recalc_on_follow();

-- ── One-time backfill for existing users ──────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM profiles LOOP
    PERFORM recalculate_reputation(r.id);
  END LOOP;
END;
$$;
