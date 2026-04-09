"use client";

import { useState } from "react";
import { useConvexQuery, convexApi } from "../hooks/useConvexSafe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SystemHealth {
  config: {
    mode: string;
    reviewMode: string;
    paused: boolean;
    isActive?: boolean;
    expired?: boolean;
    enabledPlatforms: string[];
    focusTopics: string[];
    slackChannel: string;
    activeUntil: number | null;
    budgetPolicy: unknown;
  } | null;
  knowledge: { sourceChunks: number; providers: string[] };
  content: {
    total: number;
    published: number;
    pipelinePublished: number;
    seedPublished: number;
    draft: number;
    pending: number;
  };
  experiments: { total: number; running: number; completed: number };
  feedback: { total: number; filed: number };
  community: { total: number; meaningful: number };
  reports: { total: number };
  recentRuns: Array<{ type: string; status: string; time: number }>;
}

// ---------------------------------------------------------------------------
// Preflight check definitions
// ---------------------------------------------------------------------------

interface Check {
  label: string;
  required: boolean;
  test: (h: SystemHealth) => boolean;
  hint: string;
}

const PREFLIGHT_CHECKS: Check[] = [
  {
    label: "Knowledge base populated",
    required: true,
    test: (h) => h.knowledge.sourceChunks > 50,
    hint: "Run knowledge ingestion: trigger startKnowledgeIngest from Convex dashboard",
  },
  {
    label: "Agent config created",
    required: true,
    test: (h) => h.config !== null,
    hint: "Complete the Onboarding page to set review mode and preferences",
  },
  {
    label: "Operating mode enabled",
    required: true,
    test: (h) => h.config?.isActive === true,
    hint: "Set Operating Mode to interview_proof or rc_live in onboarding. Interview proof now expires automatically.",
  },
  {
    label: "Agent not paused",
    required: true,
    test: (h) => h.config?.paused === false,
    hint: "Resume the agent or switch out of dormant mode before running the proof cycle.",
  },
  {
    label: "Review mode set",
    required: true,
    test: (h) => !!h.config?.reviewMode,
    hint: "Set review mode in Onboarding (draft_only recommended for first run)",
  },
  {
    label: "At least 1 pipeline-produced artifact",
    required: false,
    test: (h) => h.content.pipelinePublished > 0,
    hint: "Run the content pipeline once with real credentials so the system has at least one live artifact",
  },
  {
    label: "At least 1 experiment created",
    required: false,
    test: (h) => h.experiments.total > 0,
    hint: "Trigger the weekly planner — it starts an experiment automatically",
  },
  {
    label: "At least 1 feedback item",
    required: false,
    test: (h) => h.feedback.total > 0,
    hint: "Trigger the weekly planner — it starts 3 feedback workflows",
  },
  {
    label: "At least 1 weekly report",
    required: false,
    test: (h) => h.reports.total > 0,
    hint: "Trigger startWeeklyReport from Convex dashboard",
  },
  {
    label: "Community interactions logged",
    required: false,
    test: (h) => h.community.total > 0,
    hint: "Trigger the community monitor workflow",
  },
];

// ---------------------------------------------------------------------------
// Stage readiness definitions
// ---------------------------------------------------------------------------

interface Stage {
  id: number;
  title: string;
  description: string;
  requirements: string[];
  test: (h: SystemHealth) => boolean;
}

