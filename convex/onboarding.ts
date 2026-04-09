import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { listProducts } from "../lib/connectors/revenuecat";
import { requireRcAdmin } from "./authz";

const CONNECTORS = [
  "slack",
  "cms",
  "revenuecat",
  "github",
  "typefully",
  "dataforseo",
  "twitter",
] as const;

type ConnectorKey = (typeof CONNECTORS)[number];
type ConnectorStatus = "pending" | "verified" | "manual_verification" | "unsupported" | "error";

type ConnectorRecord = {
  connector: ConnectorKey;
  status: ConnectorStatus;
  label?: string;
  errorSummary?: string;
  verificationMethod?: string;
  lastSubmittedAt?: number;
  lastVerifiedAt?: number;
  details?: Record<string, unknown>;
};

const encoder = new TextEncoder();

function isConnectorKey(value: string): value is ConnectorKey {
  return (CONNECTORS as readonly string[]).includes(value);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < value.length; i += 2) {
    bytes[i / 2] = Number.parseInt(value.slice(i, i + 2), 16);
  }
  return bytes;
}

function truncate(text: string, max = 180): string {
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

async function deriveKeyMaterial(secret: string) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return globalThis.crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptPayload(payload: unknown): Promise<string> {
  const secret = process.env.CONNECTOR_SECRET_ENCRYPTION_KEY ?? process.env.GROWTHCAT_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("Missing encryption secret");
  }

  const key = await deriveKeyMaterial(secret);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(stableJson(payload));
  const encrypted = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return `v1.${toHex(iv)}.${toHex(new Uint8Array(encrypted))}`;
}

async function decryptPayload<T>(encryptedPayload: string): Promise<T | null> {
  const secret = process.env.CONNECTOR_SECRET_ENCRYPTION_KEY ?? process.env.GROWTHCAT_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("Missing encryption secret");
  }

  const [version, ivHex, cipherHex] = encryptedPayload.split(".");
  if (version !== "v1" || !ivHex || !cipherHex) {
    throw new Error("Unsupported encrypted payload format");
  }

  const key = await deriveKeyMaterial(secret);
  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromHex(ivHex).buffer as ArrayBuffer },
    key,
    fromHex(cipherHex).buffer as ArrayBuffer,
  );
  const json = new TextDecoder().decode(new Uint8Array(decrypted));
  return JSON.parse(json) as T;
}

async function signEnvelope(envelope: unknown): Promise<string> {
  const secret = process.env.GROWTHCAT_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("Missing internal signing secret");
  }

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(stableJson(envelope)));
  return toHex(new Uint8Array(signature));
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

async function verifyEnvelope(envelope: unknown, signature: string): Promise<boolean> {
  const expected = await signEnvelope(envelope);
  return timingSafeEqual(expected, signature);
}

function safeError(error: unknown): string {
  if (error instanceof Error) {
    return truncate(error.message);
  }
  if (typeof error === "string") return truncate(error);
  return "Unknown error";
}

function normalizeConnector(connector: string): ConnectorKey | null {
  return isConnectorKey(connector) ? connector : null;
}

function defaultLabel(connector: ConnectorKey, payload: Record<string, unknown>): string {
  switch (connector) {
    case "slack":
      return typeof payload.workspaceLabel === "string" && payload.workspaceLabel ? payload.workspaceLabel : "Slack workspace";
    case "cms":
      return typeof payload.siteName === "string" && payload.siteName ? payload.siteName : "CMS";
    case "revenuecat":
      return typeof payload.projectId === "string" && payload.projectId ? `RevenueCat project ${payload.projectId}` : "RevenueCat Charts";
    case "github":
      return typeof payload.owner === "string" && typeof payload.repo === "string"
        ? `${payload.owner}/${payload.repo}`
        : "GitHub";
    case "typefully":
      return typeof payload.socialSetId === "string" && payload.socialSetId ? `Typefully social set ${payload.socialSetId}` : "Typefully";
    case "dataforseo":
      return typeof payload.login === "string" && payload.login ? payload.login : "DataForSEO";
    case "twitter":
      return "X / Twitter";
  }
  return connector;
}

function toBase64(value: string): string {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  throw new Error("Base64 encoding is unavailable in this runtime");
}

function compactRecord<T extends Record<string, unknown>>(record: T): Partial<T> {
  const compacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) {
      compacted[key] = value;
    }
  }
  return compacted as Partial<T>;
}

