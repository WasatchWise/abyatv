-- ============================================================================
-- ABYA.tv Content Vetting Schema (v2 — redesigned March 6 2026)
-- Replaces original 015_abya_tv_content_vetting.sql
--
-- Design principles:
--   1. Parent abstract is the product. Everything else serves it.
--   2. Tags not enums. No migrations for new content types.
--   3. Age rating as a number. "Ages 8+" is universal.
--   4. Three tables for v1. Collections and nominations come later.
--   5. Single Claude pass scores + abstracts in one call.
-- ============================================================================

-- ============================================================================
-- Channels (YouTube channels, TikTok creators, etc.)
-- Channel-first: vet the channel, videos inherit baseline trust.
-- ============================================================================

CREATE TABLE IF NOT EXISTS abya_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name text NOT NULL,
  platform text NOT NULL DEFAULT 'youtube',
  platform_id text NOT NULL,          -- YouTube channel ID, TikTok handle
  platform_url text,
  avatar_url text,
  subscriber_count int,
  video_count int,

  -- Trust
  trust_tier text NOT NULL DEFAULT 'new'
    CHECK (trust_tier IN ('new', 'standard', 'trusted', 'probation', 'blocked')),
  trust_reason text,                  -- Why this trust level

  -- Content profile (flexible tags, not enums)
  primary_audience_min_age int,       -- Youngest typical viewer
  content_tags text[] DEFAULT ARRAY[]::text[],  -- ['gaming', 'minecraft', 'educational', 'science']
  content_language text DEFAULT 'en',

  -- Monitoring
  last_scanned_at timestamptz,
  scan_frequency_hours int DEFAULT 168, -- Weekly by default
  drift_score numeric(3,2) DEFAULT 0,   -- 0.00-1.00
  flagged boolean DEFAULT false,

  -- Lifecycle
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_platform_channel UNIQUE (platform, platform_id)
);

CREATE INDEX IF NOT EXISTS idx_abya_channels_trust ON abya_channels(trust_tier);
CREATE INDEX IF NOT EXISTS idx_abya_channels_platform ON abya_channels(platform, platform_id);
CREATE INDEX IF NOT EXISTS idx_abya_channels_tags ON abya_channels USING GIN(content_tags);
CREATE INDEX IF NOT EXISTS idx_abya_channels_flagged ON abya_channels(flagged) WHERE flagged = true;

-- ============================================================================
-- Videos (individual content items scored by the pipeline)
-- The parent_abstract is the product. Everything else supports it.
-- ============================================================================

CREATE TABLE IF NOT EXISTS abya_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES abya_channels(id) ON DELETE SET NULL,

  -- Identity
  title text NOT NULL,
  description text,
  source_url text NOT NULL,
  platform text NOT NULL DEFAULT 'youtube',
  platform_video_id text NOT NULL,    -- YouTube video ID
  thumbnail_url text,
  duration_seconds int,
  published_at timestamptz,           -- When the creator published it

  -- THE PRODUCT: parent-facing abstract
  -- 2-3 sentences. "Your kid is watching a Minecraft let's-play where they build
  -- a medieval castle. No profanity. Mild cartoon violence. Ages 8+."
  parent_abstract text,

  -- Age rating (simple, universal)
  age_min int,                        -- "Ages 8+" = 8. NULL = not yet rated.

  -- Content classification (flexible tags)
  category_tags text[] DEFAULT ARRAY[]::text[],   -- ['minecraft', 'gaming', 'building', 'lets-play']
  topic_tags text[] DEFAULT ARRAY[]::text[],      -- ['castles', 'medieval', 'creative-mode']

  -- Safety scores (S1-S5, each 1-5, from the 10-dimension rubric)
  score_safety_content numeric(2,1),      -- S1: violence, frightening content
  score_safety_language numeric(2,1),     -- S2: profanity, slurs, bullying
  score_safety_sexual numeric(2,1),       -- S3: nudity, sexual themes
  score_safety_substance numeric(2,1),    -- S4: drugs, dangerous activities
  score_safety_bias numeric(2,1),         -- S5: propaganda, stereotyping

  -- Quality scores (Q1-Q5, each 1-5)
  score_quality_pedagogical numeric(2,1), -- Q1: learning value
  score_quality_accuracy numeric(2,1),    -- Q2: factual correctness
  score_quality_engagement numeric(2,1),  -- Q3: curiosity vs dark patterns
  score_quality_accessibility numeric(2,1), -- Q4: captions, inclusivity
  score_quality_creator numeric(2,1),     -- Q5: creator trustworthiness

  -- Composite (weighted by age band)
  score_composite numeric(3,1),           -- Weighted overall 1.0-5.0
  score_age_band text,                    -- Which weight matrix was used: 'k2', '35', '68', '912'

  -- Visual consistency check
  visual_check_passed boolean,            -- Do frames match what captions describe?
  visual_check_notes text,                -- What was found if inconsistent

  -- Pipeline status
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'scored', 'approved', 'rejected', 'expired')),
  status_reason text,                     -- Why approved/rejected

  -- Transcript
  transcript_source text,                 -- 'youtube_captions', 'whisper', 'manual'
  transcript_language text,
  has_transcript boolean DEFAULT false,

  -- Flags
  flags text[] DEFAULT ARRAY[]::text[],   -- ['clickbait_thumbnail', 'rapid_cuts', 'loud_audio', 'autoplay_bait']

  -- Scoring metadata
  scored_at timestamptz,
  scored_by text,                         -- 'claude-haiku-4-5', 'claude-sonnet-4-6', 'human:john'
  score_prompt_version text,              -- 'v1', 'v2' — pin to prompt version
  scoring_cost_cents int,                 -- Track what each score costs

  -- Lifecycle
  approved_at timestamptz,
  expires_at timestamptz,                 -- Approvals expire, must re-vet
  last_checked_at timestamptz,            -- Last drift/availability check
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_platform_video UNIQUE (platform, platform_video_id)
);

