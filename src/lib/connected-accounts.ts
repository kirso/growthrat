export type ConnectorType =
  | "revenuecat"
  | "slack"
  | "cms"
  | "github"
  | "postiz"
  | "dataforseo"
  | "x";

export type ConnectorStatus = "missing" | "pending" | "active" | "error";

export type ConnectorCheck = {
  key: ConnectorType;
  label: string;
  status: "ready" | "gated" | "blocked";
  detail: string;
  authMode?: string;
  providedBy?: string;
  lastCheckedAt?: string;
};

export type ConnectorCredentials = Record<string, string>;

export type UpsertConnectorInput = {
  connectorType: ConnectorType;
  credentials: ConnectorCredentials;
  authMode?: "api_key" | "oauth";
  providedByEmail?: string;
  metadata?: Record<string, unknown>;
  scopes?: string[];
  expiresAt?: string;
};

type ConnectedAccountRow = {
  connector_type: ConnectorType;
  status: ConnectorStatus;
  auth_mode: string;
  encrypted_secret_json: string | null;
  secret_hint: string | null;
  scopes_json: string;
  metadata_json: string;
  provided_by_user_id: string | null;
  last_checked_at: string | null;
};

const accountId = "revenuecat";

export const requiredRcConnectorTypes = [
  "revenuecat",
  "slack",
  "cms",
  "github",
  "postiz",
  "dataforseo",
  "x",
] as const satisfies ConnectorType[];

const connectorLabels: Record<ConnectorType, string> = {
  revenuecat: "RevenueCat API and Charts",
  slack: "Slack workspace",
  cms: "Blog CMS",
  github: "GitHub organization",
  postiz: "Postiz social distribution",
  dataforseo: "DataForSEO keyword research",
  x: "X community monitoring",
};

const proofModeEnvFallbacks: Partial<Record<ConnectorType, string[]>> = {
  revenuecat: ["REVENUECAT_API_KEY", "REVENUECAT_PROJECT_ID"],
  slack: ["SLACK_BOT_TOKEN", "SLACK_DEFAULT_CHANNEL"],
  cms: ["CMS_API_TOKEN"],
  github: ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_CONTENT_REPO"],
  postiz: ["POSTIZ_API_KEY", "POSTIZ_API_BASE_URL"],
  dataforseo: ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"],
  x: [
    "X_BEARER_TOKEN",
    "TWITTER_BEARER_TOKEN",
    "TWITTER_API_KEY",
    "TWITTER_ACCESS_TOKEN",
  ],
};

function envString(env: Env, key: string) {
  const value = (env as unknown as Partial<Record<string, string>>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function allowsProofModeEnvFallback(env: Env) {
  return envString(env, "APP_MODE") !== "rc_live";
}

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function connectorEncryptionKey(env: Env) {
  const secret = envString(env, "GROWTHRAT_CONNECTOR_ENCRYPTION_KEY");
  if (!secret) {
    throw new Error("GROWTHRAT_CONNECTOR_ENCRYPTION_KEY is required");
  }

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );

  return await crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptConnectorCredentials(
  env: Env,
  credentials: ConnectorCredentials,
) {
  const key = await connectorEncryptionKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(credentials));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );

  return JSON.stringify({
    v: 1,
    alg: "AES-GCM",
    iv: encodeBase64(iv),
    ciphertext: encodeBase64(new Uint8Array(ciphertext)),
  });
}

async function decryptConnectorCredentials(
  env: Env,
  encryptedSecretJson: string,
): Promise<ConnectorCredentials> {
  const payload = JSON.parse(encryptedSecretJson) as {
    v: number;
    alg: string;
    iv: string;
    ciphertext: string;
  };
  if (payload.v !== 1 || payload.alg !== "AES-GCM") {
    throw new Error("Unsupported connector credential format");
  }

  const key = await connectorEncryptionKey(env);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(payload.iv) },
    key,
    decodeBase64(payload.ciphertext),
  );

  return JSON.parse(new TextDecoder().decode(plaintext)) as ConnectorCredentials;
}

function secretHint(credentials: ConnectorCredentials) {
  const firstValue = Object.values(credentials).find(Boolean) ?? "";
  if (firstValue.length <= 8) return firstValue ? "configured" : "";
  return `...${firstValue.slice(-4)}`;
}

function envFallbackCredentials(
  env: Env,
  connectorType: ConnectorType,
): ConnectorCredentials | null {
  if (!allowsProofModeEnvFallback(env)) return null;

  const keys = proofModeEnvFallbacks[connectorType] ?? [];
  const credentials = Object.fromEntries(
    keys
      .map((key) => [key, envString(env, key)] as const)
      .filter(([, value]) => Boolean(value)),
  );

  return Object.keys(credentials).length > 0 ? credentials : null;
}

