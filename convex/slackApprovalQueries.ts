import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const findBySlackTs = internalQuery({
  args: { slackThreadTs: v.string() },
  handler: async (ctx, { slackThreadTs }) => {
    const results = await ctx.db
      .query("approvalLog")
      .withIndex("by_artifact")
      .order("desc")
      .take(100);

    return results.filter((r) => r.slackThreadTs === slackThreadTs);
  },
});
