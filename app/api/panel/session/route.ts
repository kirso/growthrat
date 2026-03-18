import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return new Response("Missing prompt parameter", { status: 400 });
  }

  const panelToken = searchParams.get("token");
  const expectedToken = process.env.GROWTHCAT_PANEL_TOKEN;
  if (expectedToken && panelToken !== expectedToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const start = Date.now();
      const elapsed = () => Date.now() - start;

      // Step 1: Prompt received
      send("progress", { step: "prompt_received", content: prompt, elapsed_ms: elapsed() });

      // Step 2: REAL source retrieval via vector search
      const { sources, context } = await retrieveRealSources(prompt);
      send("progress", { step: "sources_retrieved", sources, elapsed_ms: elapsed() });

      // Step 3: Reasoning
      send("progress", {
        step: "reasoning",
        content: `Retrieved ${sources.length} relevant documents. Building grounded response...`,
        elapsed_ms: elapsed(),
      });

      // Step 4: Stream LLM response with real RAG context
      try {
        const model = anthropic("claude-sonnet-4-20250514");

        const systemPrompt = `You are GrowthRat in a live panel interview at RevenueCat.
The interviewer is watching you think and work in real time.
Tone: technical, structured, evidence-backed, curious, direct.

IMPORTANT: Show your reasoning. Cite specific sources from the retrieved documents. Be honest about uncertainty.
GrowthRat is an independent agent applying to RevenueCat, not a RevenueCat-owned property.`;

        const userPrompt = context
          ? `${context}\n\n---\n\nPanel prompt: ${prompt}\n\nRespond showing:\n1. How you understand the prompt\n2. Which retrieved sources are relevant and why\n3. Your substantive answer grounded in the sources\n4. Caveats or uncertainty`
          : `Panel prompt: ${prompt}\n\nRespond showing:\n1. How you understand the prompt\n2. Relevant knowledge\n3. Substantive answer\n4. Caveats or uncertainty`;

        const result = streamText({
          model,
          system: systemPrompt,
          prompt: userPrompt,
          maxOutputTokens: 4096,
          temperature: 0.3,
        });

        for await (const chunk of (await result).textStream) {
          send("stream", { step: "output_chunk", token: chunk, elapsed_ms: elapsed() });
        }
      } catch (err) {
        send("stream", {
          step: "output_chunk",
          token: `\n\n[Error: ${err instanceof Error ? err.message : "Unknown error"}]`,
          elapsed_ms: elapsed(),
        });
      }

      // Step 5: Complete
      send("done", { step: "complete", elapsed_ms: elapsed() });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Retrieve REAL sources from the Convex vector search endpoint.
 * Generates a Voyage AI embedding for the query, then searches the sources table.
 */
async function retrieveRealSources(
  query: string
): Promise<{ sources: Array<{ label: string; type: string; score: number }>; context: string | null }> {
  try {
    // Generate embedding via Voyage AI
    const voyageKey = process.env.VOYAGE_API_KEY;
    if (!voyageKey) {
      return { sources: [{ label: "Knowledge base (no embedding key)", type: "system", score: 0 }], context: null };
    }

    const embRes = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${voyageKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "voyage-3-lite", input: [query.slice(0, 16000)] }),
    });
    if (!embRes.ok) throw new Error(`Voyage: ${embRes.status}`);
    const embData = await embRes.json();
    const embedding = embData.data?.[0]?.embedding;
    if (!embedding) throw new Error("No embedding returned");

    // Vector search via Convex HTTP endpoint
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".cloud", ".site") ?? "";
    const searchRes = await fetch(`${convexUrl}/api/vector-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embedding, limit: 5 }),
    });
    if (!searchRes.ok) throw new Error(`Vector search: ${searchRes.status}`);
    const searchData = await searchRes.json();
    const docs = searchData.docs ?? [];

    if (docs.length === 0) {
      return { sources: [], context: null };
    }

    const sources = docs.map((d: { provider: string; key: string; summary: string; score: number }) => ({
      label: `${d.provider} — ${d.key}`,
      type: d.provider === "RevenueCat" ? "doc" : "data",
      score: d.score,
    }));

    const context = `# Retrieved Knowledge Base Documents\n\n${docs
      .map((d: { provider: string; key: string; summary: string; score: number }) =>
        `[${d.provider} — ${d.key} (relevance: ${d.score.toFixed(2)})]\n${d.summary}`
      )
      .join("\n\n---\n\n")}`;

    return { sources, context };
  } catch (err) {
    console.error("[panel] Source retrieval failed:", err);
    return {
      sources: [{ label: "Retrieval error — answering from training knowledge", type: "system", score: 0 }],
      context: null,
    };
  }
}
