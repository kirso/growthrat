import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRcAdmin } from "./authz";

export const list = query({
  args: {
    workflowType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    const limit = args.limit ?? 50;

    if (args.workflowType) {
      return await ctx.db
        .query("workflowRuns")
        .withIndex("by_type_status", (q) =>
          q.eq("workflowType", args.workflowType!)
        )
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("workflowRuns")
      .order("desc")
      .take(limit);
  },
});

export const create = mutation({
  args: {
    workflowType: v.string(),
    status: v.string(),
    inputParams: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    return await ctx.db.insert("workflowRuns", {
      workflowType: args.workflowType,
      status: args.status,
      inputParams: args.inputParams,
    });
  },
});

export const complete = mutation({
  args: {
    id: v.id("workflowRuns"),
    status: v.string(),
    outputSummary: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, {
      ...patch,
      completedAt: Date.now(),
    });
  },
});

// Internal mutation triggered by the weekly planning cron job
export const triggerWeeklyPlan = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[cron] triggerWeeklyPlan: starting weekly planning workflow");

    const runId = await ctx.db.insert("workflowRuns", {
      workflowType: "weekly-planning",
      status: "pending",
      inputParams: { triggeredBy: "cron", triggeredAt: Date.now() },
    });

    console.log(`[cron] triggerWeeklyPlan: created workflow run ${runId}`);
    // TODO: kick off actual planning workflow (Temporal or internal action chain)
  },
});
