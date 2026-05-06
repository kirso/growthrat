import { enforceModelPolicy } from "./policy";
import { getSourceStats, retrieveSources, sourceContextBlock } from "./sources";

export type ContentDraft = {
  topic: string;
  title: string;
  status: "draft" | "model_gated" | "source_gated";
  body: string;
  citations: Array<{
    title: string;
    url: string | null;
    score: number | null;
  }>;
  aiGatewayLogId: string | null;
};

const defaultModel = "@cf/meta/llama-3.2-3b-instruct";

function envString(env: Env, key: string, fallback: string) {
  const value = (env as unknown as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function extractModelText(output: unknown) {
  if (!output || typeof output !== "object") return "";
  const response = (output as Record<string, unknown>).response;
  return typeof response === "string" ? response.trim() : "";
}

function deterministicDraft(topic: string, reason: string): ContentDraft {
  return {
    topic,
    title: topic,
    status: reason === "source" ? "source_gated" : "model_gated",
    body:
      reason === "source"
        ? "Draft generation is blocked because no indexed RevenueCat source chunks were available. Ingest sources before publishing."
        : "Draft generation is blocked by model policy. The operator must inspect policy, rate limits, budget counters, and kill-switch state before retrying.",
    citations: [],
    aiGatewayLogId: null,
  };
}

export async function generateSourceGroundedDraft(env: Env, topic: string) {
  const sourceStats = await getSourceStats(env).catch(() => ({
    indexedChunks: 0,
  }));
  const sources =
    sourceStats.indexedChunks > 0
      ? await retrieveSources(env, topic, 5).catch(() => [])
      : [];
  if (sources.length === 0) return deterministicDraft(topic, "source");

  const request = new Request("https://growthrat.internal/workflow/model");
  const policy = await enforceModelPolicy(env, request);
  if (!policy.ok) return deterministicDraft(topic, "model");

  const output = await env.AI.run(
    envString(env, "AI_CHAT_MODEL", defaultModel),
    {
      messages: [
        {
          role: "system",
          content:
            "Write as GrowthRat for RevenueCat's agent-builder audience. Use only provided sources. Be concrete, technical, and concise.",
        },
        {
          role: "user",
          content: [
            `Draft a technical article outline and opening section for: ${topic}`,
            "Include: target reader, thesis, source-backed outline, measurement angle, and explicit confidence boundary.",
            "",
            "Sources:",
            sourceContextBlock(sources),
          ].join("\n"),
        },
      ],
      max_tokens: 700,
      temperature: 0.25,
    },
    {
      gateway: {
        id: env.AI_GATEWAY_ID,
        collectLog: true,
        metadata: {
          product: "growthrat",
          operation: "content_draft",
          mode: env.APP_MODE,
        },
      },
    },
  );

  return {
    topic,
    title: topic,
    status: "draft",
    body: extractModelText(output),
    citations: sources.map((source) => ({
      title: source.title,
      url: source.url,
      score: source.score,
    })),
    aiGatewayLogId: env.AI.aiGatewayLogId ?? null,
  } satisfies ContentDraft;
}
