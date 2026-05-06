CREATE TABLE IF NOT EXISTS source_chunks (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  vector_id TEXT NOT NULL UNIQUE,
  indexed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_source_chunks_source ON source_chunks (source_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_source_chunks_indexed ON source_chunks (indexed_at);

CREATE TABLE IF NOT EXISTS policy_counters (
  id TEXT PRIMARY KEY,
  counter_scope TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  window_key TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (counter_scope, subject_key, window_key)
);

CREATE INDEX IF NOT EXISTS idx_policy_counters_scope_window ON policy_counters (counter_scope, window_key);

CREATE TABLE IF NOT EXISTS runtime_flags (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  reason TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO runtime_flags (key, value, reason, updated_by)
VALUES
  ('kill_switch', 'false', 'Default startup state.', 'migration'),
  ('model_chat_enabled', 'true', 'Allow model-backed chat only behind policy gates.', 'migration');

CREATE TABLE IF NOT EXISTS operator_actions (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL,
  subject TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operator_actions_type_created ON operator_actions (action_type, created_at);
