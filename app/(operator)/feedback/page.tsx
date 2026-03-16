"use client";

import { useConvexQuery, convexApi } from "../hooks/useConvexSafe";

// Sample data — used as fallback when Convex isn't connected
interface FeedbackItem {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  status: "new" | "acknowledged" | "actioned";
  source: string;
}

const SAMPLE_ITEMS: FeedbackItem[] = [
  {
    id: "fb_001",
    title: "API-first access model would lower onboarding friction",
    severity: "high",
    status: "acknowledged",
    source: "Interview prep research",
  },
  {
    id: "fb_002",
    title: "Developer docs need more real-world integration examples",
    severity: "medium",
    status: "new",
    source: "Community analysis",
  },
  {
    id: "fb_003",
    title: "Pricing page could better communicate indie tier value",
    severity: "medium",
    status: "new",
    source: "Competitor review",
  },
];

const SAMPLE_PATTERNS = [
  {
    pattern: "API-first access mentioned in 2/3 items",
    confidence: "high",
  },
  {
    pattern: "Documentation gaps referenced across sources",
    confidence: "medium",
  },
];

const severityColors = {
  high: "bg-[var(--color-op-red)]/15 text-[var(--color-op-red)]",
  medium: "bg-[var(--color-op-amber)]/15 text-[var(--color-op-amber)]",
  low: "bg-[var(--color-op-dim)]/15 text-[var(--color-op-dim)]",
};

const statusColors = {
  new: "bg-[var(--color-op-blue)]/15 text-[var(--color-op-blue)]",
  acknowledged: "bg-[var(--color-op-amber)]/15 text-[var(--color-op-amber)]",
  actioned: "bg-[var(--color-op-green)]/15 text-[var(--color-op-green)]",
};

export default function FeedbackPage() {
  // CONVEX: wire to api.feedbackItems.list when connected
  const convexItems = useConvexQuery(convexApi?.feedbackItems?.list, {});

  // Map Convex feedback items to the UI shape, or fall back to sample data
  const items: FeedbackItem[] = convexItems
    ? convexItems.map((f: any) => ({
        id: f._id,
        title: f.title,
        severity: (f.metadata?.severity ?? "medium") as FeedbackItem["severity"],
        status: f.status as FeedbackItem["status"],
        source: f.sourceLane ?? f.evidence ?? "Unknown",
      }))
    : SAMPLE_ITEMS;

  const patterns = SAMPLE_PATTERNS; // Pattern detection not yet in Convex

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Feedback Manager
        </h1>
        <span className="text-sm text-[var(--color-op-muted)]">
          {items.length} / {items.length} items this week
        </span>
      </div>

      {/* Feedback table */}
      <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)]">
        <div className="overflow-x-auto">
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
        </div>
      </div>

      {/* Pattern Detection */}
      <section>
        <h2 className="text-xs font-medium text-[var(--color-op-dim)] uppercase tracking-wider mb-3">
          Pattern Detection
        </h2>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] divide-y divide-[var(--color-op-border)]">
          {patterns.map((p, i) => (
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
          ))}
        </div>
      </section>
    </div>
  );
}
