import { getAgentConfig } from "./agent-config";
import { scanRevenueCatGitHubIssues } from "./github";
import { enforceModelPolicy } from "./policy";
import { recordEvent } from "./runtime";

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

function json(value: unknown) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

function extractModelText(output: unknown) {
  if (!output || typeof output !== "object") return "";
  const response = (output as Record<string, unknown>).response;
  return typeof response === "string" ? response.trim() : "";
}

async function draftReply(env: Env, context: string) {
  const policy = await enforceModelPolicy(
    env,
    new Request("https://growthrat.internal/community"),
  );
  if (!policy.ok) {
    return "Draft blocked by model policy. Review the signal manually.";
  }

  const output = await env.AI.run(
    env.AI_CHAT_MODEL || "@cf/meta/llama-3.2-3b-instruct",
    {
      messages: [
        {
          role: "system",
          content:
            "Write a short, useful developer-community reply for RevenueCat agent builders. Do not claim official RevenueCat employment.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nDraft a helpful reply under 120 words.`,
        },
      ],
      max_tokens: 220,
      temperature: 0.2,
    },
    {
      gateway: {
        id: env.AI_GATEWAY_ID,
        collectLog: true,
        metadata: {
          product: "growthrat",
          operation: "community_reply_draft",
          mode: env.APP_MODE,
        },
      },
    },
  );

  return extractModelText(output) || "I can help point you to the relevant RevenueCat docs and verify the implementation path.";
}

export async function scanCommunitySignals(env: Env) {
  const config = await getAgentConfig(env);
  if (!config.isActive) {
    return { scanned: false, reason: "agent config inactive", signals: [] };
  }

  const githubSignals = await scanRevenueCatGitHubIssues(env);
  const stored = [];
  const now = new Date().toISOString();

  for (const signal of githubSignals.slice(0, 20)) {
    const responseDraft = await draftReply(env, signal.context);
    await env.DB.prepare(
      `insert into community_signals (
        id, channel, external_url, topic, context, response_draft,
        quality_status, detail_json, created_at, updated_at
      ) values (?, 'github', ?, ?, ?, ?, 'queued', ?, ?, ?)
      on conflict(channel, external_url) do update set
        context = excluded.context,
        response_draft = excluded.response_draft,
        updated_at = excluded.updated_at`,
    )
      .bind(
        id("sig"),
        signal.url,
        signal.title,
        signal.context,
        responseDraft,
        json({ source: "github_issues" }),
        now,
        now,
      )
      .run();
    stored.push(signal);
  }

  await recordEvent(env, {
    type: "community_signals_scanned",
    path: "/api/community/scan",
    detail: { count: stored.length },
  });

  return { scanned: true, signals: stored };
}

export async function listCommunitySignals(env: Env) {
  const { results } = await env.DB.prepare(
    "select * from community_signals order by created_at desc limit 100",
  ).all();
  return results;
}
