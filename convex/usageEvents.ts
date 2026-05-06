import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeBudgetPolicy } from "./agentConfig";
import { requireInternalServerToken, requireRcAdmin } from "./authz";

const usageEventArgs = {
  feature: v.string(),
  workflowType: v.optional(v.string()),
  provider: v.string(),
  model: v.string(),
  inputTokens: v.number(),
  outputTokens: v.number(),
  estimatedUsd: v.number(),
  latencyMs: v.optional(v.number()),
  success: v.boolean(),
  errorCode: v.optional(v.string()),
  metadata: v.optional(v.any()),
};

async function insertUsageEvent(ctx: any, args: any) {
  return await ctx.db.insert("usageEvents", args);
}

export const record = mutation({
  args: {
    ...usageEventArgs,
    serverToken: v.string(),
  },
  handler: async (ctx, args) => {
    requireInternalServerToken(args.serverToken);
    return await insertUsageEvent(ctx, {
      feature: args.feature,
      workflowType: args.workflowType,
      provider: args.provider,
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedUsd: args.estimatedUsd,
      latencyMs: args.latencyMs,
      success: args.success,
      errorCode: args.errorCode,
      metadata: args.metadata,
    });
  },
});

export const recordInternal = internalMutation({
  args: usageEventArgs,
  handler: async (ctx, args) => {
    return await insertUsageEvent(ctx, args);
  },
});

export const getBudgetStatus = query({
  args: { feature: v.optional(v.string()), serverToken: v.string() },
  handler: async (ctx, { feature, serverToken }) => {
    requireInternalServerToken(serverToken);
    const config = await ctx.db.query("agentConfig").first();
    const budgetPolicy = normalizeBudgetPolicy(config?.budgetPolicy);
    const allUsage = await ctx.db.query("usageEvents").collect();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const dailyUsage = allUsage.filter((event) => event._creationTime >= oneDayAgo);
    const recentFeatureRequests = feature
      ? dailyUsage.filter((event) => event.feature === feature && event._creationTime >= oneHourAgo)
      : [];

    const inputTokens = dailyUsage.reduce((sum, event) => sum + event.inputTokens, 0);
    const outputTokens = dailyUsage.reduce((sum, event) => sum + event.outputTokens, 0);
    const estimatedUsd = dailyUsage.reduce((sum, event) => sum + event.estimatedUsd, 0);
    const hourlyRequestLimit = feature === "public_panel"
      ? budgetPolicy.maxPanelRequestsPerHour
      : feature === "public_chat"
        ? budgetPolicy.maxChatRequestsPerHour
        : null;

    const withinDailyBudget =
      estimatedUsd < budgetPolicy.maxDailyEstimatedUsd &&
      inputTokens < budgetPolicy.maxDailyInputTokens &&
      outputTokens < budgetPolicy.maxDailyOutputTokens;
    const withinHourlyRequestLimit =
      hourlyRequestLimit == null || recentFeatureRequests.length < hourlyRequestLimit;

    return {
      ok: withinDailyBudget && withinHourlyRequestLimit,
      estimatedUsd24h: Math.round(estimatedUsd * 1000) / 1000,
      inputTokens24h: inputTokens,
      outputTokens24h: outputTokens,
      requestsLastHour: recentFeatureRequests.length,
      budgetPolicy,
      reason: !withinDailyBudget
        ? "Daily model budget exceeded"
        : !withinHourlyRequestLimit
          ? "Hourly request budget exceeded"
          : null,
    };
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    const allUsage = await ctx.db.query("usageEvents").collect();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = allUsage.filter((event) => event._creationTime >= dayAgo);
    const estimatedUsd24h = recent.reduce((sum, event) => sum + event.estimatedUsd, 0);
    const inputTokens24h = recent.reduce((sum, event) => sum + event.inputTokens, 0);
    const outputTokens24h = recent.reduce((sum, event) => sum + event.outputTokens, 0);

    return {
      events24h: recent.length,
      estimatedUsd24h: Math.round(estimatedUsd24h * 1000) / 1000,
      inputTokens24h,
      outputTokens24h,
      byFeature: Object.entries(
        recent.reduce<Record<string, number>>((acc, event) => {
          acc[event.feature] = (acc[event.feature] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([feature, count]) => ({ feature, count })),
    };
  },
});
