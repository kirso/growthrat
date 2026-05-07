<script lang="ts">
  import { onMount } from "svelte";

  type CheckStatus = "ready" | "gated" | "blocked";

  type ActivationCheck = {
    key: string;
    label: string;
    status: CheckStatus;
    detail: string;
  };

  type ActivationSnapshot = {
    generatedAt: string;
    mode: string;
    deployment: {
      workerName: string;
      publicSiteUrl: string;
      productionWorkerObserved: boolean;
      detail: string;
    };
    runtime: {
      source: "d1" | "fallback";
      counts: {
        artifacts: number;
        experiments: number;
        feedback: number;
        weeklyReports: number;
        events: number;
        experimentEvents: number;
        metricSnapshots: number;
        readouts: number;
        sourceChunks: number;
        policyCounters: number;
      };
      bindings: string[];
    };
    resources: ActivationCheck[];
    gates: ActivationCheck[];
    secrets: {
      required: number;
      configured: number;
      missing: string[];
    };
    connectors: ActivationCheck[];
    blockers: string[];
    policy: {
      killSwitch: boolean;
      modelChatEnabled: boolean;
      limits: {
        chatPerIpPerDay: number;
        modelCallsPerDay: number;
        publicEventsPerDay: number;
      };
    };
    sources: {
      chunks: number;
      indexedChunks: number;
      vectorCount: number | null;
      vectorDimensions: number | null;
    };
    readyForApplicationReview: boolean;
    readyForRcLive: boolean;
  };

  let snapshot: ActivationSnapshot | null = null;
  let pending = true;
  let error = "";

  const statusLabel: Record<CheckStatus, string> = {
    ready: "Ready",
    gated: "Gated",
    blocked: "Blocked",
  };

  async function loadSnapshot() {
    pending = true;
    error = "";

    try {
      const response = await fetch("/api/activation");
      if (!response.ok) {
        throw new Error(`Activation request failed with ${response.status}`);
      }
      snapshot = (await response.json()) as ActivationSnapshot;
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Activation request failed.";
    } finally {
      pending = false;
    }
  }

  onMount(() => {
    void loadSnapshot();
  });
</script>

<div class="runtime-panel">
  <div class="runtime-header">
    <div>
      <p class="eyebrow">Runtime proof</p>
      <h2>Activation state</h2>
    </div>
    {#if snapshot}
      <span class="pill {snapshot.readyForRcLive ? 'ok' : ''}">
        {snapshot.mode}
      </span>
    {/if}
  </div>

  {#if pending}
    <p class="lead">Loading runtime state.</p>
  {:else if error}
    <p class="pill">{error}</p>
  {:else if snapshot}
    <div class="grid">
      <article class="card">
        <span class="tag">Review</span>
        <div class="metric">
          {snapshot.readyForApplicationReview ? "Ready" : "Gated"}
        </div>
        <p>Application package review state</p>
      </article>
      <article class="card">
        <span class="tag">Runtime</span>
        <div class="metric">{snapshot.runtime.source.toUpperCase()}</div>
        <p>Proof data source</p>
      </article>
      <article class="card">
        <span class="tag">Platform</span>
        <div class="metric">
          {snapshot.secrets.configured}/{snapshot.secrets.required}
        </div>
        <p>Server-owned secrets configured</p>
      </article>
      <article class="card">
        <span class="tag">Connectors</span>
        <div class="metric">
          {snapshot.connectors.filter((item) => item.status === "ready").length}/{snapshot.connectors.length}
        </div>
        <p>RC-provided accounts connected</p>
      </article>
      <article class="card">
        <span class="tag">Experiments</span>
        <div class="metric">{snapshot.runtime.counts.experiments}</div>
        <p>Experiment records in D1</p>
      </article>
      <article class="card">
        <span class="tag">Sources</span>
        <div class="metric">{snapshot.sources.indexedChunks}</div>
        <p>Indexed source chunks for retrieval</p>
      </article>
      <article class="card">
        <span class="tag">Policy</span>
        <div class="metric">
          {snapshot.policy.killSwitch ? "OFF" : "ON"}
        </div>
        <p>
          {snapshot.policy.modelChatEnabled
            ? "Model chat allowed behind caps"
            : "Model chat disabled"}
        </p>
      </article>
    </div>

    <div class="grid two runtime-detail">
      <article class="card">
        <h3>Resources</h3>
        {#each snapshot.resources as item}
          <div class="status-row compact">
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
            <span class="pill {item.status === 'ready' ? 'ok' : ''}">
              {statusLabel[item.status]}
            </span>
          </div>
        {/each}
      </article>

      <article class="card">
        <h3>Activation gates</h3>
        {#each snapshot.gates as item}
          <div class="status-row compact">
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
            <span class="pill {item.status === 'ready' ? 'ok' : ''}">
              {statusLabel[item.status]}
            </span>
          </div>
        {/each}
      </article>

      <article class="card">
        <h3>Connected accounts</h3>
        {#each snapshot.connectors as item}
          <div class="status-row compact">
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
            <span class="pill {item.status === 'ready' ? 'ok' : ''}">
              {statusLabel[item.status]}
            </span>
          </div>
        {/each}
      </article>
    </div>

    <div class="card runtime-footer">
      <div>
        <strong>Production Worker observed</strong>
        <p>{snapshot.deployment.detail}</p>
      </div>
      <span class="pill {snapshot.deployment.productionWorkerObserved ? 'ok' : ''}">
        {snapshot.deployment.productionWorkerObserved ? "Observed" : "Pending"}
      </span>
    </div>
  {/if}
</div>
