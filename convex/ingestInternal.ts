"use node";

/**
 * Internal ingestion action — called by ingest.ts batch action.
 * Separated because public actions can't call other public actions.
 */

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;
const MAX_CHUNKS_PER_PAGE = 15;
const MAX_TEXT_LENGTH = 30000;
const VOYAGE_MODEL = "voyage-3-lite";

export const ingestPageInternal = internalAction({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    const path = url.replace("https://www.revenuecat.com/docs/", "");
    const key = "rc-docs:" + path.replace(/\//g, ":");

    // Fetch
    let text: string;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "GrowthRat Knowledge Crawler" },
      });
      if (!res.ok) return { url, key, error: `HTTP ${res.status}`, chunks: 0, stored: 0 };
      const html = await res.text();
      text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<header[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_TEXT_LENGTH);
    } catch (err) {
      return { url, key, error: String(err), chunks: 0, stored: 0 };
    }

    if (text.length < 100) return { url, key, error: "Too little content", chunks: 0, stored: 0 };

    // Chunk
    const chunks: string[] = [];
    const step = CHUNK_SIZE - CHUNK_OVERLAP;
    for (let i = 0; i < text.length; i += step) {
      const chunk = text.slice(i, i + CHUNK_SIZE).trim();
      if (chunk.length < 80) continue;
      chunks.push(chunk);
      if (chunks.length >= MAX_CHUNKS_PER_PAGE) break;
    }

    if (chunks.length === 0) return { url, key, error: "No valid chunks", chunks: 0, stored: 0 };

    // Hash
    const hashes = chunks.map((c) => {
      let h = 5381;
      for (let i = 0; i < c.length; i++) { h = ((h << 5) + h) + c.charCodeAt(i); h |= 0; }
      return Math.abs(h).toString(36);
    });

    // Embed (batch all chunks for this page in one call)
    const voyageKey = process.env.VOYAGE_API_KEY;
    if (!voyageKey) return { url, key, error: "No VOYAGE_API_KEY", chunks: 0, stored: 0 };

    const embRes = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${voyageKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: VOYAGE_MODEL, input: chunks.map((c) => c.slice(0, 16000)) }),
    });

    if (!embRes.ok) {
      const errText = await embRes.text();
      return { url, key, error: `Voyage ${embRes.status}: ${errText.slice(0, 100)}`, chunks: 0, stored: 0 };
    }

    const embData = await embRes.json();
    const embeddings: number[][] = embData.data?.map((d: { embedding: number[] }) => d.embedding) ?? [];

    if (embeddings.length !== chunks.length) {
      return { url, key, error: `Embedding mismatch: ${embeddings.length} vs ${chunks.length}`, chunks: chunks.length, stored: 0 };
    }

    // Store
    let stored = 0;
    for (let i = 0; i < chunks.length; i++) {
      await ctx.runMutation(internal.sources.upsertWithEmbedding, {
        key: `${key}:chunk-${i}`,
        url,
        provider: "RevenueCat",
        sourceClass: "public_product",
        evidenceTier: "public_product_and_competitor",
        lastRefreshed: Date.now(),
        contentHash: hashes[i],
        summary: chunks[i].slice(0, 500),
        embedding: embeddings[i],
        chunkIndex: i,
        parentKey: key,
      });
      stored++;
    }

    return { url, key, chunks: chunks.length, stored };
  },
});
