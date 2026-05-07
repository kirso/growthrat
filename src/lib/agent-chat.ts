import { buildChatAnswer, recordEvent } from "./runtime";
import { enforceChatPolicy, enforceModelPolicy } from "./policy";
import { sendLangfuseTrace } from "./observability/langfuse";
import { finishRun, recordRunEvent, startRun } from "./run-ledger";
import {
  getSourceStats,
  retrieveSources,
  sourceContextBlock,
  type RetrievedSource,
} from "./sources";

export type AgentChatResponse = {
  answer: string;
  mode: string;
  threadId: string;
  source: "rag" | "deterministic" | "blocked";
  policy: {
    chat: string;
    model: string;
  };
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

function envNumber(env: Env, key: string, fallback: number) {
  const value = envString(env, key, "");
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function citationsForSources(sources: RetrievedSource[]) {
  return sources.map((source) => ({
    title: source.title,
    url: source.url,
    score: source.score,
  }));
}

async function recordChatMessage(
  env: Env,
  threadId: string,
  role: "user" | "assistant",
  content: string,
  detail: Record<string, unknown> = {},
) {
  await env.DB.prepare(
    "insert into chat_messages (id, thread_id, role, content, detail_json, created_at) values (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      crypto.randomUUID(),
      threadId,
      role,
      content.slice(0, 8000),
      JSON.stringify(detail),
      new Date().toISOString(),
    )
    .run();
}

async function finishChatRun(
  env: Env,
  input: {
    runId: string | null;
    traceId: string;
    status: "completed" | "blocked";
    message: string;
    response: AgentChatResponse | { error: string; detail: string };
    citations: number;
    reason?: string;
  },
) {
  await finishRun(env, {
    runId: input.runId,
    status: input.status,
    output: {
      source: "source" in input.response ? input.response.source : "blocked",
      citations: input.citations,
      reason: input.reason ?? null,
    },
  });
  await sendLangfuseTrace(env, {
    traceId: input.traceId,
    name: "agent_chat",
    userId: "public",
    input: input.message,
    output: input.response,
    metadata: {
      mode: env.APP_MODE,
      status: input.status,
      citations: input.citations,
      reason: input.reason ?? null,
      runId: input.runId,
    },
    events: [
      {
        name: input.status === "blocked" ? "chat_blocked" : "chat_answered",
        output: {
          citations: input.citations,
          reason: input.reason ?? null,
        },
      },
    ],
  });
}

function deterministicResponse(
  env: Env,
  message: string,
  threadId: string,
  chatPolicyDetail: string,
  modelPolicyDetail: string,
  sources: RetrievedSource[] = [],
): AgentChatResponse {
  return {
    answer: buildChatAnswer(message),
    mode: env.APP_MODE,
    threadId,
    source: modelPolicyDetail === "blocked" ? "blocked" : "deterministic",
    policy: {
      chat: chatPolicyDetail,
      model: modelPolicyDetail,
    },
    citations: citationsForSources(sources),
    aiGatewayLogId: null,
  };
}

function extractModelText(output: unknown) {
  if (!output || typeof output !== "object") return "";
  const record = output as Record<string, unknown>;
  const response = record.response;
  if (typeof response === "string") return response.trim();

  const result = record.result;
  if (typeof result === "string") return result.trim();

  return "";
}

export async function answerAgentChat(
  env: Env,
  request: Request,
  message: string,
  threadId: string = crypto.randomUUID(),
): Promise<{ status: number; body: AgentChatResponse | { error: string; detail: string } }> {
  await recordChatMessage(env, threadId, "user", message).catch(() => undefined);
  const traceId = crypto.randomUUID().replaceAll("-", "");
  const runId = await startRun(env, {
    runType: "agent_chat",
    triggerType: "http",
    title: "Source-grounded chat",
    input: { message: message.slice(0, 2000), threadId },
    langfuseTraceId: traceId,
  });
  const chatPolicy = await enforceChatPolicy(env, request, message);
  if (!chatPolicy.ok) {
    await recordEvent(env, {
      type: "chat_blocked",
      path: "/api/chat",
      detail: {
        error: chatPolicy.error,
        status: chatPolicy.status,
      },
    });
    await recordRunEvent(env, {
      runId,
      eventType: "chat_policy_blocked",
      status: "blocked",
      detail: {
        error: chatPolicy.error,
        detail: chatPolicy.detail,
      },
    });
    await finishChatRun(env, {
      runId,
      traceId,
      status: "blocked",
      message,
      response: {
        error: chatPolicy.error,
        detail: chatPolicy.detail,
      },
      citations: 0,
      reason: chatPolicy.detail,
    });

    return {
      status: chatPolicy.status,
      body: {
        error: chatPolicy.error,
        detail: chatPolicy.detail,
      },
    };
  }

  const sourceStats = await getSourceStats(env).catch(() => ({
    indexedChunks: 0,
  }));
  const sources =
    sourceStats.indexedChunks > 0
      ? await retrieveSources(env, message).catch(() => [])
      : [];
  if (sources.length === 0) {
    const response = deterministicResponse(
      env,
      message,
      threadId,
      chatPolicy.detail,
      "source retrieval returned no indexed sources",
      sources,
    );

    await recordEvent(env, {
      type: "chat_answered_without_model",
      path: "/api/chat",
      detail: {
        reason: "source retrieval returned no indexed sources",
        citations: sources.length,
      },
    });
    await recordChatMessage(env, threadId, "assistant", response.answer, {
      source: response.source,
      citations: sources.length,
    }).catch(() => undefined);
    await recordRunEvent(env, {
      runId,
      eventType: "chat_answered_without_model",
      status: "succeeded",
      detail: { reason: "source retrieval returned no indexed sources" },
    });
    await finishChatRun(env, {
      runId,
      traceId,
      status: "completed",
      message,
      response,
      citations: sources.length,
      reason: "source retrieval returned no indexed sources",
    });

    return { status: 200, body: response };
  }

  const modelPolicy = await enforceModelPolicy(env, request);

  if (!modelPolicy.ok) {
    const reason = modelPolicy.detail;
    const response = deterministicResponse(
      env,
      message,
      threadId,
      chatPolicy.detail,
      reason,
      sources,
    );

    await recordEvent(env, {
      type: "chat_answered_without_model",
      path: "/api/chat",
      detail: {
        reason,
        citations: sources.length,
      },
    });
    await recordChatMessage(env, threadId, "assistant", response.answer, {
      source: response.source,
      citations: sources.length,
    }).catch(() => undefined);
    await recordRunEvent(env, {
      runId,
      eventType: "model_policy_blocked",
      status: "blocked",
      detail: { reason },
    });
    await finishChatRun(env, {
      runId,
      traceId,
      status: "completed",
      message,
      response,
      citations: sources.length,
      reason,
    });

    return { status: 200, body: response };
  }

  const prompt = [
    "You are GrowthRat, an autonomous developer advocacy and growth agent applying to RevenueCat.",
    "Answer only from the provided sources and from the runtime facts in the prompt.",
    "If a requested capability is not implemented, say so directly.",
    "If a source title directly names the concept in the question, treat that source as present and do not say you could not find it.",
    "When the question asks about RevenueCat, prioritize RevenueCat sources over GrowthRat proof artifacts.",
    "Do not recommend GrowthRat articles or internal proof artifacts unless the user asks about GrowthRat itself.",
    "Keep answers concise, technical, and evidence-backed. Do not claim RevenueCat affiliation beyond independent applicant status.",
    "",
    `Runtime mode: ${env.APP_MODE}`,
    `Question: ${message}`,
    "",
    "Sources:",
    sourceContextBlock(sources),
  ].join("\n");

  const output = await env.AI.run(
    envString(env, "AI_CHAT_MODEL", defaultModel),
    {
      messages: [
        {
          role: "system",
          content:
            "You answer as GrowthRat. You must be blunt about gaps, avoid unsupported marketing claims, and cite source numbers in plain text when useful.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: envNumber(env, "MAX_AI_OUTPUT_TOKENS", 500),
      temperature: 0,
    },
    {
      gateway: {
        id: env.AI_GATEWAY_ID,
        collectLog: true,
        metadata: {
          product: "growthrat",
          operation: "chat",
          mode: env.APP_MODE,
        },
      },
    },
  );

  const answer = extractModelText(output) || buildChatAnswer(message);
  const aiGatewayLogId = env.AI.aiGatewayLogId ?? null;

  await recordEvent(env, {
    type: "chat_answered_with_model",
    path: "/api/chat",
    detail: {
      model: envString(env, "AI_CHAT_MODEL", defaultModel),
      citations: sources.length,
      aiGatewayLogId,
    },
  });
  await recordChatMessage(env, threadId, "assistant", answer, {
    source: "rag",
    citations: sources.length,
    aiGatewayLogId,
  }).catch(() => undefined);

  const response: AgentChatResponse = {
    answer,
    mode: env.APP_MODE,
    threadId,
    source: "rag",
    policy: {
      chat: chatPolicy.detail,
      model: modelPolicy.detail,
    },
    citations: citationsForSources(sources),
    aiGatewayLogId,
  };
  await recordRunEvent(env, {
    runId,
    eventType: "chat_answered_with_model",
    status: "succeeded",
    detail: {
      citations: sources.length,
      aiGatewayLogId,
    },
  });
  await finishChatRun(env, {
    runId,
    traceId,
    status: "completed",
    message,
    response,
    citations: sources.length,
  });

  return {
    status: 200,
    body: response,
  };
}
