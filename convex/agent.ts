/**
 * GrowthRat Convex Agent Definition
 *
 * This is THE BRAIN. Every conversation (chat widget, panel console, Slack)
 * goes through this agent. It has:
 * - Persistent threads (conversation memory)
 * - RAG via contextHandler (searches sources table for RC docs)
 * - Tool calling (searchDocs, getArticle, getWeeklyMetrics)
 *
 * IMPORTANT: Tool handlers receive ActionCtx — NO ctx.db.
 * Must use ctx.runQuery / ctx.runMutation for database access.
 * ctx.vectorSearch IS available on ActionCtx.
 */

import { Agent, createTool } from "@convex-dev/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { components, internal } from "./_generated/api";
import { fetchKnowledgeContext, generateQueryEmbedding } from "./knowledge";

const SYSTEM_PROMPT = `You are GrowthRat — an autonomous developer-advocacy and growth agent for agent-built apps.

Tone: technical, structured, evidence-backed, curious, direct

Recurring themes:
- agent-built apps deserve first-class tooling
- growth work must be measurable
- product feedback should come from real usage
- autonomy requires guardrails, not vibes

NEVER do these:
- generic AI futurism without product specifics
- unsupported growth claims
- mascot-like self-description
- implying RevenueCat endorsement before hire

When answering questions about RevenueCat, ALWAYS use the searchDocs tool first to find relevant documentation. Ground your answers in the retrieved docs. If you can't find relevant docs, say so honestly.

GrowthRat is an independent agent applying to RevenueCat, not a RevenueCat-owned property.`;

export const growthRatAgent = new Agent(components.agent, {
  name: "GrowthRat",
  languageModel: anthropic.chat(process.env.ANTHROPIC_GENERATION_MODEL ?? "claude-sonnet-4-20250514"),
  // textEmbeddingModel omitted — thread search uses text-only.
  // Custom RAG on sources table uses Voyage AI via fetch in contextHandler.
  instructions: SYSTEM_PROMPT,

  tools: {
    searchDocs: createTool({
      description:
        "Search RevenueCat documentation and knowledge base for relevant information. " +
        "Use this tool BEFORE answering any question about RevenueCat APIs, SDKs, webhooks, " +
        "offerings, entitlements, or product features.",
      args: z.object({
        query: z.string().describe("What to search for in the RC knowledge base"),
      }),
      handler: async (ctx, { query }): Promise<string> => {
        const { context } = await fetchKnowledgeContext(ctx as any, query, { includeHeading: false });
        return context ?? "No relevant documentation found for this query.";
      },
    }),

    getArticle: createTool({
      description:
        "Fetch one of GrowthRat's own published articles by slug. " +
        "Use this to reference your own prior work.",
      args: z.object({
        slug: z.string().describe("The article slug"),
      }),
      handler: async (ctx, { slug }): Promise<string> => {
        // Must use ctx.runQuery — ActionCtx has NO ctx.db
        const article = await ctx.runQuery(
          internal.agentQueries.getArtifactBySlug,
          { slug }
        );

        if (!article) return `No article found with slug "${slug}".`;
        return `Title: ${article.title}\n\n${article.content}`;
      },
    }),

    getWeeklyMetrics: createTool({
      description: "Get aggregated metrics for the current week.",
      args: z.object({}),
      handler: async (ctx): Promise<string> => {
        // Must use ctx.runQuery — ActionCtx has NO ctx.db
        const report = await ctx.runQuery(
          internal.agentQueries.getLatestReport,
          {}
        );

        if (!report) return "No weekly report data available yet.";
        return `Week ${report.weekNumber}: ${report.contentCount} content, ${report.experimentCount} experiments, ${report.feedbackCount} feedback, ${report.interactionCount} interactions.`;
      },
    }),
  },

  // Thread message search options (searches THREAD HISTORY, not custom docs)
  contextOptions: {
    recentMessages: 20,
    searchOtherThreads: false,
    searchOptions: {
      textSearch: true,
      vectorSearch: true,
      limit: 10,
      messageRange: { before: 1, after: 1 },
    },
  },

  // RAG is handled via the searchDocs tool — the agent calls it when needed.
  // The chat API route also does RAG via the vector search HTTP endpoint.
  // No contextHandler needed — tool-based RAG is more reliable.

  callSettings: {
    maxRetries: 3,
    temperature: 0.4,
  },
  maxSteps: 5,
});
export { generateQueryEmbedding as generateEmbedding };
