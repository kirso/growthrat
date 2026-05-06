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
    return "The active target is Astro with Svelte islands on Cloudflare Workers. Account-backed D1, R2, Queues, Vectorize, a Pipeline stream, and AI Gateway are provisioned; Durable Objects and Workflows are wired in the Worker config and become observable after the growthrat Worker is deployed. AI Search is deferred because account provisioning failed, so Vectorize is the retrieval path.";
  }

  if (normalized.includes("revenuecat") || normalized.includes("subscription")) {
    return "The RevenueCat thesis is that agents need billing primitives they can reason about: products, offerings, entitlements, CustomerInfo, webhooks, Test Store, Charts, and Metrics API access. GrowthRat's public proof package turns those primitives into implementation content, feedback, and growth experiments.";
  }

  if (normalized.includes("interview") || normalized.includes("pass")) {
    return "The strongest interview stance is honest separation: the public application package, D1-backed proof data, Cloudflare resource provisioning, and activation dashboard are real; live RevenueCat operation still requires production Worker deployment, connector secrets, Slack, CMS, Charts, GitHub, and social credentials plus approval, rate, budget, and kill-switch gates.";
  }

  return "GrowthRat is built to prove the RevenueCat Agentic AI and Growth Advocate role through public work: technical content, growth experiments, structured product feedback, community answers, and weekly reports. The current migration moves that proof surface onto Astro, Svelte, and Cloudflare-native agent infrastructure.";
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