async function verifySlack(payload: Record<string, unknown>): Promise<Omit<ConnectorRecord, "connector">> {
  const token = typeof payload.botToken === "string" ? payload.botToken.trim() : "";
  const signingSecret = typeof payload.signingSecret === "string" ? payload.signingSecret.trim() : "";
  if (!token) {
    return {
      status: "pending",
      label: defaultLabel("slack", payload),
      errorSummary: "Slack bot token is required",
      verificationMethod: "manual",
      details: { missing: ["botToken"] },
    };
  }
  if (!signingSecret) {
    return {
      status: "pending",
      label: defaultLabel("slack", payload),
      errorSummary: "Slack signing secret is required for commands and approvals",
      verificationMethod: "manual",
      details: { missing: ["signingSecret"] },
    };
  }

  const res = await fetch("https://slack.com/api/auth.test", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.ok === false) {
    return {
      status: "error",
      label: defaultLabel("slack", payload),
      errorSummary: truncate(data.error ?? `Slack auth failed (${res.status})`),
      verificationMethod: "auth.test",
      details: { ok: data.ok ?? false },
    };
  }

  return {
    status: "verified",
    label: data.team ?? defaultLabel("slack", payload),
    verificationMethod: "auth.test",
    lastVerifiedAt: Date.now(),
    details: {
      team: data.team,
      user: data.user,
      team_id: data.team_id,
      url: data.url,
    },
  };
}

async function verifyGitHub(payload: Record<string, unknown>): Promise<Omit<ConnectorRecord, "connector">> {
  const token = typeof payload.token === "string" ? payload.token.trim() : "";
  if (!token) {
    return {
      status: "pending",
      label: defaultLabel("github", payload),
      errorSummary: "GitHub personal access token is required",
      verificationMethod: "manual",
      details: { missing: ["token"] },
    };
  }

  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      status: "error",
      label: defaultLabel("github", payload),
      errorSummary: truncate(data.message ?? `GitHub auth failed (${res.status})`),
      verificationMethod: "GET /user",
      details: { status: res.status },
    };
  }

  return {
    status: "verified",
    label: data.login ?? defaultLabel("github", payload),
    verificationMethod: "GET /user",
    lastVerifiedAt: Date.now(),
    details: {
      login: data.login,
      name: data.name,
      type: data.type,
      avatar_url: data.avatar_url,
    },
  };
}

async function verifyRevenueCat(payload: Record<string, unknown>): Promise<Omit<ConnectorRecord, "connector">> {
  const apiKey = typeof payload.apiKey === "string" ? payload.apiKey.trim() : "";
  const projectId = typeof payload.projectId === "string" ? payload.projectId.trim() : "";

  if (!apiKey || !projectId) {
    return {
      status: "pending",
      label: defaultLabel("revenuecat", payload),
      errorSummary: !apiKey ? "RevenueCat API key is required" : "RevenueCat projectId is required",
      verificationMethod: "manual",
      details: { missing: [!apiKey ? "apiKey" : null, !projectId ? "projectId" : null].filter(Boolean) },
    };
  }

  try {
    const products = await listProducts(projectId, apiKey);
    return {
      status: "verified",
      label: `RevenueCat project ${projectId}`,
      verificationMethod: "GET /v2/projects/:projectId/products",
      lastVerifiedAt: Date.now(),
      details: {
        productCount: Array.isArray(products.items) ? products.items.length : 0,
        nextPage: products.next_page ?? null,
      },
    };
  } catch (error) {
    return {
      status: "error",
      label: defaultLabel("revenuecat", payload),
      errorSummary: safeError(error),
      verificationMethod: "GET /v2/projects/:projectId/products",
    };
  }
}

