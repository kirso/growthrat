import { getRuntimeSnapshot, type RuntimeSnapshot } from "./runtime";

export type ActivationStatus = "ready" | "gated" | "blocked";

export type ActivationCheck = {
  key: string;
  label: string;
  status: ActivationStatus;
  detail: string;
};

export type SecretCheck = {
  key: string;
  configured: boolean;
};

export type ActivationSnapshot = {
  generatedAt: string;
  mode: string;
  deployment: {
    workerName: string;
    publicSiteUrl: string;
    productionWorkerObserved: boolean;
    detail: string;
  };
  runtime: RuntimeSnapshot;
  resources: ActivationCheck[];
  gates: ActivationCheck[];
  secrets: {
    required: number;
    configured: number;
    missing: string[];
    checks: SecretCheck[];
  };
  blockers: string[];
  readyForApplicationReview: boolean;
  readyForRcLive: boolean;
};

export const requiredSecretKeys = [
  "GROWTHRAT_INTERNAL_SECRET",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "REVENUECAT_API_KEY",
  "SLACK_BOT_TOKEN",
  "TYPEFULLY_API_KEY",
] as const;

function hasBinding(env: Env, key: keyof Env) {
  return Boolean((env as Partial<Env>)[key]);
}

function hasSecret(env: Env, key: (typeof requiredSecretKeys)[number]) {
  const value = (env as Partial<Record<typeof key, string>>)[key];
  return typeof value === "string" && value.trim().length > 0;
}

export async function getActivationSnapshot(
  env: Env,
): Promise<ActivationSnapshot> {
  const runtime = await getRuntimeSnapshot(env);
  const mode = String(env.APP_MODE || "interview_proof");

  const secretChecks = requiredSecretKeys.map((key) => ({
    key,
    configured: hasSecret(env, key),
  }));
  const missingSecrets = secretChecks
    .filter((check) => !check.configured)
    .map((check) => check.key);

  const resources: ActivationCheck[] = [
    {
      key: "astro_worker",
      label: "Astro on Workers",
      status: hasBinding(env, "ASSETS") ? "ready" : "blocked",
      detail: "Custom Worker entry serves Astro SSR and static assets.",
    },
    {
      key: "d1",
      label: "D1 growthrat",
      status: runtime.source === "d1" ? "ready" : "gated",
      detail:
        runtime.source === "d1"
          ? "Operational tables are reachable."
          : "Falling back to static proof counts until D1 is reachable.",
    },
    {
      key: "r2",
      label: "R2 artifacts",
      status: hasBinding(env, "ARTIFACT_BUCKET") ? "ready" : "blocked",
      detail: "Proof bundles and run receipts write to growthrat-artifacts.",
    },
    {
      key: "queue",
      label: "Queues",
      status: hasBinding(env, "GROWTHRAT_QUEUE") ? "ready" : "blocked",
      detail: "Async event backpressure uses growthrat-jobs.",
    },
    {
      key: "workflows",
      label: "Workflows",
      status: hasBinding(env, "WEEKLY_LOOP") ? "ready" : "blocked",
      detail: "Weekly run orchestration is bound as growthrat-weekly-loop.",
    },
    {
      key: "agents",
      label: "Agents plus Durable Objects",
      status: hasBinding(env, "GrowthRatAgent") ? "ready" : "blocked",
      detail: "Stateful agent sessions are available through the Agents SDK.",
    },
    {
      key: "pipelines",
      label: "Pipeline stream",
      status: hasBinding(env, "EVENT_PIPELINE") ? "ready" : "blocked",
      detail: "Worker events stream to growthrat_events; R2 sink is next.",
    },
    {
      key: "vectorize",
      label: "Vectorize",
      status: hasBinding(env, "DOC_INDEX") ? "ready" : "blocked",
      detail: "RevenueCat docs and artifact retrieval index is provisioned.",
    },
    {
      key: "ai_gateway",
      label: "AI Gateway",
      status: env.AI_GATEWAY_ID === "growthrat" ? "ready" : "gated",
      detail: "Model routing target is the growthrat gateway.",
    },
    {
      key: "ai_search",
      label: "AI Search",
      status: "gated",
      detail:
        "Deferred because account provisioning failed; Vectorize is the active retrieval path.",
    },
  ];

  const gates: ActivationCheck[] = [
    {
      key: "mode",
      label: "Runtime mode",
      status: mode === "rc_live" ? "ready" : "gated",
      detail:
        mode === "rc_live"
          ? "Live side effects are allowed by mode."
          : "Public proof mode keeps external side effects disabled.",
    },
    {
      key: "secrets",
      label: "Required secrets",
      status: missingSecrets.length === 0 ? "ready" : "blocked",
      detail:
        missingSecrets.length === 0
          ? "All required connector and model secrets are configured."
          : `${missingSecrets.length} required secrets are not configured.`,
    },
    {
      key: "revenuecat_access",
      label: "RevenueCat private access",
      status: hasSecret(env, "REVENUECAT_API_KEY") ? "gated" : "blocked",
      detail:
        "Private Charts, Slack, CMS, GitHub, and social credentials remain post-hire activation dependencies.",
    },
    {
      key: "approval_policy",
      label: "Approval policy",
      status: "gated",
      detail:
        "Publishing, Slack, and social side effects remain disabled until approval, rate, budget, and kill-switch checks are tested.",
    },
  ];

  const blockers = [
    ...gates.filter((gate) => gate.status === "blocked").map((gate) => gate.label),
    ...resources
      .filter((resource) => resource.status === "blocked")
      .map((resource) => resource.label),
  ];
  const operationalResourcesReady = resources
    .filter((resource) => resource.key !== "ai_search")
    .every((resource) => resource.status === "ready");
  const activationGatesReady = gates.every((gate) => gate.status === "ready");

  return {
    generatedAt: new Date().toISOString(),
    mode,
    deployment: {
      workerName: "growthrat",
      publicSiteUrl: env.PUBLIC_SITE_URL || "https://growthrat.com",
      productionWorkerObserved: false,
      detail:
        "Cloudflare account resources exist, but production Worker deployment must be observed after Wrangler authentication is available.",
    },
    runtime,
    resources,
    gates,
    secrets: {
      required: secretChecks.length,
      configured: secretChecks.filter((check) => check.configured).length,
      missing: missingSecrets,
      checks: secretChecks,
    },
    blockers,
    readyForApplicationReview:
      resources.filter((resource) => resource.status === "ready").length >= 7 &&
      runtime.counts.artifacts >= 6 &&
      runtime.counts.feedback >= 3,
    readyForRcLive:
      mode === "rc_live" &&
      missingSecrets.length === 0 &&
      operationalResourcesReady &&
      activationGatesReady,
  };
}

export function authorizeInternalRequest(request: Request, env: Env) {
  const expected = (env as Partial<Record<"GROWTHRAT_INTERNAL_SECRET", string>>)
    .GROWTHRAT_INTERNAL_SECRET;

  if (!expected || !expected.trim()) {
    return {
      ok: false,
      status: 503,
      error: "internal secret is not configured",
    } as const;
  }

  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const headerToken = request.headers.get("x-growthrat-secret") ?? "";
  const token = bearer || headerToken;

  if (token !== expected) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
    } as const;
  }

  return { ok: true } as const;
}
