import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRcAdmin } from "./authz";

export type AgentMode = "dormant" | "interview_proof" | "rc_live";
export type BudgetPolicy = {
  maxDailyEstimatedUsd: number;
  maxDailyInputTokens: number;
  maxDailyOutputTokens: number;
  maxChatRequestsPerHour: number;
  maxPanelRequestsPerHour: number;
  allowCommunityPosting: boolean;
  allowAutoPublish: boolean;
};

export const DEFAULT_BUDGET_POLICY: BudgetPolicy = {
  maxDailyEstimatedUsd: 15,
  maxDailyInputTokens: 2_000_000,
  maxDailyOutputTokens: 400_000,
  maxChatRequestsPerHour: 24,
  maxPanelRequestsPerHour: 12,
  allowCommunityPosting: false,
  allowAutoPublish: false,
};

type AgentConfigRecord = {
  mode: AgentMode;
  reviewMode: string;
  focusTopics: string[];
  slackChannel: string;
  githubOrg?: string;
  enabledPlatforms: string[];
  activeUntil?: number;
  budgetPolicy?: BudgetPolicy | null;
  paused: boolean;
};

function asFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeBudgetPolicy(input: unknown): BudgetPolicy {
  const record = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return {
    maxDailyEstimatedUsd: asFiniteNumber(record.maxDailyEstimatedUsd, DEFAULT_BUDGET_POLICY.maxDailyEstimatedUsd),
    maxDailyInputTokens: asFiniteNumber(record.maxDailyInputTokens, DEFAULT_BUDGET_POLICY.maxDailyInputTokens),
    maxDailyOutputTokens: asFiniteNumber(record.maxDailyOutputTokens, DEFAULT_BUDGET_POLICY.maxDailyOutputTokens),
    maxChatRequestsPerHour: asFiniteNumber(record.maxChatRequestsPerHour, DEFAULT_BUDGET_POLICY.maxChatRequestsPerHour),
    maxPanelRequestsPerHour: asFiniteNumber(record.maxPanelRequestsPerHour, DEFAULT_BUDGET_POLICY.maxPanelRequestsPerHour),
    allowCommunityPosting: asBoolean(record.allowCommunityPosting, DEFAULT_BUDGET_POLICY.allowCommunityPosting),
    allowAutoPublish: asBoolean(record.allowAutoPublish, DEFAULT_BUDGET_POLICY.allowAutoPublish),
  };
}

export function isActiveMode(mode?: string | null): mode is Exclude<AgentMode, "dormant"> {
  return mode === "interview_proof" || mode === "rc_live";
}

export function hasExpired(activeUntil?: number | null, now = Date.now()) {
  return typeof activeUntil === "number" && activeUntil <= now;
}

export function isRuntimeActive(config: AgentConfigRecord | null | undefined, now = Date.now()) {
  const mode = config?.mode ?? "dormant";
  const paused = config?.paused ?? true;
  if (!isActiveMode(mode) || paused) return false;
  if (mode === "interview_proof" && hasExpired(config?.activeUntil, now)) return false;
  return true;
}

export function normalizeAgentConfig(config: AgentConfigRecord | null | undefined) {
  const activeUntil = config?.activeUntil ?? null;
  const expired = hasExpired(activeUntil);
  return {
    mode: config?.mode ?? "dormant",
    reviewMode: config?.reviewMode ?? "draft_only",
    focusTopics: config?.focusTopics ?? [],
    slackChannel: config?.slackChannel ?? "growthrat",
    githubOrg: config?.githubOrg ?? undefined,
    enabledPlatforms: config?.enabledPlatforms ?? [],
    activeUntil,
    budgetPolicy: normalizeBudgetPolicy(config?.budgetPolicy),
    paused: config?.paused ?? true,
    expired,
    isActive: isRuntimeActive(config),
  };
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    const config = await ctx.db.query("agentConfig").first();
    return config ? normalizeAgentConfig(config as AgentConfigRecord) : null;
  },
});

export const getRuntimeState = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("agentConfig").first();
    const normalized = normalizeAgentConfig(config as AgentConfigRecord | null);
    return {
      mode: normalized.mode,
      paused: normalized.paused,
      activeUntil: normalized.activeUntil,
      expired: normalized.expired,
      isActive: normalized.isActive,
    };
  },
});

