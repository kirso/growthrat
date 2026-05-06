import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireRcAdmin } from "./authz";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    return await ctx.db.query("sources").take(100);
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    const all = await ctx.db.query("sources").collect();
    return { total: all.length, providers: [...new Set(all.map((s) => s.provider))] };
  },
});

export const getFreshnessSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    const all = await ctx.db.query("sources").collect();
    const now = Date.now();
    const staleThresholdMs = 7 * 24 * 60 * 60 * 1000;

    const stale = all.filter((source) => now - source.lastRefreshed > staleThresholdMs);
    const byProvider: Record<string, { total: number; stale: number }> = {};
    for (const source of all) {
      const bucket = byProvider[source.provider] ?? { total: 0, stale: 0 };
      bucket.total += 1;
      if (now - source.lastRefreshed > staleThresholdMs) bucket.stale += 1;
      byProvider[source.provider] = bucket;
    }

    const oldest = all
      .slice()
      .sort((a, b) => a.lastRefreshed - b.lastRefreshed)[0];

    return {
      total: all.length,
      staleCount: stale.length,
      staleThresholdMs,
      oldestSource: oldest
        ? {
            key: oldest.key,
            provider: oldest.provider,
            lastRefreshed: oldest.lastRefreshed,
          }
        : null,
      byProvider,
    };
  },
});

export const getById = query({
  args: { id: v.id("sources") },
  handler: async (ctx, { id }) => {
    await requireRcAdmin(ctx);
    return await ctx.db.get(id);
  },
});

export const upsert = mutation({
  args: {
    key: v.string(),
    url: v.optional(v.string()),
    provider: v.string(),
    sourceClass: v.string(),
    evidenceTier: v.string(),
    lastRefreshed: v.number(),
    contentHash: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    // Look for an existing source with the same key
    const existing = await ctx.db
      .query("sources")
      .filter((q) => q.eq(q.field("key"), args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("sources", args);
  },
});

// VS-A1: Upsert a source chunk WITH embedding (for knowledge ingestion)
export const upsertWithEmbedding = internalMutation({
  args: {
    key: v.string(),
    url: v.optional(v.string()),
    provider: v.string(),
    sourceClass: v.string(),
    evidenceTier: v.string(),
    lastRefreshed: v.number(),
    contentHash: v.string(),
    summary: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    chunkIndex: v.optional(v.number()),
    parentKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sources")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      // Skip if content hasn't changed
      if (existing.contentHash === args.contentHash) {
        return existing._id;
      }
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("sources", args);
  },
});

// Internal mutation triggered by the daily source freshness cron job
export const auditFreshness = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[cron] auditFreshness: checking source freshness");

    const sources = await ctx.db.query("sources").collect();
    const now = Date.now();
    const staleThresholdMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    let staleCount = 0;
    for (const source of sources) {
      const age = now - source.lastRefreshed;
      if (age > staleThresholdMs) {
        staleCount++;
        console.log(
          `[cron] auditFreshness: STALE source "${source.key}" (provider=${source.provider}, last refreshed ${Math.floor(age / (24 * 60 * 60 * 1000))} days ago)`
        );
      }
    }

    console.log(
      `[cron] auditFreshness: ${staleCount} stale out of ${sources.length} total sources`
    );

    if (staleCount > 0) {
      console.log(
        `[cron] auditFreshness: ALERT ${staleCount} stale sources detected; trigger knowledge ingest to refresh the docs corpus`
      );
    }
  },
});
