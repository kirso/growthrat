/**
 * Convex Chat Actions — thread management for GrowthRat agent.
 *
 * Every conversation (chat widget, panel, Slack) creates a persistent thread.
 * The agent has tools (searchDocs, getArticle, getWeeklyMetrics) and RAG
 * via prompt-based context injection from the sources table.
 */

import { action, ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { growthRatAgent } from "./agent";
import { fetchKnowledgeContext } from "./knowledge";
import { requireInternalServerToken, requireRcAdmin } from "./authz";

/**
 * Create a new conversation thread.
 */
export const createThread = action({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, { userId }) => {
    await requireRcAdmin(ctx);
    const { threadId } = await growthRatAgent.createThread(ctx, {
      userId,
    });
    return { threadId };
  },
});

/**
 * Search RevenueCat documentation and return the retrieved context.
 * Used by the Next.js chat route so it can stay off the old HTTP bridge.
 */
export const searchKnowledge = action({
  args: {
    query: v.string(),
    serverToken: v.string(),
  },
  handler: async (ctx, { query, serverToken }) => {
    requireInternalServerToken(serverToken);
    const runtime = await ctx.runQuery(api.agentConfig.getRuntimeState, {});
    if (!runtime.isActive) {
      return { context: "", sources: [] };
    }
    const safeQuery = query.slice(0, 2_000);
    const { context, sources } = await fetchRAGContextWithSources(ctx, safeQuery);
    return { context: context ?? "", sources };
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
    await requireRcAdmin(ctx);
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
    await requireRcAdmin(ctx);
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
  return await fetchKnowledgeContext(ctx as any, query);
}
