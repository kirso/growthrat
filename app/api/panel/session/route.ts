import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return new Response("Missing prompt parameter", { status: 400 });
  }

  // Auth: require a session token to prevent unauthorized LLM usage
  // In production, use a proper session/JWT. For now, check a simple token.
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

      // Step 2: Retrieve sources
      const sources = retrieveSources(prompt);
      send("progress", { step: "sources_retrieved", sources, elapsed_ms: elapsed() });

      // Step 3: Reasoning
      send("progress", {
        step: "reasoning",
        content: "Building response from retrieved sources and RevenueCat knowledge...",
        elapsed_ms: elapsed(),
      });

      // Step 4: Stream LLM response
      try {
        const model = process.env.ANTHROPIC_API_KEY
          ? anthropic("claude-sonnet-4-20250514")
          : process.env.OPENAI_API_KEY
            ? openai("gpt-4o-mini")
            : null;

        if (!model) {
          send("stream", {
            step: "output_chunk",
            token: "[No LLM configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY to enable live responses.]",
            elapsed_ms: elapsed(),
          });
        } else {
          const voice = GROWTHCAT_VOICE_PROFILE;
          const sourcesText = sources
            .map((s) => `- [${s.label}] (${s.type})`)
            .join("\n");

          const systemPrompt = `You are ${voice.agentName} in a live panel interview at RevenueCat.
The interviewer is watching you think and work in real time.
Tone: ${voice.toneTraits.join(", ")}
Core themes: ${voice.recurringThemes.map((t) => `- ${t}`).join("\n")}
IMPORTANT: Show your reasoning. Cite specific sources. Be honest about uncertainty.
${voice.disclosureLine}`;

          const userPrompt = `Panel prompt: ${prompt}

Retrieved sources and context:
${sourcesText}

Respond to this prompt. Show your thinking:
1. How you understand the prompt
2. Relevant sources
3. Substantive answer
4. Caveats or uncertainty`;

          const result = streamText({
            model,
            system: systemPrompt,
            prompt: userPrompt,
            maxTokens: 4096,
            temperature: 0.3,
          });

          for await (const chunk of (await result).textStream) {
            send("stream", { step: "output_chunk", token: chunk, elapsed_ms: elapsed() });
          }
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

function retrieveSources(prompt: string): { label: string; type: string }[] {
  const p = prompt.toLowerCase();
  const sources: { label: string; type: string }[] = [
    { label: "RevenueCat REST API v2 Docs", type: "public_product" },
  ];

  if (["webhook", "event", "subscription", "lifecycle"].some((k) => p.includes(k))) {
    sources.push({ label: "RevenueCat Webhook Event Types", type: "public_product" });
  }
  if (["offering", "entitlement", "package", "product"].some((k) => p.includes(k))) {
    sources.push({ label: "RevenueCat Offerings & Entitlements", type: "public_product" });
  }
  if (["agent", "autonomous", "ai", "programmatic"].some((k) => p.includes(k))) {
    sources.push({ label: "Agent-Built App Patterns", type: "market_intelligence" });
    sources.push({ label: "DataForSEO Keyword Data", type: "market_intelligence" });
  }
  if (["growth", "experiment", "metric", "churn"].some((k) => p.includes(k))) {
    sources.push({ label: "Growth Experiment Framework", type: "internal_config" });
    sources.push({ label: "KPI Tree", type: "internal_config" });
  }
  if (["content", "blog", "tutorial", "guide"].some((k) => p.includes(k))) {
    sources.push({ label: "Content Strategy Config", type: "internal_config" });
    sources.push({ label: "Publish Quality Gates (8 gates)", type: "internal_config" });
  }
  if (["chart", "analytic", "mrr", "revenue"].some((k) => p.includes(k))) {
    sources.push({ label: "RevenueCat Charts (dashboard-only)", type: "public_product" });
  }

  sources.push({ label: "GrowthCat Voice Profile", type: "internal_config" });
  return sources;
}
