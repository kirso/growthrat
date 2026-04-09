import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

function deriveConvexSiteUrl() {
  if (process.env.NEXT_PUBLIC_CONVEX_SITE_URL) {
    return process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  }
  const cloudUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (cloudUrl?.endsWith(".convex.cloud")) {
    return cloudUrl.replace(".convex.cloud", ".convex.site");
  }
  return process.env.CONVEX_SITE_URL;
}

type AuthHelpers = ReturnType<typeof convexBetterAuthNextJs>;

let cachedHelpers: AuthHelpers | null = null;

function getAuthHelpers(): AuthHelpers {
  if (cachedHelpers) return cachedHelpers;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convexSiteUrl = deriveConvexSiteUrl();

  if (!convexUrl || !convexSiteUrl) {
    throw new Error(
      "Convex auth environment is not configured. Set NEXT_PUBLIC_CONVEX_URL and CONVEX_SITE_URL or NEXT_PUBLIC_CONVEX_SITE_URL."
    );
  }

  // The Better Auth + Convex integration also reads CONVEX_SITE_URL internally.
  if (!process.env.CONVEX_SITE_URL) {
    process.env.CONVEX_SITE_URL = convexSiteUrl;
  }

  cachedHelpers = convexBetterAuthNextJs({
    convexUrl,
    convexSiteUrl,
    jwtCache: {
      enabled: true,
      isAuthError: (error) => /auth/i.test(String(error)),
    },
  });

  return cachedHelpers;
}

export const handler = {
  GET: async (request: Request) => getAuthHelpers().handler.GET(request),
  POST: async (request: Request) => getAuthHelpers().handler.POST(request),
};

export async function preloadAuthQuery(query: any, ...args: any[]) {
  return (getAuthHelpers().preloadAuthQuery as any)(query, ...args);
}

export async function isAuthenticated() {
  return getAuthHelpers().isAuthenticated();
}

export async function getToken() {
  return getAuthHelpers().getToken();
}

export async function fetchAuthQuery(query: any, ...args: any[]) {
  return (getAuthHelpers().fetchAuthQuery as any)(query, ...args);
}

export async function fetchAuthMutation(mutation: any, ...args: any[]) {
  return (getAuthHelpers().fetchAuthMutation as any)(mutation, ...args);
}

export async function fetchAuthAction(action: any, ...args: any[]) {
  return (getAuthHelpers().fetchAuthAction as any)(action, ...args);
}
