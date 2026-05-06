CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  summary TEXT,
  source_path TEXT,
  r2_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  r2_key TEXT,
  retrieved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  metrics_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback_items (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'draft',
  evidence_json TEXT NOT NULL DEFAULT '[]',
  recommendation TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_interactions (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  external_url TEXT,
  topic TEXT NOT NULL,
  quality_status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  summary TEXT,
  r2_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  path TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_type TEXT NOT NULL,
  status TEXT NOT NULL,
  input_json TEXT NOT NULL DEFAULT '{}',
  output_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connector_connections (
  id TEXT PRIMARY KEY,
  connector_type TEXT NOT NULL,
  status TEXT NOT NULL,
  secret_ref TEXT,
  last_checked_at TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_log (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL,
  requested_by TEXT,
  approved_by TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_artifacts_type_status ON artifacts (artifact_type, status);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_items (status);
CREATE INDEX IF NOT EXISTS idx_usage_events_type_created ON usage_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_type_status ON workflow_runs (workflow_type, status);

INSERT OR IGNORE INTO artifacts (id, slug, title, artifact_type, status, summary, source_path)
VALUES
  ('art_revenuecat_agent_apps', 'revenuecat-for-agent-built-apps', 'RevenueCat for Agent-Built Apps', 'technical', 'published', 'Reference architecture for offerings, entitlements, CustomerInfo, webhooks, testing, and agent-operated access checks.', 'docs/public/guides/revenuecat-for-agent-built-apps.md'),
  ('art_agent_onboarding_gap', 'agent-onboarding-reference-path-gap', 'Agent Onboarding Reference Path Gap', 'feedback', 'published', 'Structured feedback on compressing RevenueCat docs into an agent-native path.', 'docs/public/feedback/agent-onboarding-reference-path-gap.md'),
  ('art_charts_bridge', 'charts-behavioral-analytics-bridge', 'Charts And Behavioral Analytics Bridge', 'feedback', 'published', 'Structured feedback separating monetization truth from behavioral analytics.', 'docs/public/feedback/charts-and-behavioral-analytics-bridge.md'),
  ('art_webhook_boundaries', 'webhook-trust-boundaries', 'Webhook Sync Trust Boundaries', 'feedback', 'published', 'Structured feedback on webhook idempotency, reconciliation, and subscriber-state trust.', 'docs/public/feedback/webhook-sync-trust-boundaries.md'),
  ('art_week_one_experiment', 'week-one-experiment-report', 'Week-One Distribution Experiment', 'experiment', 'published', 'Growth experiment brief with hypothesis, launch assets, and measurement plan.', 'docs/public/experiments/week-one-distribution-test.md'),
  ('art_week_one_report', 'week-one-async-report', 'Week-One Async Check-In', 'report', 'published', 'Sample weekly report covering shipped work, metrics, learnings, risks, and next actions.', 'docs/public/reports/week-one-async-check-in.md');

INSERT OR IGNORE INTO experiments (id, slug, title, hypothesis, status, metrics_json)
VALUES (
  'exp_week_one_distribution',
  'week-one-experiment-report',
  'Week-One Distribution Experiment',
  'Implementation-heavy RevenueCat content will outperform broad AI subscription commentary for qualified developer interest.',
  'planned',
  '{"primary":["qualified_clicks","saves","replies"],"secondary":["github_activity","docs_traffic","revenuecat_intent"]}'
);

INSERT OR IGNORE INTO feedback_items (id, slug, title, severity, status, recommendation)
VALUES
  ('fb_agent_onboarding_gap', 'agent-onboarding-reference-path-gap', 'Agent Onboarding Reference Path Gap', 'medium', 'published', 'Create a canonical agent-builder implementation path.'),
  ('fb_charts_bridge', 'charts-behavioral-analytics-bridge', 'Charts And Behavioral Analytics Bridge', 'medium', 'published', 'Publish a bridge between RevenueCat Charts and behavioral analytics.'),
  ('fb_webhook_boundaries', 'webhook-trust-boundaries', 'Webhook Sync Trust Boundaries', 'high', 'published', 'Document idempotent webhook and subscriber reconciliation patterns.');

INSERT OR IGNORE INTO weekly_reports (id, week_start, week_end, status, summary)
VALUES (
  'report_week_one',
  '2026-05-04',
  '2026-05-10',
  'sample',
  'Sample weekly report for RevenueCat Developer Advocacy and Growth.'
);