const STAGES: Stage[] = [
  {
    id: 1,
    title: "Application Review",
    description: "Public URL, application letter, portfolio samples, live chat with RAG",
    requirements: [
      "Knowledge base populated (50+ chunks from RC docs)",
      "Chat returns grounded answers citing ingested docs",
      "Portfolio articles demonstrate content quality",
      "Application letter with honest pre-hire/post-hire framing",
    ],
    test: (h) => h.knowledge.sourceChunks > 50,
  },
  {
    id: 2,
    title: "Take-Home Assignment",
    description: "Run the system end-to-end with real credentials, producing real artifacts",
    requirements: [
      "At least 1 pipeline-generated article (not seeded)",
      "At least 1 feedback item filed as GitHub issue",
      "At least 1 experiment with real DataForSEO baseline",
      "At least 1 weekly report from real DB metrics",
      "At least 1 workflow run completed successfully",
    ],
    test: (h) =>
      h.content.pipelinePublished > 0 &&
      h.recentRuns.some((r) => r.status === "completed") && // At least one real workflow completed
      h.feedback.filed > 0 &&
      h.experiments.total > 0 &&
      h.reports.total > 0,
  },
  {
    id: 3,
    title: "Panel Interview",
    description: "Live demo of judgment, not just features: retrieval, validation, safety, measurement",
    requirements: [
      "All Stage 2 requirements met",
      "Panel console returns real data from Convex (not fallbacks)",
      "Approval flow demo-ready (draft_only mode configured)",
      "Kill switch demo-ready (pause/resume works)",
      "Community signals from GitHub + X visible",
    ],
    test: (h) =>
      h.content.pipelinePublished > 0 &&
      h.recentRuns.some((r) => r.status === "completed") &&
      h.feedback.filed > 0 &&
      h.experiments.total > 0 &&
      h.reports.total > 0 &&
      h.community.total > 0 &&
      h.config?.reviewMode === "draft_only",
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function CheckItem({ check, health }: { check: Check; health: SystemHealth }) {
  const passed = check.test(health);
  return (
    <div className="flex items-start gap-3 py-2">
      <span className={`mt-0.5 text-sm ${passed ? "text-emerald-400" : check.required ? "text-red-400" : "text-[var(--color-op-amber)]"}`}>
        {passed ? "+" : check.required ? "x" : "-"}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${passed ? "text-[var(--color-op-text)]" : "text-[var(--color-op-muted)]"}`}>
            {check.label}
          </span>
          {check.required && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-op-card-alt)] text-[var(--color-op-dim)]">
              required
            </span>
          )}
        </div>
        {!passed && (
          <p className="text-xs text-[var(--color-op-dim)] mt-0.5">{check.hint}</p>
        )}
      </div>
    </div>
  );
}

function StageCard({ stage, health }: { stage: Stage; health: SystemHealth }) {
  const ready = stage.test(health);
  return (
    <div className={`rounded-lg border p-4 ${ready ? "border-emerald-500/30 bg-emerald-500/5" : "border-[var(--color-op-border)] bg-[var(--color-op-card)]"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${ready ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--color-op-card-alt)] text-[var(--color-op-dim)]"}`}>
          Stage {stage.id}
        </span>
        <span className="text-sm font-medium text-[var(--color-op-text)]">{stage.title}</span>
      </div>
      <p className="text-xs text-[var(--color-op-muted)] mb-3">{stage.description}</p>
      <ul className="space-y-1">
        {stage.requirements.map((req) => (
          <li key={req} className="text-xs text-[var(--color-op-dim)] flex items-center gap-1.5">
            <span className={ready ? "text-emerald-400" : "text-[var(--color-op-dim)]"}>{ready ? "+" : "-"}</span>
            {req}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricBox({ label, value, target }: { label: string; value: number; target?: number }) {
  const met = target ? value >= target : value > 0;
  return (
    <div className="rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)] p-3 text-center">
      <div className={`text-2xl font-bold ${met ? "text-emerald-400" : "text-[var(--color-op-muted)]"}`}>
        {value}{target ? `/${target}` : ""}
      </div>
      <div className="text-xs text-[var(--color-op-dim)] mt-1">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Capability map
// ---------------------------------------------------------------------------

// Three-state capability model:
// "built"        — code path exists, not yet run with real credentials
// "activated"    — has run on operator infrastructure and produced real output
// "rc-connected" — operating against RevenueCat's assets (post-hire only)
// "deferred"     — not yet implemented
type CapStatus = "built" | "activated" | "rc-connected" | "deferred";

const CAPABILITIES: Array<{ name: string; status: CapStatus; detail: string }> = [
  { name: "RAG-grounded Q&A", status: "built", detail: "Voyage AI embeddings, vector search over ingested RC docs" },
  { name: "Multi-type content generation", status: "built", detail: "blog_post, comparison, api_guide, integration_guide, faq_hub" },
  { name: "Quality-gated validation", status: "built", detail: "8 gates: grounding, novelty, technical, seo, aeo, geo, benchmark, voice" },
  { name: "Approval-gated publishing", status: "built", detail: "draft_only, semi_auto, bounded_autonomy modes" },
  { name: "Multi-platform distribution", status: "built", detail: "X, LinkedIn, Threads, Bluesky, Mastodon via Typefully + GitHub" },
  { name: "Weekly planning from search intelligence", status: "built", detail: "DataForSEO today; Ahrefs can remain optional behind the same provider layer" },
  { name: "Structured product feedback", status: "built", detail: "LLM-generated, filed as GitHub issues, URL persisted" },
  { name: "Growth experiments", status: "built", detail: "Search-intel baseline + 7-day scheduled measurement on operator domain" },
  { name: "Weekly reporting", status: "built", detail: "Real metrics from Convex, posted to Slack" },
  { name: "Community monitoring (GitHub)", status: "built", detail: "8 RC SDK repos, keyword filtering, comment posting" },
  { name: "Community monitoring (X)", status: "built", detail: "Twitter API v2 search, signal detection" },
  { name: "Kill switch", status: "built", detail: "All 7 workflow starters require dormant=false and paused=false" },
  { name: "Operator dashboard", status: "built", detail: "Real-time Convex queries, reactive updates" },
  { name: "Knowledge refresh", status: "built", detail: "Daily cron at 6am UTC, content-hash dedup" },
  { name: "Panel interview console", status: "built", detail: "Real tool data from Convex, streaming SSE" },
  { name: "CMS publishing (RC blog)", status: "rc-connected", detail: "Requires RC CMS API access post-hire" },
  { name: "Charts API metrics", status: "rc-connected", detail: "Requires RC Charts API access post-hire" },
  { name: "Discord monitoring", status: "deferred", detail: "Requires bot infrastructure — month 2" },
  { name: "Programmatic SEO", status: "deferred", detail: "Template pages at scale — month 2-3" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GoLivePage() {
  const health = useConvexQuery(convexApi?.agentConfig?.getSystemHealth, {}) as SystemHealth | undefined;
  const [proofState, setProofState] = useState<string | null>(null);
  const [proofBusy, setProofBusy] = useState(false);

  async function runProofCycle() {
    setProofBusy(true);
    setProofState(null);
    try {
      const res = await fetch("/api/proof/run", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setProofState(json?.error ?? "Unable to trigger proof cycle");
        return;
      }
      setProofState(json?.message ?? "Proof cycle triggered");
    } catch (error) {
      setProofState(error instanceof Error ? error.message : "Unable to trigger proof cycle");
    } finally {
      setProofBusy(false);
    }
  }

  if (!health) {
    return (
      <div className="max-w-4xl p-6">
        <h1 className="text-xl font-semibold text-[var(--color-op-text)] mb-4">Go Live</h1>
        <p className="text-sm text-[var(--color-op-muted)]">Connecting to Convex...</p>
      </div>
    );
  }

  const requiredChecks = PREFLIGHT_CHECKS.filter((c) => c.required);
  const requiredPassed = requiredChecks.filter((c) => c.test(health)).length;
  const allRequiredPassed = requiredPassed === requiredChecks.length;
  const totalPassed = PREFLIGHT_CHECKS.filter((c) => c.test(health)).length;
  const currentMode = health.config?.mode ?? "dormant";

  return (
    <div className="max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-op-text)]">Go Live</h1>
        <p className="text-sm text-[var(--color-op-muted)] mt-1">
          System readiness, hiring stage coverage, and capability map.
        </p>
      </div>

      {/* ── Metrics bar ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricBox label="Knowledge chunks" value={health.knowledge.sourceChunks} />
        <MetricBox label="Activated artifacts" value={health.content.pipelinePublished} target={1} />
        <MetricBox label="Experiments" value={health.experiments.total} target={1} />
        <MetricBox label="Feedback" value={health.feedback.total} target={3} />
        <MetricBox label="Interactions" value={health.community.total} target={50} />
        <MetricBox label="Reports" value={health.reports.total} target={1} />
        <MetricBox label="Preflight" value={totalPassed} target={PREFLIGHT_CHECKS.length} />
      </div>
      <p className="text-xs text-[var(--color-op-dim)]">
        Artifact counts include the seeded portfolio samples until the first live operator cycle runs.
      </p>
      <p className="text-xs text-[var(--color-op-dim)]">
        Current mode: <span className="font-mono">{currentMode}</span>
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={runProofCycle}
          disabled={proofBusy}
          className="rounded-md border border-[var(--color-op-border)] bg-[var(--color-op-card)] px-3 py-2 text-xs font-medium text-[var(--color-op-text)] hover:bg-[var(--color-op-card-alt)] disabled:opacity-60"
        >
          {proofBusy ? "Triggering proof cycle..." : "Run proof cycle"}
        </button>
        {proofState && (
          <span className="text-xs text-[var(--color-op-dim)]">{proofState}</span>
        )}
      </div>

      {/* ── Preflight checks ─────────────────────────────── */}
      <div className="rounded-lg border border-[var(--color-op-border)] bg-[var(--color-op-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-op-text)]">Preflight Checks</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded ${allRequiredPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
            {requiredPassed}/{requiredChecks.length} required
          </span>
        </div>
        <div className="divide-y divide-[var(--color-op-border)]">
          {PREFLIGHT_CHECKS.map((check) => (
            <CheckItem key={check.label} check={check} health={health} />
          ))}
        </div>
      </div>

      {/* ── Stage readiness ──────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-op-text)] mb-3">Hiring Stage Readiness</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {STAGES.map((stage) => (
            <StageCard key={stage.id} stage={stage} health={health} />
          ))}
        </div>
      </div>

      {/* ── First cycle actions ──────────────────────────── */}
      <div className="rounded-lg border border-[var(--color-op-border)] bg-[var(--color-op-card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--color-op-text)] mb-1">First Cycle Checklist</h2>
        <p className="text-xs text-[var(--color-op-dim)] mb-4">
          Run these in order from the Convex dashboard to produce real proof artifacts.
        </p>
        <div className="space-y-2 font-mono text-xs">
          {[
            { cmd: "startKnowledgeIngest", done: health.knowledge.sourceChunks > 50, label: "Ingest RC docs" },
            { cmd: "startWeeklyPlan", done: health.content.pipelinePublished > 0 && health.experiments.total > 0, label: "Run weekly planner" },
            { cmd: "(auto) contentGenWorkflow", done: health.content.pipelinePublished > 0, label: "Content generated + stored" },
            { cmd: "(auto) generateFeedback x3", done: health.feedback.total >= 3, label: "3 feedback items filed" },
            { cmd: "(auto) runExperiment", done: health.experiments.total > 0, label: "Experiment started" },
            { cmd: "startCommunityMonitor", done: health.community.total > 0, label: "Community signals engaged" },
            { cmd: "startWeeklyReport", done: health.reports.total > 0, label: "Weekly report generated" },
          ].map((item) => (
            <div key={item.cmd} className="flex items-center gap-3 py-1.5 px-3 rounded bg-[var(--color-op-card-alt)]">
              <span className={item.done ? "text-emerald-400" : "text-[var(--color-op-dim)]"}>
                {item.done ? "[x]" : "[ ]"}
              </span>
              <span className="text-[var(--color-op-muted)] flex-1">{item.label}</span>
              <span className="text-[var(--color-op-dim)]">{item.cmd}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Capabilities ─────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-op-text)] mb-3">Capability Map</h2>
        <div className="flex flex-wrap gap-2 mb-3 text-xs text-[var(--color-op-dim)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Built</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Activated</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> RC-connected (post-hire)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--color-op-dim)]" /> Deferred</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {CAPABILITIES.map((cap) => {
            const statusColor = { built: "text-blue-400", activated: "text-emerald-400", "rc-connected": "text-purple-400", deferred: "text-[var(--color-op-dim)]" }[cap.status];
            const statusIcon = { built: "B", activated: "A", "rc-connected": "RC", deferred: "~" }[cap.status];
            return (
              <div key={cap.name} className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-op-card)] border border-[var(--color-op-border)]">
                <span className={`mt-0.5 text-[10px] font-bold ${statusColor}`}>{statusIcon}</span>
                <div>
                  <div className="text-sm text-[var(--color-op-text)]">{cap.name}</div>
                  <div className="text-xs text-[var(--color-op-dim)]">{cap.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent workflow runs ──────────────────────────── */}
      {health.recentRuns.length > 0 && (
        <div className="rounded-lg border border-[var(--color-op-border)] bg-[var(--color-op-card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-op-text)] mb-3">Recent Workflow Runs</h2>
          <div className="space-y-1 font-mono text-xs">
            {health.recentRuns.map((run, i) => (
              <div key={i} className="flex items-center gap-3 py-1 px-2">
                <span className={`w-2 h-2 rounded-full ${run.status === "completed" ? "bg-emerald-400" : run.status === "running" ? "bg-blue-400" : "bg-red-400"}`} />
                <span className="text-[var(--color-op-muted)] flex-1">{run.type}</span>
                <span className="text-[var(--color-op-dim)]">
                  {new Date(run.time).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Interview prep ───────────────────────────────── */}
      <div className="rounded-lg border border-[var(--color-op-border)] bg-[var(--color-op-card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--color-op-text)] mb-1">Interview Demo Script</h2>
        <p className="text-xs text-[var(--color-op-dim)] mb-4">Recommended demo sequence for Stage 3 panel.</p>
        <ol className="space-y-3 text-sm text-[var(--color-op-muted)]">
          <li className="flex gap-3">
            <span className="text-[var(--color-op-dim)] font-mono shrink-0">1.</span>
            <div>
              <strong className="text-[var(--color-op-text)]">Grounded retrieval</strong>
              <p className="text-xs text-[var(--color-op-dim)] mt-0.5">Ask a RevenueCat question in the chat or panel. Show tool calls + source citations.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-op-dim)] font-mono shrink-0">2.</span>
            <div>
              <strong className="text-[var(--color-op-text)]">Content generation</strong>
              <p className="text-xs text-[var(--color-op-dim)] mt-0.5">Show a real article generated by the pipeline. Point to RAG context, quality gates, approval state.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-op-dim)] font-mono shrink-0">3.</span>
            <div>
              <strong className="text-[var(--color-op-text)]">Safety controls</strong>
              <p className="text-xs text-[var(--color-op-dim)] mt-0.5">Show draft_only review mode. Show kill switch via @GrowthRat stop. Show approval log.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-op-dim)] font-mono shrink-0">4.</span>
            <div>
              <strong className="text-[var(--color-op-text)]">Community engagement</strong>
              <p className="text-xs text-[var(--color-op-dim)] mt-0.5">Show GitHub + X signal scanning. Show a community reply with the GrowthRat footer.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-op-dim)] font-mono shrink-0">5.</span>
            <div>
              <strong className="text-[var(--color-op-text)]">Measurement + learning</strong>
              <p className="text-xs text-[var(--color-op-dim)] mt-0.5">Show an experiment with baseline data. Show the weekly report. Explain how results feed back into the planner.</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
