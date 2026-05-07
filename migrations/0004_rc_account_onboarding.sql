CREATE TABLE IF NOT EXISTS rc_accounts (
  id TEXT PRIMARY KEY,
  organization_name TEXT NOT NULL DEFAULT 'RevenueCat',
  status TEXT NOT NULL DEFAULT 'pending_activation',
  allowed_domains_json TEXT NOT NULL DEFAULT '["revenuecat.com"]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rc_account_users (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'representative',
  status TEXT NOT NULL DEFAULT 'active',
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES rc_accounts(id)
);

CREATE TABLE IF NOT EXISTS connected_accounts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'missing',
  auth_mode TEXT NOT NULL DEFAULT 'api_key',
  encrypted_secret_json TEXT,
  secret_hint TEXT,
  scopes_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  provided_by_user_id TEXT,
  expires_at TEXT,
  last_checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (account_id, connector_type),
  FOREIGN KEY (account_id) REFERENCES rc_accounts(id),
  FOREIGN KEY (provided_by_user_id) REFERENCES rc_account_users(id)
);

CREATE TABLE IF NOT EXISTS connector_audit_events (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES rc_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_type_status
  ON connected_accounts (connector_type, status);

CREATE INDEX IF NOT EXISTS idx_connector_audit_events_account_created
  ON connector_audit_events (account_id, created_at);

INSERT OR IGNORE INTO rc_accounts (
  id,
  organization_name,
  status,
  allowed_domains_json
)
VALUES (
  'revenuecat',
  'RevenueCat',
  'pending_activation',
  '["revenuecat.com"]'
);
