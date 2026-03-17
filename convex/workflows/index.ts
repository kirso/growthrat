/**
 * GrowthRat Workflows — Convex Workflow definitions replacing Inngest.
 *
 * Why Convex Workflow instead of Inngest:
 * - Direct DB access: step.runMutation/runQuery/runAction — no HTTP bridge
 * - No shared secret needed: everything runs inside Convex
 * - Durable: steps persist, retry on failure, resume after restart
 * - Native: same platform as the database, agent, and crons
 */

import { WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "../_generated/api";
import { v } from "convex/values";

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 10,
    retryActionsByDefault: true,
    defaultRetryBehavior: {
      maxAttempts: 3,
      initialBackoffMs: 1000,
      base: 2,
    },
  },
});

/**
 * Weekly Planning Workflow
 * Triggered by Convex cron (Monday 9am UTC)
 * Discovers keywords → scores → plans → triggers content generation
 */
export const weeklyPlanWorkflow = workflow.define({
  args: { weekNumber: v.number() },
  handler: async (step, { weekNumber }) => {
    // Step 1: Fetch keyword data from DataForSEO
    const keywords = await step.runAction(
      internal.actions.fetchKeywords,
      { seeds: ["revenuecat webhook", "revenuecat api", "mobile app monetization"] },
      { retry: true }
    );

    // Step 2: Score and select opportunities
    const plan = await step.runMutation(
      internal.mutations.scorePlan,
      { keywords, weekNumber }
    );

    // Step 3: Post plan to Slack
    await step.runAction(
      internal.actions.postToSlack,
      { text: `*🐭 Weekly Plan — Week ${weekNumber}*\n\nTopics: ${plan.contentTopics.join(", ")}` },
      { retry: true }
    );

    // Step 4: Trigger content generation for each topic
    for (const topic of plan.contentTopics) {
      await step.runAction(
        internal.actions.startContentWorkflow,
        { topic, targetKeyword: topic, weekNumber }
      );
    }

    // Step 5: Trigger feedback generation
    await step.runAction(
      internal.actions.startFeedbackWorkflow,
      { topics: plan.feedbackTopics }
    );

    return { weekNumber, topicsPlanned: plan.contentTopics.length };
  },
});

/**
 * Content Generation Workflow
 * Generates content → validates → publishes → distributes
 */
export const contentGenWorkflow = workflow.define({
  args: {
    topic: v.string(),
    targetKeyword: v.string(),
  },
  handler: async (step, { topic, targetKeyword }) => {
    // Step 1: Generate content via LLM
    const draft = await step.runAction(
      internal.actions.generateContent,
      { topic, targetKeyword },
      { retry: true }
    );

    // Step 2: Run quality gates
    const validation = await step.runAction(
      internal.actions.validateQuality,
      { content: draft.content, artifactId: draft.artifactId }
    );

    // Step 3: If validated, publish and distribute
    if (validation.allPassed) {
      await step.runMutation(
        internal.mutations.updateArtifactStatus,
        { id: draft.artifactId, status: "validated" }
      );

      // Publish to CMS
      await step.runAction(
        internal.actions.publishToCMS,
        { artifactId: draft.artifactId },
        { retry: true }
      );

      // Distribute via Typefully
      await step.runAction(
        internal.actions.distributeViaTypefully,
        { artifactId: draft.artifactId, topic },
        { retry: true }
      );

      await step.runMutation(
        internal.mutations.updateArtifactStatus,
        { id: draft.artifactId, status: "published" }
      );
    } else {
      await step.runMutation(
        internal.mutations.updateArtifactStatus,
        { id: draft.artifactId, status: "rejected" }
      );
    }

    return { artifactId: draft.artifactId, published: validation.allPassed };
  },
});

/**
 * Weekly Report Workflow
 * Triggered by Convex cron (Friday 5pm UTC)
 */
export const weeklyReportWorkflow = workflow.define({
  args: { weekNumber: v.number() },
  handler: async (step, { weekNumber }) => {
    // Step 1: Gather real metrics directly from DB
    const metrics = await step.runQuery(
      internal.mutations.gatherWeeklyMetrics,
      {}
    );

    // Step 2: Generate report via LLM
    const report = await step.runAction(
      internal.actions.generateReport,
      { weekNumber, metrics },
      { retry: true }
    );

    // Step 3: Post to Slack
    await step.runAction(
      internal.actions.postToSlack,
      { text: `*🐭 Weekly Report — Week ${weekNumber}*\n\n${report.content.slice(0, 3000)}` },
      { retry: true }
    );

    // Step 4: Store report
    await step.runMutation(
      internal.mutations.saveWeeklyReport,
      { weekNumber, metrics, content: report.content }
    );

    return { weekNumber, metrics };
  },
});

/**
 * Knowledge Ingestion Workflow
 * Crawls RC docs → chunks → embeds → stores
 */
export const knowledgeIngestWorkflow = workflow.define({
  args: {},
  handler: async (step) => {
    const result = await step.runAction(
      internal.actions.ingestKnowledge,
      {},
      { retry: true }
    );

    return result;
  },
});

/**
 * Community Monitor Workflow
 * Scans RC GitHub repos for agent-related issues
 */
export const communityMonitorWorkflow = workflow.define({
  args: {},
  handler: async (step) => {
    // Scan GitHub repos
    const signals = await step.runAction(
      internal.actions.scanGitHubRepos,
      {},
      { retry: true }
    );

    // Generate and post responses for relevant issues
    for (const signal of signals.slice(0, 5)) {
      await step.runAction(
        internal.actions.engageCommunity,
        { channel: signal.channel, context: signal.context, targetUrl: signal.url },
        { retry: true }
      );
    }

    return { signalsFound: signals.length, engaged: Math.min(signals.length, 5) };
  },
});