async function getActiveConnectorRow(
  env: Env,
  connectorType: ConnectorType,
): Promise<ConnectedAccountRow | null> {
  try {
    return await env.DB.prepare(
      `select connector_type, status, auth_mode, encrypted_secret_json,
        secret_hint, scopes_json, metadata_json, provided_by_user_id,
        last_checked_at
       from connected_accounts
       where account_id = ? and connector_type = ? and status = 'active'
       limit 1`,
    )
      .bind(accountId, connectorType)
      .first<ConnectedAccountRow>();
  } catch {
    return null;
  }
}

export async function resolveConnectorCredentials(
  env: Env,
  connectorType: ConnectorType,
): Promise<ConnectorCredentials | null> {
  const row = await getActiveConnectorRow(env, connectorType);
  if (row?.encrypted_secret_json) {
    return await decryptConnectorCredentials(env, row.encrypted_secret_json);
  }

  return envFallbackCredentials(env, connectorType);
}

async function verifySlack(credentials: ConnectorCredentials) {
  const token = credentials.botToken ?? credentials.SLACK_BOT_TOKEN;
  if (!token) return { status: "pending", detail: "Slack bot token is required." };

  const response = await fetch("https://slack.com/api/auth.test", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    team?: string;
    user?: string;
    error?: string;
  };

  return body.ok
    ? { status: "active", detail: `Verified Slack team ${body.team ?? "unknown"}.` }
    : {
        status: "error",
        detail: body.error ?? `Slack auth.test failed with ${response.status}.`,
      };
}

async function verifyGitHub(credentials: ConnectorCredentials) {
  const token = credentials.token ?? credentials.GITHUB_TOKEN;
  if (!token) return { status: "pending", detail: "GitHub token is required." };

  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "GrowthRat",
    },
  });
  const body = (await response.json().catch(() => ({}))) as {
    login?: string;
    message?: string;
  };

  return response.ok
    ? { status: "active", detail: `Verified GitHub user ${body.login ?? "unknown"}.` }
    : {
        status: "error",
        detail: body.message ?? `GitHub verification failed with ${response.status}.`,
      };
}

async function verifyRevenueCat(credentials: ConnectorCredentials) {
  const apiKey = credentials.apiKey ?? credentials.REVENUECAT_API_KEY;
  const projectId = credentials.projectId ?? credentials.REVENUECAT_PROJECT_ID;
  if (!apiKey || !projectId) {
    return {
      status: "pending",
      detail: "RevenueCat API key and project id are required.",
    };
  }

  const response = await fetch(
    `https://api.revenuecat.com/v2/projects/${encodeURIComponent(projectId)}/products?limit=1`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    },
  );
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };

  return response.ok
    ? { status: "active", detail: `Verified RevenueCat project ${projectId}.` }
    : {
        status: "error",
        detail:
          body.message ??
          body.error ??
          `RevenueCat product list failed with ${response.status}.`,
      };
}

async function verifyPostiz(credentials: ConnectorCredentials) {
  const apiKey = credentials.apiKey ?? credentials.POSTIZ_API_KEY;
  const baseUrl = (
    credentials.baseUrl ??
    credentials.POSTIZ_API_BASE_URL ??
    "https://api.postiz.com/public/v1"
  ).replace(/\/+$/, "");
  if (!apiKey) return { status: "pending", detail: "Postiz API key is required." };

  const response = await fetch(`${baseUrl}/is-connected`, {
    headers: { Authorization: apiKey, Accept: "application/json" },
  });
  const body = (await response.json().catch(() => ({}))) as {
    connected?: boolean;
    message?: string;
  };

  return response.ok
    ? {
        status: body.connected === false ? "pending" : "active",
        detail:
          body.connected === false
            ? "Postiz API key is valid but no channels are connected."
            : "Verified Postiz Public API access.",
      }
    : {
        status: "error",
        detail: body.message ?? `Postiz check failed with ${response.status}.`,
      };
}

async function verifyDataForSeo(credentials: ConnectorCredentials) {
  const login = credentials.login ?? credentials.DATAFORSEO_LOGIN;
  const password = credentials.password ?? credentials.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    return {
      status: "pending",
      detail: "DataForSEO login and password are required.",
    };
  }

  const response = await fetch(
    "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${login}:${password}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          keywords: ["revenuecat"],
          location_code: 2840,
          language_code: "en",
          limit: 1,
        },
      ]),
    },
  );
  const body = (await response.json().catch(() => ({}))) as {
    status_message?: string;
  };

  return response.ok
    ? { status: "active", detail: "Verified DataForSEO keyword endpoint." }
    : {
        status: "error",
        detail:
          body.status_message ??
          `DataForSEO verification failed with ${response.status}.`,
      };
}

