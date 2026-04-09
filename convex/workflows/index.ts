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
import { Id } from "../_generated/dataModel";

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
  handler: async (step, { weekNumber }): Promise<{ weekNumber: number; topicsPlanned: number }> => {
    // Step 0: Gather historical data for the learning loop
    const lastWeekMetrics = await step.runQuery(
      internal.mutations.gatherWeeklyMetrics, {}
    );
    const completedExperiments = await step.runQuery(
      internal.agentQueries.getCompletedExperiments, {}
    );

    // Step 1: Fetch keyword data from DataForSEO
    const keywords = await step.runAction(
      internal.actions.fetchKeywords,
      { seeds: ["revenuecat", "in-app purchase sdk", "mobile subscription management", "revenuecat react native", "revenuecat flutter", "app paywall implementation"] },
      { retry: true }
    );

    // Step 2: Score and select opportunities (with historical context)
    const plan = await step.runMutation(
      internal.mutations.scorePlan,
      { keywords, weekNumber, experimentHistory: completedExperiments ?? [], lastWeekMetrics: lastWeekMetrics ?? {} }
    );

    // Step 3: Post plan to Slack
    await step.runAction(
      internal.actions.postToSlack,
      { text: `*🐭 Weekly Plan — Week ${weekNumber}*\n\nTopics: ${plan.contentTopics.join(", ")}` },
      { retry: true }
    );

    // Step 4: Trigger content generation for each topic with auto-detected content type
    for (const topic of plan.contentTopics) {
      const lower = topic.toLowerCase();
      let artifactType = "blog_post";
      if (lower.includes(" vs ") || lower.includes("alternative")) artifactType = "comparison";
      else if (lower.includes("api") || lower.includes("endpoint")) artifactType = "api_guide";
      else if (lower.includes("setup") || lower.includes("integration") || lower.includes("flutter") || lower.includes("react native")) artifactType = "integration_guide";

      await step.runAction(
        internal.actions.startContentWorkflow,
        { topic, targetKeyword: topic, weekNumber, artifactType }
      );
    }

    // Step 5: Trigger feedback generation
    await step.runAction(
      internal.actions.startFeedbackWorkflow,
      { topics: plan.feedbackTopics }
    );

    // Step 6: Start experiment for the third-ranked keyword
    if (plan.experimentTopic) {
      await step.runAction(
        internal.actions.startExperimentWorkflow,
        {
          experimentKey: `exp-w${weekNumber}-${plan.experimentTopic.replace(/\s+/g, "-").slice(0, 30)}`,
          hypothesis: `Publishing targeted content for "${plan.experimentTopic}" will achieve search indexing within 14 days`,
          targetKeyword: plan.experimentTopic,
          contentSlug: plan.experimentTopic.replace(/\s+/g, "-"),
        }
      );
    }

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
    artifactType: v.optional(v.string()),
  },
  handler: async (step, { topic, targetKeyword, artifactType }): Promise<{ artifactId: string; published: boolean }> => {
    // Step 1: Search knowledge base for RAG grounding
    const ragContext = await step.runAction(
      internal.actions.searchKnowledgeForContent,
      { query: topic },
      { retry: true }
    );

    // Step 2: Generate content via LLM (with RAG context and content type)
    const draft = await step.runAction(
      internal.actions.generateContent,
      { topic, targetKeyword, ragContext: ragContext || undefined, artifactType: artifactType || undefined },
      { retry: true }
    );

    const artifactId = draft.artifactId as Id<"artifacts">;
    const slug = targetKeyword.replace(/\s+/g, "-");

    // Step 3: Run quality gates
    const validation = await step.runAction(
      internal.actions.validateQuality,
      { content: draft.content, artifactId, title: topic, slug }
    );

    // Step 3: If validated, handle approval based on review mode
    if (validation.allPassed) {
      await step.runMutation(
        internal.mutations.updateArtifactStatus,
        { id: artifactId, status: "validated" }
      );

      // Check review mode to determine approval flow
      const config = await step.runQuery(
        internal.slackCommandQueries.getAgentConfig, {}
      );

      // Post to Slack for approval (auto-approves if no Slack token)
      const approval = await step.runAction(
        internal.slackApproval.postForApproval,
        {
          artifactId,
          title: topic,
          slug: targetKeyword.replace(/\s+/g, "-"),
          contentPreview: draft.content.slice(0, 500),
          qualityGates: validation.gates.map((g: { key: string; passed: boolean }) => g.passed ? `${g.key}` : `~${g.key}~`).join(", "),
        },
        { retry: true }
      );

      if (approval.autoApproved) {
        // No Slack configured — auto-publish immediately
        const publishResult = await step.runAction(internal.actions.publishToCMS, { artifactId }, { retry: true });
        await step.runAction(internal.actions.distributeViaTypefully, { artifactId, topic }, { retry: true });
        const githubResult = await step.runAction(
          internal.actions.distributeViaGitHub,
          { artifactId: draft.artifactId as Id<"artifacts">, title: topic, slug: targetKeyword.replace(/\s+/g, "-"), content: draft.content },
          { retry: true }
        );
        if (publishResult.published || githubResult.committed) {
          await step.runMutation(internal.mutations.updateArtifactStatus, { id: artifactId, status: "published" });
        }
      } else if (config?.reviewMode === "draft_only") {
        // Draft-only mode: wait for Slack reaction before publishing.
        // The Slack reaction handler (slackApproval.handleReaction) triggers distribution.
        await step.runMutation(
          internal.mutations.updateArtifactStatus,
          { id: artifactId, status: "pending_approval" }
        );
      } else {
        // Semi-auto or bounded autonomy — publish after Slack notification
        const publishResult = await step.runAction(internal.actions.publishToCMS, { artifactId }, { retry: true });
        await step.runAction(internal.actions.distributeViaTypefully, { artifactId, topic }, { retry: true });
        const githubResult = await step.runAction(
          internal.actions.distributeViaGitHub,
          { artifactId: draft.artifactId as Id<"artifacts">, title: topic, slug: targetKeyword.replace(/\s+/g, "-"), content: draft.content },
          { retry: true }
        );
        if (publishResult.published || githubResult.committed) {
          await step.runMutation(internal.mutations.updateArtifactStatus, { id: artifactId, status: "published" });
        }
      }
    } else {
      await step.runMutation(
        internal.mutations.updateArtifactStatus,
        { id: artifactId, status: "rejected" }
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
  handler: async (step, { weekNumber }): Promise<{ weekNumber: number; metrics: Record<string, number> }> => {
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
  handler: async (step): Promise<{ totalChunks?: number; signalsFound?: number; engaged?: number }> => {
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
 * Scans RC GitHub repos + X/Twitter for agent-related signals
 */
export const communityMonitorWorkflow = workflow.define({
  args: {},
  handler: async (step): Promise<{ totalChunks?: number; signalsFound?: number; engaged?: number }> => {
    // Scan GitHub repos
    const githubSignals = await step.runAction(
      internal.actions.scanGitHubRepos,
      {},
      { retry: true }
    );

    // Scan X/Twitter mentions
    const xSignals = await step.runAction(
      internal.actions.scanTwitterMentions,
      {},
      { retry: true }
    );

    const allSignals = [...githubSignals, ...xSignals];

    // Generate and post responses for top signals
    for (const signal of allSignals.slice(0, 10)) {
      await step.runAction(
        internal.actions.engageCommunity,
        { channel: signal.channel, context: signal.context, targetUrl: signal.url },
        { retry: true }
      );
    }

    return { signalsFound: allSignals.length, engaged: Math.min(allSignals.length, 10) };
  },
});
