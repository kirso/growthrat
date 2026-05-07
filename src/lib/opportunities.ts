import { listCommunitySignals } from "./community";
import { fetchKeywordIdeas } from "./dataforseo";
import { slugify } from "./experiments";

export type OpportunityLane = "content" | "experiment" | "feedback" | "community";

export type OpportunityComponents = {
  developerPain: number;
  revenueCatFit: number;
  technicalDepth: number;
  demandSignal: number;
  measurableOutcome: number;
  freshness: number;
  confidence: number;
  effortPenalty: number;
  riskPenalty: number;
};

export type OpportunityInput = {
  title: string;
  lane: OpportunityLane;
  audience?: string;
  sourceType?: string;
  sourceUrl?: string;
  sourceIds?: string[];
  components?: Partial<OpportunityComponents>;
  rationale: string;
  recommendedAction: string;
  riskLevel?: "low" | "medium" | "high";
  effortLevel?: "low" | "medium" | "high";
};

export type OpportunityRow = {
  id: string;
  slug: string;
  title: string;
  lane: OpportunityLane | string;
  audience: string;
  status: string;
  source_type: string;
  source_url: string | null;
  source_ids_json: string;
  score: number;
  components_json: string;
  rationale: string;
  recommended_action: string;
  risk_level: string;
  effort_level: string;
  confidence: number;
  last_selected_at: string | null;
  created_at: string;
  updated_at: string;
};

const defaultAudience = "agent developers and subscription-app growth operators";

const seedOpportunities: OpportunityInput[] = [
  {
    title: "RevenueCat Test Store for agent-built apps",
    lane: "content",
    rationale:
      "Agents need deterministic purchase validation before app-store review. Test Store is a high-leverage RevenueCat surface for that workflow.",
    recommendedAction:
      "Publish a source-grounded Test Store implementation guide and benchmark it with an agent-built sample app.",
    components: {
      developerPain: 92,
      revenueCatFit: 96,
      technicalDepth: 88,
      demandSignal: 74,
      measurableOutcome: 82,
      freshness: 86,
      confidence: 82,
      effortPenalty: 18,
      riskPenalty: 10,
    },
    riskLevel: "low",
    effortLevel: "medium",
  },
  {
    title: "Charts plus behavioral analytics decision tree",
    lane: "feedback",
    rationale:
      "Growth operators need to know which decisions RevenueCat Charts should own and which decisions require product analytics.",
    recommendedAction:
      "File a product/docs feedback packet and turn the bridge into a canonical public answer.",
    components: {
      developerPain: 78,
      revenueCatFit: 94,
      technicalDepth: 80,
      demandSignal: 72,
      measurableOutcome: 92,
      freshness: 76,
      confidence: 84,
      effortPenalty: 14,
      riskPenalty: 8,
    },
    riskLevel: "low",
    effortLevel: "low",
  },
  {
    title: "Webhook trust boundaries for autonomous builders",
    lane: "content",
    rationale:
      "Agent-built apps need a safe, idempotent subscriber-sync pattern that says when to trust events and when to re-read subscriber state.",
    recommendedAction:
      "Publish an implementation checklist and community-ready canonical answer.",
    components: {
      developerPain: 88,
      revenueCatFit: 96,
      technicalDepth: 92,
      demandSignal: 70,
      measurableOutcome: 76,
      freshness: 72,
      confidence: 86,
      effortPenalty: 20,
      riskPenalty: 14,
    },
    riskLevel: "medium",
    effortLevel: "medium",
  },
  {
    title: "Agent monetization benchmark",
    lane: "experiment",
    rationale:
      "A repeatable benchmark would show where autonomous agents succeed or stall when integrating RevenueCat.",
    recommendedAction:
      "Run a public benchmark across prompts, docs paths, validation checks, and failure modes.",
    components: {
      developerPain: 84,
      revenueCatFit: 98,
      technicalDepth: 94,
      demandSignal: 78,
      measurableOutcome: 90,
      freshness: 96,
      confidence: 78,
      effortPenalty: 28,
      riskPenalty: 12,
    },
    riskLevel: "medium",
    effortLevel: "high",
  },
];

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

