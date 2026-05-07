<script lang="ts">
  import { onMount } from "svelte";

  type ConnectorCheck = {
    key: string;
    label: string;
    status: "ready" | "gated" | "blocked";
    detail: string;
  };

  type AgentRun = {
    id: string;
    run_type: string;
    trigger_type: string;
    status: string;
    title: string | null;
    created_at: string;
    completed_at: string | null;
  };

  type ApprovalRequest = {
    id: string;
    subject_type: string;
    subject_id: string;
    action_type: string;
    status: string;
    slack_channel: string | null;
    reason: string | null;
    detail_json: string;
    created_at: string;
  };

  type DistributionAction = {
    id: string;
    channel: string;
    action_type: string;
    status: string;
    external_url: string | null;
    detail_json: string;
    created_at: string;
  };

  type ReportDelivery = {
    id: string;
    report_id: string | null;
    run_id: string | null;
    channel: string;
    status: string;
    destination: string | null;
    error_message: string | null;
    delivered_at: string | null;
    created_at: string;
  };

  type WeeklyReport = {
    id: string;
    week_start: string;
    week_end: string;
    status: string;
    summary: string | null;
    r2_key: string | null;
    created_at: string;
  };

  type OpsSnapshot = {
    generatedAt: string;
    config: {
      mode: string;
      reviewMode: string;
      focusTopics: string[];
      slackChannel: string;
      enabledPlatforms: string[];
      paused: boolean;
      isActive: boolean;
      budgetPolicy: {
        maxDailyEstimatedUsd: number;
        allowCommunityPosting: boolean;
        allowAutoPublish: boolean;
      };
    };
    connectors: ConnectorCheck[];
    runs: AgentRun[];
    approvals: ApprovalRequest[];
    distributionActions: DistributionAction[];
    reportDeliveries: ReportDelivery[];
    weeklyReports: WeeklyReport[];
  };

  type State =
    | { kind: "loading" }
    | { kind: "auth"; status: number; message: string }
    | { kind: "error"; message: string }
    | { kind: "data"; snapshot: OpsSnapshot };

  export let title = "Operator console";
  export let showDryRunControl = true;

  let state: State = { kind: "loading" };
  let actionPending = false;
  let actionMessage = "";
  let actionError = "";

  const slackCommands = [
    "`status` shows mode, review policy, pause state, and focus topics.",
    "`opportunities` rescans the backlog and posts the highest-scoring bets.",
    "`plan` or `report` runs the weekly advocate loop and posts the check-in.",
    "`approve [id]` or `reject [id] because [reason]` decides queued side effects.",
    "React with `white_check_mark` or `x` on a report thread to decide the oldest pending approval attached to it.",
    "`stop` and `resume` pause or restart automation without redeploying.",
    "`write about [topic]` creates a source-grounded draft in dry-run mode.",
  ];

  function truthFor(status: string) {
    const normalized = status.toLowerCase();
    if (["ready", "active", "approved", "delivered", "planned", "completed"].includes(normalized)) {
      return "live";
    }
    if (["pending", "queued", "draft", "running"].includes(normalized)) {
      return "sample";
    }
    if (["blocked", "failed", "error", "rejected"].includes(normalized)) {
      return "warn";
    }
    return "pending";
  }

  function safeJson(value: string) {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  function detailTitle(value: string) {
    const parsed = safeJson(value);
    return typeof parsed.title === "string" ? parsed.title : "";
  }

  function shortDate(value: string | null) {
    if (!value) return "not yet";
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function load() {
    state = { kind: "loading" };
    actionError = "";

    try {
      const response = await fetch("/api/ops/status", {
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as {
        snapshot?: OpsSnapshot;
        error?: string;
      };

      if (response.status === 401 || response.status === 403 || response.status === 503) {
        state = {
          kind: "auth",
          status: response.status,
          message:
            data.error ||
            "This operating surface requires a RevenueCat representative session.",
        };
        return;
      }

      if (!response.ok || !data.snapshot) {
        throw new Error(data.error || `Ops request failed with ${response.status}`);
      }

      state = { kind: "data", snapshot: data.snapshot };
    } catch (error) {
      state = {
        kind: "error",
        message: error instanceof Error ? error.message : "Could not load ops state.",
      };
    }
  }

  async function startDryRun() {
    actionPending = true;
    actionMessage = "";
    actionError = "";

    try {
      const response = await fetch("/api/workflows/weekly-dry-run", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as {
        workflowId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || `Dry run failed with ${response.status}`);
      }

      actionMessage = `Weekly dry run queued: ${data.workflowId ?? "created"}.`;
      await load();
    } catch (error) {
      actionError =
        error instanceof Error ? error.message : "Could not queue dry run.";
    } finally {
      actionPending = false;
    }
  }

  onMount(load);
</script>

<div class="ops-console">
  <div class="ops-heading">
    <div>
      <p class="eyebrow">Operating state</p>
      <h2>{title}</h2>
    </div>
    <button type="button" class="button" on:click={load}>Refresh</button>
  </div>

  {#if state.kind === "loading"}
    <div class="ops-empty">Loading operating state.</div>
  {:else if state.kind === "auth"}
    <div class="ops-empty">
      <span class="truth warn">{state.status}</span>
      <h3>{state.message}</h3>
      <p>
        Public proof is visible without auth. Runs, approvals, report deliveries,
        and connected-account state are available after RevenueCat sign-in.
      </p>
      <a class="button primary" href="/sign-in">Sign in</a>
    </div>
  {:else if state.kind === "error"}
    <div class="ops-empty">
      <span class="truth warn">error</span>
      <p>{state.message}</p>
      <button type="button" class="button" on:click={load}>Retry</button>
    </div>
  {:else}
    {@const snapshot = state.snapshot}
    <div class="ops-metrics">
      <article class="card">
        <span class="tag">Mode</span>
        <div class="ops-number">{snapshot.config.mode}</div>
        <p>{snapshot.config.paused ? "Automation paused" : "Automation active"}</p>
      </article>
      <article class="card">
        <span class="tag">Connectors</span>
        <div class="ops-number">
          {snapshot.connectors.filter((item) => item.status === "ready").length}/{snapshot.connectors.length}
        </div>
        <p>RevenueCat-owned account links</p>
      </article>
      <article class="card">
        <span class="tag">Approvals</span>
        <div class="ops-number">
          {snapshot.approvals.filter((item) => item.status === "pending").length}
        </div>
        <p>Pending sensitive actions</p>
      </article>
      <article class="card">
        <span class="tag">Reports</span>
        <div class="ops-number">{snapshot.weeklyReports.length}</div>
        <p>Stored weekly check-ins</p>
      </article>
    </div>

    {#if showDryRunControl}
      <div class="ops-callout">
        <div>
          <strong>Weekly dry run</strong>
          <p>
            Runs the advocate loop in proof mode: source retrieval, plan,
            draft, approval request, report, and ledger. External posting stays
            disabled unless rc_live and approvals are active.
          </p>
        </div>
        <button class="button primary" type="button" disabled={actionPending} on:click={startDryRun}>
          Queue dry run
        </button>
      </div>
    {/if}

    {#if actionMessage}
      <p class="pill ok">{actionMessage}</p>
    {/if}
    {#if actionError}
      <p class="pill">{actionError}</p>
    {/if}

    <div class="grid two runtime-detail">
      <article class="card">
        <h3>Slack command surface</h3>
        <ul class="ops-list compact">
          {#each slackCommands as command}
            <li>{@html command.replace(/`([^`]+)`/g, "<code>$1</code>")}</li>
          {/each}
        </ul>
        <p class="ops-note">
          Default channel: <code>{snapshot.config.slackChannel}</code>.
          Community posting: {snapshot.config.budgetPolicy.allowCommunityPosting ? "allowed" : "approval-gated"}.
          Auto-publish: {snapshot.config.budgetPolicy.allowAutoPublish ? "allowed" : "approval-gated"}.
        </p>
      </article>

      <article class="card">
        <h3>Connected accounts</h3>
        <div class="ops-rows">
          {#each snapshot.connectors as connector}
            <div class="ops-row">
              <span>
                <strong>{connector.label}</strong>
                <small>{connector.detail}</small>
              </span>
              <span class={`truth ${truthFor(connector.status)}`}>{connector.status}</span>
            </div>
          {/each}
        </div>
      </article>

      <article class="card">
        <h3>Latest runs</h3>
        {#if snapshot.runs.length === 0}
          <p>No runs recorded yet.</p>
        {:else}
          <div class="ops-rows">
            {#each snapshot.runs.slice(0, 6) as run}
              <div class="ops-row">
                <span>
                  <strong>{run.title ?? run.run_type}</strong>
                  <small>{run.run_type} · {run.trigger_type} · {shortDate(run.created_at)}</small>
                </span>
                <span class={`truth ${truthFor(run.status)}`}>{run.status}</span>
              </div>
            {/each}
          </div>
        {/if}
      </article>

      <article class="card">
        <h3>Pending approvals</h3>
        {#if snapshot.approvals.length === 0}
          <p>No approval requests recorded yet.</p>
        {:else}
          <div class="ops-rows">
            {#each snapshot.approvals.slice(0, 6) as approval}
              <div class="ops-row">
                <span>
                  <strong>{detailTitle(approval.detail_json) || approval.action_type}</strong>
                  <small>{approval.id} · {approval.subject_type} · {approval.slack_channel ?? "no Slack channel"}</small>
                </span>
                <span class={`truth ${truthFor(approval.status)}`}>{approval.status}</span>
              </div>
            {/each}
          </div>
        {/if}
      </article>

      <article class="card">
        <h3>Distribution actions</h3>
        {#if snapshot.distributionActions.length === 0}
          <p>No distribution actions recorded yet.</p>
        {:else}
          <div class="ops-rows">
            {#each snapshot.distributionActions.slice(0, 6) as action}
              <div class="ops-row">
                <span>
                  <strong>{detailTitle(action.detail_json) || action.action_type}</strong>
                  <small>{action.channel} · {shortDate(action.created_at)}</small>
                </span>
                <span class={`truth ${truthFor(action.status)}`}>{action.status}</span>
              </div>
            {/each}
          </div>
        {/if}
      </article>

      <article class="card">
        <h3>Report deliveries</h3>
        {#if snapshot.reportDeliveries.length === 0}
          <p>No Slack report deliveries recorded yet.</p>
        {:else}
          <div class="ops-rows">
            {#each snapshot.reportDeliveries.slice(0, 6) as delivery}
              <div class="ops-row">
                <span>
                  <strong>{delivery.report_id ?? "report"}</strong>
                  <small>{delivery.channel} · {delivery.destination ?? "no destination"} · {shortDate(delivery.delivered_at ?? delivery.created_at)}</small>
                </span>
                <span class={`truth ${truthFor(delivery.status)}`}>{delivery.status}</span>
              </div>
            {/each}
          </div>
        {/if}
      </article>
    </div>
  {/if}
</div>

<style>
  .ops-console {
    display: grid;
    gap: 22px;
  }
  .ops-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .ops-heading h2 {
    margin-bottom: 0;
  }
  .ops-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
  .ops-number {
    margin-top: 12px;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: 30px;
    font-weight: 650;
    line-height: 1;
  }
  .ops-callout {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--white);
    padding: 18px 20px;
  }
  .ops-callout strong {
    color: var(--ink);
  }
  .ops-callout p,
  .ops-note {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 14px;
  }
  .ops-empty {
    display: grid;
    place-items: center;
    gap: 12px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--white);
    padding: 48px 20px;
    text-align: center;
  }
  .ops-empty h3,
  .ops-empty p {
    margin: 0;
  }
  .ops-empty p {
    max-width: 54ch;
    color: var(--muted);
  }
  .ops-list {
    display: grid;
    gap: 8px;
    margin: 8px 0 0;
    padding-left: 18px;
    color: var(--body);
    font-size: 14px;
  }
  :global(.ops-list code),
  .ops-note code {
    border-radius: var(--radius-xs);
    background: var(--surface);
    padding: 1px 5px;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .ops-rows {
    display: grid;
    gap: 10px;
  }
  .ops-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    border-top: 1px solid var(--line);
    padding-top: 10px;
  }
  .ops-row:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .ops-row span:first-child {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .ops-row strong {
    color: var(--ink);
    font-size: 14px;
  }
  .ops-row small {
    color: var(--muted);
    font-size: 12px;
    overflow-wrap: anywhere;
  }
  @media (max-width: 860px) {
    .ops-metrics {
      grid-template-columns: 1fr;
    }
    .ops-callout {
      align-items: start;
      flex-direction: column;
    }
    .ops-row {
      align-items: start;
      flex-direction: column;
    }
  }
</style>