async function verifyDataForSeo(payload: Record<string, unknown>): Promise<Omit<ConnectorRecord, "connector">> {
  const login = typeof payload.login === "string" ? payload.login.trim() : "";
  const password = typeof payload.password === "string" ? payload.password.trim() : "";

  if (!login || !password) {
    return {
      status: "pending",
      label: defaultLabel("dataforseo", payload),
      errorSummary: "DataForSEO login and password are required",
      verificationMethod: "manual",
      details: { missing: [!login ? "login" : null, !password ? "password" : null].filter(Boolean) },
    };
  }

  try {
    const res = await fetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${toBase64(`${login}:${password}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          { keywords: ["revenuecat"], location_code: 2840, language_code: "en", limit: 1 },
        ]),
      }
    );
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        status: "error",
        label: defaultLabel("dataforseo", payload),
        errorSummary: truncate(data.status_message ?? `DataForSEO auth failed (${res.status})`),
        verificationMethod: "keyword_ideas/live",
      };
    }

    return {
      status: "verified",
      label: login,
      verificationMethod: "keyword_ideas/live",
      lastVerifiedAt: Date.now(),
      details: { live: true },
    };
  } catch (error) {
    return {
      status: "error",
      label: defaultLabel("dataforseo", payload),
      errorSummary: safeError(error),
      verificationMethod: "keyword_ideas/live",
    };
  }
}

async function verifyTwitter(payload: Record<string, unknown>): Promise<Omit<ConnectorRecord, "connector">> {
  const bearerToken = typeof payload.bearerToken === "string" ? payload.bearerToken.trim() : "";
  if (!bearerToken) {
    return {
      status: "pending",
      label: defaultLabel("twitter", payload),
      errorSummary: "Twitter/X bearer token is required",
      verificationMethod: "manual",
      details: { missing: ["bearerToken"] },
    };
  }

  try {
    const query = encodeURIComponent('"RevenueCat" -is:retweet');
    const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=10`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || Array.isArray(data.errors)) {
      return {
        status: "error",
        label: defaultLabel("twitter", payload),
        errorSummary: truncate(data.title ?? `Twitter API returned ${res.status}`),
        verificationMethod: "recent search",
      };
    }

    return {
      status: "verified",
      label: defaultLabel("twitter", payload),
      verificationMethod: "recent search",
      lastVerifiedAt: Date.now(),
      details: { resultCount: Array.isArray(data.data) ? data.data.length : 0 },
    };
  } catch (error) {
    return {
      status: "error",
      label: defaultLabel("twitter", payload),
      errorSummary: safeError(error),
      verificationMethod: "recent search",
    };
  }
}

async function verifyCms(payload: Record<string, unknown>): Promise<Omit<ConnectorRecord, "connector">> {
  const provider = typeof payload.provider === "string" ? payload.provider.trim().toLowerCase() : "";
  const endpoint = typeof payload.endpoint === "string" ? payload.endpoint.trim() : "";

  if (!provider || !endpoint) {
    return {
      status: "pending",
      label: defaultLabel("cms", payload),
      errorSummary: "CMS provider and endpoint are required",
      verificationMethod: "manual",
      details: { missing: [!provider ? "provider" : null, !endpoint ? "endpoint" : null].filter(Boolean) },
    };
  }

  return {
    status: "manual_verification",
    label: defaultLabel("cms", payload),
    verificationMethod: "manual",
    lastVerifiedAt: Date.now(),
    details: {
      provider,
      endpoint,
      note: "CMS access is captured server-side; direct CMS API verification remains provider-specific and may need manual confirmation.",
    },
  };
}

async function verifyTypefully(payload: Record<string, unknown>): Promise<Omit<ConnectorRecord, "connector">> {
  const apiKey = typeof payload.apiKey === "string" ? payload.apiKey.trim() : "";
  const socialSetId = typeof payload.socialSetId === "string" ? payload.socialSetId.trim() : "";

  if (!apiKey || !socialSetId) {
    return {
      status: "pending",
      label: defaultLabel("typefully", payload),
      errorSummary: "Typefully API key and social set id are required",
      verificationMethod: "manual",
      details: { missing: [!apiKey ? "apiKey" : null, !socialSetId ? "socialSetId" : null].filter(Boolean) },
    };
  }

  return {
    status: "manual_verification",
    label: `Typefully set ${socialSetId}`,
    verificationMethod: "manual",
    lastVerifiedAt: Date.now(),
    details: {
      socialSetId,
      note: "Typefully credentials stored server-side. A live API health check can be added once the exact account-level endpoint is confirmed.",
    },
  };
}

async function verifyConnector(connector: ConnectorKey, payload: Record<string, unknown>): Promise<Omit<ConnectorRecord, "connector">> {
  switch (connector) {
    case "slack":
      return await verifySlack(payload);
    case "cms":
      return await verifyCms(payload);
    case "revenuecat":
      return await verifyRevenueCat(payload);
    case "github":
      return await verifyGitHub(payload);
    case "typefully":
      return await verifyTypefully(payload);
    case "dataforseo":
      return await verifyDataForSeo(payload);
    case "twitter":
      return await verifyTwitter(payload);
  }
}

export const getConnectorStatuses = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    const rows = await ctx.db.query("connectorConnections").collect();
    const byConnector = new Map(rows.map((row) => [row.connector, row]));

    return CONNECTORS.map((connector) => {
      const row = byConnector.get(connector);
      return {
        connector,
        status: row?.status ?? "pending",
        label: row?.label ?? defaultLabel(connector, {}),
        errorSummary: row?.errorSummary ?? null,
        verificationMethod: row?.verificationMethod ?? null,
        lastSubmittedAt: row?.lastSubmittedAt ?? null,
        lastVerifiedAt: row?.lastVerifiedAt ?? null,
        details: row?.details ?? null,
      };
    });
  },
});

