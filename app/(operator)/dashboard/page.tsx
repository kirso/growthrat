"use client";

import Link from "next/link";
import { useConvexAvailable, useConvexQuery, convexApi } from "../hooks/useConvexSafe";

type ConnectorStatus = "connected" | "configured_not_verified" | "not_configured" | "error";

interface Connector {
  name: string;
  status: ConnectorStatus;
  detail: string;
}

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

function ConnectorBadge({ status }: { status: ConnectorStatus }) {
  return status === "connected" ? (
    <span className="text-xs text-[var(--color-op-green)]">Verified</span>
  ) : status === "configured_not_verified" ? (
    <span className="text-xs text-[var(--color-op-amber)]">Configured, not verified</span>
  ) : status === "error" ? (
    <span className="text-xs text-[var(--color-op-red)]">Verification failed</span>
  ) : (
    <span className="text-xs text-[var(--color-op-dim)]">Not configured</span>
  );
}

export default function DashboardPage() {
  const available = useConvexAvailable();
  const convexRuns = useConvexQuery(convexApi?.workflowRuns?.list, { limit: 10 });
  const convexConfig = useConvexQuery(convexApi?.agentConfig?.get, {});
  const connectorSummary = useConvexQuery(convexApi?.onboarding?.getConnectorStatuses, {});
  const freshnessSummary = useConvexQuery(convexApi?.sources?.getFreshnessSummary, {});
  const usageSummary = useConvexQuery(convexApi?.usageEvents?.getSummary, {});
  if (!available) {
    return (
      <div className="space-y-6 max-w-6xl">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Dashboard
        </h1>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-5">
          <p className="text-sm text-[var(--color-op-muted)]">
            Convex is not connected yet. Connect the backend to see live workflow runs, connector state, and queue data.
          </p>
        </div>
      </div>
    );
  }

  if (convexRuns === undefined || convexConfig === undefined || connectorSummary === undefined || freshnessSummary === undefined || usageSummary === undefined) {
    return (
      <div className="space-y-6 max-w-6xl">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Dashboard
        </h1>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-5">
          <p className="text-sm text-[var(--color-op-muted)]">
            Loading live Convex state...
          </p>
        </div>
      </div>
    );
  }

  type Run = {
    id: string;
    workflow: string;
    status: "complete" | "running" | "failed";
    started: string;
    duration: string;
  };

  const recentRuns: Run[] = convexRuns.map((run: Record<string, any>) => ({
    id: run._id as string,
    workflow: run.workflowType as string,
    status: run.status === "completed" ? "complete" : run.status === "running" ? "running" : "failed",
    started: new Date(run._creationTime as number).toLocaleString(),
    duration: run.completedAt
      ? `${Math.round(((run.completedAt as number) - (run._creationTime as number)) / 1000)}s`
      : "...",
  }));

  const config = convexConfig as {
    mode?: string;
    paused?: boolean;
    isActive?: boolean;
    expired?: boolean;
    slackChannel?: string;
    githubOrg?: string;
  } | null;
  const connectorNames: Record<string, string> = {
    slack: "Slack",
    twitter: "X / Twitter",
    github: "GitHub",
    revenuecat: "RevenueCat",
    dataforseo: "DataForSEO",
    typefully: "Typefully",
    cms: "CMS",
  };

  const connectors: Connector[] = (connectorSummary as Array<Record<string, any>>).map((connector) => {
    const rawStatus = connector.status as string;
    const status: ConnectorStatus =
      rawStatus === "verified"
        ? "connected"
        : rawStatus === "manual_verification"
          ? "configured_not_verified"
          : rawStatus === "error"
            ? "error"
            : "not_configured";
    return {
      name: connectorNames[connector.connector] ?? connector.connector,
      status,
      detail:
        connector.errorSummary ||
        connector.label ||
        (status === "connected"
          ? "Verified"
          : status === "configured_not_verified"
            ? "Configured, pending manual verification"
            : "Not configured"),
    };
  });

  const taskQueue = convexRuns
    .filter((r: Record<string, unknown>) => r.status === "running")
    .map((r: Record<string, unknown>) => `${r.workflowType}`)
    .slice(0, 5);
  const currentMode = config?.mode ?? "dormant";
  const systemOnline = config?.isActive ?? false;
  const staleSources = freshnessSummary?.staleCount ?? 0;
  const estimatedUsd24h = (usageSummary as { estimatedUsd24h?: number } | null)?.estimatedUsd24h ?? 0;
  const events24h = (usageSummary as { events24h?: number } | null)?.events24h ?? 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
        Dashboard
      </h1>

      {/* Top row: Status + CTA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* System status */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <StatusDot status={systemOnline ? "online" : "offline"} />
            <span className="text-sm font-medium">
              System {systemOnline ? "Online" : "Dormant / Paused"}
            </span>
          </div>
          <div className="text-xs text-[var(--color-op-dim)] mb-1">
            Mode: <span className="font-mono">{currentMode}</span>
          </div>
          {config?.expired && (
            <div className="text-xs text-[var(--color-op-dim)] mb-1">
              Interview proof window expired
            </div>
          )}
          <div className="text-xs text-[var(--color-op-dim)] mb-1">
            Task Queue
          </div>
          {taskQueue.length === 0 ? (
            <div className="text-xs text-[var(--color-op-dim)]">
              No running workflows yet.
            </div>
          ) : (
            <div className="space-y-1">
              {taskQueue.map((task: string) => (
                <div
                  key={task}
                  className="font-mono text-xs text-[var(--color-op-muted)] bg-[var(--color-op-card-alt)] rounded px-2 py-1"
                >
                  {task}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connector status */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4">
          <div className="text-sm font-medium mb-3">Connectors</div>
          <div className="space-y-3">
            {connectors.map((c) => (
              <div key={c.name} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="text-[var(--color-op-text)]">{c.name}</div>
                  <div className="text-xs text-[var(--color-op-dim)]">{c.detail}</div>
                </div>
                <ConnectorBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Docs freshness */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4 flex flex-col justify-between">
          <div>
            <div className="text-sm font-medium mb-1">Docs Freshness</div>
            <p className="text-xs text-[var(--color-op-muted)] mb-4">
              Monitor whether the ingested RevenueCat knowledge base is drifting stale.
            </p>
            <div className="text-2xl font-semibold text-[var(--color-op-text)]">
              {staleSources}
            </div>
            <div className="text-xs text-[var(--color-op-dim)]">
              stale source chunks
            </div>
          </div>
          <Link
            href="/go-live"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-op-green)] text-white hover:opacity-90 transition-opacity"
          >
            Review Go-Live Checks
          </Link>
        </div>

        {/* Usage telemetry */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4 flex flex-col justify-between">
          <div>
            <div className="text-sm font-medium mb-1">Usage Telemetry</div>
            <p className="text-xs text-[var(--color-op-muted)] mb-4">
              Model spend and event volume over the last 24 hours.
            </p>
            <div className="text-2xl font-semibold text-[var(--color-op-text)]">
              ${estimatedUsd24h.toFixed(2)}
            </div>
            <div className="text-xs text-[var(--color-op-dim)]">
              {events24h} logged model events
            </div>
          </div>
          <Link
            href="/go-live"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-op-card-alt)] text-[var(--color-op-text)] hover:opacity-90 transition-opacity"
          >
            Inspect Runtime Readiness
          </Link>
        </div>
      </div>

      {/* Recent workflow runs */}
      <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)]">
        <div className="px-4 py-3 border-b border-[var(--color-op-border)]">
          <h2 className="text-sm font-medium">Recent Workflow Runs</h2>
        </div>
        <div className="overflow-x-auto">
          {recentRuns.length === 0 ? (
            <div className="px-4 py-8 text-sm text-[var(--color-op-dim)]">
              No workflow runs recorded yet.
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
