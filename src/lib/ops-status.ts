import { getAgentConfig, type AgentConfig } from "./agent-config";
import {
  getConnectorChecks,
  type ConnectorCheck,
} from "./connected-accounts";
import { listRuns, type AgentRun } from "./run-ledger";

export type ApprovalRequestRow = {
  id: string;
  subject_type: string;
  subject_id: string;
  action_type: string;
  status: string;
  requested_by: string;
  requested_in_channel: string | null;
  slack_channel: string | null;
  slack_thread_ts: string | null;
  approved_by: string | null;
  decided_at: string | null;
  reason: string | null;
  detail_json: string;
  created_at: string;
  updated_at: string;
};

export type DistributionActionRow = {
  id: string;
  artifact_id: string | null;
  channel: string;
  action_type: string;
  status: string;
  external_id: string | null;
  external_url: string | null;
  detail_json: string;
  created_at: string;
  updated_at: string;
};

export type ReportDeliveryRow = {
  id: string;
  report_id: string | null;
  run_id: string | null;
  channel: string;
  status: string;
  destination: string | null;
  external_id: string | null;
  error_message: string | null;
  detail_json: string;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WeeklyReportRow = {
  id: string;
  week_start: string;
  week_end: string;
  status: string;
  summary: string | null;
  r2_key: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunitySignalRow = {
  id: string;
  channel: string;
  external_url: string;
  topic: string;
  context: string;
  response_draft: string | null;
  quality_status: string;
  posted_at: string | null;
  detail_json: string;
  created_at: string;
  updated_at: string;
};

export type OpsSnapshot = {
  generatedAt: string;
  config: AgentConfig;
  connectors: ConnectorCheck[];
  runs: AgentRun[];
  approvals: ApprovalRequestRow[];
  distributionActions: DistributionActionRow[];
  reportDeliveries: ReportDeliveryRow[];
  weeklyReports: WeeklyReportRow[];
  communitySignals: CommunitySignalRow[];
};

async function safeAll<T>(
  env: Env,
  sql: string,
  bind: unknown[] = [],
): Promise<T[]> {
  try {
    const statement = env.DB.prepare(sql);
    const result = bind.length
      ? await statement.bind(...bind).all<T>()
      : await statement.all<T>();
    return result.results;
  } catch {
    return [];
  }
}

export async function getOpsSnapshot(env: Env): Promise<OpsSnapshot> {
  const [
    config,
    connectors,
    runs,
    approvals,
    distributionActions,
    reportDeliveries,
    weeklyReports,
    communitySignals,
  ] = await Promise.all([
    getAgentConfig(env),
    getConnectorChecks(env),
    listRuns(env, 12).catch(() => []),
    safeAll<ApprovalRequestRow>(
      env,
      "select * from approval_requests order by created_at desc limit 20",
    ),
    safeAll<DistributionActionRow>(
      env,
      "select id, artifact_id, channel, action_type, status, external_id, external_url, detail_json, created_at, updated_at from distribution_actions order by created_at desc limit 20",
    ),
    safeAll<ReportDeliveryRow>(
      env,
      "select * from report_deliveries order by created_at desc limit 20",
    ),
    safeAll<WeeklyReportRow>(
      env,
      "select * from weekly_reports order by created_at desc limit 12",
    ),
    safeAll<CommunitySignalRow>(
      env,
      "select * from community_signals order by created_at desc limit 20",
    ),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    config,
    connectors,
    runs,
    approvals,
    distributionActions,
    reportDeliveries,
    weeklyReports,
    communitySignals,
  };
}
