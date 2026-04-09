import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { requireRcAdmin } from "./authz";

export const list = query({
  args: {
    artifactType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    if (args.artifactType && args.status) {
      return await ctx.db
        .query("artifacts")
        .withIndex("by_type_status", (q) =>
          q.eq("artifactType", args.artifactType!).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    }

    const results = await ctx.db
      .query("artifacts")
      .order("desc")
      .take(100);

    return results.filter((a) => {
      if (args.artifactType && a.artifactType !== args.artifactType) return false;
      if (args.status && a.status !== args.status) return false;
      return true;
    });

    return results;
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    // Can't use filter after withIndex. Query all and filter in JS.
    const all = await ctx.db
      .query("artifacts")
      .order("desc")
      .take(100);
    return all.filter((a) => a.status === "published");
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("artifacts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const create = mutation({
  args: {
    artifactType: v.string(),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    contentFormat: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
    qualityScores: v.optional(v.any()),
    llmProvider: v.optional(v.string()),
    llmModel: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    return await ctx.db.insert("artifacts", args);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("artifacts"),
    status: v.string(),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const searchByContent = action({
  args: {
    query: v.string(),
    artifactType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    const results = await ctx.runQuery(
      // Use the internal search query helper
      "artifacts:_searchByContent" as any,
      { query: args.query, artifactType: args.artifactType }
    );
    return results;
  },
});

// Internal query used by the searchByContent action
export const _searchByContent = query({
  args: {
    query: v.string(),
    artifactType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("artifacts")
      .withSearchIndex("search_content", (q) => {
        let sq = q.search("content", args.query);
        if (args.artifactType) {
          sq = sq.eq("artifactType", args.artifactType);
        }
        return sq;
      });

    return await searchQuery.take(20);
  },
});