export const save = mutation({
  args: {
    mode: v.optional(v.string()),
    reviewMode: v.string(),
    focusTopics: v.array(v.string()),
    slackChannel: v.string(),
    githubOrg: v.optional(v.string()),
    enabledPlatforms: v.array(v.string()),
    activeUntil: v.optional(v.number()),
    budgetPolicy: v.optional(v.any()),
    paused: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    const existing = await ctx.db.query("agentConfig").first();
    const budgetPolicy = normalizeBudgetPolicy(args.budgetPolicy ?? existing?.budgetPolicy);
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        budgetPolicy,
        mode: args.mode ?? existing.mode ?? "dormant",
      });
      return existing._id;
    }
    return await ctx.db.insert("agentConfig", {
      ...args,
      budgetPolicy,
      mode: args.mode ?? "dormant",
    });
  },
});

export const getSystemHealth = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    const config = await ctx.db.query("agentConfig").first();
    const connectors = await ctx.db.query("connectorConnections").collect();
    const sources = await ctx.db.query("sources").collect();
    const artifacts = await ctx.db.query("artifacts").collect();
    const experiments = await ctx.db.query("experiments").collect();
    const feedback = await ctx.db.query("feedbackItems").collect();
    const interactions = await ctx.db.query("communityInteractions").collect();
    const reports = await ctx.db.query("weeklyReports").collect();
    const runs = await ctx.db.query("workflowRuns").order("desc").take(10);
    const usageEvents = await ctx.db.query("usageEvents").collect();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentUsage = usageEvents.filter((event) => event._creationTime >= dayAgo);
    const totalEstimatedUsd = recentUsage.reduce((sum, event) => sum + event.estimatedUsd, 0);
    const totalInputTokens = recentUsage.reduce((sum, event) => sum + event.inputTokens, 0);
    const totalOutputTokens = recentUsage.reduce((sum, event) => sum + event.outputTokens, 0);

    return {
      config: config ? {
        ...normalizeAgentConfig(config as AgentConfigRecord),
      } : null,
      connectors: connectors.map((connector) => ({
        connector: connector.connector,
        status: connector.status,
        label: connector.label ?? connector.connector,
        errorSummary: connector.errorSummary ?? null,
        verificationMethod: connector.verificationMethod ?? null,
        lastSubmittedAt: connector.lastSubmittedAt ?? null,
        lastVerifiedAt: connector.lastVerifiedAt ?? null,
      })),
      knowledge: { sourceChunks: sources.length, providers: [...new Set(sources.map((s) => s.provider))] },
      content: {
        total: artifacts.length,
        published: artifacts.filter((a) => a.status === "published").length,
        pipelinePublished: artifacts.filter((a) => a.status === "published" && a.metadata?.origin === "pipeline").length,
        seedPublished: artifacts.filter((a) => a.status === "published" && a.metadata?.origin === "seed").length,
        draft: artifacts.filter((a) => a.status === "draft").length,
        pending: artifacts.filter((a) => a.status === "pending_approval").length,
      },
      experiments: {
        total: experiments.length,
        running: experiments.filter((e) => e.status === "running").length,
        completed: experiments.filter((e) => e.status === "completed").length,
      },
      feedback: { total: feedback.length, filed: feedback.filter((f) => f.status === "filed").length },
      community: { total: interactions.length, meaningful: interactions.filter((i) => i.meaningful).length },
      reports: { total: reports.length },
      usage: {
        totalEvents: recentUsage.length,
        estimatedUsd24h: Math.round(totalEstimatedUsd * 1000) / 1000,
        inputTokens24h: totalInputTokens,
        outputTokens24h: totalOutputTokens,
      },
      recentRuns: runs.map((r) => ({
        type: r.workflowType,
        status: r.status,
        time: r._creationTime,
      })),
    };
  },
});

export const updateField = mutation({
  args: {
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, { field, value }) => {
    await requireRcAdmin(ctx);
    const existing = await ctx.db.query("agentConfig").first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, { [field]: value });
    return existing._id;
  },
});