CREATE INDEX IF NOT EXISTS idx_abya_videos_status ON abya_videos(status);
CREATE INDEX IF NOT EXISTS idx_abya_videos_channel ON abya_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_abya_videos_age ON abya_videos(age_min);
CREATE INDEX IF NOT EXISTS idx_abya_videos_composite ON abya_videos(score_composite DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_abya_videos_category ON abya_videos USING GIN(category_tags);
CREATE INDEX IF NOT EXISTS idx_abya_videos_topic ON abya_videos USING GIN(topic_tags);
CREATE INDEX IF NOT EXISTS idx_abya_videos_platform ON abya_videos(platform, platform_video_id);
CREATE INDEX IF NOT EXISTS idx_abya_videos_approved ON abya_videos(status, approved_at DESC)
  WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_abya_videos_scored ON abya_videos(scored_at DESC NULLS LAST);

-- Full-text search on title + description + parent_abstract
CREATE INDEX IF NOT EXISTS idx_abya_videos_fts ON abya_videos
  USING GIN(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(parent_abstract, '')));

-- ============================================================================
-- Vetting log (audit trail — every pipeline action recorded)
-- ============================================================================

CREATE TABLE IF NOT EXISTS abya_vetting_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES abya_videos(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES abya_channels(id) ON DELETE CASCADE,

  action text NOT NULL CHECK (action IN (
    'queued', 'transcript_extracted', 'scored', 'visual_checked',
    'auto_approved', 'auto_rejected', 'human_approved', 'human_rejected',
    'expired', 'drift_detected', 'rescored', 'flagged', 'unflagged'
  )),
  actor text NOT NULL,                    -- 'pipeline:v1', 'claude-haiku-4-5', 'human:john'
  details jsonb DEFAULT '{}'::jsonb,      -- Action-specific payload

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abya_vlog_video ON abya_vetting_log(video_id);
CREATE INDEX IF NOT EXISTS idx_abya_vlog_channel ON abya_vetting_log(channel_id);
CREATE INDEX IF NOT EXISTS idx_abya_vlog_action ON abya_vetting_log(action);
CREATE INDEX IF NOT EXISTS idx_abya_vlog_time ON abya_vetting_log(created_at DESC);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Reuse the update_updated_at_column() function from bootstrap migration
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_abya_channels_updated_at
  BEFORE UPDATE ON abya_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abya_videos_updated_at
  BEFORE UPDATE ON abya_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE abya_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE abya_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE abya_vetting_log ENABLE ROW LEVEL SECURITY;

-- Public: only approved videos
CREATE POLICY "Public can view approved videos" ON abya_videos
  FOR SELECT USING (status = 'approved');

-- Public: only channels with approved videos
CREATE POLICY "Public can view active channels" ON abya_channels
  FOR SELECT USING (trust_tier IN ('standard', 'trusted'));

-- Service role: full access for pipeline operations
CREATE POLICY "Service role full access videos" ON abya_videos
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access channels" ON abya_channels
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access vetting_log" ON abya_vetting_log
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE abya_channels IS 'YouTube/TikTok channels tracked by ABYA.tv content vetting pipeline';
COMMENT ON TABLE abya_videos IS 'Individual videos scored by the AI pipeline. parent_abstract is the product.';
COMMENT ON TABLE abya_vetting_log IS 'Audit trail for every vetting pipeline action';
COMMENT ON COLUMN abya_videos.parent_abstract IS '2-3 sentence summary for parents. The core product of ABYA.tv.';
COMMENT ON COLUMN abya_videos.age_min IS 'Minimum recommended age. "Ages 8+" = 8. Universal format.';

-- ============================================================================
-- END OF MIGRATION 015 v2
-- ============================================================================
