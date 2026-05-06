import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const findBySlackTs = internalQuery({
  args: { slackThreadTs: v.string() },
  handler: async (ctx, { slackThreadTs }) => {
    return await ctx.db
      .query("approvalLog")
      .withIndex("by_slack_thread", (q) => q.eq("slackThreadTs", slackThreadTs))
      .order("desc")
      .collect();
  },
});
