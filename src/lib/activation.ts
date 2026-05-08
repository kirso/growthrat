import { getRuntimeSnapshot, type RuntimeSnapshot } from "./runtime";
import { getRuntimePolicySnapshot, type RuntimePolicySnapshot } from "./policy";
import { getSourceStats, type SourceStats } from "./sources";
import {
  getConnectorChecks,
  type ConnectorCheck,
} from "./connected-accounts";
import { getRcSessionFromRequest, timingSafeEqual, type RcSession } from "./auth";

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
  connectors: ConnectorCheck[];
  blockers: string[];
  policy: RuntimePolicySnapshot;
  sources: SourceStats;
  readyForApplicationReview: boolean;
  readyForRcLive: boolean;
};

export const requiredPlatformSecretKeys = [
  "GROWTHRAT_INTERNAL_SECRET",
  "GROWTHRAT_CONNECTOR_ENCRYPTION_KEY",
] as const;

function hasBinding(env: Env, key: keyof Env) {
  return Boolean((env as Partial<Env>)[key]);
}

function hasSecret(env: Env, key: (typeof requiredPlatformSecretKeys)[number]) {
  const value = (env as Partial<Record<typeof key, string>>)[key];
  return typeof value === "string" && value.trim().length > 0;
}

function hasConfigValue(env: Env, key: string) {
  const value = (env as unknown as Partial<Record<string, string>>)[key];
  return typeof value === "string" && value.trim().length > 0;
}

export async function getActivationSnapshot(
  env: Env,
): Promise<ActivationSnapshot> {
  const [runtime, policy, sources, connectors] = await Promise.all([
    getRuntimeSnapshot(env),
    getRuntimePolicySnapshot(env),
    getSourceStats(env),
    getConnectorChecks(env),
  ]);
  const mode = String(env.APP_MODE || "interview_proof");
  const productionWorkerObserved =
    hasConfigValue(env, "PRODUCTION_WORKER_OBSERVED") &&
    String(
      (env as unknown as Partial<Record<"PRODUCTION_WORKER_OBSERVED", string>>)
        .PRODUCTION_WORKER_OBSERVED,
    ) === "true";

  const secretChecks = requiredPlatformSecretKeys.map((key) => ({
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
      key: "experiment_ops",
      label: "Experiment operations",
      status: runtime.source === "d1" && runtime.counts.experiments >= 1 ? "ready" : "gated",
      detail:
        "D1 stores experiments, variants, assets, tracking events, metric snapshots, and readouts.",
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
      status:
        hasBinding(env, "DOC_INDEX") &&
        sources.indexedChunks > 0 &&
        sources.freshness.status === "fresh"
          ? "ready"
          : hasBinding(env, "DOC_INDEX") && sources.indexedChunks > 0
            ? "gated"
            : hasBinding(env, "DOC_INDEX")
              ? "gated"
              : "blocked",
      detail:
        sources.indexedChunks > 0 && sources.freshness.status === "fresh"
          ? `${sources.indexedChunks} source chunks are indexed for retrieval; bundled proof corpus is fresh.`
          : sources.indexedChunks > 0
            ? `${sources.indexedChunks} source chunks are indexed, but bundled proof corpus is ${sources.freshness.status}: ${sources.freshness.detail}`
          : "Retrieval index is provisioned; RevenueCat docs ingestion is still required.",
    },
    {
      key: "ai_gateway",
      label: "AI Gateway",
      status:
        hasBinding(env, "AI") && env.AI_GATEWAY_ID === "growthrat"
          ? "ready"
          : "gated",
      detail:
        "Model calls use the Workers AI binding with the growthrat AI Gateway policy path.",
    },
    {
      key: "ai_search",
      label: "AI Search",
      status: "gated",
      detail:
        "Deferred because account provisioning failed; Vectorize is the planned retrieval path after docs ingestion.",
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
      label: "Platform secrets",
      status: missingSecrets.length === 0 ? "ready" : "blocked",
      detail:
        missingSecrets.length === 0
          ? "Server-owned auth and connector-encryption secrets are configured."
          : `${missingSecrets.length} platform secrets are not configured.`,
    },
    {
      key: "revenuecat_access",
      label: "RC connected accounts",
      status: connectors.every((connector) => connector.status === "ready")
        ? "ready"
        : "gated",
      detail:
        "After interview approval, a RevenueCat representative signs in and connects RevenueCat, Slack, CMS, GitHub, and Postiz from the app.",
    },
    {
      key: "approval_policy",
      label: "Approval policy",
      status: "gated",
      detail:
        "Publishing, Slack, and social side effects remain disabled until approval, rate, budget, and kill-switch checks are tested.",
    },
    {
      key: "rate_budget_kill",
      label: "Rate, budget, kill switch",
      status:
        !policy.killSwitch &&
        policy.limits.chatPerIpPerDay > 0 &&
        policy.limits.modelCallsPerDay > 0
          ? "ready"
          : "blocked",
      detail: policy.killSwitch
        ? "Runtime kill switch is enabled."
        : `Chat is capped at ${policy.limits.chatPerIpPerDay}/client/day and model calls at ${policy.limits.modelCallsPerDay}/day.`,
    },
  ];

  const blockers = [
    ...gates.filter((gate) => gate.status === "blocked").map((gate) => gate.label),
    ...connectors
      .filter((connector) => connector.status === "blocked")
      .map((connector) => connector.label),
    ...resources
      .filter((resource) => resource.status === "blocked")
      .map((resource) => resource.label),
  ];
  const operationalResourcesReady = resources
    .filter((resource) => resource.key !== "ai_search")
    .every((resource) => resource.status === "ready");
  const activationGatesReady = gates.every((gate) => gate.status === "ready");
  const connectorsReady = connectors.every(
    (connector) => connector.status === "ready",
  );

  return {
    generatedAt: new Date().toISOString(),
    mode,
    deployment: {
      workerName: "growthrat",
      publicSiteUrl:
        env.PUBLIC_SITE_URL || "https://growthrat.kirso.workers.dev",
      productionWorkerObserved,
      detail:
        productionWorkerObserved
          ? "Production Worker deployment has been observed on Cloudflare workers.dev."
          : "Cloudflare account resources exist, but production Worker deployment must be observed after Wrangler authentication is available.",
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
    connectors,
    blockers,
    policy,
    sources,
    readyForApplicationReview:
      resources.filter((resource) => resource.status === "ready").length >= 7 &&
      runtime.counts.artifacts >= 6 &&
      runtime.counts.feedback >= 3,
    readyForRcLive:
      mode === "rc_live" &&
      missingSecrets.length === 0 &&
      connectorsReady &&
      operationalResourcesReady &&
      activationGatesReady,
  };
}

export async function authorizeInternalRequest(request: Request, env: Env): Promise<
  | { ok: true; session?: RcSession }
  | { ok: false; status: number; error: string }
> {
  const session = await getRcSessionFromRequest(request, env);
  if (session) {
    return { ok: true, session };
  }

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

  if (!(await timingSafeEqual(token, expected))) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
    } as const;
  }

  return { ok: true } as const;
}
