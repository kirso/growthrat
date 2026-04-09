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
        .query("feedbackItems")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("feedbackItems")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    problem: v.string(),
    evidence: v.optional(v.string()),
    proposedFix: v.optional(v.string()),
    sourceLane: v.optional(v.string()),
    status: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    return await ctx.db.insert("feedbackItems", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("feedbackItems"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    await ctx.db.patch(args.id, { status: args.status });
  },
});
