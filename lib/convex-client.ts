/**
 * HTTP client for calling Convex from Inngest functions.
 *
 * Inngest functions run as Next.js serverless functions — they cannot call
 * Convex mutations directly. Instead they POST/GET to the Convex HTTP router
 * defined in convex/http.ts, which forwards to the relevant mutations/queries.
 *
 * All requests include a Bearer token (GROWTHCAT_INTERNAL_SECRET) for auth.
 * The same secret must be set as an environment variable in both Convex and
 * the Next.js deployment.
 *
 * When NEXT_PUBLIC_CONVEX_URL is unset the helpers degrade to dry-run mode.
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const CONVEX_HTTP_URL = CONVEX_URL.replace(".convex.cloud", ".convex.site");
const INTERNAL_SECRET = process.env.GROWTHCAT_INTERNAL_SECRET ?? "";

function isDryRun(): boolean {
  return !CONVEX_HTTP_URL || CONVEX_HTTP_URL.includes("placeholder");
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(INTERNAL_SECRET ? { Authorization: `Bearer ${INTERNAL_SECRET}` } : {}),
  };
}

/**
 * POST data to a Convex HTTP action endpoint.
 * Returns the parsed JSON response (typically `{ id: string }`).
 */
export async function convexStore(
  path: string,
  data: Record<string, unknown>,
): Promise<{ id: string | null; error?: number }> {
  if (isDryRun()) {
    console.log(
      `[convex-dry-run] Would store to ${path}:`,
      JSON.stringify(data).slice(0, 200),
    );
    return { id: "dry-run" };
  }

  const url = `${CONVEX_HTTP_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Convex store error (${res.status}) for ${path}: ${text}`);
    return { id: null, error: res.status };
  }

  return res.json() as Promise<{ id: string }>;
}

/**
 * GET data from a Convex HTTP action endpoint.
 * Returns the parsed JSON response, or an empty object on failure / dry-run.
 */
export async function convexFetch(
  path: string,
): Promise<Record<string, unknown>> {
  if (isDryRun()) {
    console.log(`[convex-dry-run] Would fetch ${path}`);
    return {};
  }

  const url = `${CONVEX_HTTP_URL}${path}`;
  const res = await fetch(url, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    console.error(`Convex fetch error (${res.status}) for ${path}`);
    return {};
  }

  return res.json() as Promise<Record<string, unknown>>;
}
