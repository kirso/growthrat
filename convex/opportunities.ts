import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByLane = query({
  args: {
    lane: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    if (args.lane) {
      // Use the composite index, then sort by score descending in memory
      const results = await ctx.db
        .query("opportunitySnapshots")
        .withIndex("by_lane_score", (q) => q.eq("lane", args.lane!))
        .order("desc")
        .take(limit);
      return results;
    }

    // No lane filter — collect all and sort by score descending
    const all = await ctx.db
      .query("opportunitySnapshots")
      .order("desc")
      .collect();

    // Sort by score descending and take limit
    return all
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
});

export const getTopOverall = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const all = await ctx.db
      .query("opportunitySnapshots")
      .collect();

    return all
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    lane: v.string(),
    audience: v.optional(v.string()),
    score: v.number(),
    components: v.optional(v.any()),
    rationale: v.optional(v.string()),
    readinessScore: v.optional(v.number()),
    readinessPasses: v.boolean(),
    workflowRunId: v.optional(v.id("workflowRuns")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("opportunitySnapshots", args);
  },
});
