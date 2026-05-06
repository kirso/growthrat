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
    blockers: string[];
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
      <h2>Cloudflare activation state</h2>
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
        <p>D1 or fallback proof data source</p>
      </article>
      <article class="card">
        <span class="tag">Secrets</span>
        <div class="metric">
          {snapshot.secrets.configured}/{snapshot.secrets.required}
        </div>
        <p>Required production secrets configured</p>
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
