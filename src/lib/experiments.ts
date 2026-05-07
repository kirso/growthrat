export const allowedExperimentEventTypes = [
  "page_view",
  "tracking_click",
  "cta_click",
  "qualified_click",
  "signup",
  "paywall_view",
  "trial_start",
  "purchase",
  "community_reply",
  "manual_signal",
] as const;

export type ExperimentEventType = (typeof allowedExperimentEventTypes)[number];

export type ExperimentRow = {
  id: string;
  slug: string;
  title: string;
  hypothesis: string;
  status: string;
  metrics_json: string;
  audience: string;
  channel: string;
  decision_rule: string;
  started_at: string | null;
  ended_at: string | null;
  owner: string;
  source_doc: string | null;
  created_at: string;
  updated_at: string;
};

export type ExperimentVariantRow = {
  id: string;
  experiment_id: string;
  variant_key: string;
  name: string;
  hypothesis_delta: string | null;
  hook: string | null;
  cta: string | null;
  destination_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ExperimentAssetRow = {
  id: string;
  experiment_id: string;
  variant_id: string | null;
  asset_type: string;
  channel: string;
  title: string;
  url: string | null;
  tracking_id: string;
  status: string;
  published_at: string | null;
  metadata_json: string;
  created_at: string;
  updated_at: string;
};

export type ExperimentMetricSnapshotRow = {
  id: string;
  experiment_id: string;
  variant_id: string | null;
  source: string;
  metric_key: string;
  metric_value: number;
  window_start: string | null;
  window_end: string | null;
  detail_json: string;
  captured_at: string;
};

export type ExperimentReadoutRow = {
  id: string;
  experiment_id: string;
  status: string;
  decision: string;
  summary: string;
  learning: string;
  next_action: string;
  metrics_json: string;
  created_at: string;
};

export type ExperimentEventTotal = {
  event_type: ExperimentEventType | string;
  count: number;
};

export type ExperimentMetricTotal = {
  source: string;
  metric_key: string;
  variant_id: string | null;
  total: number;
  latest_captured_at: string | null;
};

export type ExperimentDetail = ExperimentRow & {
  variants: ExperimentVariantRow[];
  assets: ExperimentAssetRow[];
  eventTotals: ExperimentEventTotal[];
  metricTotals: ExperimentMetricTotal[];
  latestMetrics: ExperimentMetricSnapshotRow[];
  readouts: ExperimentReadoutRow[];
};

export type CreateExperimentInput = {
  title?: unknown;
  slug?: unknown;
  hypothesis?: unknown;
  audience?: unknown;
  channel?: unknown;
  decisionRule?: unknown;
  owner?: unknown;
  sourceDoc?: unknown;
  variants?: unknown;
};

export type CreateVariantInput = {
  key?: unknown;
  name?: unknown;
  hypothesisDelta?: unknown;
  hook?: unknown;
  cta?: unknown;
  destinationUrl?: unknown;
};

export type MetricSnapshotInput = {
  source?: unknown;
  metricKey?: unknown;
  value?: unknown;
  variantKey?: unknown;
  windowStart?: unknown;
  windowEnd?: unknown;
  detail?: unknown;
};

export type ReadoutInput = {
  status?: unknown;
  decision?: unknown;
  summary?: unknown;
  learning?: unknown;
  nextAction?: unknown;
};

export type ExperimentEventInput = {
  eventType?: unknown;
  experimentId?: unknown;
  variantId?: unknown;
  assetId?: unknown;
  trackingId?: unknown;
  channel?: unknown;
  source?: unknown;
  path?: unknown;
  referrer?: unknown;
  userAgent?: unknown;
  detail?: unknown;
};

const defaultExperimentTitle =
  "Week-One RevenueCat Agent Advocacy Distribution Loop";

const maxTextLength = 2_000;

const defaultVariants: CreateVariantInput[] = [
  {
    key: "control",
    name: "Control",
    hypothesisDelta: "Baseline message and destination.",
    hook: "Baseline RevenueCat agent advocacy message.",
    cta: "Open the proof surface",
    destinationUrl: "/proof-pack",
  },
];

function text(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > maxTextLength ? trimmed.slice(0, maxTextLength) : trimmed;
}

function nullableText(value: unknown) {
  const next = text(value);
  return next ? next : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeSlug(value: unknown, fallback: string) {
  const slug = slugify(text(value));
  return slug || fallback;
}

function generateId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function isVariantInput(value: unknown): value is CreateVariantInput {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeVariants(value: unknown): CreateVariantInput[] {
  if (!Array.isArray(value)) {
    return defaultVariants;
  }

  const variants = value.filter(isVariantInput).slice(0, 6);
  return variants.length > 0 ? variants : defaultVariants;
}

export function normalizeEventType(value: unknown): ExperimentEventType {
  const next = text(value);
  return allowedExperimentEventTypes.includes(next as ExperimentEventType)
    ? (next as ExperimentEventType)
    : "manual_signal";
}

function normalizeDestination(value: unknown) {
  const destination = text(value, "/experiments");
  if (destination.startsWith("/")) return destination;

  try {
    const url = new URL(destination);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return "/experiments";
  }

  return "/experiments";
}

async function findExperiment(db: D1Database, identifier: string) {
  return db
    .prepare(
      "select * from experiments where id = ? or slug = ? order by created_at desc limit 1",
    )
    .bind(identifier, identifier)
    .first<ExperimentRow>();
}

async function findVariant(
  db: D1Database,
  experimentId: string,
  variantKeyOrId: string | null,
) {
  if (!variantKeyOrId) return null;

  return db
    .prepare(
      "select * from experiment_variants where experiment_id = ? and (id = ? or variant_key = ?) limit 1",
    )
    .bind(experimentId, variantKeyOrId, variantKeyOrId)
    .first<ExperimentVariantRow>();
}

export async function listExperiments(env: Env) {
  const { results } = await env.DB.prepare(
    "select * from experiments order by created_at desc",
  ).all<ExperimentRow>();

  const details: ExperimentDetail[] = [];
  for (const row of results) {
    const detail = await getExperimentDetail(env, row.id);
    if (detail) details.push(detail);
  }

  return details;
}

export async function getExperimentDetail(env: Env, identifier: string) {
  const experiment = await findExperiment(env.DB, identifier);
  if (!experiment) return null;

  const [variants, assets, eventTotals, metricTotals, latestMetrics, readouts] =
    await Promise.all([
      env.DB.prepare(
        "select * from experiment_variants where experiment_id = ? order by created_at asc",
      )
        .bind(experiment.id)
        .all<ExperimentVariantRow>(),
      env.DB.prepare(
        "select * from experiment_assets where experiment_id = ? order by created_at asc",
      )
        .bind(experiment.id)
        .all<ExperimentAssetRow>(),
      env.DB.prepare(
        "select event_type, count(*) as count from experiment_events where experiment_id = ? group by event_type order by count desc",
      )
        .bind(experiment.id)
        .all<ExperimentEventTotal>(),
      env.DB.prepare(
        "select source, metric_key, variant_id, sum(metric_value) as total, max(captured_at) as latest_captured_at from experiment_metric_snapshots where experiment_id = ? group by source, metric_key, variant_id order by metric_key asc",
      )
        .bind(experiment.id)
        .all<ExperimentMetricTotal>(),
      env.DB.prepare(
        "select * from experiment_metric_snapshots where experiment_id = ? order by captured_at desc limit 40",
      )
        .bind(experiment.id)
        .all<ExperimentMetricSnapshotRow>(),
      env.DB.prepare(
        "select * from experiment_readouts where experiment_id = ? order by created_at desc",
      )
        .bind(experiment.id)
        .all<ExperimentReadoutRow>(),
    ]);

  return {
    ...experiment,
    variants: variants.results,
    assets: assets.results,
    eventTotals: eventTotals.results.map((row) => ({
      ...row,
      count: Number(row.count),
    })),
    metricTotals: metricTotals.results.map((row) => ({
      ...row,
      total: Number(row.total),
    })),
    latestMetrics: latestMetrics.results,
    readouts: readouts.results,
  } satisfies ExperimentDetail;
}

export async function createExperiment(env: Env, input: CreateExperimentInput) {
  const now = new Date().toISOString();
  const title = text(input.title, defaultExperimentTitle);
  const id = generateId("exp");
  const baseSlug = safeSlug(input.slug, slugify(title));
  const slug = text(input.slug) ? baseSlug : `${baseSlug}-${id.slice(-6)}`;
  const variants = normalizeVariants(input.variants);

  await env.DB.prepare(
    `insert into experiments (
      id,
      slug,
      title,
      hypothesis,
      status,
      metrics_json,
      audience,
      channel,
      decision_rule,
      started_at,
      owner,
      source_doc,
      created_at,
      updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      slug,
      title,
      text(
        input.hypothesis,
        "A specific agent-developer advocacy message will produce measurable qualified interest.",
      ),
      "running",
      safeJson({
        primary: ["qualified_clicks", "cta_clicks", "saves", "replies"],
        monetization: ["trial_start", "conversion_to_paying", "revenue"],
      }),
      text(input.audience, "agent developers evaluating RevenueCat"),
      text(input.channel, "owned site and approved developer channels"),
      text(
        input.decisionRule,
        "A win requires stronger qualified interest and a clear funnel diagnosis.",
      ),
      now,
      text(input.owner, "GrowthRat"),
      nullableText(input.sourceDoc),
      now,
      now,
    )
    .run();

  for (const [index, variant] of variants.entries()) {
    const variantKey = safeSlug(variant.key, `variant-${index + 1}`);
    const variantId = generateId("var");
    const destinationUrl = normalizeDestination(variant.destinationUrl);

    await env.DB.prepare(
      `insert into experiment_variants (
        id,
        experiment_id,
        variant_key,
        name,
        hypothesis_delta,
        hook,
        cta,
        destination_url,
        status,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        variantId,
        id,
        variantKey,
        text(variant.name, `Variant ${index + 1}`),
        nullableText(variant.hypothesisDelta),
        nullableText(variant.hook),
        nullableText(variant.cta),
        destinationUrl,
        "running",
        now,
        now,
      )
      .run();

    await env.DB.prepare(
      `insert into experiment_assets (
        id,
        experiment_id,
        variant_id,
        asset_type,
        channel,
        title,
        url,
        tracking_id,
        status,
        metadata_json,
        created_at,
        updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        generateId("asset"),
        id,
        variantId,
        "tracking_link",
        text(input.channel, "owned_site"),
        `${text(variant.name, `Variant ${index + 1}`)} tracking link`,
        destinationUrl,
        `${slug}-${variantKey}`,
        "published",
        safeJson({ createdBy: "operator_console" }),
        now,
        now,
      )
      .run();
  }

  return getExperimentDetail(env, id);
}

export async function recordExperimentEvent(
  env: Env,
  input: ExperimentEventInput,
) {
  const trackingId = nullableText(input.trackingId);
  const now = new Date().toISOString();
  let experimentId = nullableText(input.experimentId);
  let variantId = nullableText(input.variantId);
  let assetId = nullableText(input.assetId);
  let channel = nullableText(input.channel);

  if (trackingId) {
    const asset = await env.DB.prepare(
      "select * from experiment_assets where tracking_id = ? limit 1",
    )
      .bind(trackingId)
      .first<ExperimentAssetRow>();

    if (asset) {
      experimentId = asset.experiment_id;
      variantId = asset.variant_id;
      assetId = asset.id;
      channel = asset.channel;
    }
  }

  await env.DB.prepare(
    `insert into experiment_events (
      id,
      experiment_id,
      variant_id,
      asset_id,
      event_type,
      channel,
      source,
      path,
      referrer,
      user_agent,
      detail_json,
      occurred_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      generateId("evt"),
      experimentId,
      variantId,
      assetId,
      normalizeEventType(input.eventType),
      channel,
      nullableText(input.source),
      nullableText(input.path),
      nullableText(input.referrer),
      nullableText(input.userAgent),
      safeJson(input.detail),
      now,
    )
    .run();

  return { ok: true, experimentId, variantId, assetId };
}

export async function addMetricSnapshot(
  env: Env,
  experimentIdentifier: string,
  input: MetricSnapshotInput,
) {
  const experiment = await findExperiment(env.DB, experimentIdentifier);
  if (!experiment) return null;

  const metricValue = numberValue(input.value);
  if (metricValue === null) {
    throw new Error("metric value must be a finite number");
  }

  const variant = await findVariant(
    env.DB,
    experiment.id,
    nullableText(input.variantKey),
  );
  const now = new Date().toISOString();

  await env.DB.prepare(
    `insert into experiment_metric_snapshots (
      id,
      experiment_id,
      variant_id,
      source,
      metric_key,
      metric_value,
      window_start,
      window_end,
      detail_json,
      captured_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      generateId("met"),
      experiment.id,
      variant?.id ?? null,
      text(input.source, "manual"),
      safeSlug(input.metricKey, "manual_signal"),
      metricValue,
      nullableText(input.windowStart),
      nullableText(input.windowEnd),
      safeJson(input.detail),
      now,
    )
    .run();

  return getExperimentDetail(env, experiment.id);
}

export async function createExperimentReadout(
  env: Env,
  experimentIdentifier: string,
  input: ReadoutInput,
) {
  const experiment = await getExperimentDetail(env, experimentIdentifier);
  if (!experiment) return null;

  const status = text(input.status, "completed");
  const now = new Date().toISOString();
  const metrics = {
    events: experiment.eventTotals,
    metrics: experiment.metricTotals,
  };

  await env.DB.prepare(
    `insert into experiment_readouts (
      id,
      experiment_id,
      status,
      decision,
      summary,
      learning,
      next_action,
      metrics_json,
      created_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      generateId("readout"),
      experiment.id,
      status,
      text(input.decision, "inconclusive"),
      text(input.summary, "No summary supplied."),
      text(input.learning, "No learning supplied."),
      text(input.nextAction, "Define the next experiment before running more distribution."),
      safeJson(metrics),
      now,
    )
    .run();

  if (status === "completed" || status === "inconclusive") {
    await env.DB.prepare(
      "update experiments set status = ?, ended_at = ?, updated_at = ? where id = ?",
    )
      .bind(status, now, now, experiment.id)
      .run();
  }

  return getExperimentDetail(env, experiment.id);
}

function eventCount(experiment: ExperimentDetail, eventType: string) {
  return experiment.eventTotals
    .filter((event) => event.event_type === eventType)
    .reduce((total, event) => total + Number(event.count ?? 0), 0);
}

function metricTotal(experiment: ExperimentDetail, pattern: RegExp) {
  return experiment.metricTotals
    .filter((metric) => pattern.test(metric.metric_key))
    .reduce((total, metric) => total + Number(metric.total ?? 0), 0);
}

export function buildExperimentReadoutSuggestion(
  experiment: ExperimentDetail,
): Required<Pick<ReadoutInput, "status" | "decision" | "summary" | "learning" | "nextAction">> {
  const trackingClicks = eventCount(experiment, "tracking_click");
  const ctaClicks = eventCount(experiment, "cta_click");
  const qualifiedClicks =
    eventCount(experiment, "qualified_click") +
    metricTotal(experiment, /qualified[_-]?click/i);
  const signups = eventCount(experiment, "signup");
  const paywallViews = eventCount(experiment, "paywall_view");
  const trials =
    eventCount(experiment, "trial_start") +
    metricTotal(experiment, /trial|subscription/i);
  const purchases =
    eventCount(experiment, "purchase") +
    metricTotal(experiment, /purchase|revenue|conversion/i);
  const totalBehavior =
    trackingClicks + ctaClicks + qualifiedClicks + signups + paywallViews;
  const totalMonetization = trials + purchases;

  if (totalBehavior === 0 && totalMonetization === 0) {
    return {
      status: "draft",
      decision: "keep_running",
      summary: `${experiment.title} has no captured behavior or monetization signal yet.`,
      learning:
        "There is not enough evidence to evaluate the hypothesis. The next run needs tracked distribution before the agent can compare hooks or diagnose the funnel.",
      nextAction:
        "Publish or distribute one approved variant with tracking links, then wait for qualified clicks or RevenueCat chart data before closing the experiment.",
    };
  }

  if (totalMonetization > 0) {
    return {
      status: "completed",
      decision: "continue",
      summary: `${experiment.title} produced ${totalBehavior} behavior signals and ${totalMonetization} monetization signals.`,
      learning:
        "The experiment has downstream subscription signal, so the next decision should optimize the strongest hook rather than restart the topic from scratch.",
      nextAction:
        "Promote the best-performing variant into the next content/distribution plan and compare it against one sharper CTA.",
    };
  }

  if (qualifiedClicks + signups + paywallViews >= 5 && totalMonetization === 0) {
    return {
      status: "completed",
      decision: "iterate_funnel",
      summary: `${experiment.title} generated ${qualifiedClicks} qualified clicks, ${signups} signups, and ${paywallViews} paywall views without confirmed monetization.`,
      learning:
        "The message can create intent, but the conversion path is not yet proving subscription value. That usually points to CTA mismatch, onboarding friction, or missing RevenueCat chart coverage.",
      nextAction:
        "Keep the topic, revise the CTA and landing path, and pull RevenueCat conversion or trial-start data before scaling distribution.",
    };
  }

  return {
    status: "inconclusive",
    decision: "collect_more_signal",
    summary: `${experiment.title} captured ${totalBehavior} behavior signals and no confirmed monetization signal.`,
    learning:
      "The experiment has early attention but not enough qualified or revenue-linked evidence to choose a winner.",
    nextAction:
      "Run one more distribution pass, prioritize channels with qualified replies or saves, and import the next RevenueCat chart snapshot.",
  };
}

export async function generateExperimentReadout(
  env: Env,
  experimentIdentifier: string,
) {
  const experiment = await getExperimentDetail(env, experimentIdentifier);
  if (!experiment) return null;

  return createExperimentReadout(
    env,
    experiment.id,
    buildExperimentReadoutSuggestion(experiment),
  );
}

export async function resolveTrackingDestination(env: Env, trackingId: string) {
  const asset = await env.DB.prepare(
    "select * from experiment_assets where tracking_id = ? limit 1",
  )
    .bind(trackingId)
    .first<ExperimentAssetRow>();

  if (!asset) return null;

  return {
    asset,
    destination: normalizeDestination(asset.url),
    metadata: parseJsonObject(asset.metadata_json),
  };
}

export async function ensureWeeklyExperiment(env: Env, weekStart: string) {
  const slug = `weekly-agent-advocacy-${weekStart}`;
  const existing = await findExperiment(env.DB, slug);
  if (existing) return getExperimentDetail(env, existing.id);

  return createExperiment(env, {
    slug,
    title: `Weekly Agent Advocacy Experiment ${weekStart}`,
    hypothesis:
      "Agent-native RevenueCat implementation content will produce more qualified developer intent than broad agentic-AI commentary.",
    audience: "agent developers building paid subscription apps",
    channel: "owned proof site, GitHub, X, and approved community replies",
    decisionRule:
      "Compare qualified clicks, saves, replies, repo visits, and RevenueCat monetization signals when available. Do not call a win from impressions alone.",
    sourceDoc: "generated by GrowthRat weekly Workflow",
    variants: [
      {
        key: "implementation",
        name: "Implementation hook",
        hypothesisDelta:
          "Specific code-and-architecture framing should outperform abstract AI commentary.",
        hook: "I built a RevenueCat subscription loop an agent can reason about.",
        cta: "Open the implementation guide",
        destinationUrl: "/articles/revenuecat-for-agent-built-apps",
      },
      {
        key: "testing",
        name: "Testing hook",
        hypothesisDelta:
          "Test Store framing should resonate with agents that need deterministic purchase proofs.",
        hook: "An agent should not wait for app review to test subscriptions.",
        cta: "Open the testing path",
        destinationUrl: "/readiness-review",
      },
      {
        key: "measurement",
        name: "Measurement hook",
        hypothesisDelta:
          "Growth operators should respond to clear RevenueCat Charts versus behavior analytics boundaries.",
        hook: "RevenueCat Charts tell you if money moved. They do not replace your funnel.",
        cta: "Open the measurement guide",
        destinationUrl: "/articles/charts-behavioral-analytics-bridge",
      },
    ],
  });
}
