import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { requireInternalServerToken } from "./authz";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  publicChatRequests: {
    kind: "token bucket",
    rate: 18,
    period: HOUR,
    capacity: 6,
  },
  panelRequests: {
    kind: "token bucket",
    rate: 10,
    period: HOUR,
    capacity: 4,
  },
  publicChatBurst: {
    kind: "fixed window",
    rate: 4,
    period: MINUTE,
  },
  panelBurst: {
    kind: "fixed window",
    rate: 2,
    period: MINUTE,
  },
});

export const consumePublicChat = mutation({
  args: { key: v.string(), serverToken: v.string() },
  handler: async (ctx, { key, serverToken }) => {
    requireInternalServerToken(serverToken);
    const hourly = await rateLimiter.limit(ctx, "publicChatRequests", { key });
    if (!hourly.ok) return hourly;
    return await rateLimiter.limit(ctx, "publicChatBurst", { key });
  },
});

export const consumePanel = mutation({
  args: { key: v.string(), serverToken: v.string() },
  handler: async (ctx, { key, serverToken }) => {
    requireInternalServerToken(serverToken);
    const hourly = await rateLimiter.limit(ctx, "panelRequests", { key });
    if (!hourly.ok) return hourly;
    return await rateLimiter.limit(ctx, "panelBurst", { key });
  },
});
