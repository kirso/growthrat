"use client";

import { useState, type FormEvent } from "react";

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
    title: "Add GrowthCat to Slack",
    description:
      "Install the GrowthCat Slack app to your workspace. GrowthCat will post weekly plans, reports, and respond to commands in your designated channel.",
    status: "pending",
  },
  {
    id: "cms",
    title: "Connect Blog CMS",
    description:
      "Provide access to your blog CMS so GrowthCat can publish drafted content. Supports API key or OAuth-based connections.",
    status: "pending",
  },
  {
    id: "charts",
    title: "Connect Charts API",
    description:
      "Give GrowthCat read access to your RevenueCat Charts API so it can pull real metrics for reports and content grounding.",
    status: "pending",
  },
  {
    id: "preferences",
    title: "Set Preferences",
    description:
      "Configure where reports go, how content gets reviewed, and which topics to prioritize.",
    status: "pending",
  },
];

// ---------------------------------------------------------------------------
// Status badge component
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: StepStatus }) {
  const styles: Record<StepStatus, { bg: string; text: string; label: string }> = {
    pending: {
      bg: "bg-[var(--color-op-card-alt)]",
      text: "text-[var(--color-op-muted)]",
      label: "Pending",
    },
    connected: {
      bg: "bg-emerald-900/40",
      text: "text-emerald-400",
      label: "Connected",
    },
    skipped: {
      bg: "bg-yellow-900/30",
      text: "text-yellow-400",
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
            ? "bg-emerald-400"
            : status === "skipped"
              ? "bg-yellow-400"
              : "bg-[var(--color-op-muted)]"
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
      <p className="text-sm text-[var(--color-op-muted)]">
        Click the button below to start the Slack OAuth flow. GrowthCat will
        request the following scopes:{" "}
        <code className="text-xs bg-[var(--color-op-bg)] px-1.5 py-0.5 rounded">
          app_mentions:read
        </code>
        ,{" "}
        <code className="text-xs bg-[var(--color-op-bg)] px-1.5 py-0.5 rounded">
          chat:write
        </code>
        ,{" "}
        <code className="text-xs bg-[var(--color-op-bg)] px-1.5 py-0.5 rounded">
          channels:read
        </code>
        .
      </p>
      <p className="text-xs text-[var(--color-op-dim)]">
        Alternatively, a workspace admin can install the bot manually from the
        Slack App Directory and provide the Bot Token below.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onConnect}
          className="px-4 py-2 text-sm font-medium rounded-md bg-[#4A154B] text-white hover:bg-[#611f64] transition-colors"
        >
          Add to Slack
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--color-op-border)] text-[var(--color-op-muted)] hover:text-[var(--color-op-text)] hover:border-[var(--color-op-muted)] transition-colors"
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
      <p className="text-sm text-[var(--color-op-muted)]">
        Enter your CMS API key. GrowthCat supports Ghost, WordPress (REST API),
        and any CMS with a REST or GraphQL endpoint. The key is stored
        server-side and never exposed to the operator dashboard.
      </p>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="cms-key"
            className="block text-xs font-medium text-[var(--color-op-muted)] mb-1.5"
          >
            CMS API Key
          </label>
          <input
            id="cms-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk_live_..."
            className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-op-bg)] border border-[var(--color-op-border)] text-[var(--color-op-text)] placeholder:text-[var(--color-op-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--color-op-green)]"
          />
        </div>
        <button
          type="submit"
          disabled={!apiKey.trim()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--color-op-green)] text-[var(--color-op-bg)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Connect
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--color-op-border)] text-[var(--color-op-muted)] hover:text-[var(--color-op-text)] hover:border-[var(--color-op-muted)] transition-colors"
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
      <p className="text-sm text-[var(--color-op-muted)]">
        Provide a RevenueCat API key with read-only access to Charts data.
        GrowthCat uses this to ground weekly reports and content with real
        metrics. The key is encrypted and stored server-side.
      </p>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="charts-key"
            className="block text-xs font-medium text-[var(--color-op-muted)] mb-1.5"
          >
            RevenueCat API Key (read-only)
          </label>
          <input
            id="charts-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="appl_..."
            className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-op-bg)] border border-[var(--color-op-border)] text-[var(--color-op-text)] placeholder:text-[var(--color-op-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--color-op-green)]"
          />
        </div>
        <button
          type="submit"
          disabled={!apiKey.trim()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--color-op-green)] text-[var(--color-op-bg)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Connect
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--color-op-border)] text-[var(--color-op-muted)] hover:text-[var(--color-op-text)] hover:border-[var(--color-op-muted)] transition-colors"
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
  const [reportChannel, setReportChannel] = useState("growthcat");
  const [reviewMode, setReviewMode] = useState("draft-only");
  const [focusTopics, setFocusTopics] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ reportChannel, reviewMode, focusTopics });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-op-muted)]">
        Configure how GrowthCat operates. These can be changed later from the
        operator dashboard.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="report-channel"
            className="block text-xs font-medium text-[var(--color-op-muted)] mb-1.5"
          >
            Weekly Report Slack Channel
          </label>
          <input
            id="report-channel"
            type="text"
            value={reportChannel}
            onChange={(e) => setReportChannel(e.target.value)}
            placeholder="#growthcat"
            className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-op-bg)] border border-[var(--color-op-border)] text-[var(--color-op-text)] placeholder:text-[var(--color-op-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--color-op-green)]"
          />
        </div>

        <div>
          <label
            htmlFor="review-mode"
            className="block text-xs font-medium text-[var(--color-op-muted)] mb-1.5"
          >
            Content Review Mode
          </label>
          <select
            id="review-mode"
            value={reviewMode}
            onChange={(e) => setReviewMode(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-op-bg)] border border-[var(--color-op-border)] text-[var(--color-op-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-op-green)]"
          >
            <option value="draft-only">
              Draft only &mdash; human reviews before publish
            </option>
            <option value="auto-publish">
              Auto-publish &mdash; publish after quality gates pass
            </option>
          </select>
          <p className="mt-1 text-xs text-[var(--color-op-dim)]">
            &quot;Draft only&quot; is recommended during onboarding. GrowthCat
            will generate content and wait for your approval.
          </p>
        </div>

        <div>
          <label
            htmlFor="focus-topics"
            className="block text-xs font-medium text-[var(--color-op-muted)] mb-1.5"
          >
            Focus Topics (comma-separated)
          </label>
          <input
            id="focus-topics"
            type="text"
            value={focusTopics}
            onChange={(e) => setFocusTopics(e.target.value)}
            placeholder="webhooks, flutter sdk, react native, paywalls"
            className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-op-bg)] border border-[var(--color-op-border)] text-[var(--color-op-text)] placeholder:text-[var(--color-op-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--color-op-green)]"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--color-op-green)] text-[var(--color-op-bg)] hover:opacity-90 transition-opacity"
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
        "Onboarding complete. GrowthCat is ready to operate.",
      );
    }
  }

  // Handlers for each step
  function handleSlackConnect() {
    // In production: redirect to Slack OAuth URL
    // window.location.href = `/api/slack/oauth/start`;
    updateStepStatus("slack", "connected");
    advance();
  }

  function handleSlackSkip() {
    updateStepStatus("slack", "skipped");
    advance();
  }

  function handleCmsConnect(_key: string) {
    // In production: POST to /api/onboarding/cms with the key
    // The server stores it securely and never returns it
    updateStepStatus("cms", "connected");
    advance();
  }

  function handleCmsSkip() {
    updateStepStatus("cms", "skipped");
    advance();
  }

  function handleChartsConnect(_key: string) {
    // In production: POST to /api/onboarding/charts with the key
    updateStepStatus("charts", "connected");
    advance();
  }

  function handleChartsSkip() {
    updateStepStatus("charts", "skipped");
    advance();
  }

  function handlePreferencesSave(_prefs: {
    reportChannel: string;
    reviewMode: string;
    focusTopics: string;
  }) {
    // In production: POST to /api/onboarding/preferences
    updateStepStatus("preferences", "connected");
    advance();
  }

  const connectedCount = steps.filter((s) => s.status === "connected").length;
  const completedCount = steps.filter((s) => s.status !== "pending").length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-op-text)]">
          Onboarding
        </h1>
        <p className="mt-1 text-sm text-[var(--color-op-muted)]">
          Connect GrowthCat to your services. API keys are stored server-side
          and never exposed to the operator dashboard.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--color-op-muted)]">
          <span>
            {completedCount} of {steps.length} steps completed
          </span>
          <span>
            {connectedCount} connected
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-op-card-alt)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-op-green)] transition-all duration-500"
            style={{
              width: `${(completedCount / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Completion banner */}
      {completionMessage && (
        <div className="rounded-lg border border-emerald-800/50 bg-emerald-900/20 p-4">
          <p className="text-sm text-emerald-400 font-medium">
            {completionMessage}
          </p>
          <p className="mt-1 text-xs text-[var(--color-op-muted)]">
            Head to the{" "}
            <a
              href="/dashboard"
              className="underline text-[var(--color-op-green)] hover:opacity-80"
            >
              Dashboard
            </a>{" "}
            to see GrowthCat in action, or revisit any step below to update
            your configuration.
          </p>
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
              className={`rounded-lg border transition-colors ${
                isActive
                  ? "border-[var(--color-op-green)]/50 bg-[var(--color-op-card)]"
                  : "border-[var(--color-op-border)] bg-[var(--color-op-card)]"
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
                        ? "bg-emerald-900/40 text-emerald-400"
                        : "bg-yellow-900/30 text-yellow-400"
                      : isActive
                        ? "bg-[var(--color-op-green)]/20 text-[var(--color-op-green)]"
                        : "bg-[var(--color-op-card-alt)] text-[var(--color-op-dim)]"
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
                          ? "text-[var(--color-op-text)]"
                          : "text-[var(--color-op-muted)]"
                      }`}
                    >
                      {step.title}
                    </span>
                    <StatusBadge status={step.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-op-dim)] truncate">
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
                  className={`flex-shrink-0 text-[var(--color-op-dim)] transition-transform ${
                    isActive ? "rotate-180" : ""
                  }`}
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>

              {/* Step content */}
              {isActive && (
                <div className="px-5 pb-5 pt-0 border-t border-[var(--color-op-border)]">
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
