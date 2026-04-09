import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

if (!process.env.CONVEX_SITE_URL) {
  process.env.CONVEX_SITE_URL =
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
    process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".convex.cloud", ".convex.site");
}

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
