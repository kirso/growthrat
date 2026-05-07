export type ReviewMode = "draft_only" | "semi_auto" | "bounded_autonomy";

export type BudgetPolicy = {
  maxDailyEstimatedUsd: number;
  maxDailyInputTokens: number;
  maxDailyOutputTokens: number;
  allowCommunityPosting: boolean;
  allowAutoPublish: boolean;
};

export type AgentConfig = {
  mode: string;
  reviewMode: ReviewMode;
  focusTopics: string[];
  slackChannel: string;
  enabledPlatforms: string[];
  budgetPolicy: BudgetPolicy;
  paused: boolean;
  activeUntil: string | null;
  isActive: boolean;
};

type AgentConfigRow = {
  mode: string;
  review_mode: string;
  focus_topics_json: string;
  slack_channel: string;
  enabled_platforms_json: string;
  budget_policy_json: string;
  paused: number;
  active_until: string | null;
};

const defaultBudgetPolicy: BudgetPolicy = {
  maxDailyEstimatedUsd: 15,
  maxDailyInputTokens: 2_000_000,
  maxDailyOutputTokens: 400_000,
  allowCommunityPosting: false,
  allowAutoPublish: false,
};

function parseArray(value: string, fallback: string[]) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : fallback;
  } catch {
    return fallback;
  }
}

function parseBudgetPolicy(value: string): BudgetPolicy {
  try {
    const parsed = JSON.parse(value) as Partial<BudgetPolicy>;
    return {
      maxDailyEstimatedUsd:
        typeof parsed.maxDailyEstimatedUsd === "number"
          ? parsed.maxDailyEstimatedUsd
          : defaultBudgetPolicy.maxDailyEstimatedUsd,
      maxDailyInputTokens:
        typeof parsed.maxDailyInputTokens === "number"
          ? parsed.maxDailyInputTokens
          : defaultBudgetPolicy.maxDailyInputTokens,
      maxDailyOutputTokens:
        typeof parsed.maxDailyOutputTokens === "number"
          ? parsed.maxDailyOutputTokens
          : defaultBudgetPolicy.maxDailyOutputTokens,
      allowCommunityPosting: parsed.allowCommunityPosting === true,
      allowAutoPublish: parsed.allowAutoPublish === true,
    };
  } catch {
    return defaultBudgetPolicy;
  }
}

function normalizeReviewMode(value: string): ReviewMode {
  return value === "semi_auto" || value === "bounded_autonomy"
    ? value
    : "draft_only";
}

function isActive(row: AgentConfigRow, now = new Date()) {
  if (row.paused) return false;
  if (row.mode !== "interview_proof" && row.mode !== "rc_live") return false;
  if (row.active_until && new Date(row.active_until) <= now) return false;
  return true;
}

function fallbackConfig(mode = "interview_proof"): AgentConfig {
  return {
    mode,
    reviewMode: "draft_only",
    focusTopics: [
      "RevenueCat agent builders",
      "subscription app growth",
      "developer advocacy",
    ],
    slackChannel: "growthrat",
    enabledPlatforms: ["site", "github", "slack", "postiz"],
    budgetPolicy: defaultBudgetPolicy,
    paused: false,
    activeUntil: null,
    isActive: mode === "interview_proof" || mode === "rc_live",
  };
}

function fromRow(row: AgentConfigRow): AgentConfig {
  return {
    mode: row.mode,
    reviewMode: normalizeReviewMode(row.review_mode),
    focusTopics: parseArray(row.focus_topics_json, []),
    slackChannel: row.slack_channel || "growthrat",
    enabledPlatforms: parseArray(row.enabled_platforms_json, []),
    budgetPolicy: parseBudgetPolicy(row.budget_policy_json),
    paused: Boolean(row.paused),
    activeUntil: row.active_until,
    isActive: isActive(row),
  };
}

export async function getAgentConfig(env: Env): Promise<AgentConfig> {
  try {
    const row = await env.DB.prepare(
      `select mode, review_mode, focus_topics_json, slack_channel,
        enabled_platforms_json, budget_policy_json, paused, active_until
       from agent_config where id = 'default' limit 1`,
    ).first<AgentConfigRow>();

    return row ? fromRow(row) : fallbackConfig(env.APP_MODE);
  } catch {
    return fallbackConfig(env.APP_MODE);
  }
}

export async function saveAgentConfig(
  env: Env,
  input: Partial<
    Omit<AgentConfig, "budgetPolicy"> & { budgetPolicy: Partial<BudgetPolicy> }
  >,
) {
  const current = await getAgentConfig(env);
  const next = {
    mode: input.mode ?? current.mode,
    reviewMode: input.reviewMode ?? current.reviewMode,
    focusTopics: input.focusTopics ?? current.focusTopics,
    slackChannel: input.slackChannel ?? current.slackChannel,
    enabledPlatforms: input.enabledPlatforms ?? current.enabledPlatforms,
    budgetPolicy: { ...current.budgetPolicy, ...(input.budgetPolicy ?? {}) },
    paused: input.paused ?? current.paused,
    activeUntil: input.activeUntil ?? current.activeUntil,
  };
  const now = new Date().toISOString();

  await env.DB.prepare(
    `insert into agent_config (
      id, mode, review_mode, focus_topics_json, slack_channel,
      enabled_platforms_json, budget_policy_json, paused, active_until,
      created_at, updated_at
    ) values ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    on conflict(id) do update set
      mode = excluded.mode,
      review_mode = excluded.review_mode,
      focus_topics_json = excluded.focus_topics_json,
      slack_channel = excluded.slack_channel,
      enabled_platforms_json = excluded.enabled_platforms_json,
      budget_policy_json = excluded.budget_policy_json,
      paused = excluded.paused,
      active_until = excluded.active_until,
      updated_at = excluded.updated_at`,
  )
    .bind(
      next.mode,
      next.reviewMode,
      JSON.stringify(next.focusTopics),
      next.slackChannel,
      JSON.stringify(next.enabledPlatforms),
      JSON.stringify(next.budgetPolicy),
      next.paused ? 1 : 0,
      next.activeUntil,
      now,
      now,
    )
    .run();

  return await getAgentConfig(env);
}
