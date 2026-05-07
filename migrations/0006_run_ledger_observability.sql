CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  run_type TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  actor_type TEXT NOT NULL DEFAULT 'growthrat',
  actor_id TEXT,
  mode TEXT NOT NULL DEFAULT 'interview_proof',
  title TEXT,
  input_json TEXT NOT NULL DEFAULT '{}',
  output_json TEXT,
  langfuse_trace_id TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_type_status
  ON agent_runs (run_type, status, created_at);

CREATE TABLE IF NOT EXISTS agent_run_events (
  id TEXT PRIMARY KEY,
  run_id TEXT,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'growthrat',
  actor_id TEXT,
  status TEXT NOT NULL DEFAULT 'recorded',
  subject_type TEXT,
  subject_id TEXT,
  source_ids_json TEXT NOT NULL DEFAULT '[]',
  detail_json TEXT NOT NULL DEFAULT '{}',
  cost_usd REAL,
  latency_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_run_events_run_created
  ON agent_run_events (run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_run_events_type_created
  ON agent_run_events (event_type, created_at);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lane TEXT NOT NULL,
  audience TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  source_type TEXT NOT NULL DEFAULT 'synthesized',
  source_url TEXT,
  source_ids_json TEXT NOT NULL DEFAULT '[]',
  score REAL NOT NULL DEFAULT 0,
  components_json TEXT NOT NULL DEFAULT '{}',
  rationale TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  effort_level TEXT NOT NULL DEFAULT 'medium',
  confidence REAL NOT NULL DEFAULT 0,
  last_selected_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_opportunities_lane_score
  ON opportunities (lane, score);
CREATE INDEX IF NOT EXISTS idx_opportunities_status_score
  ON opportunities (status, score);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by TEXT NOT NULL DEFAULT 'growthrat',
  requested_in_channel TEXT,
  slack_channel TEXT,
  slack_thread_ts TEXT,
  approved_by TEXT,
  decided_at TEXT,
  reason TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (subject_type, subject_id, action_type)
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status_created
  ON approval_requests (status, created_at);

CREATE TABLE IF NOT EXISTS report_deliveries (
  id TEXT PRIMARY KEY,
  report_id TEXT,
  run_id TEXT,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  destination TEXT,
  external_id TEXT,
  error_message TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  delivered_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES agent_runs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_report_deliveries_report
  ON report_deliveries (report_id, created_at);
