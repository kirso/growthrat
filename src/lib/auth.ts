export type RcSession = {
  accountId: "revenuecat";
  email: string;
  fullName?: string;
  role: string;
  sessionId: string;
  expiresAt: string;
};

type SignedSessionPayload = {
  v: 1;
  sid: string;
  accountId: "revenuecat";
  email: string;
  fullName?: string;
  role: string;
  exp: number;
};

export const rcSessionCookieName = "growthrat_rc_session";

const accountId = "revenuecat";
const sessionTtlSeconds = 60 * 60 * 12;

function envString(env: Env, key: string) {
  const value = (env as unknown as Partial<Record<string, string>>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeJson(payload: SignedSessionPayload) {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

function decodeJson(value: string) {
  return JSON.parse(
    new TextDecoder().decode(decodeBase64Url(value)),
  ) as SignedSessionPayload;
}

async function hmacKey(env: Env) {
  const secret = envString(env, "GROWTHRAT_INTERNAL_SECRET");
  if (!secret) throw new Error("GROWTHRAT_INTERNAL_SECRET is required");

  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signPayload(env: Env, payloadBase64: string) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(env),
    new TextEncoder().encode(payloadBase64),
  );
  return encodeBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(actual: string, expected: string) {
  if (actual.length !== expected.length) return false;

  let mismatch = 0;
  for (let index = 0; index < actual.length; index += 1) {
    mismatch |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function timingSafeEqual(actual: string, expected: string) {
  const encoder = new TextEncoder();
  const actualBytes = encoder.encode(actual);
  const expectedBytes = encoder.encode(expected);

  if (actualBytes.byteLength !== expectedBytes.byteLength) return false;

  const actualDigest = await crypto.subtle.digest("SHA-256", actualBytes);
  const expectedDigest = await crypto.subtle.digest("SHA-256", expectedBytes);
  const actualHash = new Uint8Array(actualDigest);
  const expectedHash = new Uint8Array(expectedDigest);

  let mismatch = 0;
  for (const [index, value] of actualHash.entries()) {
    mismatch |= value ^ expectedHash[index];
  }

  return mismatch === 0;
}

function cookieHeader(request: Request) {
  return request.headers.get("cookie") ?? "";
}

function parseCookie(request: Request, name: string) {
  const cookies = cookieHeader(request)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");
    if (separator === -1) continue;
    const key = cookie.slice(0, separator);
    if (key !== name) continue;
    return decodeURIComponent(cookie.slice(separator + 1));
  }

  return "";
}

function isSecureRequest(request: Request) {
  const url = new URL(request.url);
  return (
    url.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

export function clearRcSessionCookie() {
  return `${rcSessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function buildSessionCookie(request: Request, token: string) {
  return [
    `${rcSessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${sessionTtlSeconds}`,
    isSecureRequest(request) ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function allowedRevenueCatDomains(env: Env) {
  try {
    const row = await env.DB.prepare(
      "select allowed_domains_json from rc_accounts where id = ? limit 1",
    )
      .bind(accountId)
      .first<{ allowed_domains_json: string }>();
    const parsed = JSON.parse(row?.allowed_domains_json ?? "[]") as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed.map((item) => item.toLowerCase());
    }
  } catch {
    return ["revenuecat.com"];
  }

  return ["revenuecat.com"];
}

export async function isAllowedRevenueCatEmail(env: Env, email: string) {
  const normalized = normalizeEmail(email);
  const domain = normalized.split("@")[1] ?? "";
  if (!normalized.includes("@") || !domain) return false;
  const allowed = await allowedRevenueCatDomains(env);
  return allowed.includes(domain);
}

async function upsertRepresentative(
  env: Env,
  email: string,
  fullName: string,
) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `insert into rc_account_users (
      id, account_id, email, full_name, role, status, last_seen_at,
      created_at, updated_at
    ) values (?, ?, ?, ?, 'representative', 'active', ?, ?, ?)
    on conflict(email) do update set
      full_name = excluded.full_name,
      status = 'active',
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at`,
  )
    .bind(email, accountId, email, fullName || null, now, now, now)
    .run();
}

async function touchRepresentative(env: Env, email: string) {
  await env.DB.prepare(
    "update rc_account_users set last_seen_at = ?, updated_at = ? where email = ?",
  )
    .bind(new Date().toISOString(), new Date().toISOString(), email)
    .run();
}

export async function registerRcRepresentative(
  env: Env,
  input: {
    email: string;
    fullName?: string;
    activationCode?: string;
  },
) {
  const expected = envString(env, "GROWTHRAT_INTERNAL_SECRET");
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: "activation code is not configured",
    } as const;
  }

  const email = normalizeEmail(input.email);
  if (!(await isAllowedRevenueCatEmail(env, email))) {
    return {
      ok: false,
      status: 403,
      error: "RevenueCat email is required",
    } as const;
  }

  if (!(await timingSafeEqual(input.activationCode ?? "", expected))) {
    return { ok: false, status: 401, error: "invalid activation code" } as const;
  }

  await upsertRepresentative(env, email, input.fullName?.trim() ?? "");

  return {
    ok: true,
    session: createRcSession({
      email,
      fullName: input.fullName?.trim(),
      role: "representative",
    }),
  } as const;
}

export function createRcSession(
  input: { email: string; fullName?: string; role: string },
): RcSession {
  const exp = Math.floor(Date.now() / 1000) + sessionTtlSeconds;

  return {
    accountId,
    email: normalizeEmail(input.email),
    fullName: input.fullName,
    role: input.role,
    sessionId: crypto.randomUUID(),
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

export async function createRcSessionCookie(
  env: Env,
  request: Request,
  session: RcSession,
) {
  const payload: SignedSessionPayload = {
    v: 1,
    sid: session.sessionId,
    accountId,
    email: session.email,
    fullName: session.fullName,
    role: session.role,
    exp: Math.floor(new Date(session.expiresAt).getTime() / 1000),
  };
  const payloadBase64 = encodeJson(payload);
  const signature = await signPayload(env, payloadBase64);
  return buildSessionCookie(request, `${payloadBase64}.${signature}`);
}

export async function getRcSessionFromRequest(
  request: Request,
  env: Env,
): Promise<RcSession | null> {
  const token = parseCookie(request, rcSessionCookieName);
  if (!token) return null;

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  try {
    const expectedSignature = await signPayload(env, payloadBase64);
    if (!constantTimeEqual(signature, expectedSignature)) return null;

    const payload = decodeJson(payloadBase64);
    if (payload.v !== 1 || payload.accountId !== accountId) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!(await isAllowedRevenueCatEmail(env, payload.email))) return null;

    await touchRepresentative(env, payload.email).catch(() => undefined);

    return {
      accountId,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      sessionId: payload.sid,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}
