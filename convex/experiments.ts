import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRcAdmin } from "./authz";

export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    if (args.status) {
      return await ctx.db
        .query("experiments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("experiments")
      .order("desc")
      .collect();
  },
});

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    // Prefer running experiments, then most recent
    const running = await ctx.db
      .query("experiments")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .first();
    if (running) return running;
    return await ctx.db.query("experiments").order("desc").first();
  },
});

export const create = mutation({
  args: {
    experimentKey: v.string(),
    title: v.string(),
    hypothesis: v.string(),
    baselineMetric: v.string(),
    targetMetric: v.string(),
    status: v.string(),
    results: v.optional(v.any()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    return await ctx.db.insert("experiments", args);
  },
});

export const updateResults = mutation({
  args: {
    id: v.id("experiments"),
    status: v.string(),
    results: v.optional(v.any()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});
