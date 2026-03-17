/**
 * Internal queries used by Convex Agent tools.
 * Tools receive ActionCtx (no ctx.db), so they must call these via ctx.runQuery.
 */

import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/** Get multiple source documents by their IDs */
export const getSourcesByIds = internalQuery({
  args: { ids: v.array(v.id("sources")) },
  handler: async (ctx, { ids }) => {
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return docs.filter(Boolean).map((d) => ({
      key: d!.key,
      provider: d!.provider,
      summary: d!.summary ?? "",
    }));
  },
});

/** Get an artifact by slug */
export const getArtifactBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const article = await ctx.db
      .query("artifacts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!article) return null;
    return {
      title: article.title,
      content: article.content.slice(0, 2000),
      status: article.status,
    };
  },
});

/** Get the latest weekly report */
export const getLatestReport = internalQuery({
  args: {},
  handler: async (ctx) => {
    const report = await ctx.db
      .query("weeklyReports")
      .order("desc")
      .first();

    if (!report) return null;
    return {
      weekNumber: report.weekNumber,
      contentCount: report.contentCount,
      experimentCount: report.experimentCount,
      feedbackCount: report.feedbackCount,
      interactionCount: report.interactionCount,
    };
  },
});
