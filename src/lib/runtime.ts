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
    },
    bindings: [
      "Astro",
      "Svelte islands",
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
    return "The infrastructure foundation is a Cloudflare-hosted proof app with state, artifacts, queues, workflow wiring, model routing, and a provisioned Vectorize index. The product claim should stay higher level: GrowthRat is an autonomous advocate loop. Important truth: the Vectorize index is not populated yet, so live source-grounded RevenueCat answers still need docs ingestion and citations.";
  }

  if (normalized.includes("revenuecat") || normalized.includes("subscription")) {
    return "The RevenueCat thesis is that agents need billing primitives they can reason about: products, offerings, entitlements, CustomerInfo, webhooks, Test Store, Charts, and Metrics API access. GrowthRat has public proof artifacts around those primitives, but the live agent still needs indexed docs and RevenueCat credentials before it should answer as an authoritative source.";
  }

  if (normalized.includes("interview") || normalized.includes("pass")) {
    return "The strongest interview stance is honest separation: the public application package, proof artifacts, product reasoning, and activation dashboard are real; live RevenueCat operation still requires production deployment, docs ingestion, connector secrets, Slack, CMS, Charts, GitHub, social credentials, approval policy, rate limits, budget controls, and a tested kill switch.";
  }

  return "GrowthRat is built to prove the RevenueCat Agentic AI and Growth Advocate role through public work: technical content, growth experiments, structured product feedback, community answers, and weekly reports. It is a credible pre-production advocate system, but it is not fully autonomous live operation until retrieval, deployment, connectors, approvals, and analytics are finished.";
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
