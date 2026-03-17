import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agentConfig").first();
  },
});

export const save = mutation({
  args: {
    reviewMode: v.string(),
    focusTopics: v.array(v.string()),
    slackChannel: v.string(),
    githubOrg: v.optional(v.string()),
    enabledPlatforms: v.array(v.string()),
    paused: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("agentConfig").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("agentConfig", args);
  },
});

export const updateField = mutation({
  args: {
    field: v.string(),
    value: v.any(),
  },
  handler: async (ctx, { field, value }) => {
    const existing = await ctx.db.query("agentConfig").first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, { [field]: value });
    return existing._id;
  },
});
