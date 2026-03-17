/**
 * Convex Agent Actions — public actions for chat widget and testing.
 *
 * The chat widget uses /api/chat (Next.js route with RAG via vector search).
 * These actions provide alternative entry points + testing utilities.
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Trigger knowledge ingestion (public, for testing).
 */
export const triggerIngest = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.actions.ingestKnowledge, {});
    return { triggered: true };
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

    const res = await fetch(page.url);
    const html = await res.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000);

    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += 1800) {
      const chunk = text.slice(i, i + 2000).trim();
      if (chunk.length > 50) chunks.push(chunk);
      if (chunks.length >= 5) break;
    }

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

/** Minimal test — just fetch one RC docs page */
export const testFetch = action({
  args: {},
  handler: async () => {
    try {
      const res = await fetch("https://www.revenuecat.com/docs/getting-started/quickstart");
      const text = await res.text();
      return { status: res.status, length: text.length };
    } catch (err) {
      return { error: String(err) };
    }
  },
});