export const getConnectorSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    const rows = await ctx.db.query("connectorConnections").collect();
    return rows.map((row) => ({
      connector: row.connector,
      status: row.status,
      label: row.label ?? null,
      errorSummary: row.errorSummary ?? null,
      verificationMethod: row.verificationMethod ?? null,
      lastSubmittedAt: row.lastSubmittedAt ?? null,
      lastVerifiedAt: row.lastVerifiedAt ?? null,
    }));
  },
});

export const upsertConnectorStatus = internalMutation({
  args: {
    connector: v.string(),
    status: v.string(),
    label: v.optional(v.string()),
    errorSummary: v.optional(v.string()),
    verificationMethod: v.optional(v.string()),
    lastSubmittedAt: v.optional(v.number()),
    lastVerifiedAt: v.optional(v.number()),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("connectorConnections")
      .withIndex("by_connector", (q) => q.eq("connector", args.connector))
      .first();

    const patch = {
      status: args.status,
      label: args.label,
      errorSummary: args.errorSummary,
      verificationMethod: args.verificationMethod,
      lastSubmittedAt: args.lastSubmittedAt,
      lastVerifiedAt: args.lastVerifiedAt,
      details: args.details,
    };
    const compacted = compactRecord(patch) as {
      status: string;
      label?: string;
      errorSummary?: string;
      verificationMethod?: string;
      lastSubmittedAt?: number;
      lastVerifiedAt?: number;
      details?: any;
    };

    if (existing) {
      await ctx.db.patch(existing._id, compacted);
      return existing._id;
    }

    return await ctx.db.insert("connectorConnections", {
      connector: args.connector,
      ...compacted,
    });
  },
});

export const storeConnectorSecret = internalMutation({
  args: {
    connector: v.string(),
    encryptedPayload: v.string(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("connectorSecrets")
      .withIndex("by_connector", (q) => q.eq("connector", args.connector))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("connectorSecrets", args);
  },
});

export const getRuntimeConnectorPayload = internalQuery({
  args: { connector: v.string() },
  handler: async (ctx, { connector }) => {
    const row = await ctx.db
      .query("connectorSecrets")
      .withIndex("by_connector", (q) => q.eq("connector", connector))
      .first();

    if (!row) return null;
    return await decryptPayload<Record<string, unknown>>(row.encryptedPayload);
  },
});

export const submitConnectorSubmission = action({
  args: {
    connector: v.string(),
    payload: v.any(),
    timestamp: v.number(),
    nonce: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    if (!process.env.GROWTHCAT_INTERNAL_SECRET) {
      return {
        ok: false,
        connector: args.connector,
        status: "error" as const,
        errorSummary: "Missing internal signing secret",
      };
    }

    const envelope = {
      connector: args.connector,
      payload: args.payload,
      timestamp: args.timestamp,
      nonce: args.nonce,
    };
    const valid = await verifyEnvelope(envelope, args.signature);
    if (!valid) {
      return {
        ok: false,
        connector: args.connector,
        status: "error" as const,
        errorSummary: "Invalid onboarding signature",
      };
    }

    const connector = normalizeConnector(args.connector);
    if (!connector) {
      return {
        ok: false,
        connector: args.connector,
        status: "unsupported" as const,
        errorSummary: "Unsupported connector",
      };
    }

    const payload = (args.payload ?? {}) as Record<string, unknown>;
    const submittedAt = Date.now();

    try {
      await ctx.runMutation((internal as any).onboarding.storeConnectorSecret, {
        connector,
        encryptedPayload: await encryptPayload(payload),
        updatedAt: submittedAt,
      });

      const verification = await verifyConnector(connector, payload);
      await ctx.runMutation((internal as any).onboarding.upsertConnectorStatus, {
        connector,
        status: verification.status,
        label: verification.label,
        errorSummary: verification.errorSummary,
        verificationMethod: verification.verificationMethod,
        lastSubmittedAt: submittedAt,
        lastVerifiedAt: verification.lastVerifiedAt ?? submittedAt,
        details: verification.details,
      });

      return {
        ok: true,
        connector,
        status: verification.status,
        label: verification.label,
        errorSummary: verification.errorSummary ?? null,
        verificationMethod: verification.verificationMethod ?? null,
        lastVerifiedAt: verification.lastVerifiedAt ?? submittedAt,
      };
    } catch (error) {
      const errorSummary = safeError(error);
      await ctx.runMutation((internal as any).onboarding.upsertConnectorStatus, {
        connector,
        status: "error",
        label: defaultLabel(connector, payload),
        errorSummary,
        verificationMethod: "submission",
        lastSubmittedAt: submittedAt,
        details: { payloadKeys: Object.keys(payload) },
      });

      return {
        ok: false,
        connector,
        status: "error" as const,
        errorSummary,
      };
    }
  },
});
