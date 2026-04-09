"use client";

import { useConvexAvailable, useConvexQuery, convexApi } from "../hooks/useConvexSafe";

interface ContentSlot {
  id: string;
  title: string;
  stage: "Draft" | "Quality Gates" | "Published";
  gates: boolean[];
}

interface Opportunity {
  score: number;
  title: string;
  lane: "SEO" | "Social" | "Community" | "Technical";
}

const stageBadgeColors = {
  Draft: "bg-[var(--color-op-amber)]/15 text-[var(--color-op-amber)]",
  "Quality Gates": "bg-[var(--color-op-blue)]/15 text-[var(--color-op-blue)]",
  Published: "bg-[var(--color-op-green)]/15 text-[var(--color-op-green)]",
};

const laneBadgeColors: Record<Opportunity["lane"], string> = {
  SEO: "bg-purple-500/15 text-purple-400",
  Social: "bg-[var(--color-op-blue)]/15 text-[var(--color-op-blue)]",
  Community: "bg-[var(--color-op-green)]/15 text-[var(--color-op-green)]",
  Technical: "bg-[var(--color-op-amber)]/15 text-[var(--color-op-amber)]",
};

function GateProgress({ gates }: { gates: boolean[] }) {
  if (gates.length === 0) {
    return <span className="text-xs text-[var(--color-op-dim)]">No gate results yet.</span>;
  }
  return (
    <div className="flex items-center gap-1">
      {gates.map((passed, i) => (
        <span
          key={i}
          className={`inline-block w-3 h-3 rounded-full text-[10px] flex items-center justify-center ${
            passed
              ? "bg-[var(--color-op-green)]"
              : "bg-[var(--color-op-card-alt)] border border-[var(--color-op-border)]"
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-[var(--color-op-dim)]">
        {gates.filter(Boolean).length}/{gates.length}
      </span>
    </div>
  );
}

export default function PipelinePage() {
  const available = useConvexAvailable();
  const convexArtifacts = useConvexQuery(convexApi?.artifacts?.list, {
    artifactType: "flagship",
  });

  const convexOpportunities = useConvexQuery(
    convexApi?.opportunities?.getTopOverall,
    { limit: 10 }
  );

  if (!available) {
    return (
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Content Pipeline
        </h1>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-op-dim)]">
            Convex is not connected yet. No pipeline data is available.
          </p>
        </div>
      </div>
    );
  }

  if (convexArtifacts === undefined || convexOpportunities === undefined) {
    return (
      <div className="space-y-6 max-w-5xl">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Content Pipeline
        </h1>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-op-dim)]">
            Loading live pipeline data...
          </p>
        </div>
      </div>
    );
  }

  const slots: ContentSlot[] = convexArtifacts.map((a: any) => ({
    id: a.slug ?? a._id,
    title: a.title,
    stage:
      a.status === "published"
        ? "Published" as const
        : a.status === "validated" || a.status === "pending_approval"
          ? "Quality Gates" as const
          : "Draft" as const,
    gates: a.qualityScores
      ? Object.values(a.qualityScores).map((v: any) => Boolean(v))
      : [],
  }));

  const opportunities: Opportunity[] = convexOpportunities.map((o: any) => ({
    score: o.score,
    title: o.title,
    lane: (o.lane ?? "Technical") as Opportunity["lane"],
  }));

  const derivatives: Array<{ type: string; title: string; status: string }> = [];

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
        Content Pipeline
      </h1>

      {/* This Week's Plan */}
      <section>
        <h2 className="text-sm font-medium text-[var(--color-op-muted)] uppercase tracking-wider mb-3">
          This Week&apos;s Plan
        </h2>
        {slots.length === 0 ? (
          <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-8 text-center">
            <p className="text-sm text-[var(--color-op-dim)]">
              No flagship content queued yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="text-xs text-[var(--color-op-dim)] mb-1">
                      Flagship {index + 1}
                    </div>
                    <h3 className="text-sm font-medium text-[var(--color-op-text)] leading-snug">
                      {slot.title}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${stageBadgeColors[slot.stage]}`}
                  >
                    {slot.stage}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-op-dim)] mb-1.5">
                  Quality Gates
                </div>
                <GateProgress gates={slot.gates} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Derivatives */}
      <section>
        <h2 className="text-sm font-medium text-[var(--color-op-muted)] uppercase tracking-wider mb-3">
          Derivatives
        </h2>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] divide-y divide-[var(--color-op-border)]">
          {derivatives.length === 0 ? (
            <div className="px-4 py-8 text-sm text-[var(--color-op-dim)]">
              No derivative assets recorded yet.
            </div>
          ) : (
            derivatives.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-op-card-alt)] text-[var(--color-op-muted)]">
                    {d.type}
                  </span>
                  <span className="text-sm text-[var(--color-op-text)]">
                    {d.title}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-op-dim)]">
                  {d.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Opportunity Queue */}
      <section>
        <h2 className="text-sm font-medium text-[var(--color-op-muted)] uppercase tracking-wider mb-3">
          Opportunity Queue
        </h2>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] divide-y divide-[var(--color-op-border)]">
          {opportunities.length === 0 ? (
            <div className="px-4 py-8 text-sm text-[var(--color-op-dim)]">
              No scored opportunities yet.
            </div>
          ) : (
            opportunities.map((opp, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <span className="shrink-0 w-10 text-right font-mono text-sm font-semibold text-[var(--color-op-green)]">
                  {opp.score}
                </span>
                <span className="flex-1 text-sm text-[var(--color-op-text)]">
                  {opp.title}
                </span>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${laneBadgeColors[opp.lane]}`}
                >
                  {opp.lane}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
