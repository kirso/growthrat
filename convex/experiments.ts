import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});
