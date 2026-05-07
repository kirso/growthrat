import { getAgentConfig, saveAgentConfig } from "./agent-config";
import {
  approveRequest,
  attachRunApprovalsToSlackThread,
  decideApprovalBySlackThread,
  rejectRequest,
} from "./approvals";
import { resolveConnectorCredentials } from "./connected-accounts";
import { listTopOpportunities, refreshOpportunities } from "./opportunities";
import { runWeeklyAdvocateLoop } from "./pipeline";
import { recordReportDelivery } from "./report-deliveries";
import { recordEvent } from "./runtime";
import {
  formatAdvocateLoopSlackReport,
  formatOpportunitiesSlackReport,
} from "./slack-report";

export type SlackConfig = {
  botToken: string;
  signingSecret: string;
  defaultChannel: string;
};

function envString(env: Env, key: string) {
  const value = (env as unknown as Partial<Record<string, string>>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export async function getSlackConfig(env: Env): Promise<SlackConfig | null> {
  const credentials = await resolveConnectorCredentials(env, "slack");
  const botToken = credentials?.botToken ?? credentials?.SLACK_BOT_TOKEN;
  const signingSecret =
    credentials?.signingSecret ??
    credentials?.SLACK_SIGNING_SECRET ??
    envString(env, "SLACK_SIGNING_SECRET");
  const defaultChannel =
    credentials?.defaultChannel ??
    credentials?.SLACK_DEFAULT_CHANNEL ??
    envString(env, "SLACK_DEFAULT_CHANNEL") ??
    "growthrat";

  return botToken && signingSecret
    ? { botToken, signingSecret, defaultChannel }
    : null;
}

function toHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return toHex(new Uint8Array(signature));
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function verifySlackRequest(
  request: Request,
  body: string,
  signingSecret: string,
) {
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";
  const signature = request.headers.get("x-slack-signature") ?? "";
  const nowSeconds = Math.floor(Date.now() / 1000);
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(nowSeconds - timestampSeconds) > 60 * 5) return false;

  const expected = `v0=${await hmacSha256(
    signingSecret,
    `v0:${timestamp}:${body}`,
  )}`;
  return safeEqual(signature, expected);
}

export async function postSlackMessage(
  env: Env,
  input: { text: string; channel?: string; threadTs?: string },
) {
  const config = await getSlackConfig(env);
  if (!config) return { posted: false, reason: "Slack connector is not active" };

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: input.channel ?? config.defaultChannel,
      text: input.text,
      ...(input.threadTs ? { thread_ts: input.threadTs } : {}),
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    ts?: string;
    error?: string;
  };

  return payload.ok
    ? { posted: true, ts: payload.ts }
    : {
        posted: false,
        reason: payload.error ?? `Slack returned ${response.status}`,
      };
}

function commandText(event: Record<string, unknown>) {
  const text = typeof event.text === "string" ? event.text : "";
  return text.replace(/<@[^>]+>/g, "").trim();
}

