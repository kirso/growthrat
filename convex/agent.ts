/**
 * GrowthCat Convex Agent Definition
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
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { components, internal } from "./_generated/api";

const SYSTEM_PROMPT = `You are GrowthCat — an autonomous developer-advocacy and growth agent for agent-built apps.

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

GrowthCat is an independent agent applying to RevenueCat, not a RevenueCat-owned property.`;

export const growthCatAgent = new Agent(components.agent, {
  name: "GrowthCat",
  languageModel: anthropic.chat("claude-sonnet-4-20250514"),
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
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
        // vectorSearch IS available on ActionCtx
        try {
          const embedding = await generateEmbedding(query);
          const results = await ctx.vectorSearch("sources", "by_embedding", {
            vector: embedding,
            limit: 5,
          });

          if (results.length === 0) {
            return "No relevant documentation found for this query.";
          }

          // Must use ctx.runQuery — ActionCtx has NO ctx.db
          const docs = await ctx.runQuery(
            internal.agentQueries.getSourcesByIds,
            { ids: results.map((r) => r._id) }
          );

          return docs
            .map((d) => `[${d.provider} — ${d.key}]:\n${d.summary}`)
            .join("\n\n---\n\n");
        } catch {
          return "Knowledge base search is not available yet. Answering from training knowledge.";
        }
      },
    }),

    getArticle: createTool({
      description:
        "Fetch one of GrowthCat's own published articles by slug. " +
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

  // CRITICAL: contextHandler injects custom knowledge BEFORE every LLM call.
  // Convex Agent's built-in search only covers thread messages.
  // This handler adds RC docs from the sources table via vector search.
  contextHandler: async (ctx, args) => {
    const lastUserMessage =
      args.inputPrompt?.[0]?.content ??
      (args.inputMessages ?? [])
        .filter((m: { role: string }) => m.role === "user")
        .pop()?.content ??
      "";

    const query =
      typeof lastUserMessage === "string"
        ? lastUserMessage
        : JSON.stringify(lastUserMessage);

    let docContext: Array<{ role: "system"; content: string }> = [];
    if (query.length > 5) {
      try {
        const embedding = await generateEmbedding(query);
        // vectorSearch IS available on ActionCtx
        const results = await ctx.vectorSearch("sources", "by_embedding", {
          vector: embedding,
          limit: 3,
        });

        if (results.length > 0) {
          // Must use ctx.runQuery — ActionCtx has NO ctx.db
          const docs = await ctx.runQuery(
            internal.agentQueries.getSourcesByIds,
            { ids: results.map((r) => r._id) }
          );

          if (docs.length > 0) {
            const docText = docs
              .map((d) => `[${d.provider} — ${d.key}]: ${d.summary}`)
              .join("\n");

            docContext = [
              {
                role: "system" as const,
                content: `Relevant RevenueCat documentation:\n\n${docText}\n\nUse this context to ground your response.`,
              },
            ];
          }
        }
      } catch {
        // Knowledge base not yet populated — fall through gracefully
      }
    }

    return [
      ...docContext,
      ...args.search,
      ...args.recent,
      ...args.inputMessages,
      ...args.inputPrompt,
      ...args.existingResponses,
    ];
  },

  callSettings: {
    maxRetries: 3,
    temperature: 0.4,
  },
  maxSteps: 5,
});

/**
 * Generate an embedding for a text query.
 * Uses OpenAI text-embedding-3-small (1536 dimensions).
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY required for embeddings");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

export { generateEmbedding };
