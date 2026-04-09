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
      _id: article._id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      status: article.status,
    };
  },
});

/** Get an artifact by its ID */
export const getArtifactById = internalQuery({
  args: { id: v.id("artifacts") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
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

export const getLatestReportWithContent = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("weeklyReports")
      .order("desc")
      .first();
  },
});

/** Get an experiment by its key */
export const getExperimentByKey = internalQuery({
  args: { experimentKey: v.string() },
  handler: async (ctx, { experimentKey }) => {
    return await ctx.db
      .query("experiments")
      .filter((q) => q.eq(q.field("experimentKey"), experimentKey))
      .first();
  },
});

/** Get completed experiments for the learning loop */
export const getCompletedExperiments = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("experiments")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(10);
  },
});

/** Get the latest experiment (for panel tool) */
export const getLatestExperiment = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Prefer running experiments, then most recent
    const running = await ctx.db
      .query("experiments")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .first();
    if (running) return running;
    return await ctx.db.query("experiments").order("desc").first();
  },
});

/** Get aggregated weekly metrics summary (for panel tool) */
export const getWeeklyMetricsSummary = internalQuery({
  args: {},
  handler: async (ctx) => {
    const artifacts = await ctx.db.query("artifacts").collect();
    const experiments = await ctx.db.query("experiments").collect();
    const feedback = await ctx.db.query("feedbackItems").collect();
    const interactions = await ctx.db.query("communityInteractions").collect();
    const latestReport = await ctx.db.query("weeklyReports").order("desc").first();

    return {
      week: latestReport?.weekNumber ?? 0,
      contentPublished: artifacts.filter((a) => a.status === "published").length,
      contentTarget: 2,
      experimentsRunning: experiments.filter((e) => e.status === "running").length,
      experimentsTarget: 1,
      feedbackFiled: feedback.length,
      feedbackTarget: 3,
      communityInteractions: interactions.length,
      communityTarget: 50,
      source: "convex" as const,
    };
  },
});