function sourceJson(value: unknown) {
  try {
    return JSON.stringify(Array.isArray(value) ? value : []);
  } catch {
    return "[]";
  }
}

function clampScore(value: number | undefined, fallback: number) {
  const next = Number(value ?? fallback);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(0, Math.min(100, next));
}

export function scoreOpportunity(components: Partial<OpportunityComponents> = {}) {
  const normalized: OpportunityComponents = {
    developerPain: clampScore(components.developerPain, 70),
    revenueCatFit: clampScore(components.revenueCatFit, 80),
    technicalDepth: clampScore(components.technicalDepth, 70),
    demandSignal: clampScore(components.demandSignal, 55),
    measurableOutcome: clampScore(components.measurableOutcome, 65),
    freshness: clampScore(components.freshness, 60),
    confidence: clampScore(components.confidence, 65),
    effortPenalty: clampScore(components.effortPenalty, 15),
    riskPenalty: clampScore(components.riskPenalty, 10),
  };

  const score =
    normalized.developerPain * 0.22 +
    normalized.revenueCatFit * 0.2 +
    normalized.technicalDepth * 0.16 +
    normalized.demandSignal * 0.14 +
    normalized.measurableOutcome * 0.12 +
    normalized.freshness * 0.08 +
    normalized.confidence * 0.08 -
    normalized.effortPenalty -
    normalized.riskPenalty;

  return {
    score: Math.round(Math.max(0, score) * 100) / 100,
    components: normalized,
  };
}

export async function upsertOpportunity(env: Env, input: OpportunityInput) {
  const now = new Date().toISOString();
  const slug = slugify(input.title);
  const scored = scoreOpportunity(input.components);

  await env.DB.prepare(
    `insert into opportunities (
      id, slug, title, lane, audience, status, source_type, source_url,
      source_ids_json, score, components_json, rationale, recommended_action,
      risk_level, effort_level, confidence, created_at, updated_at
    ) values (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    on conflict(slug) do update set
      title = excluded.title,
      lane = excluded.lane,
      audience = excluded.audience,
      source_type = excluded.source_type,
      source_url = excluded.source_url,
      source_ids_json = excluded.source_ids_json,
      score = excluded.score,
      components_json = excluded.components_json,
      rationale = excluded.rationale,
      recommended_action = excluded.recommended_action,
      risk_level = excluded.risk_level,
      effort_level = excluded.effort_level,
      confidence = excluded.confidence,
      updated_at = excluded.updated_at`,
  )
    .bind(
      id("opp"),
      slug,
      input.title,
      input.lane,
      input.audience ?? defaultAudience,
      input.sourceType ?? "synthesized",
      input.sourceUrl ?? null,
      sourceJson(input.sourceIds),
      scored.score,
      json(scored.components),
      input.rationale,
      input.recommendedAction,
      input.riskLevel ?? "medium",
      input.effortLevel ?? "medium",
      scored.components.confidence,
      now,
      now,
    )
    .run();

  return await env.DB.prepare("select * from opportunities where slug = ? limit 1")
    .bind(slug)
    .first<OpportunityRow>();
}

async function keywordOpportunities(env: Env): Promise<OpportunityInput[]> {
  const seeds = [
    "RevenueCat agent built apps",
    "RevenueCat webhooks for AI agents",
    "mobile subscription growth experiments",
    "RevenueCat charts product analytics",
    "RevenueCat test store automation",
  ];
  const ideas = await fetchKeywordIdeas(env, seeds).catch(() => []);

  return ideas.slice(0, 8).map((idea) => {
    const volume = idea.volume ?? 0;
    const difficulty = idea.difficulty ?? 60;
    return {
      title: idea.keyword,
      lane: "content",
      sourceType: "dataforseo",
      rationale: `Keyword demand signal from DataForSEO. Volume: ${volume}; difficulty: ${difficulty}.`,
      recommendedAction:
        "Create a source-grounded implementation article or canonical answer and attach tracking links.",
      components: {
        developerPain: 68,
        revenueCatFit: /revenuecat/i.test(idea.keyword) ? 92 : 72,
        technicalDepth: /webhook|api|charts|test|sdk/i.test(idea.keyword) ? 86 : 68,
        demandSignal: Math.max(40, Math.min(96, volume / 20)),
        measurableOutcome: 72,
        freshness: 70,
        confidence: Math.max(52, 100 - difficulty / 2),
        effortPenalty: 16,
        riskPenalty: 8,
      },
      riskLevel: "low",
      effortLevel: "medium",
    } satisfies OpportunityInput;
  });
}

