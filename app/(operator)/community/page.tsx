"use client";

import { useConvexQuery, convexApi } from "../hooks/useConvexSafe";

// Sample data — used as fallback when Convex isn't connected
const SAMPLE_COMMUNITY = {
  current: 12,
  target: 50,
  channels: [
    { name: "X / Twitter", count: 6, icon: "\u{1D54F}" },
    { name: "GitHub", count: 4, icon: "GH" },
    { name: "Discord", count: 2, icon: "DC" },
  ],
  quality: {
    high: 4,
    medium: 5,
    low: 3,
  },
  pendingDrafts: 3,
};

function ProgressBar({
  value,
  max,
  color = "var(--color-op-green)",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2.5 rounded-full bg-[var(--color-op-card-alt)]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function CommunityPage() {
  // CONVEX: wire to api.community.getStats when connected
  const convexStats = useConvexQuery(convexApi?.community?.getStats, {});

  // CONVEX: wire to api.community.list when connected
  const convexInteractions = useConvexQuery(convexApi?.community?.list, {});

  // Build display data from Convex or fall back to sample
  const data = convexStats
    ? {
        current: convexStats.total ?? 0,
        target: 50, // Target is a config constant, not stored in Convex yet
        channels: Object.entries(
          (convexStats as any).byChannel as Record<string, number>
        ).map(([name, count]) => ({
          name,
          count,
          icon: name.toLowerCase().includes("twitter")
            ? "\u{1D54F}"
            : name.toLowerCase().includes("github")
              ? "GH"
              : "DC",
        })),
        quality: {
          high: (convexStats as any).meaningful ?? 0,
          medium: Math.max(0, ((convexStats as any).total ?? 0) - ((convexStats as any).meaningful ?? 0)),
          low: 0,
        },
        pendingDrafts: convexInteractions
          ? convexInteractions.filter((i: any) => !i.meaningful).length
          : 0,
      }
    : SAMPLE_COMMUNITY;

  const pct = Math.round((data.current / data.target) * 100);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
        Community Tracker
      </h1>

      {/* Progress overview */}
      <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-[var(--color-op-muted)]">
            Weekly Interactions
          </span>
          <span className="text-sm font-medium text-[var(--color-op-text)]">
            {data.current} / {data.target}
            <span className="ml-2 text-xs text-[var(--color-op-dim)]">
              ({pct}%)
            </span>
          </span>
        </div>
        <ProgressBar value={data.current} max={data.target} />
      </div>

      {/* Grid: By Channel, Quality, Drafts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Channel */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4">
          <h2 className="text-xs font-medium text-[var(--color-op-dim)] uppercase tracking-wider mb-3">
            By Channel
          </h2>
          <div className="space-y-3">
            {data.channels.map((ch) => (
              <div key={ch.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-[var(--color-op-card-alt)] text-xs font-mono font-medium text-[var(--color-op-muted)]">
                    {ch.icon}
                  </span>
                  <span className="text-sm text-[var(--color-op-text)]">
                    {ch.name}
                  </span>
                </div>
                <span className="font-mono text-sm font-semibold text-[var(--color-op-text)]">
                  {ch.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4">
          <h2 className="text-xs font-medium text-[var(--color-op-dim)] uppercase tracking-wider mb-3">
            Quality Distribution
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-op-green)]" />
                High
              </span>
              <span className="font-mono text-sm font-semibold text-[var(--color-op-text)]">
                {data.quality.high}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-op-amber)]" />
                Medium
              </span>
              <span className="font-mono text-sm font-semibold text-[var(--color-op-text)]">
                {data.quality.medium}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-op-red)]" />
                Low
              </span>
              <span className="font-mono text-sm font-semibold text-[var(--color-op-text)]">
                {data.quality.low}
              </span>
            </div>
          </div>
        </div>

        {/* Pending Drafts */}
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-[var(--color-op-text)] mb-1">
            {data.pendingDrafts}
          </div>
          <div className="text-sm text-[var(--color-op-muted)]">
            Pending Drafts
          </div>
          <div className="text-xs text-[var(--color-op-dim)] mt-1">
            Awaiting review
          </div>
        </div>
      </div>
    </div>
  );
}
