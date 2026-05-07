ALTER TABLE artifacts ADD COLUMN content TEXT;
ALTER TABLE artifacts ADD COLUMN content_format TEXT NOT NULL DEFAULT 'markdown';
ALTER TABLE artifacts ADD COLUMN quality_scores_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE artifacts ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE artifacts ADD COLUMN published_at TEXT;

CREATE TABLE IF NOT EXISTS agent_config (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'interview_proof',
  review_mode TEXT NOT NULL DEFAULT 'draft_only',
  focus_topics_json TEXT NOT NULL DEFAULT '[]',
  slack_channel TEXT NOT NULL DEFAULT 'growthrat',
  enabled_platforms_json TEXT NOT NULL DEFAULT '[]',
  budget_policy_json TEXT NOT NULL DEFAULT '{}',
  paused INTEGER NOT NULL DEFAULT 0,
  active_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO agent_config (
  id,
  mode,
  review_mode,
  focus_topics_json,
  enabled_platforms_json,
  budget_policy_json,
  paused
) VALUES (
  'default',
  'interview_proof',
  'draft_only',
  '["RevenueCat agent builders","subscription app growth","developer advocacy"]',
  '["site","github","slack","postiz"]',
  '{"maxDailyEstimatedUsd":15,"maxDailyInputTokens":2000000,"maxDailyOutputTokens":400000,"allowCommunityPosting":false,"allowAutoPublish":false}',
  0
);

CREATE TABLE IF NOT EXISTS opportunity_snapshots (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  lane TEXT NOT NULL,
  audience TEXT,
  score REAL NOT NULL DEFAULT 0,
  components_json TEXT NOT NULL DEFAULT '{}',
  rationale TEXT,
  readiness_score REAL,
  readiness_passes INTEGER NOT NULL DEFAULT 0,
  workflow_run_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_opportunity_snapshots_lane_score
  ON opportunity_snapshots (lane, score);

CREATE TABLE IF NOT EXISTS community_signals (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  external_url TEXT NOT NULL,
  topic TEXT NOT NULL,
  context TEXT NOT NULL,
  response_draft TEXT,
  quality_status TEXT NOT NULL DEFAULT 'queued',
  posted_at TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (channel, external_url)
);

CREATE INDEX IF NOT EXISTS idx_community_signals_status_created
  ON community_signals (quality_status, created_at);

CREATE TABLE IF NOT EXISTS distribution_actions (
  id TEXT PRIMARY KEY,
  artifact_id TEXT,
  channel TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  idempotency_key TEXT NOT NULL UNIQUE,
  external_id TEXT,
  external_url TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_distribution_actions_artifact
  ON distribution_actions (artifact_id, created_at);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created
  ON chat_messages (thread_id, created_at);
