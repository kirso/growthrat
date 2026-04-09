"use client";

import Link from "next/link";
import { useContext, useEffect, useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexAvailableContext } from "@/app/ConvexClientProvider";

// ---- Dynamic API import ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let convexApi: Record<string, any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  convexApi = require("@/convex/_generated/api").api;
} catch {
  convexApi = null;
}

type ConnectorKey =
  | "slack"
  | "cms"
  | "revenuecat"
  | "github"
  | "typefully"
  | "dataforseo"
  | "twitter";

type ConnectorStatus = "pending" | "verified" | "manual_verification" | "unsupported" | "error";

type ConnectorState = {
  connector: ConnectorKey;
  status: ConnectorStatus;
  label: string;
  errorSummary: string | null;
  verificationMethod: string | null;
  lastSubmittedAt: number | null;
  lastVerifiedAt: number | null;
  details: Record<string, unknown> | null;
};

type Snapshot = {
  connectors: ConnectorState[];
  config: {
    mode: string;
    reviewMode: string;
    paused: boolean;
    isActive?: boolean;
    expired?: boolean;
    enabledPlatforms: string[];
    focusTopics: string[];
    slackChannel: string;
    activeUntil?: number | null;
    budgetPolicy?: unknown;
  } | null;
};

const INTERVIEW_PROOF_DURATION_MS = 8 * 60 * 60 * 1000;

type FieldDef = {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  helper?: string;
};

type ConnectorDef = {
  title: string;
  description: string;
  fields: FieldDef[];
};

const CONNECTOR_DEFS: Record<ConnectorKey, ConnectorDef> = {
  slack: {
    title: "Slack",
    description: "Used for plans, approvals, weekly reports, and command handling.",
    fields: [
      { key: "botToken", label: "Bot Token", type: "password", placeholder: "xoxb-..." },
      { key: "signingSecret", label: "Signing Secret", type: "password", placeholder: "Slack signing secret" },
      { key: "workspaceLabel", label: "Workspace Label", placeholder: "RevenueCat" },
      { key: "defaultChannel", label: "Default Channel", placeholder: "#growthrat" },
    ],
  },
  cms: {
    title: "CMS",
    description: "Stores the blog/publishing target for post-approval content.",
    fields: [
      { key: "provider", label: "Provider", placeholder: "ghost | wordpress | custom" },
      { key: "endpoint", label: "API Endpoint", placeholder: "https://blog.example.com" },
      { key: "apiKey", label: "API Key", type: "password", placeholder: "cms_..." },
      { key: "siteName", label: "Site Name", placeholder: "RevenueCat Blog" },
    ],
  },
  revenuecat: {
    title: "RevenueCat / Charts",
    description: "Provides product metrics for grounded content and experiments.",
    fields: [
      { key: "apiKey", label: "RevenueCat API Key", type: "password", placeholder: "rc_..." },
      { key: "projectId", label: "Project ID", placeholder: "project_..." },
    ],
  },
  github: {
    title: "GitHub",
    description: "Used for source control, feedback filing, and backup publishing.",
    fields: [
      { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." },
      { key: "owner", label: "Owner", placeholder: "RevenueCat" },
      { key: "repo", label: "Repo", placeholder: "revenuecat-docs" },
    ],
  },
  typefully: {
    title: "Typefully",
    description: "Creates multi-platform distribution drafts for X and related channels.",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "tf_..." },
      { key: "socialSetId", label: "Social Set ID", placeholder: "12345" },
    ],
  },
  dataforseo: {
    title: "DataForSEO",
    description: "Provides keyword and SERP intelligence for experiments and planning.",
    fields: [
      { key: "login", label: "Login", placeholder: "your-email@example.com" },
      { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
    ],
  },
  twitter: {
    title: "X / Twitter",
    description: "Used for community monitoring and reply drafting on X.",
    fields: [
      { key: "bearerToken", label: "Bearer Token", type: "password", placeholder: "AAAA..." },
    ],
  },
};

const CONNECTOR_ORDER: ConnectorKey[] = [
  "slack",
  "cms",
  "revenuecat",
  "github",
  "typefully",
  "dataforseo",
  "twitter",
];

const EMPTY_FORMS: Record<ConnectorKey, Record<string, string>> = {
  slack: { botToken: "", signingSecret: "", workspaceLabel: "", defaultChannel: "" },
  cms: { provider: "ghost", endpoint: "", apiKey: "", siteName: "" },
  revenuecat: { apiKey: "", projectId: "" },
  github: { token: "", owner: "", repo: "" },
  typefully: { apiKey: "", socialSetId: "" },
  dataforseo: { login: "", password: "" },
  twitter: { bearerToken: "" },
};

