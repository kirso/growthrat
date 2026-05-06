"use client";

import { useConvexAvailable, useConvexQuery, convexApi } from "../hooks/useConvexSafe";

interface Experiment {
  id: string;
  title: string;
  hypothesis: string;
  baseline: string;
  target: string;
  currentDay: number;
  totalDays: number;
  status: "active" | "paused" | "complete" | "stopped";
  stopCondition: string;
  currentMetric: string;
}

function ExperimentProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = Math.min((current / total) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-op-muted)]">
          Day {current} / {total}
        </span>
        <span className="text-[var(--color-op-dim)]">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-[var(--color-op-card-alt)]">
        <div
          className="h-full rounded-full bg-[var(--color-op-green)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  planned: "bg-[var(--color-op-dim)]/15 text-[var(--color-op-dim)]",
  running: "bg-[var(--color-op-green)]/15 text-[var(--color-op-green)]",
  measuring: "bg-[var(--color-op-amber)]/15 text-[var(--color-op-amber)]",
  completed: "bg-[var(--color-op-blue)]/15 text-[var(--color-op-blue)]",
  stopped: "bg-[var(--color-op-red)]/15 text-[var(--color-op-red)]",
};

export default function ExperimentsPage() {
  const available = useConvexAvailable();
  const convexActive = useConvexQuery(convexApi?.experiments?.list, {
    status: "running",
  });
  const convexCompleted = useConvexQuery(convexApi?.experiments?.list, {
    status: "completed",
  });

  if (!available) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Experiment Tracker
        </h1>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-op-dim)]">
            Convex is not connected yet. No experiment data is available.
          </p>
        </div>
      </div>
    );
  }

  if (convexActive === undefined || convexCompleted === undefined) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
          Experiment Tracker
        </h1>
        <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-op-dim)]">
            Loading live experiment state...
          </p>
        </div>
      </div>
    );
  }

  const mapExperiment = (e: any): Experiment => ({
    id: e.experimentKey ?? e._id,
    title: e.title,
    hypothesis: e.hypothesis ?? "",
    baseline: e.baselineMetric ?? "",
    target: e.targetMetric ?? "",
    currentDay: e.results?.currentDay ?? 0,
    totalDays: e.results?.totalDays ?? 14,
    status: e.status as Experiment["status"],
    stopCondition: e.results?.stopCondition ?? "",
    currentMetric: e.results?.currentMetric ?? "",
  });

  const activeExperiment: Experiment | null = convexActive.length > 0
    ? mapExperiment(convexActive[0])
    : null;

  const completed: Experiment[] = convexCompleted.map(mapExperiment);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-[var(--color-op-text)]">
        Experiment Tracker
      </h1>

      {/* Mode context */}
      <div className="rounded-md bg-[var(--color-op-card-alt)] border border-[var(--color-op-border)] px-4 py-2.5 text-xs text-[var(--color-op-dim)]">
        Data shown reflects the current operating mode. Portfolio samples are displayed until a proof cycle runs.
      </div>

      {/* Active Experiment */}
      <section>
        <h2 className="text-xs font-medium text-[var(--color-op-dim)] uppercase tracking-wider mb-3">
          Active Experiment
        </h2>
        {activeExperiment ? (
          <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-[var(--color-op-dim)] mb-1">
                  {activeExperiment.id}
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-op-text)]">
                  {activeExperiment.title}
                </h3>
              </div>
              <span
                className={`shrink-0 px-2.5 py-1 rounded text-xs font-medium capitalize ${statusColors[activeExperiment.status]}`}
              >
                {activeExperiment.status}
              </span>
            </div>

            {/* Hypothesis */}
            <div>
              <div className="text-xs text-[var(--color-op-dim)] mb-1">
                Hypothesis
              </div>
              <p className="text-sm text-[var(--color-op-muted)] leading-relaxed">
                {activeExperiment.hypothesis}
              </p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded bg-[var(--color-op-card-alt)] p-3">
                <div className="text-xs text-[var(--color-op-dim)] mb-1">
                  Baseline
                </div>
                <div className="text-sm text-[var(--color-op-text)]">
                  {activeExperiment.baseline}
                </div>
              </div>
              <div className="rounded bg-[var(--color-op-card-alt)] p-3">
                <div className="text-xs text-[var(--color-op-dim)] mb-1">
                  Target
                </div>
                <div className="text-sm text-[var(--color-op-text)]">
                  {activeExperiment.target}
                </div>
              </div>
              <div className="rounded bg-[var(--color-op-card-alt)] p-3">
                <div className="text-xs text-[var(--color-op-dim)] mb-1">
                  Current
                </div>
                <div className="text-sm font-medium text-[var(--color-op-green)]">
                  {activeExperiment.currentMetric}
                </div>
              </div>
            </div>

            {/* Progress */}
            <ExperimentProgress
              current={activeExperiment.currentDay}
              total={activeExperiment.totalDays}
            />

            {/* Stop condition */}
            <div className="rounded bg-[var(--color-op-card-alt)] border border-[var(--color-op-border)] p-3">
              <div className="text-xs text-[var(--color-op-dim)] mb-1">
                Stop Condition
              </div>
              <p className="text-sm text-[var(--color-op-muted)]">
                {activeExperiment.stopCondition}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-8 text-center">
            <p className="text-sm text-[var(--color-op-dim)]">
              No active experiments yet. Run the weekly planner to start one.
            </p>
          </div>
        )}
      </section>

      {/* Completed Experiments */}
      <section>
        <h2 className="text-xs font-medium text-[var(--color-op-dim)] uppercase tracking-wider mb-3">
          Completed Experiments
        </h2>
        {completed.length === 0 ? (
          <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-8 text-center">
            <p className="text-sm text-[var(--color-op-dim)]">
              No completed experiments yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((exp) => (
              <div
                key={exp.id}
                className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-op-text)]">
                    {exp.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[exp.status]}`}
                  >
                    {exp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
