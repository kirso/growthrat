"use client";

import { useState, useContext, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexAvailableContext } from "@/app/ConvexClientProvider";
import Link from "next/link";

// ---- Dynamic API import ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let convexApi: Record<string, any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  convexApi = require("@/convex/_generated/api").api;
} catch {
  convexApi = null;
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

type StepStatus = "pending" | "connected" | "skipped";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
}

const initialSteps: OnboardingStep[] = [
  {
    id: "slack",
    title: "Connect Slack",
    description:
      "Add GrowthRat to your workspace. It will post weekly plans, reports, and respond to commands.",
    status: "pending",
  },
  {
    id: "cms",
    title: "Connect Blog CMS",
    description:
      "Provide CMS API access so GrowthRat can publish drafted content after approval.",
    status: "pending",
  },
  {
    id: "charts",
    title: "Connect Charts API",
    description:
      "Give GrowthRat read access to RevenueCat Charts for real metrics in reports and content.",
    status: "pending",
  },
  {
    id: "preferences",
    title: "Set Preferences",
    description:
      "Configure reporting channel, content review mode, and focus topics.",
    status: "pending",
  },
];

// ---------------------------------------------------------------------------
// Status badge component
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: StepStatus }) {
  const styles: Record<
    StepStatus,
    { bg: string; text: string; label: string }
  > = {
    pending: {
      bg: "bg-gray-100",
      text: "text-[var(--color-rc-muted)]",
      label: "Pending",
    },
    connected: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Connected",
    },
    skipped: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Skipped",
    },
  };

  const s = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "connected"
            ? "bg-emerald-500"
            : status === "skipped"
              ? "bg-yellow-500"
              : "bg-gray-400"
        }`}
      />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Individual step panels
// ---------------------------------------------------------------------------

function SlackStep({
  onConnect,
  onSkip,
}: {
  onConnect: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-rc-muted)]">
        GrowthRat integrates with Slack to post weekly plans, reports, and
        respond to commands. After hiring, the operator will provide a Slack app
        install link for your workspace.
      </p>
      <div className="rounded-lg bg-[var(--color-rc-surface)] border border-[var(--color-rc-border)] p-4">
        <p className="text-sm font-medium text-[var(--color-rc-dark)] mb-2">
          Required Slack scopes:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "app_mentions:read",
            "chat:write",
            "channels:read",
            "reactions:read",
          ].map((scope) => (
            <code
              key={scope}
              className="text-xs bg-white px-2 py-1 rounded border border-[var(--color-rc-border)]"
            >
              {scope}
            </code>
          ))}
        </div>
      </div>
      <p className="text-xs text-[var(--color-rc-muted)]">
        For the demo: click &quot;Mark Connected&quot; to simulate the
        integration, or &quot;Skip&quot; to proceed without Slack.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onConnect}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-gc-primary)] text-white hover:bg-[var(--color-gc-primary-hover)] transition-colors"
        >
          Mark Connected
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-rc-border)] text-[var(--color-rc-muted)] hover:text-[var(--color-rc-dark)] transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function CmsStep({
  onConnect,
  onSkip,
}: {
  onConnect: (key: string) => void;
  onSkip: () => void;
}) {
  const [apiKey, setApiKey] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (apiKey.trim()) onConnect(apiKey.trim());
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-rc-muted)]">
        Enter your CMS API key. GrowthRat supports Ghost, WordPress (REST API),
        and any CMS with a REST or GraphQL endpoint. The key is stored
        server-side and never exposed to the operator dashboard.
      </p>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="cms-key"
            className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5"
          >
            CMS API Key
          </label>
          <input
            id="cms-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk_live_..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[var(--color-rc-border)] text-[var(--color-rc-dark)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
          />
        </div>
        <button
          type="submit"
          disabled={!apiKey.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-gc-primary)] text-white hover:bg-[var(--color-gc-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Connect
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-rc-border)] text-[var(--color-rc-muted)] hover:text-[var(--color-rc-dark)] transition-colors"
        >
          Skip
        </button>
      </form>
    </div>
  );
}

function ChartsStep({
  onConnect,
  onSkip,
}: {
  onConnect: (key: string) => void;
  onSkip: () => void;
}) {
  const [apiKey, setApiKey] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (apiKey.trim()) onConnect(apiKey.trim());
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-rc-muted)]">
        Provide a RevenueCat API key with read-only access to Charts data.
        GrowthRat uses this to ground weekly reports and content with real
        metrics. The key is encrypted and stored server-side.
      </p>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="charts-key"
            className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5"
          >
            RevenueCat API Key (read-only)
          </label>
          <input
            id="charts-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="appl_..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[var(--color-rc-border)] text-[var(--color-rc-dark)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
          />
        </div>
        <button
          type="submit"
          disabled={!apiKey.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-gc-primary)] text-white hover:bg-[var(--color-gc-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Connect
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-rc-border)] text-[var(--color-rc-muted)] hover:text-[var(--color-rc-dark)] transition-colors"
        >
          Skip
        </button>
      </form>
    </div>
  );
}

function PreferencesStep({
  onSave,
}: {
  onSave: (prefs: {
    reportChannel: string;
    reviewMode: string;
    focusTopics: string;
  }) => void;
}) {
  const [reportChannel, setReportChannel] = useState("growthrat");
  const [reviewMode, setReviewMode] = useState("draft-only");
  const [focusTopics, setFocusTopics] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ reportChannel, reviewMode, focusTopics });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-rc-muted)]">
        Configure how GrowthRat operates. These can be changed later from the
        operator dashboard.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="report-channel"
            className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5"
          >
            Weekly Report Slack Channel
          </label>
          <input
            id="report-channel"
            type="text"
            value={reportChannel}
            onChange={(e) => setReportChannel(e.target.value)}
            placeholder="#growthrat"
            className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[var(--color-rc-border)] text-[var(--color-rc-dark)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
          />
        </div>

        <div>
          <label
            htmlFor="review-mode"
            className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5"
          >
            Content Review Mode
          </label>
          <select
            id="review-mode"
            value={reviewMode}
            onChange={(e) => setReviewMode(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[var(--color-rc-border)] text-[var(--color-rc-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
          >
            <option value="draft-only">
              Draft only &mdash; human reviews before publish
            </option>
            <option value="auto-publish">
              Auto-publish &mdash; publish after quality gates pass
            </option>
          </select>
          <p className="mt-1 text-xs text-[var(--color-rc-muted)]">
            &quot;Draft only&quot; is recommended during onboarding. GrowthRat
            will generate content and wait for your approval.
          </p>
        </div>

        <div>
          <label
            htmlFor="focus-topics"
            className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5"
          >
            Focus Topics (comma-separated)
          </label>
          <input
            id="focus-topics"
            type="text"
            value={focusTopics}
            onChange={(e) => setFocusTopics(e.target.value)}
            placeholder="webhooks, flutter sdk, react native, paywalls"
            className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-[var(--color-rc-border)] text-[var(--color-rc-dark)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-gc-primary)] text-white hover:bg-[var(--color-gc-primary-hover)] transition-colors"
        >
          Save Preferences
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main onboarding page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [steps, setSteps] = useState<OnboardingStep[]>(initialSteps);
  const [activeStep, setActiveStep] = useState(0);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );

  const convexAvailable = useContext(ConvexAvailableContext);
  // The mutation ref is stable (env-based), so this conditional hook is safe.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const saveConfig = convexAvailable
    ? useMutation(convexApi?.agentConfig?.save ?? ("__skip__" as any))
    : null;

  function updateStepStatus(id: string, status: StepStatus) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  }

  function advance() {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      setCompletionMessage(
        "Onboarding complete. GrowthRat is ready to operate.",
      );
    }
  }

  // Handlers for each step
  function handleSlackConnect() {
    updateStepStatus("slack", "connected");
    advance();
  }

  function handleSlackSkip() {
    updateStepStatus("slack", "skipped");
    advance();
  }

  function handleCmsConnect(_key: string) {
    updateStepStatus("cms", "connected");
    advance();
  }

  function handleCmsSkip() {
    updateStepStatus("cms", "skipped");
    advance();
  }

  function handleChartsConnect(_key: string) {
    updateStepStatus("charts", "connected");
    advance();
  }

  function handleChartsSkip() {
    updateStepStatus("charts", "skipped");
    advance();
  }

  async function handlePreferencesSave(prefs: {
    reportChannel: string;
    reviewMode: string;
    focusTopics: string;
  }) {
    // Persist to Convex
    if (saveConfig) {
      await saveConfig({
        reviewMode:
          prefs.reviewMode === "auto-publish" ? "semi_auto" : "draft_only",
        focusTopics: prefs.focusTopics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        slackChannel: prefs.reportChannel,
        enabledPlatforms: ["slack", "x", "github"],
        paused: false,
      });
    }
    updateStepStatus("preferences", "connected");
    advance();
  }

  const connectedCount = steps.filter((s) => s.status === "connected").length;
  const completedCount = steps.filter((s) => s.status !== "pending").length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-gc-primary)]/10 text-[var(--color-gc-primary)]">
            Self-Service Onboarding
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--color-rc-dark)] tracking-tight">
          Onboarding
        </h1>
        <p className="mt-2 text-[var(--color-rc-muted)]">
          Connect GrowthRat to your services. API keys are stored server-side
          and never exposed to the operator dashboard.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--color-rc-muted)]">
          <span>
            {completedCount} of {steps.length} steps completed
          </span>
          <span>{connectedCount} connected</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-gc-primary)] transition-all duration-500"
            style={{
              width: `${(completedCount / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Completion banner */}
      {completionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">
            Onboarding Complete
          </h3>
          <p className="text-sm text-emerald-700 mb-4">
            GrowthRat is configured and ready to operate. The weekly cycle will
            begin automatically.
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors no-underline"
            >
              Open Dashboard
            </Link>
            <Link
              href="/articles"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-colors no-underline"
            >
              View Published Content
            </Link>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = index === activeStep && !completionMessage;
          const isCompleted = step.status !== "pending";

          return (
            <div
              key={step.id}
              className={`rounded-xl border transition-colors ${
                isActive
                  ? "border-[var(--color-gc-primary)]/50 bg-white shadow-sm"
                  : "border-[var(--color-rc-border)] bg-white"
              }`}
            >
              {/* Step header */}
              <button
                onClick={() => {
                  if (isCompleted || index <= activeStep)
                    setActiveStep(index);
                }}
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
              >
                {/* Step number */}
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted
                      ? step.status === "connected"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-yellow-100 text-yellow-700"
                      : isActive
                        ? "bg-[var(--color-gc-primary)]/10 text-[var(--color-gc-primary)]"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted && step.status === "connected" ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 7l3 3 7-7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Title and status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${
                        isActive || isCompleted
                          ? "text-[var(--color-rc-dark)]"
                          : "text-[var(--color-rc-muted)]"
                      }`}
                    >
                      {step.title}
                    </span>
                    <StatusBadge status={step.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-rc-muted)] truncate">
                    {step.description}
                  </p>
                </div>

                {/* Expand indicator */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`flex-shrink-0 text-[var(--color-rc-muted)] transition-transform ${
                    isActive ? "rotate-180" : ""
                  }`}
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>

              {/* Step content */}
              {isActive && (
                <div className="px-5 pb-5 pt-0 border-t border-[var(--color-rc-border)]">
                  <div className="pt-4">
                    {step.id === "slack" && (
                      <SlackStep
                        onConnect={handleSlackConnect}
                        onSkip={handleSlackSkip}
                      />
                    )}
                    {step.id === "cms" && (
                      <CmsStep
                        onConnect={handleCmsConnect}
                        onSkip={handleCmsSkip}
                      />
                    )}
                    {step.id === "charts" && (
                      <ChartsStep
                        onConnect={handleChartsConnect}
                        onSkip={handleChartsSkip}
                      />
                    )}
                    {step.id === "preferences" && (
                      <PreferencesStep onSave={handlePreferencesSave} />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