async function communityOpportunities(env: Env): Promise<OpportunityInput[]> {
  const signals = await listCommunitySignals(env).catch(() => []);
  return signals.slice(0, 8).map((signal) => {
    const record = signal as Record<string, unknown>;
    const topic =
      typeof record.topic === "string" ? record.topic : "RevenueCat community signal";
    const url = typeof record.external_url === "string" ? record.external_url : undefined;
    return {
      title: topic,
      lane: "community",
      sourceType: "community_signal",
      sourceUrl: url,
      sourceIds: [String(record.id ?? url ?? topic)],
      rationale:
        "Observed community signal. Turn repeated questions into useful replies, canonical answers, and product feedback.",
      recommendedAction:
        "Draft a source-cited reply and decide whether this should become a canonical public answer.",
      components: {
        developerPain: 82,
        revenueCatFit: 88,
        technicalDepth: 72,
        demandSignal: 64,
        measurableOutcome: 68,
        freshness: 90,
        confidence: 74,
        effortPenalty: 10,
        riskPenalty: 18,
      },
      riskLevel: "medium",
      effortLevel: "low",
    } satisfies OpportunityInput;
  });
}

export async function refreshOpportunities(env: Env) {
  const candidates = [
    ...seedOpportunities,
    ...(await keywordOpportunities(env)),
    ...(await communityOpportunities(env)),
  ];
  const rows: OpportunityRow[] = [];

  for (const candidate of candidates) {
    const row = await upsertOpportunity(env, candidate).catch(() => null);
    if (row) rows.push(row);
  }

  return rows.sort((left, right) => Number(right.score) - Number(left.score));
}

export async function listTopOpportunities(
  env: Env,
  input: { lane?: OpportunityLane; limit?: number } = {},
) {
  const limit = Math.max(1, Math.min(50, input.limit ?? 10));
  const rows = input.lane
    ? await env.DB.prepare(
        "select * from opportunities where status = 'open' and lane = ? order by score desc limit ?",
      )
        .bind(input.lane, limit)
        .all<OpportunityRow>()
    : await env.DB.prepare(
        "select * from opportunities where status = 'open' order by score desc limit ?",
      )
        .bind(limit)
        .all<OpportunityRow>();

  return rows.results;
}

export async function planWeeklyOpportunities(env: Env) {
  await refreshOpportunities(env).catch(() => []);
  let top = await listTopOpportunities(env, { limit: 12 }).catch(() => []);
  if (top.length === 0) {
    const seeded = [];
    for (const candidate of seedOpportunities) {
      const row = await upsertOpportunity(env, candidate).catch(() => null);
      if (row) seeded.push(row);
    }
    top = seeded.sort((left, right) => Number(right.score) - Number(left.score));
  }

  const content = top.filter((item) => item.lane === "content").slice(0, 2);
  const experiment = top.find((item) => item.lane === "experiment") ?? top[0] ?? null;
  const feedback = top
    .filter((item) => item.lane === "feedback" || item.lane === "community")
    .slice(0, 3);

  const now = new Date().toISOString();
  for (const selected of [...content, ...(experiment ? [experiment] : []), ...feedback]) {
    await env.DB.prepare(
      "update opportunities set last_selected_at = ?, updated_at = ? where id = ?",
    )
      .bind(now, now, selected.id)
      .run()
      .catch(() => undefined);
  }

  return {
    selected: top.slice(0, 6),
    contentTopics: content.map((item) => item.title),
    feedbackTopics: feedback.map((item) => item.title),
    experimentTopic: experiment?.title ?? null,
  };
}

