import { articles } from "../content/articles";

export type RuntimeSnapshot = {
  mode: string;
  source: "d1" | "fallback";
  counts: {
    artifacts: number;
    experiments: number;
    feedback: number;
    weeklyReports: number;
    events: number;
    experimentEvents: number;
    metricSnapshots: number;
    readouts: number;
    sourceChunks: number;
    policyCounters: number;
  };
  bindings: string[];
};

export type GrowthRatEvent = {
  type: string;
  path?: string;
  detail?: Record<string, unknown>;
};

const countTables = [
  ["artifacts", "artifacts"],
  ["experiments", "experiments"],
  ["feedback", "feedback_items"],
  ["weeklyReports", "weekly_reports"],
  ["events", "usage_events"],
  ["experimentEvents", "experiment_events"],
  ["metricSnapshots", "experiment_metric_snapshots"],
  ["readouts", "experiment_readouts"],
  ["sourceChunks", "source_chunks"],
  ["policyCounters", "policy_counters"],
] as const;

export function fallbackSnapshot(mode = "interview_proof"): RuntimeSnapshot {
  return {
    mode,
    source: "fallback",
    counts: {
      artifacts: articles.length,
      experiments: 1,
      feedback: 3,
      weeklyReports: 1,
      events: 0,
      experimentEvents: 0,
      metricSnapshots: 0,
      readouts: 0,
      sourceChunks: 0,
      policyCounters: 0,
    },
    bindings: [
      "Astro",
      "Svelte components",
      "Workers",
      "D1",
      "R2",
      "Queues",
      "Durable Objects",
      "Workflows",
      "Pipelines",
      "AI Gateway",
      "Vectorize",
    ],
  };
}

export async function getRuntimeSnapshot(env: Env): Promise<RuntimeSnapshot> {
  const mode = env.APP_MODE || "interview_proof";

  try {
    const entries = await Promise.all(
      countTables.map(async ([key, table]) => {
        const row = await env.DB.prepare(`select count(*) as count from ${table}`).first<{
          count: number;
        }>();
        return [key, Number(row?.count ?? 0)] as const;
      }),
    );

    return {
      ...fallbackSnapshot(mode),
      source: "d1",
      counts: Object.fromEntries(entries) as RuntimeSnapshot["counts"],
    };
  } catch {
    return fallbackSnapshot(mode);
  }
}

export function buildChatAnswer(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("cloudflare") || normalized.includes("d1")) {
    return "The infrastructure foundation is a Cloudflare-hosted advocate loop with D1 state, R2 artifacts, Queues, Workflows, Durable Object agent state, Pipelines, Vectorize retrieval, and Workers AI routed through AI Gateway. The important boundary is access: RevenueCat-owned Slack, CMS, GitHub, social, and private analytics credentials still need post-hire activation.";
  }

  if (normalized.includes("revenuecat") || normalized.includes("subscription")) {
    return "The RevenueCat thesis is that agents need billing primitives they can reason about: products, offerings, entitlements, CustomerInfo, webhooks, Test Store, Charts, and Metrics API access. GrowthRat now has a source-ingestion and citation path for those primitives; it still needs RevenueCat credentials before it can pull private Charts data or act inside RevenueCat-owned channels.";
  }

  if (normalized.includes("interview") || normalized.includes("pass")) {
    return "The strongest interview stance is honest separation: the public application package, proof artifacts, deployed Worker, experiment loop, AI Gateway chat path, retrieval ingestion endpoint, budget/rate limits, RC representative session, connected-account registry, and kill switch are real; live RevenueCat operation still requires RC-owned accounts, private context, and approved external channel access.";
  }

  return "GrowthRat is built to prove the RevenueCat Agentic AI and Growth Advocate role through public work: technical content, growth experiments, structured product feedback, community answers, and weekly reports. It is a deployed gated advocate system; the remaining live-operation boundary is RevenueCat-owned access and connector approval.";
}

export async function recordEvent(env: Env, event: GrowthRatEvent): Promise<void> {
  const payload = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...event,
  };

  const tasks: Promise<unknown>[] = [];
  const bindings = env as Partial<Env>;

  try {
    if (bindings.DB) {
      tasks.push(
        bindings.DB.prepare(
          "insert into usage_events (id, event_type, path, detail_json, created_at) values (?, ?, ?, ?, ?)",
        )
          .bind(
            payload.id,
            payload.type,
            payload.path ?? null,
            JSON.stringify(payload.detail ?? {}),
            payload.created_at,
          )
          .run(),
      );
    }
  } catch {
    // Event logging must never break public proof endpoints.
  }

  try {
    if (bindings.GROWTHRAT_QUEUE) {
      tasks.push(bindings.GROWTHRAT_QUEUE.send(payload));
    }
  } catch {
    // Event logging must never break public proof endpoints.
  }

  try {
    if (bindings.EVENT_PIPELINE) {
      tasks.push(bindings.EVENT_PIPELINE.send([{ value: payload }]));
    }
  } catch {
    // Event logging must never break public proof endpoints.
  }

  await Promise.allSettled(tasks);
}
