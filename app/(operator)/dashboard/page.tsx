"use client";

import Link from "next/link";
import { useConvexQuery, convexApi } from "../hooks/useConvexSafe";

// Sample data — used as fallback when Convex isn't connected
const SAMPLE_CONNECTORS = [
  { name: "Slack", status: "connected" as const },
  { name: "X / Twitter", status: "connected" as const },
  { name: "GitHub", status: "connected" as const },
  { name: "RevenueCat", status: "not_configured" as const },
  { name: "DataForSEO", status: "connected" as const },
];

const SAMPLE_RUNS = [
  {
    id: "run_001",
    workflow: "content_pipeline",
    status: "complete" as const,
    started: "2026-03-16 09:00",
    duration: "4m 12s",
  },
  {
    id: "run_002",
    workflow: "community_tracker",
    status: "complete" as const,
    started: "2026-03-16 08:30",
    duration: "1m 03s",
  },
  {
    id: "run_003",
    workflow: "experiment_check",
    status: "running" as const,
    started: "2026-03-16 09:15",
    duration: "0m 22s",
  },
  {
    id: "run_004",
    workflow: "feedback_ingest",
    status: "failed" as const,
    started: "2026-03-15 22:00",
    duration: "0m 05s",
  },
];

const SAMPLE_TASK_QUEUE = [
  "content:draft_flagship_1",
  "community:reply_x_thread",
  "experiment:log_metric",
];

function StatusDot({ status }: { status: "online" | "offline" }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        status === "online"
          ? "bg-[var(--color-op-green)]"
          : "bg-[var(--color-op-red)]"
      }`}
    />
  );
}

function RunStatusBadge({
  status,
}: {
  status: "complete" | "running" | "failed";
}) {
  const styles = {
    complete:
      "bg-[var(--color-op-green)]/15 text-[var(--color-op-green)]",
    running:
      "bg-[var(--color-op-blue)]/15 text-[var(--color-op-blue)]",
    failed:
      "bg-[var(--color-op-red)]/15 text-[var(--color-op-red)]",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  // CONVEX: wire to api.workflowRuns.list when connected
  const convexRuns = useConvexQuery(convexApi?.workflowRuns?.list, { limit: 10 });

  // Map Convex workflow run data to the UI shape, or fall back to sample data
  type Run = {
    id: string;
    workflow: string;
    status: "complete" | "running" | "failed";
    started: string;
    duration: string;
  };

  const recentRuns: Run[] = convexRuns
    ? convexRuns.map((run: Record<string, any>) => ({
        id: run._id as string,
        workflow: run.workflowType as string,
        status: run.status as "complete" | "running" | "failed",
        started: new Date(run._creationTime as number).toLocaleString(),
        duration: run.completedAt
          ? `${Math.round(((run.completedAt as number) - (run._creationTime as number)) / 1000)}s`
          : "...",
      }))
    : SAMPLE_RUNS;

  const connectors = SAMPLE_CONNECTORS; // No Convex table for connectors yet
  const taskQueue = SAMPLE_TASK_QUEUE; // No Convex table for task queue yet
  const systemOnline = true;

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
        Dashboard
      </h1>

      {/* Top row: Status + CTA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* System status */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <StatusDot status={systemOnline ? "online" : "offline"} />
            <span className="text-sm font-medium">
              System {systemOnline ? "Online" : "Offline"}
            </span>
          </div>
          <div className="text-xs text-[var(--color-op-dim)] mb-1">
            Task Queue
          </div>
          <div className="space-y-1">
            {taskQueue.map((task) => (
              <div
                key={task}
                className="font-mono text-xs text-[var(--color-op-muted)] bg-[var(--color-op-card-alt)] rounded px-2 py-1"
              >
                {task}
              </div>
            ))}
          </div>
        </div>

        {/* Connector status */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4">
          <div className="text-sm font-medium mb-3">Connectors</div>
          <div className="space-y-2">
            {connectors.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-[var(--color-op-muted)]">
                  {c.name}
                </span>
                {c.status === "connected" ? (
                  <span className="flex items-center gap-1.5 text-xs text-[var(--color-op-green)]">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-op-green)]" />
                    Connected
                  </span>
                ) : (
                  <span className="text-xs text-[var(--color-op-dim)]">
                    Not configured
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4 flex flex-col justify-between">
          <div>
            <div className="text-sm font-medium mb-1">Panel Console</div>
            <p className="text-xs text-[var(--color-op-muted)] mb-4">
              Run the AI-powered panel session for live interviews.
            </p>
          </div>
          <Link
            href="/panel"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-op-green)] text-white hover:opacity-90 transition-opacity"
          >
            Open Panel Console
          </Link>
        </div>
      </div>

      {/* Recent workflow runs */}
      <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)]">
        <div className="px-4 py-3 border-b border-[var(--color-op-border)]">
          <h2 className="text-sm font-medium">Recent Workflow Runs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--color-op-dim)] border-b border-[var(--color-op-border)]">
                <th className="px-4 py-2 font-medium">Run ID</th>
                <th className="px-4 py-2 font-medium">Workflow</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Started</th>
                <th className="px-4 py-2 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-[var(--color-op-border)] last:border-b-0 hover:bg-[var(--color-op-card-alt)] transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-op-muted)]">
                    {run.id}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {run.workflow}
                  </td>
                  <td className="px-4 py-2.5">
                    <RunStatusBadge status={run.status} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-op-muted)]">
                    {run.started}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-op-muted)]">
                    {run.duration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
