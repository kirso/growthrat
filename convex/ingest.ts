/**
 * Knowledge Ingestion v2 — Full RevenueCat docs coverage.
 *
 * Fetches ALL doc pages from RC sitemap, chunks them properly,
 * batches Voyage embeddings, and stores with correct content hashing.
 *
 * Token budget: ~1M embedding tokens (0.5% of Voyage free tier).
 * API calls: 1 per page (batches all chunks in one Voyage call).
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 1500; // chars per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks
const MAX_CHUNKS_PER_PAGE = 15;
const MAX_TEXT_LENGTH = 30000; // max chars extracted per page
const VOYAGE_MODEL = "voyage-3-lite";
const VOYAGE_BATCH_SIZE = 20; // chunks per Voyage API call (conservative)

// ---------------------------------------------------------------------------
// Sitemap fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch all doc page URLs from the RevenueCat sitemap.
 */
export const fetchSitemap = action({
  args: {},
  handler: async () => {
    const res = await fetch("https://www.revenuecat.com/docs/sitemap.xml");
    if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
    const xml = await res.text();

    // Extract all URLs from sitemap XML
    const urls: string[] = [];
    const regex = /<loc>(https:\/\/www\.revenuecat\.com\/docs\/[^<]+)<\/loc>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const url = match[1];
      // Skip non-content pages
      if (url.endsWith("/search") || url.endsWith("/markdown-page") || url === "https://www.revenuecat.com/docs/") {
        continue;
      }
      urls.push(url);
    }

    return { count: urls.length, urls };
  },
});

/**
 * Ingest a single page by URL. Fetches, chunks, embeds, stores.
 * Returns stats on what was stored vs skipped.
 */
export const ingestPage = action({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    // Derive key from URL path
    const path = url.replace("https://www.revenuecat.com/docs/", "");
    const key = "rc-docs:" + path.replace(/\//g, ":");

    // Step 1: Fetch and extract text
    let text: string;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "GrowthRat Knowledge Crawler (developer advocacy agent)" },
      });
      if (!res.ok) {
        return { url, key, error: `HTTP ${res.status}`, stored: 0, skipped: 0 };
      }
      const html = await res.text();
      text = extractText(html);
    } catch (err) {
      return { url, key, error: String(err), stored: 0, skipped: 0 };
    }

    if (text.length < 100) {
      return { url, key, error: "Too little content", stored: 0, skipped: 0 };
    }

    // Step 2: Chunk
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return { url, key, error: "No valid chunks", stored: 0, skipped: 0 };
    }

    // Step 3: Hash each chunk to detect changes
    const hashes = chunks.map((c) => hashText(c));

    // Step 4: Check which chunks are new or changed
    // Build keys for each chunk
    const chunkKeys = chunks.map((_, i) => `${key}:chunk-${i}`);

    // Step 5: Batch embed via Voyage AI
    const voyageKey = process.env.VOYAGE_API_KEY;
    if (!voyageKey) {
      return { url, key, error: "No VOYAGE_API_KEY", stored: 0, skipped: 0 };
    }

    let embeddings: number[][] = [];
    try {
      embeddings = await batchEmbed(voyageKey, chunks);
    } catch (err) {
      return { url, key, error: `Embedding failed: ${err}`, stored: 0, skipped: 0 };
    }

    if (embeddings.length !== chunks.length) {
      return { url, key, error: `Embedding count mismatch: got ${embeddings.length}, expected ${chunks.length}`, stored: 0, skipped: 0 };
    }

    // Step 6: Upsert each chunk
    let stored = 0;
    const skipped = 0;
    for (let i = 0; i < chunks.length; i++) {
      const result = await ctx.runMutation(internal.sources.upsertWithEmbedding, {
        key: chunkKeys[i],
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
      // upsertWithEmbedding returns the ID; if content hash matched, it skipped
      // We can't easily distinguish here, so count all as stored
      if (result) stored++;
    }

    return { url, key, chunks: chunks.length, stored, skipped };
  },
});

/**
 * Ingest a batch of pages by URL array. For running from CLI.
 */
export const ingestBatch = action({
  args: { urls: v.array(v.string()) },
  handler: async (ctx, { urls }) => {
    const results: Array<{ url: string; chunks: number; stored: number; error?: string }> = [];

    for (const url of urls) {
      try {
        const result = await ctx.runAction(internal.ingestInternal.ingestPageInternal, { url });
        results.push(result as any);
      } catch (err) {
        results.push({ url, chunks: 0, stored: 0, error: String(err) });
      }
    }

    const totalStored = results.reduce((sum, r) => sum + (r.stored ?? 0), 0);
    const totalChunks = results.reduce((sum, r) => sum + (r.chunks ?? 0), 0);
    const errors = results.filter((r) => r.error).length;

    return { pages: urls.length, totalChunks, totalStored, errors, results };
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract readable text from HTML. Strips scripts, styles, tags, collapses whitespace.
 */
function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "") // Remove navigation
    .replace(/<header[\s\S]*?<\/header>/gi, "") // Remove header
    .replace(/<footer[\s\S]*?<\/footer>/gi, "") // Remove footer
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ") // HTML entities
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

/**
 * Split text into overlapping chunks.
 */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const step = CHUNK_SIZE - CHUNK_OVERLAP;

  for (let i = 0; i < text.length; i += step) {
    const chunk = text.slice(i, i + CHUNK_SIZE).trim();
    if (chunk.length < 80) continue; // Skip tiny trailing chunks
    chunks.push(chunk);
    if (chunks.length >= MAX_CHUNKS_PER_PAGE) break;
  }

  return chunks;
}

/**
 * DJB2 hash of text content. Fast, deterministic, good enough for dedup.
 */
function hashText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Batch embed texts via Voyage AI. Sends all chunks in one API call.
 */
async function batchEmbed(apiKey: string, texts: string[]): Promise<number[][]> {
  // Voyage supports up to 128 inputs per call
  // For safety, batch in groups of VOYAGE_BATCH_SIZE
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += VOYAGE_BATCH_SIZE) {
    const batch = texts.slice(i, i + VOYAGE_BATCH_SIZE);

    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: batch.map((t) => t.slice(0, 16000)), // Voyage max input
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Voyage API error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const embeddings = data.data?.map((d: { embedding: number[] }) => d.embedding) ?? [];

    if (embeddings.length !== batch.length) {
      throw new Error(`Voyage returned ${embeddings.length} embeddings for ${batch.length} inputs`);
    }

    allEmbeddings.push(...embeddings);

    // Small delay between batches to avoid rate limits
    if (i + VOYAGE_BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return allEmbeddings;
}
