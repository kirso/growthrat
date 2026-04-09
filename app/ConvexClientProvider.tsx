"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { createContext, useMemo } from "react";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Whether Convex is connected.
 * Pages use this via `useConvexAvailable()` from hooks/useConvexSafe
 * to decide whether to call `useQuery` or fall back to sample data.
 */
export const ConvexAvailableContext = createContext<boolean>(false);

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken?: string | null;
}) {
  // Convex is optional in dev — pages work without it, just no live data
  const client = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    []
  );

  if (!client) {
    return (
      <ConvexAvailableContext.Provider value={false}>
        {children}
      </ConvexAvailableContext.Provider>
    );
  }

  return (
    <ConvexAvailableContext.Provider value={true}>
      <ConvexBetterAuthProvider
        client={client}
        authClient={authClient}
        initialToken={initialToken}
      >
        {children}
      </ConvexBetterAuthProvider>
    </ConvexAvailableContext.Provider>
  );
}