export async function handleSlackCommand(
  env: Env,
  input: { command: string; channel: string; threadTs?: string },
) {
  const command = input.command.toLowerCase().trim();
  const reply = async (text: string) =>
    await postSlackMessage(env, {
      text,
      channel: input.channel,
      threadTs: input.threadTs,
    });

  if (command === "help" || command === "commands" || command === "?") {
    return await reply(
      [
        "*GrowthRat commands*",
        "`plan` - run weekly planning",
        "`status` - show mode and review policy",
        "`report` - generate weekly report",
        "`opportunities` - rescore and show the top work backlog",
        "`approve [id]` - approve a pending distribution action",
        "`reject [id] because [reason]` - reject a pending action",
        "`stop` - pause automation",
        "`resume` - resume automation",
        "`write about [topic]` - create a source-grounded draft",
      ].join("\n"),
    );
  }

  if (command === "status" || command === "metrics") {
    const config = await getAgentConfig(env);
    return await reply(
      `*GrowthRat status*\nMode: ${config.mode}\nReview: ${config.reviewMode}\nPaused: ${config.paused ? "yes" : "no"}\nFocus: ${config.focusTopics.join(", ")}`,
    );
  }

  if (command === "opportunities" || command === "backlog" || command === "ideas") {
    await refreshOpportunities(env).catch(() => []);
    const opportunities = await listTopOpportunities(env, { limit: 5 }).catch(
      () => [],
    );
    return await reply(formatOpportunitiesSlackReport(opportunities));
  }

  if (command.startsWith("approve ")) {
    const requestId = input.command.replace(/^approve\s+/i, "").trim().split(/\s+/)[0];
    if (!requestId) {
      return await reply("Usage: `approve [approval_id_or_distribution_id]`");
    }

    const result = await approveRequest(env, requestId, "slack");
    return await reply(
      result.ok
        ? `*Approved.* ${requestId}`
        : `*Approval failed.* ${result.reason ?? "unknown error"}`,
    );
  }

  if (command.startsWith("reject ")) {
    const raw = input.command.replace(/^reject\s+/i, "").trim();
    const [requestId = "", ...rest] = raw.split(/\s+/);
    const reason = rest.join(" ").replace(/^because\s+/i, "").trim();
    if (!requestId) {
      return await reply("Usage: `reject [approval_id_or_distribution_id] because [reason]`");
    }

    const result = await rejectRequest(env, requestId, "slack", reason);
    return await reply(
      result.ok
        ? `*Rejected.* ${requestId}${reason ? `\nReason: ${reason}` : ""}`
        : `*Rejection failed.* ${result.reason ?? "unknown error"}`,
    );
  }

  if (command === "stop" || command === "pause") {
    await saveAgentConfig(env, { paused: true });
    return await reply("*Paused.* External automation will not run until resumed.");
  }

  if (command === "resume" || command === "start") {
    await saveAgentConfig(env, { paused: false });
    return await reply("*Resumed.* Automation can run inside current mode and policy gates.");
  }

  if (command === "plan" || command === "report" || command.startsWith("write ")) {
    const topic = command.startsWith("write ")
      ? input.command.replace(/^write (about )?/i, "").trim()
      : undefined;
    const run = await runWeeklyAdvocateLoop(env, {
      trigger: "slack",
      dryRun: String(env.APP_MODE) !== "rc_live",
      topic,
    });
    const text = formatAdvocateLoopSlackReport(run);
    const delivery = await reply(text);
    if (delivery.posted && "ts" in delivery) {
      await attachRunApprovalsToSlackThread(env, {
        runId: run.runLedgerId,
        channel: input.channel,
        threadTs: delivery.ts,
      }).catch(() => undefined);
    }
    await recordReportDelivery(env, {
      reportId: run.reportId,
      runId: run.runLedgerId,
      channel: "slack",
      status: delivery.posted ? "delivered" : "failed",
      destination: input.channel,
      externalId: "ts" in delivery ? delivery.ts ?? null : null,
      errorMessage: delivery.posted
        ? null
        : "reason" in delivery
          ? delivery.reason
          : "Slack delivery failed",
      detail: { command: input.command.slice(0, 120) },
    });
    return delivery;
  }

  await recordEvent(env, {
    type: "slack_question_received",
    path: "/api/slack/events",
    detail: { command: input.command.slice(0, 300) },
  });

  return await reply(
    "I received that. Use `help` for commands, or ask in the web panel for source-cited answers.",
  );
}

export async function handleSlackEventPayload(env: Env, payload: unknown) {
  if (!payload || typeof payload !== "object") return { ok: true };
  const body = payload as Record<string, unknown>;
  if (body.type === "url_verification") {
    return { ok: true, challenge: body.challenge };
  }

  const event = body.event as Record<string, unknown> | undefined;
  if (!event || event.bot_id || event.subtype === "bot_message") {
    return { ok: true };
  }

  const channel = typeof event.channel === "string" ? event.channel : "";
  const threadTs =
    typeof event.thread_ts === "string"
      ? event.thread_ts
      : typeof event.ts === "string"
        ? event.ts
        : undefined;

  if (event.type === "app_mention" || event.type === "message") {
    await handleSlackCommand(env, {
      command: commandText(event),
      channel,
      threadTs,
    });
  }

  if (event.type === "reaction_added") {
    const reaction = typeof event.reaction === "string" ? event.reaction : "";
    const item =
      event.item && typeof event.item === "object"
        ? (event.item as Record<string, unknown>)
        : {};
    const itemChannel = typeof item.channel === "string" ? item.channel : channel;
    const itemTs = typeof item.ts === "string" ? item.ts : "";
    const actor = typeof event.user === "string" ? event.user : "slack";

    if (["white_check_mark", "+1", "heavy_check_mark"].includes(reaction)) {
      const result = await decideApprovalBySlackThread(env, {
        channel: itemChannel,
        threadTs: itemTs,
        status: "approved",
        by: actor,
      });
      await postSlackMessage(env, {
        channel: itemChannel,
        threadTs: itemTs,
        text: result.ok
          ? `*Approved by reaction.* ${result.approvalId}`
          : `*Approval reaction ignored.* ${result.reason ?? "No pending request on this thread."}`,
      });
    }

    if (["x", "-1", "no_entry"].includes(reaction)) {
      const result = await decideApprovalBySlackThread(env, {
        channel: itemChannel,
        threadTs: itemTs,
        status: "rejected",
        by: actor,
        reason: `Slack reaction :${reaction}:`,
      });
      await postSlackMessage(env, {
        channel: itemChannel,
        threadTs: itemTs,
        text: result.ok
          ? `*Rejected by reaction.* ${result.approvalId}`
          : `*Rejection reaction ignored.* ${result.reason ?? "No pending request on this thread."}`,
      });
    }

    await recordEvent(env, {
      type: "slack_reaction_received",
      path: "/api/slack/events",
      detail: { event },
    });
  }

  return { ok: true };
}
