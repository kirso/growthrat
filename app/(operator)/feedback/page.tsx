"use client";

import { useConvexAvailable, useConvexQuery, convexApi } from "../hooks/useConvexSafe";

interface FeedbackItem {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  status: "draft" | "filed" | "acknowledged";
  source: string;
}

const severityColors = {
  high: "bg-[var(--color-op-red)]/15 text-[var(--color-op-red)]",
  medium: "bg-[var(--color-op-amber)]/15 text-[var(--color-op-amber)]",
  low: "bg-[var(--color-op-dim)]/15 text-[var(--color-op-dim)]",
};

const statusColors: Record<string, string> = {
  draft: "bg-[var(--color-op-dim)]/15 text-[var(--color-op-dim)]",
  filed: "bg-[var(--color-op-blue)]/15 text-[var(--color-op-blue)]",
  acknowledged: "bg-[var(--color-op-amber)]/15 text-[var(--color-op-amber)]",
  actioned: "bg-[var(--color-op-green)]/15 text-[var(--color-op-green)]",
};

export default function FeedbackPage() {
  const available = useConvexAvailable();
  const convexItems = useConvexQuery(convexApi?.feedbackItems?.list, {});

  if (!available) {
    return (
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Feedback Manager
        </h1>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-op-dim)]">
            Convex is not connected yet. No feedback items are available.
          </p>
        </div>
      </div>
    );
  }

  if (convexItems === undefined) {
    return (
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Feedback Manager
        </h1>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-op-dim)]">
            Loading live feedback items...
          </p>
        </div>
      </div>
    );
  }

  const items: FeedbackItem[] = convexItems.map((f: any) => ({
    id: f._id,
    title: f.title,
    severity: (f.metadata?.severity ?? "medium") as FeedbackItem["severity"],
    status: f.status as FeedbackItem["status"],
    source: f.sourceLane ?? f.evidence ?? "Unknown",
  }));

  const patterns = items.length > 0
    ? [
        items.some((item) => /api/i.test(item.title) || /api/i.test(item.source))
          ? { pattern: "API friction appears in the current feedback set", confidence: "high" as const }
          : null,
        items.some((item) => /docs|documentation/i.test(item.title + " " + item.source))
          ? { pattern: "Documentation gaps are recurring", confidence: "medium" as const }
          : null,
        items.some((item) => /charts|analytics/i.test(item.title + " " + item.source))
          ? { pattern: "Analytics access remains a repeated theme", confidence: "medium" as const }
          : null,
      ].filter((p): p is { pattern: string; confidence: "high" | "medium" } => Boolean(p))
    : [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Feedback Manager
        </h1>
        <span className="text-sm text-[var(--color-op-muted)]">
          {items.filter((i) => i.status === "filed").length} filed /{" "}
          {items.length} total
        </span>
      </div>

      {/* Mode context */}
      <div className="rounded-md bg-[var(--color-op-card-alt)] border border-[var(--color-op-border)] px-4 py-2.5 text-xs text-[var(--color-op-dim)]">
        Data shown reflects the current operating mode. Portfolio samples are displayed until a proof cycle runs.
      </div>

      {/* Feedback table */}
      <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)]">
        <div className="overflow-x-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-sm text-[var(--color-op-dim)]">
              No feedback items filed yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-op-dim)] border-b border-[var(--color-op-border)]">
                  <th className="px-4 py-2.5 font-medium w-28">Status</th>
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium w-24">Severity</th>
                  <th className="px-4 py-2.5 font-medium w-40">Source</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--color-op-border)] last:border-b-0 hover:bg-[var(--color-op-card-alt)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-op-text)]">
                      {item.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${severityColors[item.severity]}`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-op-muted)]">
                      {item.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pattern Detection */}
      <section>
        <h2 className="text-xs font-medium text-[var(--color-op-dim)] uppercase tracking-wider mb-3">
          Pattern Detection
        </h2>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] divide-y divide-[var(--color-op-border)]">
          {patterns.length === 0 ? (
            <div className="px-4 py-8 text-sm text-[var(--color-op-dim)]">
              No repeatable feedback patterns yet.
            </div>
          ) : (
            patterns.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--color-op-amber)]">
                    {p.confidence === "high" ? "!!" : "!"}
                  </span>
                  <span className="text-sm text-[var(--color-op-text)]">
                    {p.pattern}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    p.confidence === "high"
                      ? "bg-[var(--color-op-amber)]/15 text-[var(--color-op-amber)]"
                      : "bg-[var(--color-op-dim)]/15 text-[var(--color-op-dim)]"
                  }`}
                >
                  {p.confidence} confidence
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
