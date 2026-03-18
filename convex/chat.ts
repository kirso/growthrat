/**
 * Convex Chat Actions — thread management for GrowthRat agent.
 *
 * Every conversation (chat widget, panel, Slack) creates a persistent thread.
 * The agent has tools (searchDocs, getArticle, getWeeklyMetrics) and RAG
 * via prompt-based context injection from the sources table.
 */

import { action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { growthRatAgent, generateEmbedding } from "./agent";
import { internal } from "./_generated/api";

/**
 * Create a new conversation thread.
 */
export const createThread = action({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, { userId }) => {
    const { threadId } = await growthRatAgent.createThread(ctx, {
      userId,
    });
    return { threadId };
  },
});

/**
 * Send a message and get a complete (non-streaming) response.
 * Creates a new thread if threadId is not provided.
 * Injects RAG context from the sources table before every call.
 */
export const chat = action({
  args: {
    prompt: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { prompt, threadId }) => {
    // Fetch RAG context from our sources table
    const ragContext = await fetchRAGContext(ctx, prompt);
    const enrichedPrompt = ragContext
      ? `${ragContext}\n\n---\n\nUser question: ${prompt}`
      : prompt;

    // Use the agent-level API: agent.generateText(ctx, { threadId }, { prompt })
    let tid = threadId;
    if (!tid) {
      const { threadId: newId } = await growthRatAgent.createThread(ctx, {});
      tid = newId;
    }

    const result = await growthRatAgent.generateText(ctx, { threadId: tid }, { prompt: enrichedPrompt } as any);
    return { threadId: tid, text: result.text };
  },
});

/**
 * Panel session: same as chat but returns structured data including sources.
 */
export const panelChat = action({
  args: {
    prompt: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { prompt, threadId }) => {
    // Fetch RAG context with source metadata
    const { context, sources } = await fetchRAGContextWithSources(ctx, prompt);
    const enrichedPrompt = context
      ? `${context}\n\n---\n\nPanel prompt: ${prompt}`
      : prompt;

    let tid = threadId;
    if (!tid) {
      const { threadId: newId } = await growthRatAgent.createThread(ctx, {});
      tid = newId;
    }

    const result = await growthRatAgent.generateText(ctx, { threadId: tid }, { prompt: enrichedPrompt } as any);

    return {
      threadId: tid,
      text: result.text,
      sources,
    };
  },
});

/**
 * Fetch RAG context from our sources table.
 */
async function fetchRAGContext(
  ctx: ActionCtx,
  query: string
): Promise<string | null> {
  const { context } = await fetchRAGContextWithSources(ctx, query);
  return context;
}

/**
 * Fetch RAG context with source metadata (for panel transparency).
 */
async function fetchRAGContextWithSources(
  ctx: ActionCtx,
  query: string
): Promise<{ context: string | null; sources: Array<{ label: string; type: string; score: number }> }> {
  try {
    const embedding = await generateEmbedding(query);

    const results = await ctx.vectorSearch("sources", "by_embedding", {
      vector: embedding,
      limit: 5,
    });

    if (results.length === 0) {
      return { context: null, sources: [] };
    }

    // Fetch full documents
    const docs = await ctx.runQuery(internal.agentQueries.getSourcesByIds, {
      ids: results.map((r) => r._id),
    });

    const sources = docs.map((d: { provider: string; key: string; summary: string }, i: number) => ({
      label: `${d.provider} — ${d.key}`,
      type: d.provider === "RevenueCat" ? "doc" : "data",
      score: results[i]?._score ?? 0,
    }));

    const contextText = docs
      .map((d: { provider: string; key: string; summary: string }, i: number) =>
        `[Source: ${d.provider} — ${d.key} (relevance: ${(results[i]?._score ?? 0).toFixed(2)})]\n${d.summary}`
      )
      .join("\n\n---\n\n");

    const context = `# Retrieved Knowledge Base Context\n\nThe following documents were retrieved and are relevant to the question:\n\n${contextText}`;

    return { context, sources };
  } catch (err) {
    console.error("[chat] RAG context fetch failed:", err);
    return { context: null, sources: [] };
  }
}
