import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getByArtifact = query({
  args: { artifactId: v.id("artifacts") },
  handler: async (ctx, { artifactId }) => {
    return await ctx.db
      .query("approvalLog")
      .withIndex("by_artifact", (q) => q.eq("artifactId", artifactId))
      .order("desc")
      .collect();
  },
});

export const log = internalMutation({
  args: {
    artifactId: v.id("artifacts"),
    action: v.string(),
    by: v.string(),
    reason: v.optional(v.string()),
    slackThreadTs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("approvalLog", args);
  },
});
