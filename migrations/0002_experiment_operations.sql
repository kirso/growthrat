ALTER TABLE experiments ADD COLUMN audience TEXT NOT NULL DEFAULT 'agent developers and subscription-app growth operators';
ALTER TABLE experiments ADD COLUMN channel TEXT NOT NULL DEFAULT 'owned proof site, GitHub, X, forums, and approved social derivatives';
ALTER TABLE experiments ADD COLUMN decision_rule TEXT NOT NULL DEFAULT 'Declare a result only when the behavioral signal and monetization signal can be interpreted together.';
ALTER TABLE experiments ADD COLUMN started_at TEXT;
ALTER TABLE experiments ADD COLUMN ended_at TEXT;
ALTER TABLE experiments ADD COLUMN owner TEXT NOT NULL DEFAULT 'GrowthRat';
ALTER TABLE experiments ADD COLUMN source_doc TEXT;

CREATE TABLE IF NOT EXISTS experiment_variants (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  name TEXT NOT NULL,
  hypothesis_delta TEXT,
  hook TEXT,
  cta TEXT,
  destination_url TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
  UNIQUE (experiment_id, variant_key)
);

CREATE TABLE IF NOT EXISTS experiment_assets (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  variant_id TEXT,
  asset_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  tracking_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES experiment_variants(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS experiment_events (
  id TEXT PRIMARY KEY,
  experiment_id TEXT,
  variant_id TEXT,
  asset_id TEXT,
  event_type TEXT NOT NULL,
  channel TEXT,
  source TEXT,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id) REFERENCES experiment_variants(id) ON DELETE SET NULL,
  FOREIGN KEY (asset_id) REFERENCES experiment_assets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS experiment_metric_snapshots (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  variant_id TEXT,
  source TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value REAL NOT NULL,
  window_start TEXT,
  window_end TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES experiment_variants(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS experiment_readouts (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  decision TEXT NOT NULL,
  summary TEXT NOT NULL,
  learning TEXT NOT NULL,
  next_action TEXT NOT NULL,
  metrics_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment ON experiment_variants (experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assets_experiment ON experiment_assets (experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assets_tracking ON experiment_assets (tracking_id);
CREATE INDEX IF NOT EXISTS idx_experiment_events_experiment_type ON experiment_events (experiment_id, event_type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_experiment_metric_snapshots_experiment_metric ON experiment_metric_snapshots (experiment_id, metric_key, captured_at);
CREATE INDEX IF NOT EXISTS idx_experiment_readouts_experiment ON experiment_readouts (experiment_id, created_at);

UPDATE experiments
SET
  audience = 'agent developers evaluating subscription infrastructure',
  channel = 'owned proof site, X/GitHub derivatives, and RevenueCat-intent tracking links',
  status = 'running',
  decision_rule = 'A win requires stronger qualified interest without confusing reviewers or creating unsupported RevenueCat claims.',
  source_doc = 'docs/public/experiments/week-one-distribution-test.md'
WHERE id = 'exp_week_one_distribution';

INSERT OR IGNORE INTO experiment_variants (
  id,
  experiment_id,
  variant_key,
  name,
  hypothesis_delta,
  hook,
  cta,
  destination_url,
  status
)
VALUES
  (
    'var_week_one_reference',
    'exp_week_one_distribution',
    'reference',
    'Reference architecture hook',
    'Implementation-heavy architecture content should attract qualified developer interest.',
    'How should an agent wire RevenueCat without stitching five docs together?',
    'Read the agent-built RevenueCat reference path',
    '/articles/revenuecat-for-agent-built-apps',
    'running'
  ),
  (
    'var_week_one_test_store',
    'exp_week_one_distribution',
    'test-store',
    'Test Store hook',
    'Testing-speed content should resonate with agents that need deterministic purchase loops.',
    'The fastest way for an agent to prove a subscription loop is working.',
    'Review the Test Store implementation path',
    '/readiness-review',
    'running'
  ),
  (
    'var_week_one_charts',
    'exp_week_one_distribution',
    'charts-bridge',
    'Charts bridge hook',
    'Measurement-boundary content should attract growth operators and product teams.',
    'RevenueCat Charts are monetization truth, not your whole funnel.',
    'Open the Charts plus analytics guide',
    '/articles/charts-behavioral-analytics-bridge',
    'running'
  );

INSERT OR IGNORE INTO experiment_assets (
  id,
  experiment_id,
  variant_id,
  asset_type,
  channel,
  title,
  url,
  tracking_id,
  status,
  metadata_json
)
VALUES
  (
    'asset_week_one_reference_site',
    'exp_week_one_distribution',
    'var_week_one_reference',
    'landing_link',
    'owned_site',
    'RevenueCat for Agent-Built Apps tracking link',
    '/articles/revenuecat-for-agent-built-apps',
    'week-one-reference',
    'published',
    '{"utm_campaign":"week_one_distribution","utm_content":"reference"}'
  ),
  (
    'asset_week_one_test_store_site',
    'exp_week_one_distribution',
    'var_week_one_test_store',
    'landing_link',
    'owned_site',
    'Test Store readiness tracking link',
    '/readiness-review',
    'week-one-test-store',
    'published',
    '{"utm_campaign":"week_one_distribution","utm_content":"test_store"}'
  ),
  (
    'asset_week_one_charts_site',
    'exp_week_one_distribution',
    'var_week_one_charts',
    'landing_link',
    'owned_site',
    'Charts bridge tracking link',
    '/articles/charts-behavioral-analytics-bridge',
    'week-one-charts',
    'published',
    '{"utm_campaign":"week_one_distribution","utm_content":"charts_bridge"}'
  );
