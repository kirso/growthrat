import { getAgentConfig } from "./agent-config";
import { recordRunEvent } from "./run-ledger";

export type ApprovalDecision = {
  ok: boolean;
  approvalId?: string;
  status?: string;
  reason?: string;
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

export async function requestDistributionApproval(
  env: Env,
  input: {
    runId?: string | null;
    distributionActionId: string;
    artifactId: string;
    channel: string;
    actionType: string;
    title: string;
    slug: string;
  },
) {
  const approvalId = id("appr");
  const config = await getAgentConfig(env).catch(() => null);
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `insert or ignore into approval_requests (
        id, subject_type, subject_id, action_type, status, requested_by,
        requested_in_channel, slack_channel, detail_json, created_at, updated_at
      ) values (?, 'distribution_action', ?, ?, 'pending', 'growthrat', ?, ?, ?, ?, ?)`,
    )
      .bind(
        approvalId,
        input.distributionActionId,
        input.actionType,
        input.channel,
        config?.slackChannel ?? "growthrat",
        json({
          artifactId: input.artifactId,
          title: input.title,
          slug: input.slug,
          channel: input.channel,
        }),
        now,
        now,
      )
      .run();

    const row = await env.DB.prepare(
      `select id from approval_requests
       where subject_type = 'distribution_action'
         and subject_id = ?
         and action_type = ?
       limit 1`,
    )
      .bind(input.distributionActionId, input.actionType)
      .first<{ id: string }>();
    const storedApprovalId = row?.id ?? approvalId;

    await recordRunEvent(env, {
      runId: input.runId,
      eventType: "approval_requested",
      subjectType: "distribution_action",
      subjectId: input.distributionActionId,
      detail: {
        approvalId: storedApprovalId,
        channel: input.channel,
        title: input.title,
      },
    });

    return storedApprovalId;
  } catch {
    return null;
  }
}

async function decideApproval(
  env: Env,
  input: {
    approvalId: string;
    status: "approved" | "rejected";
    by: string;
    reason?: string;
  },
): Promise<ApprovalDecision> {
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    "select * from approval_requests where id = ? or subject_id = ? limit 1",
  )
    .bind(input.approvalId, input.approvalId)
    .first<{ id: string; subject_type: string; subject_id: string; status: string }>();

  if (!row) return { ok: false, reason: "approval request not found" };

  await env.DB.prepare(
    `update approval_requests set status = ?, approved_by = ?, decided_at = ?,
      reason = ?, updated_at = ? where id = ?`,
  )
    .bind(input.status, input.by, now, input.reason ?? null, now, row.id)
    .run();

  if (row.subject_type === "distribution_action") {
    await env.DB.prepare(
      "update distribution_actions set status = ?, updated_at = ? where id = ?",
    )
      .bind(input.status === "approved" ? "approved" : "rejected", now, row.subject_id)
      .run();
  }

  return { ok: true, approvalId: row.id, status: input.status };
}

export async function approveRequest(env: Env, approvalId: string, by: string) {
  return await decideApproval(env, { approvalId, status: "approved", by });
}

export async function rejectRequest(
  env: Env,
  approvalId: string,
  by: string,
  reason?: string,
) {
  return await decideApproval(env, { approvalId, status: "rejected", by, reason });
}

export async function attachRunApprovalsToSlackThread(
  env: Env,
  input: { runId?: string | null; channel: string; threadTs?: string | null },
) {
  if (!input.runId || !input.threadTs) return 0;

  const events = await env.DB.prepare(
    `select detail_json from agent_run_events
     where run_id = ? and event_type = 'approval_requested'
     order by created_at desc limit 20`,
  )
    .bind(input.runId)
    .all<{ detail_json: string }>();

  const approvalIds = events.results
    .map((event) => {
      try {
        const parsed = JSON.parse(event.detail_json) as { approvalId?: unknown };
        return typeof parsed.approvalId === "string" ? parsed.approvalId : "";
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  const now = new Date().toISOString();
  let updated = 0;
  for (const approvalId of approvalIds) {
    await env.DB.prepare(
      `update approval_requests
       set slack_channel = ?, slack_thread_ts = ?, updated_at = ?
       where id = ? and status = 'pending'`,
    )
      .bind(input.channel, input.threadTs, now, approvalId)
      .run();
    updated += 1;
  }

  return updated;
}

export async function decideApprovalBySlackThread(
  env: Env,
  input: {
    channel: string;
    threadTs: string;
    status: "approved" | "rejected";
    by: string;
    reason?: string;
  },
) {
  const row = await env.DB.prepare(
    `select id from approval_requests
     where slack_channel = ?
       and slack_thread_ts = ?
       and status = 'pending'
     order by created_at asc limit 1`,
  )
    .bind(input.channel, input.threadTs)
    .first<{ id: string }>();

  if (!row) return { ok: false, reason: "approval request not found" };

  return await decideApproval(env, {
    approvalId: row.id,
    status: input.status,
    by: input.by,
    reason: input.reason,
  });
}
