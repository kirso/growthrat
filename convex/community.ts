import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRcAdmin } from "./authz";

export const list = query({
  args: {
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    if (args.channel) {
      return await ctx.db
        .query("communityInteractions")
        .withIndex("by_channel", (q) => q.eq("channel", args.channel!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("communityInteractions")
      .order("desc")
      .collect();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    const all = await ctx.db
      .query("communityInteractions")
      .collect();

    const total = all.length;
    const meaningful = all.filter((i) => i.meaningful).length;

    const byChannel: Record<string, number> = {};
    for (const interaction of all) {
      byChannel[interaction.channel] =
        (byChannel[interaction.channel] ?? 0) + 1;
    }

    return { total, meaningful, byChannel };
  },
});

export const record = mutation({
  args: {
    channel: v.string(),
    interactionType: v.string(),
    content: v.string(),
    targetUrl: v.optional(v.string()),
    qualityScore: v.optional(v.number()),
    meaningful: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    return await ctx.db.insert("communityInteractions", args);
  },
});
