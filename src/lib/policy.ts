export type PolicyAction =
  | "chat"
  | "model_call"
  | "source_ingest"
  | "operator_mutation"
  | "external_side_effect";

export type PolicyDecision =
  | { ok: true; status: 200; detail: string }
  | { ok: false; status: number; error: string; detail: string };

export type RuntimePolicySnapshot = {
  mode: string;
  killSwitch: boolean;
  modelChatEnabled: boolean;
  limits: {
    chatMessageChars: number;
    chatPerIpPerDay: number;
    modelCallsPerDay: number;
    sideEffectsPerDay: number;
    publicEventsPerDay: number;
  };
  flags: Record<string, string>;
};

const defaultLimits = {
  chatMessageChars: 1200,
  chatPerIpPerDay: 80,
  modelCallsPerDay: 120,
  sideEffectsPerDay: 20,
  publicEventsPerDay: 5000,
};

function stringValue(env: Env, key: string, fallback = "") {
  const value = (env as unknown as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(env: Env, key: string, fallback: number) {
  const raw = stringValue(env, key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function boolString(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return value === "true" || value === "1" || value === "yes";
}

function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function clientKey(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown-client"
  );
}

function counterId(scope: string, subjectKey: string, windowKey: string) {
  return `${scope}:${subjectKey}:${windowKey}`;
}

async function readRuntimeFlags(env: Env) {
  try {
    const { results } = await env.DB.prepare(
      "select key, value from runtime_flags",
    ).all<{ key: string; value: string }>();

    return Object.fromEntries(results.map((row) => [row.key, row.value]));
  } catch {
    return {};
  }
}

export async function getRuntimePolicySnapshot(
  env: Env,
): Promise<RuntimePolicySnapshot> {
  const flags = await readRuntimeFlags(env);
  const killSwitch =
    boolString(flags.kill_switch) ||
    boolString(stringValue(env, "KILL_SWITCH", "false"));

  return {
    mode: stringValue(env, "APP_MODE", "interview_proof"),
    killSwitch,
    modelChatEnabled:
      !killSwitch &&
      boolString(flags.model_chat_enabled, true) &&
      boolString(stringValue(env, "MODEL_CHAT_ENABLED", "true"), true),
    limits: {
      chatMessageChars: numberValue(
        env,
        "MAX_CHAT_MESSAGE_CHARS",
        defaultLimits.chatMessageChars,
      ),
      chatPerIpPerDay: numberValue(
        env,
        "CHAT_DAILY_LIMIT",
        defaultLimits.chatPerIpPerDay,
      ),
      modelCallsPerDay: numberValue(
        env,
        "AI_DAILY_CALL_LIMIT",
        defaultLimits.modelCallsPerDay,
      ),
      sideEffectsPerDay: numberValue(
        env,
        "SIDE_EFFECT_DAILY_LIMIT",
        defaultLimits.sideEffectsPerDay,
      ),
      publicEventsPerDay: numberValue(
        env,
        "PUBLIC_EVENT_DAILY_LIMIT",
        defaultLimits.publicEventsPerDay,
      ),
    },
    flags,
  };
}

async function incrementCounter(
  env: Env,
  scope: string,
  subjectKey: string,
  limitValue: number,
) {
  const windowKey = todayKey();
  const id = counterId(scope, subjectKey, windowKey);
  const now = new Date().toISOString();

  await env.DB.prepare(
    `insert into policy_counters (
      id,
      counter_scope,
      subject_key,
      window_key,
      used,
      limit_value,
      created_at,
      updated_at
    ) values (?, ?, ?, ?, 1, ?, ?, ?)
    on conflict(counter_scope, subject_key, window_key)
    do update set used = used + 1, limit_value = excluded.limit_value, updated_at = excluded.updated_at`,
  )
    .bind(id, scope, subjectKey, windowKey, limitValue, now, now)
    .run();

  const row = await env.DB.prepare(
    "select used, limit_value from policy_counters where counter_scope = ? and subject_key = ? and window_key = ? limit 1",
  )
    .bind(scope, subjectKey, windowKey)
    .first<{ used: number; limit_value: number }>();

  const used = Number(row?.used ?? limitValue + 1);
  const limit = Number(row?.limit_value ?? limitValue);

  return { used, limit, allowed: used <= limit };
}

export async function enforceChatPolicy(
  env: Env,
  request: Request,
  message: string,
): Promise<PolicyDecision> {
  const policy = await getRuntimePolicySnapshot(env);
  if (policy.killSwitch) {
    return {
      ok: false,
      status: 423,
      error: "kill switch is enabled",
      detail: "Chat is disabled until the operator clears the runtime kill switch.",
    };
  }

  if (message.length > policy.limits.chatMessageChars) {
    return {
      ok: false,
      status: 413,
      error: "message is too long",
      detail: `Chat messages are limited to ${policy.limits.chatMessageChars} characters.`,
    };
  }

  const rateLimiter = (env as Partial<Record<"CHAT_RATE_LIMITER", RateLimit>>)
    .CHAT_RATE_LIMITER;
  if (rateLimiter) {
    const outcome = await rateLimiter.limit({ key: clientKey(request) });
    if (!outcome.success) {
      return {
        ok: false,
        status: 429,
        error: "chat rate limit exceeded",
        detail: "The edge rate limit blocked this chat request.",
      };
    }
  }

  try {
    const counter = await incrementCounter(
      env,
      "chat_per_client",
      clientKey(request),
      policy.limits.chatPerIpPerDay,
    );
    if (!counter.allowed) {
      return {
        ok: false,
        status: 429,
        error: "daily chat quota exceeded",
        detail: `Daily chat usage is ${counter.used}/${counter.limit} for this client.`,
      };
    }
  } catch {
    return {
      ok: false,
      status: 503,
      error: "policy counter unavailable",
      detail: "Chat fails closed when D1 policy counters are unavailable.",
    };
  }

  return { ok: true, status: 200, detail: "chat policy passed" };
}

export async function enforceModelPolicy(
  env: Env,
  request: Request,
): Promise<PolicyDecision> {
  const policy = await getRuntimePolicySnapshot(env);
  if (policy.killSwitch || !policy.modelChatEnabled) {
    return {
      ok: false,
      status: 423,
      error: "model chat is disabled",
      detail: "Model calls are disabled by policy.",
    };
  }

  const rateLimiter = (env as Partial<Record<"AI_RATE_LIMITER", RateLimit>>)
    .AI_RATE_LIMITER;
  if (rateLimiter) {
    const outcome = await rateLimiter.limit({ key: clientKey(request) });
    if (!outcome.success) {
      return {
        ok: false,
        status: 429,
        error: "model rate limit exceeded",
        detail: "The edge rate limit blocked this model request.",
      };
    }
  }

  try {
    const counter = await incrementCounter(
      env,
      "model_calls_global",
      "all",
      policy.limits.modelCallsPerDay,
    );
    if (!counter.allowed) {
      return {
        ok: false,
        status: 429,
        error: "daily model budget exceeded",
        detail: `Daily model calls are ${counter.used}/${counter.limit}.`,
      };
    }
  } catch {
    return {
      ok: false,
      status: 503,
      error: "model budget unavailable",
      detail: "Model calls fail closed when D1 policy counters are unavailable.",
    };
  }

  return { ok: true, status: 200, detail: "model policy passed" };
}

export async function enforcePublicEventPolicy(
  env: Env,
  request: Request,
): Promise<PolicyDecision> {
  const policy = await getRuntimePolicySnapshot(env);
  if (policy.killSwitch) {
    return {
      ok: false,
      status: 423,
      error: "kill switch is enabled",
      detail: "Public event writes are disabled.",
    };
  }

  const rateLimiter = (env as Partial<Record<"EVENT_RATE_LIMITER", RateLimit>>)
    .EVENT_RATE_LIMITER;
  if (rateLimiter) {
    const outcome = await rateLimiter.limit({ key: clientKey(request) });
    if (!outcome.success) {
      return {
        ok: false,
        status: 429,
        error: "event rate limit exceeded",
        detail: "The edge rate limit blocked this event write.",
      };
    }
  }

  try {
    const counter = await incrementCounter(
      env,
      "public_events_global",
      "all",
      policy.limits.publicEventsPerDay,
    );
    if (!counter.allowed) {
      return {
        ok: false,
        status: 429,
        error: "daily public event budget exceeded",
        detail: `Daily public event writes are ${counter.used}/${counter.limit}.`,
      };
    }
  } catch {
    return {
      ok: false,
      status: 503,
      error: "public event budget unavailable",
      detail: "Public event writes fail closed when D1 policy counters are unavailable.",
    };
  }

  return { ok: true, status: 200, detail: "public event policy passed" };
}

export async function enforceSideEffectPolicy(
  env: Env,
  action: PolicyAction,
): Promise<PolicyDecision> {
  const policy = await getRuntimePolicySnapshot(env);
  if (policy.killSwitch) {
    return {
      ok: false,
      status: 423,
      error: "kill switch is enabled",
      detail: "External side effects are disabled.",
    };
  }

  if (policy.mode !== "rc_live") {
    return {
      ok: false,
      status: 423,
      error: "runtime mode is not rc_live",
      detail: `${action} requires rc_live mode and explicit approval.`,
    };
  }

  try {
    const counter = await incrementCounter(
      env,
      "side_effects_global",
      "all",
      policy.limits.sideEffectsPerDay,
    );
    if (!counter.allowed) {
      return {
        ok: false,
        status: 429,
        error: "daily side-effect budget exceeded",
        detail: `Daily side effects are ${counter.used}/${counter.limit}.`,
      };
    }
  } catch {
    return {
      ok: false,
      status: 503,
      error: "side-effect budget unavailable",
      detail: "Side effects fail closed when D1 policy counters are unavailable.",
    };
  }

  return { ok: true, status: 200, detail: "side-effect policy passed" };
}

export async function setRuntimeFlag(
  env: Env,
  key: "kill_switch" | "model_chat_enabled",
  value: boolean,
  reason: string,
  updatedBy = "operator",
) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `insert into runtime_flags (key, value, reason, updated_by, updated_at)
    values (?, ?, ?, ?, ?)
    on conflict(key)
    do update set value = excluded.value, reason = excluded.reason, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
  )
    .bind(key, String(value), reason, updatedBy, now)
    .run();

  await env.DB.prepare(
    "insert into operator_actions (id, action_type, status, subject, detail_json, created_at) values (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      crypto.randomUUID(),
      "runtime_flag_update",
      "applied",
      key,
      JSON.stringify({ value, reason, updatedBy }),
      now,
    )
    .run();
}
