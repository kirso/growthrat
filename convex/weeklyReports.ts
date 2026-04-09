import { query, mutation, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { requireRcAdmin } from "./authz";
import { api, internal } from "./_generated/api";

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    return await ctx.db
      .query("weeklyReports")
      .withIndex("by_week")
      .order("desc")
      .first();
  },
});

export const getByWeek = query({
  args: { weekNumber: v.number() },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    return await ctx.db
      .query("weeklyReports")
      .withIndex("by_week", (q) => q.eq("weekNumber", args.weekNumber))
      .first();
  },
});

export const getMetricsSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireRcAdmin(ctx);
    const artifacts = await ctx.db.query("artifacts").collect();
    const experiments = await ctx.db.query("experiments").collect();
    const feedback = await ctx.db.query("feedbackItems").collect();
    const interactions = await ctx.db.query("communityInteractions").collect();
    const latestReport = await ctx.db.query("weeklyReports").withIndex("by_week").order("desc").first();

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
    };
  },
});

export const save = mutation({
  args: {
    weekNumber: v.number(),
    contentCount: v.number(),
    experimentCount: v.number(),
    feedbackCount: v.number(),
    interactionCount: v.number(),
    reportContent: v.string(),
    slackTs: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRcAdmin(ctx);
    // Check if a report for this week already exists
    const existing = await ctx.db
      .query("weeklyReports")
      .withIndex("by_week", (q) => q.eq("weekNumber", args.weekNumber))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("weeklyReports", args);
  },
});

export const sendLatestToSlack = action({
  args: {},
  handler: async (ctx): Promise<{ posted: boolean; slackTs: string | null }> => {
    await requireRcAdmin(ctx);
    const latest: {
      weekNumber: number;
      contentCount: number;
      experimentCount: number;
      feedbackCount: number;
      interactionCount: number;
      reportContent: string;
    } | null = await ctx.runQuery(internal.agentQueries.getLatestReportWithContent, {});
    if (!latest) {
      throw new Error("No weekly report available");
    }

    const response: { posted: boolean; ts?: string } = await ctx.runAction(internal.actions.postToSlack, {
      text: `*🐭 Weekly Report — Week ${latest.weekNumber}*\n\n${latest.reportContent.slice(0, 3000)}`,
    });

    if (response?.posted && response.ts) {
      await ctx.runMutation(api.weeklyReports.save, {
        weekNumber: latest.weekNumber,
        contentCount: latest.contentCount,
        experimentCount: latest.experimentCount,
        feedbackCount: latest.feedbackCount,
        interactionCount: latest.interactionCount,
        reportContent: latest.reportContent,
        slackTs: response.ts,
      });
    }

    return { posted: Boolean(response?.posted), slackTs: response?.ts ?? null };
  },
});

// Internal mutation triggered by the weekly report cron job
export const generateReport = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[cron] generateReport: starting weekly report generation");

    // Count artifacts created this week
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recentArtifacts = await ctx.db
      .query("artifacts")
      .order("desc")
      .collect();
    const contentCount = recentArtifacts.filter(
      (a) => a._creationTime > oneWeekAgo
    ).length;

    const recentExperiments = await ctx.db
      .query("experiments")
      .order("desc")
      .collect();
    const experimentCount = recentExperiments.filter(
      (e) => e._creationTime > oneWeekAgo
    ).length;

    const recentFeedback = await ctx.db
      .query("feedbackItems")
      .order("desc")
      .collect();
    const feedbackCount = recentFeedback.filter(
      (f) => f._creationTime > oneWeekAgo
    ).length;

    const recentInteractions = await ctx.db
      .query("communityInteractions")
      .order("desc")
      .collect();
    const interactionCount = recentInteractions.filter(
      (i) => i._creationTime > oneWeekAgo
    ).length;

    // Calculate ISO week number
    const date = new Date(now);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    const reportContent = [
      `# Weekly Report - Week ${weekNumber}`,
      ``,
      `## Summary`,
      `- Content pieces: ${contentCount}`,
      `- Experiments: ${experimentCount}`,
      `- Feedback items: ${feedbackCount}`,
      `- Community interactions: ${interactionCount}`,
      ``,
      `_Auto-generated by GrowthRat cron. Replace with LLM-generated summary._`,
    ].join("\n");

    await ctx.db.insert("weeklyReports", {
      weekNumber,
      contentCount,
      experimentCount,
      feedbackCount,
      interactionCount,
      reportContent,
    });

    console.log(
      `[cron] generateReport: saved week ${weekNumber} report (content=${contentCount}, experiments=${experimentCount}, feedback=${feedbackCount}, interactions=${interactionCount})`
    );
  },
});
