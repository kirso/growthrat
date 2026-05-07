export type RunActor = "growthrat" | "operator" | "revenuecat_rep" | "system";

export type AgentRun = {
  id: string;
  run_type: string;
  trigger_type: string;
  status: string;
  actor_type: RunActor | string;
  actor_id: string | null;
  mode: string;
  title: string | null;
  input_json: string;
  output_json: string | null;
  langfuse_trace_id: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentRunEvent = {
  id: string;
  run_id: string | null;
  event_type: string;
  actor_type: RunActor | string;
  actor_id: string | null;
  status: string;
  subject_type: string | null;
  subject_id: string | null;
  source_ids_json: string;
  detail_json: string;
  cost_usd: number | null;
  latency_ms: number | null;
  created_at: string;
};

type StartRunInput = {
  runType: string;
  triggerType: string;
  title?: string;
  actorType?: RunActor;
  actorId?: string;
  input?: unknown;
  langfuseTraceId?: string;
};

type RecordRunEventInput = {
  runId?: string | null;
  eventType: string;
  actorType?: RunActor;
  actorId?: string;
  status?: string;
  subjectType?: string;
  subjectId?: string;
  sourceIds?: string[];
  detail?: unknown;
  costUsd?: number | null;
  latencyMs?: number | null;
};

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

function arrayJson(value: unknown) {
  try {
    return JSON.stringify(Array.isArray(value) ? value : []);
  } catch {
    return "[]";
  }
}

function mode(env: Env) {
  const value = (env as unknown as Partial<Record<"APP_MODE", string>>).APP_MODE;
  return typeof value === "string" && value.trim() ? value.trim() : "interview_proof";
}

export async function startRun(env: Env, input: StartRunInput) {
  const now = new Date().toISOString();
  const runId = id("run");

  try {
    await env.DB.prepare(
      `insert into agent_runs (
        id, run_type, trigger_type, status, actor_type, actor_id, mode, title,
        input_json, langfuse_trace_id, started_at, created_at, updated_at
      ) values (?, ?, ?, 'running', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        runId,
        input.runType,
        input.triggerType,
        input.actorType ?? "growthrat",
        input.actorId ?? null,
        mode(env),
        input.title ?? null,
        json(input.input),
        input.langfuseTraceId ?? runId,
        now,
        now,
        now,
      )
      .run();
  } catch {
    return null;
  }

  return runId;
}

export async function recordRunEvent(env: Env, input: RecordRunEventInput) {
  const eventId = id("evt");

  try {
    await env.DB.prepare(
      `insert into agent_run_events (
        id, run_id, event_type, actor_type, actor_id, status, subject_type,
        subject_id, source_ids_json, detail_json, cost_usd, latency_ms, created_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        eventId,
        input.runId ?? null,
        input.eventType,
        input.actorType ?? "growthrat",
        input.actorId ?? null,
        input.status ?? "recorded",
        input.subjectType ?? null,
        input.subjectId ?? null,
        arrayJson(input.sourceIds),
        json(input.detail),
        input.costUsd ?? null,
        input.latencyMs ?? null,
        new Date().toISOString(),
      )
      .run();
  } catch {
    return null;
  }

  return eventId;
}

export async function finishRun(
  env: Env,
  input: { runId?: string | null; status: string; output?: unknown },
) {
  if (!input.runId) return;
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `update agent_runs set status = ?, output_json = ?, completed_at = ?,
        updated_at = ? where id = ?`,
    )
      .bind(input.status, json(input.output), now, now, input.runId)
      .run();
  } catch {
    return;
  }
}

export async function listRuns(env: Env, limit = 50) {
  const { results } = await env.DB.prepare(
    "select * from agent_runs order by created_at desc limit ?",
  )
    .bind(limit)
    .all<AgentRun>();
  return results;
}

export async function getRunDetail(env: Env, runId: string) {
  const run = await env.DB.prepare("select * from agent_runs where id = ? limit 1")
    .bind(runId)
    .first<AgentRun>();
  if (!run) return null;

  const events = await env.DB.prepare(
    "select * from agent_run_events where run_id = ? order by created_at asc",
  )
    .bind(runId)
    .all<AgentRunEvent>();

  return { run, events: events.results };
}
