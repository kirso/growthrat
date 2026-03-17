/**
 * Convex Agent Actions
 *
 * These actions power the chat widget and panel console.
 * They use the GrowthRat Convex Agent for thread management,
 * message persistence, RAG, and tool calling.
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { growthRatAgent } from "./agent";

/**
 * Start a new conversation thread.
 * Called when a user opens the chat widget for the first time.
 */
export const createThread = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, { prompt }) => {
    const { threadId, thread } = await growthRatAgent.createThread(ctx);
    const result = await thread.generateText({ prompt });
    return {
      threadId,
      text: result.text,
    };
  },
});

/**
 * Continue an existing conversation thread.
 * Called for follow-up messages in an existing chat session.
 * Automatically includes previous message history.
 */
export const continueThread = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, { threadId, prompt }) => {
    const { thread } = await growthRatAgent.continueThread(ctx, { threadId });
    const result = await thread.generateText({ prompt });
    return {
      threadId,
      text: result.text,
    };
  },
});

/**
 * Stream a response (for the chat widget / panel console).
 * Uses the same agent brain but returns a streaming response.
 */
export const streamChat = action({
  args: {
    threadId: v.optional(v.string()),
    prompt: v.string(),
  },
  handler: async (ctx, { threadId, prompt }) => {
    if (threadId) {
      const { thread } = await growthRatAgent.continueThread(ctx, { threadId });
      const result = await thread.generateText({ prompt });
      return { threadId, text: result.text };
    }

    const { threadId: newThreadId, thread } =
      await growthRatAgent.createThread(ctx);
    const result = await thread.generateText({ prompt });
    return { threadId: newThreadId, text: result.text };
  },
});

/**
 * Trigger knowledge ingestion (public, for testing).
 * In production this runs via cron.
 */
export const triggerIngest = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.actions.ingestKnowledge, {});
    return { triggered: true };
  },
});

/** Minimal test — just fetch one RC docs page */
export const testFetch = action({
  args: {},
  handler: async () => {
    try {
      const res = await fetch("https://www.revenuecat.com/docs/getting-started/quickstart");
      const text = await res.text();
      return { status: res.status, length: text.length, first100: text.slice(0, 100) };
    } catch (err) {
      return { error: String(err) };
    }
  },
});

/** Step-by-step test of ingestion pipeline */
export const testIngestSteps = action({
  args: {},
  handler: async (ctx) => {
    const { fetchPage, chunkText, generateEmbedding, hashContent } = await import("./crawler");
    const results: string[] = [];
    
    // Step 1: Fetch
    try {
      const text = await fetchPage("https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields");
      results.push("1. Fetch OK: " + text.length + " chars");
      
      // Step 2: Chunk
      const chunks = chunkText(text);
      results.push("2. Chunks OK: " + chunks.length + " chunks");
      
      // Step 3: Embed first chunk
      const embedding = await generateEmbedding(chunks[0]);
      results.push("3. Embedding OK: " + embedding.length + " dimensions");
      
      // Step 4: Store in Convex
      const hash = hashContent(chunks[0]);
      await ctx.runMutation(internal.sources.upsertWithEmbedding, {
        key: "test:webhook-events:chunk-0",
        url: "https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields",
        provider: "RevenueCat",
        sourceClass: "public_product",
        evidenceTier: "public_product_and_competitor",
        lastRefreshed: Date.now(),
        contentHash: hash,
        summary: chunks[0].slice(0, 500),
        embedding: embedding,
        chunkIndex: 0,
        parentKey: "test:webhook-events",
      });
      results.push("4. Stored in Convex OK");
      
      return { success: true, steps: results };
    } catch (err) {
      results.push("ERROR: " + String(err));
      return { success: false, steps: results };
    }
  },
});

/** Test ingestion via Node.js runtime */
export const testIngestNode = action({
  args: {},
  handler: async (ctx) => {
    return await ctx.runAction(internal.actions.testIngestStep, {});
  },
});

/** Ingest a single RC doc page by index (0-11) */
export const ingestOnePage = action({
  args: { pageIndex: v.number() },
  handler: async (ctx, { pageIndex }) => {
    const { RC_DOC_URLS } = await import("./crawler");
    if (pageIndex < 0 || pageIndex >= RC_DOC_URLS.length) {
      return { error: "Invalid page index. Range: 0-" + (RC_DOC_URLS.length - 1) };
    }
    const page = RC_DOC_URLS[pageIndex];

    // Fetch
    const res = await fetch(page.url);
    const html = await res.text();

    // Extract (memory-safe)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000);

    // Chunk
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += 1800) {
      const chunk = text.slice(i, i + 2000).trim();
      if (chunk.length > 50) chunks.push(chunk);
      if (chunks.length >= 5) break;
    }

    // Embed + store each chunk
    let stored = 0;
    const voyageKey = process.env.VOYAGE_API_KEY;
    for (let i = 0; i < chunks.length; i++) {
      const embRes = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: { Authorization: "Bearer " + voyageKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "voyage-3-lite", input: [chunks[i]] }),
      });
      const embData = await embRes.json();
      const embedding = embData.data?.[0]?.embedding;
      if (!embedding) continue;

      await ctx.runMutation(internal.sources.upsertWithEmbedding, {
        key: page.key + ":chunk-" + i,
        url: page.url,
        provider: "RevenueCat",
        sourceClass: "public_product",
        evidenceTier: "public_product_and_competitor",
        lastRefreshed: Date.now(),
        contentHash: String(chunks[i].length) + "-" + i,
        summary: chunks[i].slice(0, 500),
        embedding: embedding,
        chunkIndex: i,
        parentKey: page.key,
      });
      stored++;
    }

    return { page: page.key, chunks: chunks.length, stored };
  },
});
