import { internal } from "./_generated/api";

type KnowledgeCtx = {
  vectorSearch: (
    table: "sources",
    index: "by_embedding",
    args: { vector: number[]; limit: number }
  ) => Promise<Array<{ _id: string; _score?: number }>>;
  runQuery: (query: any, args: any) => Promise<any>;
};

export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (voyageKey) {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${voyageKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "voyage-3-lite", input: [text.slice(0, 16000)] }),
    });
    if (!res.ok) throw new Error(`Voyage error: ${res.status}`);
    const data = await res.json();
    return data.data?.[0]?.embedding ?? [];
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json();
    return data.data?.[0]?.embedding ?? [];
  }

  throw new Error("No embedding key. Set VOYAGE_API_KEY or OPENAI_API_KEY.");
}

export async function fetchKnowledgeContext(
  ctx: KnowledgeCtx,
  query: string,
  options?: { limit?: number; includeHeading?: boolean },
): Promise<{ context: string | null; sources: Array<{ label: string; type: string; score: number }> }> {
  try {
    const embedding = await generateQueryEmbedding(query);
    const results = await ctx.vectorSearch("sources", "by_embedding", {
      vector: embedding,
      limit: options?.limit ?? 5,
    });

    if (results.length === 0) {
      return { context: null, sources: [] };
    }

    const docs = await ctx.runQuery(internal.agentQueries.getSourcesByIds, {
      ids: results.map((result) => result._id),
    });

    const sources = docs.map((doc: { provider: string; key: string }, index: number) => ({
      label: `${doc.provider} — ${doc.key}`,
      type: doc.provider === "RevenueCat" ? "doc" : "data",
      score: results[index]?._score ?? 0,
    }));

    const body = docs
      .map((doc: { provider: string; key: string; summary: string }, index: number) =>
        `[Source: ${doc.provider} — ${doc.key} (relevance: ${(results[index]?._score ?? 0).toFixed(2)})]\n${doc.summary}`,
      )
      .join("\n\n---\n\n");

    if (!body) {
      return { context: null, sources };
    }

    return {
      context: options?.includeHeading === false
        ? body
        : `# Retrieved Knowledge Base Context\n\nThe following documents were retrieved and are relevant to the question:\n\n${body}`,
      sources,
    };
  } catch (error) {
    console.error("[knowledge] Retrieval failed:", error);
    return { context: null, sources: [] };
  }
}
