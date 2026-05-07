type LangfuseTraceInput = {
  traceId: string;
  name: string;
  userId?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  tags?: string[];
  events?: Array<{
    name: string;
    input?: unknown;
    output?: unknown;
    metadata?: Record<string, unknown>;
  }>;
};

function envString(env: Env, key: string, fallback = "") {
  const value = (env as unknown as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function envNumber(env: Env, key: string, fallback: number) {
  const raw = envString(env, key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function isEnabled(env: Env) {
  const flag = envString(env, "LANGFUSE_ENABLED", "false").toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

function shouldSample(env: Env) {
  const rate = Math.min(1, Math.max(0, envNumber(env, "LANGFUSE_SAMPLE_RATE", 1)));
  return rate >= 1 || Math.random() <= rate;
}

function baseUrl(env: Env) {
  return envString(env, "LANGFUSE_BASE_URL", "https://cloud.langfuse.com").replace(
    /\/+$/,
    "",
  );
}

function authHeader(publicKey: string, secretKey: string) {
  return `Basic ${btoa(`${publicKey}:${secretKey}`)}`;
}

function safeJson(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as unknown;
  } catch {
    return null;
  }
}

function eventId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
}

export function getLangfuseTraceUrl(env: Env, traceId: string) {
  if (!traceId) return null;
  const projectId = envString(env, "LANGFUSE_PROJECT_ID");
  if (!projectId) return null;
  return `${baseUrl(env)}/project/${encodeURIComponent(projectId)}/traces/${encodeURIComponent(traceId)}`;
}

export async function sendLangfuseTrace(env: Env, input: LangfuseTraceInput) {
  if (!isEnabled(env) || !shouldSample(env)) return { sent: false, reason: "disabled" };

  const publicKey = envString(env, "LANGFUSE_PUBLIC_KEY");
  const secretKey = envString(env, "LANGFUSE_SECRET_KEY");
  if (!publicKey || !secretKey) {
    return { sent: false, reason: "missing credentials" };
  }

  const timestamp = new Date().toISOString();
  const batch = [
    {
      id: eventId("lf_trace"),
      timestamp,
      type: "trace-create",
      body: {
        id: input.traceId,
        name: input.name,
        userId: input.userId,
        timestamp,
        input: safeJson(input.input),
        output: safeJson(input.output),
        metadata: {
          product: "growthrat",
          mode: envString(env, "APP_MODE", "interview_proof"),
          ...(input.metadata ?? {}),
        },
        tags: input.tags ?? ["growthrat"],
        environment: envString(env, "APP_MODE", "interview_proof")
          .replace(/[^a-z0-9_-]/gi, "_")
          .toLowerCase(),
      },
    },
    ...(input.events ?? []).map((event) => ({
      id: eventId("lf_event"),
      timestamp,
      type: "event-create",
      body: {
        id: eventId("obs"),
        traceId: input.traceId,
        name: event.name,
        startTime: timestamp,
        input: safeJson(event.input),
        output: safeJson(event.output),
        metadata: safeJson(event.metadata),
      },
    })),
  ];

  try {
    const response = await fetch(`${baseUrl(env)}/api/public/ingestion`, {
      method: "POST",
      headers: {
        Authorization: authHeader(publicKey, secretKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        batch,
        metadata: {
          sdkName: "growthrat-worker",
          sdkVersion: "0.1.0",
        },
      }),
    });

    if (!response.ok) {
      return { sent: false, reason: `Langfuse returned ${response.status}` };
    }
    return { sent: true, reason: "sent" };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "Langfuse request failed",
    };
  }
}
