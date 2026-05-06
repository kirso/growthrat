"use client";

import { useContext } from "react";
import { useQuery } from "convex/react";
import { ConvexAvailableContext } from "@/app/ConvexClientProvider";

// ---- Dynamic API import ----
// The generated API module only exists after `npx convex dev`.
let convexApi: Record<string, any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  convexApi = require("@/convex/_generated/api").api;
} catch {
  convexApi = null;
}

export { convexApi };

/**
 * Whether the Convex backend is connected (provider is mounted).
 */
export function useConvexAvailable(): boolean {
  return useContext(ConvexAvailableContext);
}

/**
 * Safely call Convex `useQuery`.
 *
 * Returns `undefined` when:
 * - Convex generated API hasn't been created yet (`npx convex dev`)
 * - `NEXT_PUBLIC_CONVEX_URL` is not set (no ConvexProvider)
 * - The query reference is null/undefined
 *
 * Usage in pages:
 * ```ts
 * const liveData = useConvexQuery(convexApi?.artifacts?.list, {});
 * // Render explicit loading / empty states when liveData is undefined or empty.
 * ```
 *
 * NOTE: The `useConvexAvailable()` value is determined by an env var and
 * is constant for the lifetime of the app. The conditional hook call below
 * is safe because the branch never changes between renders.
 */
export function useConvexQuery<T = any>(
  queryRef: any | null | undefined,
  args?: Record<string, unknown>
): T | undefined {
  const available = useContext(ConvexAvailableContext);

  // When Convex provider is not mounted, return undefined immediately.
  // This branch is stable (env var never changes at runtime) so the
  // conditional hook call below is safe per React rules.
  if (!available) {
    return undefined;
  }

  // ConvexProvider IS mounted — safe to call useQuery.
  // If query ref is missing (generated API not available), use "skip".
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const result = useQuery(
    queryRef ?? ("__placeholder__" as any),
    queryRef ? (args ?? {}) : "skip"
  );

  if (!queryRef) return undefined;
  return result as T | undefined;
}
