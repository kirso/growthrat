import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { query } from "./_generated/server";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

export function getSiteUrl() {
  const siteUrl =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://growthcat-psi.vercel.app";
  if (!siteUrl) {
    throw new Error("SITE_URL must be configured for Better Auth");
  }
  return siteUrl;
}

function getAuthSecret() {
  const secret =
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.GROWTHCAT_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET must be configured. No fallback secret is allowed in production.");
  }
  return secret;
}

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: getSiteUrl(),
    trustedOrigins: [getSiteUrl()],
    secret: getAuthSecret(),
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({
        authConfig,
      }),
    ],
  });

export const { getAuthUser } = authComponent.clientApi();

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx);
  },
});