async function verifyConnectorCredentials(
  connectorType: ConnectorType,
  credentials: ConnectorCredentials,
) {
  switch (connectorType) {
    case "slack":
      return await verifySlack(credentials);
    case "github":
      return await verifyGitHub(credentials);
    case "revenuecat":
      return await verifyRevenueCat(credentials);
    case "postiz":
      return await verifyPostiz(credentials);
    case "dataforseo":
      return await verifyDataForSeo(credentials);
    case "cms":
      return {
        status: "pending",
        detail: "CMS credentials stored; provider-specific verification is manual.",
      };
    case "x":
      return {
        status:
          credentials.bearerToken ||
          credentials.X_BEARER_TOKEN ||
          credentials.TWITTER_BEARER_TOKEN
            ? "active"
            : "pending",
        detail:
          "X community monitoring credentials are stored; live search is rate-limit dependent.",
      };
  }
}

export async function getConnectorChecks(env: Env): Promise<ConnectorCheck[]> {
  let rows: ConnectedAccountRow[] = [];

  try {
    const response = await env.DB.prepare(
      `select connector_type, status, auth_mode, encrypted_secret_json,
        secret_hint, scopes_json, metadata_json, provided_by_user_id,
        last_checked_at
       from connected_accounts
       where account_id = ?`,
    )
      .bind(accountId)
      .all<ConnectedAccountRow>();
    rows = response.results;
  } catch {
    rows = [];
  }

  const byType = new Map(rows.map((row) => [row.connector_type, row]));

  return requiredRcConnectorTypes.map((connectorType) => {
    const row = byType.get(connectorType);
    if (row?.status === "active") {
      return {
        key: connectorType,
        label: connectorLabels[connectorType],
        status: "ready",
        detail: "Connected by a RevenueCat representative account.",
        authMode: row.auth_mode,
        providedBy: row.provided_by_user_id ?? undefined,
        lastCheckedAt: row.last_checked_at ?? undefined,
      };
    }

    const fallback = envFallbackCredentials(env, connectorType);
    if (fallback) {
      return {
        key: connectorType,
        label: connectorLabels[connectorType],
        status: "gated",
        detail:
          "Configured through local/proof env fallback. Production rc_live requires an RC-provided connected account.",
        authMode: "env_fallback",
      };
    }

    return {
      key: connectorType,
      label: connectorLabels[connectorType],
      status: row?.status === "error" ? "blocked" : "gated",
      detail:
        row?.status === "error"
          ? "Connector account exists but is currently in error."
          : "Waiting for a RevenueCat representative to connect this account after interview approval.",
      authMode: row?.auth_mode,
      providedBy: row?.provided_by_user_id ?? undefined,
      lastCheckedAt: row?.last_checked_at ?? undefined,
    };
  });
}

export async function upsertConnectedAccount(
  env: Env,
  input: UpsertConnectorInput,
) {
  const now = new Date().toISOString();
  const verification = await verifyConnectorCredentials(
    input.connectorType,
    input.credentials,
  );
  const encryptedSecretJson = await encryptConnectorCredentials(
    env,
    input.credentials,
  );
  const id = `${accountId}:${input.connectorType}`;
  const providedByUserId = input.providedByEmail?.trim().toLowerCase() || null;

  await env.DB.prepare(
    `insert into connected_accounts (
      id, account_id, connector_type, status, auth_mode,
      encrypted_secret_json, secret_hint, scopes_json, metadata_json,
      provided_by_user_id, expires_at, last_checked_at, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    on conflict(account_id, connector_type) do update set
      status = excluded.status,
      auth_mode = excluded.auth_mode,
      encrypted_secret_json = excluded.encrypted_secret_json,
      secret_hint = excluded.secret_hint,
      scopes_json = excluded.scopes_json,
      metadata_json = excluded.metadata_json,
      provided_by_user_id = excluded.provided_by_user_id,
      expires_at = excluded.expires_at,
      last_checked_at = excluded.last_checked_at,
      updated_at = excluded.updated_at`,
  )
    .bind(
      id,
      accountId,
      input.connectorType,
      verification.status,
      input.authMode ?? "api_key",
      encryptedSecretJson,
      secretHint(input.credentials),
      JSON.stringify(input.scopes ?? []),
      JSON.stringify({
        ...(input.metadata ?? {}),
        verification: verification.detail,
      }),
      providedByUserId,
      input.expiresAt ?? null,
      now,
      now,
      now,
    )
    .run();

  await env.DB.prepare(
    `insert into connector_audit_events (
      id, account_id, connector_type, event_type, actor_user_id,
      detail_json, created_at
    ) values (?, ?, ?, 'connector_connected', ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      accountId,
      input.connectorType,
      providedByUserId,
      JSON.stringify({
        authMode: input.authMode ?? "api_key",
        verificationStatus: verification.status,
        verification: verification.detail,
      }),
      now,
    )
    .run();
}