function statusTone(status: ConnectorStatus): string {
  switch (status) {
    case "verified":
      return "bg-emerald-100 text-emerald-700";
    case "manual_verification":
      return "bg-amber-100 text-amber-700";
    case "unsupported":
      return "bg-slate-100 text-slate-700";
    case "error":
      return "bg-rose-100 text-rose-700";
    case "pending":
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function prettyTime(value: number | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function cleanPayload(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value.length > 0),
  );
}

function ActivationChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-[var(--color-gc-primary)]/10 text-[var(--color-gc-primary)]"
          : "bg-gray-100 text-[var(--color-rc-muted)]"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-[var(--color-gc-primary)]" : "bg-gray-400"
        }`}
      />
      {label}
    </span>
  );
}

function ConnectorPill({ status }: { status: ConnectorStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone(status)}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function OnboardingPage() {
  const [snapshot, setSnapshot] = useState<Snapshot>({ connectors: [], config: null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<ConnectorKey | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<ConnectorKey, Record<string, string>>>(EMPTY_FORMS);
  const [reportChannel, setReportChannel] = useState("growthrat");
  const [operatingMode, setOperatingMode] = useState("dormant");
  const [reviewMode, setReviewMode] = useState("draft-only");
  const [focusTopics, setFocusTopics] = useState("");

  const convexAvailable = useContext(ConvexAvailableContext);
  // The mutation ref is stable (env-based), so this conditional hook is safe.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const saveConfig = convexAvailable
    ? useMutation(convexApi?.agentConfig?.save ?? ("__skip__" as any))
    : null;

  useEffect(() => {
    const controller = new AbortController();

    async function loadSnapshot() {
      setLoading(true);
      try {
        const res = await fetch("/api/onboarding/secrets", {
          signal: controller.signal,
        });
        const data = (await res.json()) as Snapshot;
        setSnapshot(data);

        if (data.config) {
          setReportChannel(data.config.slackChannel || "growthrat");
          setOperatingMode(data.config.mode ?? "dormant");
          setReviewMode(data.config.reviewMode === "semi_auto" ? "auto-publish" : "draft-only");
          setFocusTopics(data.config.focusTopics.join(", "));
        }
      } catch {
        setSnapshot({ connectors: [], config: null });
      } finally {
        setLoading(false);
      }
    }

    void loadSnapshot();
    return () => controller.abort();
  }, []);

  async function refreshSnapshot() {
    try {
      const res = await fetch("/api/onboarding/secrets");
      const data = (await res.json()) as Snapshot;
      setSnapshot(data);
    } catch {
      // keep current snapshot
    }
  }

  function updateForm(connector: ConnectorKey, key: string, value: string) {
    setForms((prev) => ({
      ...prev,
      [connector]: {
        ...prev[connector],
        [key]: value,
      },
    }));
  }

  async function submitConnector(connector: ConnectorKey) {
    setSubmitting(connector);
    setMessage(null);

    try {
      const payload = cleanPayload(forms[connector]);
      const res = await fetch("/api/onboarding/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connector, payload }),
      });
      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.errorSummary ?? data?.error ?? "Connector submission failed");
      }

      setMessage(`${CONNECTOR_DEFS[connector].title} saved as ${data.status}.`);
      await refreshSnapshot();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit connector");
    } finally {
      setSubmitting(null);
    }
  }

  async function handlePreferencesSave(e: FormEvent) {
    e.preventDefault();

    if (!saveConfig) {
      setMessage("Convex is not connected, so preferences could not be saved.");
      return;
    }

    try {
      const enabledPlatforms = connectorStatuses
        .filter((connector) => connector.status === "verified" || connector.status === "manual_verification")
        .map((connector) => (connector.connector === "twitter" ? "x" : connector.connector));
      const githubConnector = connectorStatuses.find((connector) => connector.connector === "github");
      const githubOrg =
        githubConnector && githubConnector.details && typeof githubConnector.details.owner === "string"
          ? githubConnector.details.owner
          : undefined;

      await saveConfig({
        reviewMode: reviewMode === "auto-publish" ? "semi_auto" : "draft_only",
        focusTopics: focusTopics
          .split(",")
          .map((topic) => topic.trim())
          .filter(Boolean),
        slackChannel: reportChannel,
        githubOrg,
        enabledPlatforms,
        mode: operatingMode,
        activeUntil:
          operatingMode === "interview_proof"
            ? Date.now() + INTERVIEW_PROOF_DURATION_MS
            : undefined,
        paused: operatingMode === "dormant",
      });
      setMessage("Preferences saved.");
      await refreshSnapshot();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save preferences");
    }
  }

  const connectorStatuses = snapshot.connectors.length > 0
    ? snapshot.connectors
    : CONNECTOR_ORDER.map((connector) => ({
        connector,
        status: "pending" as ConnectorStatus,
        label: CONNECTOR_DEFS[connector].title,
        errorSummary: null,
        verificationMethod: null,
        lastSubmittedAt: null,
        lastVerifiedAt: null,
        details: null,
      }));

  const configuredCount = connectorStatuses.filter((state) => state.status !== "pending").length;
  const verifiedCount = connectorStatuses.filter((state) => state.status === "verified").length;
  const rcConnected = connectorStatuses.some((state) => state.connector === "revenuecat" && state.status === "verified");
  const activated = configuredCount > 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
      <header className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <ActivationChip label="Built" active />
          <ActivationChip label="Activated" active={activated} />
          <ActivationChip label="RC-connected" active={rcConnected} />
        </div>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-rc-dark)]">
            Connect GrowthRat for real.
          </h1>
          <p className="text-lg text-[var(--color-rc-muted)] leading-relaxed">
            This flow stores connector credentials server-side, verifies what can be verified from this repo,
            and marks the rest as manual rather than pretending success. Pre-hire, it demonstrates how GrowthRat
            would activate. Post-hire, the same flow connects RevenueCat assets.
          </p>
        </div>
      </header>

      {message && (
        <div className="rounded-xl border border-[var(--color-rc-border)] bg-white px-4 py-3 text-sm text-[var(--color-rc-dark)]">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-rc-border)] bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-rc-muted)]">Connectors</div>
          <div className="mt-2 text-3xl font-semibold text-[var(--color-rc-dark)]">
            {configuredCount}/{connectorStatuses.length}
          </div>
          <p className="mt-1 text-sm text-[var(--color-rc-muted)]">Configured or submitted server-side</p>
        </div>
        <div className="rounded-xl border border-[var(--color-rc-border)] bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-rc-muted)]">Verified</div>
          <div className="mt-2 text-3xl font-semibold text-[var(--color-rc-dark)]">
            {verifiedCount}
          </div>
          <p className="mt-1 text-sm text-[var(--color-rc-muted)]">Connectors with real provider verification</p>
        </div>
        <div className="rounded-xl border border-[var(--color-rc-border)] bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--color-rc-muted)]">Operating mode</div>
          <div className="mt-2 text-3xl font-semibold text-[var(--color-rc-dark)]">
            {snapshot.config?.mode ?? "dormant"}
          </div>
          <p className="mt-1 text-sm text-[var(--color-rc-muted)]">
            {snapshot.config?.mode === "interview_proof" && snapshot.config.activeUntil
              ? `Interview proof expires ${new Date(snapshot.config.activeUntil).toLocaleString()}`
              : "Dormant is the safe default until interview-proof or RC-live mode is selected"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-rc-border)] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-rc-dark)]">Connector setup</h2>
            <p className="mt-1 text-sm text-[var(--color-rc-muted)]">
              Slack, GitHub, DataForSEO, RevenueCat, and X can be verified here. CMS and Typefully are stored
              securely and marked as manual where provider APIs are not yet fully wired.
            </p>
          </div>
          {loading && <span className="text-xs text-[var(--color-rc-muted)]">Loading status…</span>}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {CONNECTOR_ORDER.map((connector) => {
            const state = connectorStatuses.find((entry) => entry.connector === connector)!;
            const def = CONNECTOR_DEFS[connector];

            return (
              <form
                key={connector}
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitConnector(connector);
                }}
                className="rounded-xl border border-[var(--color-rc-border)] bg-[var(--color-rc-surface)] p-4 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-rc-dark)]">{def.title}</h3>
                    <p className="text-sm text-[var(--color-rc-muted)]">{def.description}</p>
                  </div>
                  <ConnectorPill status={state.status} />
                </div>

                <div className="space-y-3">
                  {def.fields.map((field) => (
                    <label key={field.key} className="block">
                      <span className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5">
                        {field.label}
                      </span>
                      <input
                        type={field.type ?? "text"}
                        value={forms[connector][field.key] ?? ""}
                        onChange={(e) => updateForm(connector, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-[var(--color-rc-border)] bg-white px-3 py-2 text-sm text-[var(--color-rc-dark)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
                      />
                      {field.helper && (
                        <span className="mt-1 block text-[11px] text-[var(--color-rc-muted)]">{field.helper}</span>
                      )}
                    </label>
                  ))}
                </div>

                <div className="rounded-lg bg-white border border-[var(--color-rc-border)] p-3 text-xs text-[var(--color-rc-muted)] space-y-1">
                  <div>
                    <span className="font-medium text-[var(--color-rc-dark)]">Label:</span>{" "}
                    {state.label}
                  </div>
                  <div>
                    <span className="font-medium text-[var(--color-rc-dark)]">Verified:</span>{" "}
                    {prettyTime(state.lastVerifiedAt)}
                  </div>
                  <div>
                    <span className="font-medium text-[var(--color-rc-dark)]">Method:</span>{" "}
                    {state.verificationMethod ?? "manual"}
                  </div>
                  {state.errorSummary && (
                    <div className="text-rose-700">
                      <span className="font-medium text-rose-800">Note:</span> {state.errorSummary}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting === connector || !Object.values(forms[connector]).some((value) => value.trim().length > 0)}
                  className="inline-flex items-center justify-center rounded-lg bg-[var(--color-gc-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-gc-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting === connector ? "Saving…" : "Submit server-side"}
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-rc-border)] bg-white p-6">
        <h2 className="text-2xl font-semibold text-[var(--color-rc-dark)]">Operating preferences</h2>
        <p className="mt-1 text-sm text-[var(--color-rc-muted)]">
          These remain editable after activation. They are not secrets and stay in the normal agent config.
        </p>

        <form onSubmit={handlePreferencesSave} className="mt-6 grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5">Operating Mode</span>
            <select
              value={operatingMode}
              onChange={(e) => setOperatingMode(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-rc-border)] bg-white px-3 py-2 text-sm text-[var(--color-rc-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
            >
              <option value="dormant">Dormant</option>
              <option value="interview_proof">Interview proof</option>
              <option value="rc_live">RC live</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5">Weekly Report Channel</span>
            <input
              type="text"
              value={reportChannel}
              onChange={(e) => setReportChannel(e.target.value)}
              placeholder="#growthrat"
              className="w-full rounded-lg border border-[var(--color-rc-border)] bg-white px-3 py-2 text-sm text-[var(--color-rc-dark)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5">Review Mode</span>
            <select
              value={reviewMode}
              onChange={(e) => setReviewMode(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-rc-border)] bg-white px-3 py-2 text-sm text-[var(--color-rc-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
            >
              <option value="draft-only">Draft only</option>
              <option value="auto-publish">Auto-publish</option>
            </select>
          </label>

          <label className="block md:col-span-4">
            <span className="block text-xs font-medium text-[var(--color-rc-muted)] mb-1.5">Focus Topics</span>
            <input
              type="text"
              value={focusTopics}
              onChange={(e) => setFocusTopics(e.target.value)}
              placeholder="webhooks, paywalls, app review, subscription analytics"
              className="w-full rounded-lg border border-[var(--color-rc-border)] bg-white px-3 py-2 text-sm text-[var(--color-rc-dark)] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--color-gc-primary)]"
            />
          </label>

          <div className="md:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--color-gc-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-gc-primary-hover)]"
            >
              Save preferences
            </button>
            <span className="text-xs text-[var(--color-rc-muted)]">
              Slack, CMS, Charts, GitHub, Typefully, DataForSEO, and X remain separate connector submissions.
            </span>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-rc-border)] bg-[var(--color-rc-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-rc-dark)]">What happens next</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-rc-muted)]">
            <li>Submit each connector through the server route.</li>
            <li>Verified providers move to `verified` status with timestamps.</li>
            <li>CMS and Typefully stay `manual_verification` unless their provider APIs are confirmed.</li>
            <li>The operator dashboard reads only sanitized connector state.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-[var(--color-rc-border)] bg-[var(--color-rc-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-rc-dark)]">Readiness</h2>
          <p className="mt-3 text-sm text-[var(--color-rc-muted)]">
            Pre-hire, this is a proof-of-work activation flow. Post-hire, the same flow becomes the RevenueCat
            connector setup path.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/go-live" className="text-sm font-medium text-[var(--color-gc-primary)] no-underline">
              Open go-live checklist
            </Link>
            <Link href="/readiness-review" className="text-sm font-medium text-[var(--color-gc-primary)] no-underline">
              Review readiness notes
            </Link>
            <Link href="/interview-truth" className="text-sm font-medium text-[var(--color-gc-primary)] no-underline">
              Review interview truth sheet
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
