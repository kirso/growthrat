import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const pauseAgent = internalMutation({
  args: { paused: v.boolean() },
  handler: async (ctx, { paused }) => {
    const config = await ctx.db.query("agentConfig").first();
    if (config) {
      await ctx.db.patch(config._id, { paused });
    }
  },
});
