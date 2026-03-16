"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createContext, useMemo } from "react";
import type { ReactNode } from "react";

/**
 * Whether Convex is connected.
 * Pages use this via `useConvexAvailable()` from hooks/useConvexSafe
 * to decide whether to call `useQuery` or fall back to sample data.
 */
export const ConvexAvailableContext = createContext<boolean>(false);

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
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
      <ConvexProvider client={client}>{children}</ConvexProvider>
    </ConvexAvailableContext.Provider>
  );
}
