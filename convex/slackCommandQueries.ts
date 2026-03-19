import { internalQuery } from "./_generated/server";

export const getAgentConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agentConfig").first();
  },
});
