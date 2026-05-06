<script lang="ts">
  import { onMount } from "svelte";

  type ExperimentVariant = {
    id: string;
    variant_key: string;
    name: string;
    hook: string | null;
    cta: string | null;
    destination_url: string | null;
    status: string;
  };

  type ExperimentAsset = {
    id: string;
    title: string;
    tracking_id: string;
    channel: string;
    url: string | null;
    status: string;
  };

  type EventTotal = {
    event_type: string;
    count: number;
  };

  type MetricTotal = {
    source: string;
    metric_key: string;
    variant_id: string | null;
    total: number;
    latest_captured_at: string | null;
  };

  type Readout = {
    id: string;
    status: string;
    decision: string;
    summary: string;
    learning: string;
    next_action: string;
    created_at: string;
  };

  type Experiment = {
    id: string;
    slug: string;
    title: string;
    hypothesis: string;
    status: string;
    audience: string;
    channel: string;
    decision_rule: string;
    variants: ExperimentVariant[];
    assets: ExperimentAsset[];
    eventTotals: EventTotal[];
    metricTotals: MetricTotal[];
    readouts: Readout[];
  };

  let experiments: Experiment[] = [];
  let selectedId = "";
  let token = "";
  let pending = true;
  let actionPending = false;
  let message = "";
  let error = "";

  let createForm = {
    title: "",
    hypothesis: "",
    audience: "agent developers building paid subscription apps",
    channel: "owned proof site, GitHub, X, and approved community replies",
    decisionRule:
      "A win requires qualified clicks plus a clear RevenueCat funnel diagnosis.",
    variants:
      "implementation | Implementation hook | I built a RevenueCat subscription loop an agent can reason about. | Open the implementation guide | /articles/revenuecat-for-agent-built-apps\nmeasurement | Measurement hook | RevenueCat Charts tell you if money moved. | Open the measurement guide | /articles/charts-behavioral-analytics-bridge",
  };

  let metricForm = {
    source: "manual",
    metricKey: "qualified_clicks",
    value: "",
    variantKey: "",
  };

  let eventForm = {
    trackingId: "",
    eventType: "qualified_click",
  };

  let revenueCatForm = {
    chartName: "conversion_to_paying",
    metricKey: "conversion_to_paying",
    variantKey: "",
  };

  let readoutForm = {
    status: "completed",
    decision: "inconclusive",
    summary: "",
    learning: "",
    nextAction: "",
  };

  $: selected =
    experiments.find((experiment) => experiment.id === selectedId) ??
    experiments[0] ??
    null;

  function parseVariants(value: string) {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, name, hook, cta, destinationUrl] = line
          .split("|")
          .map((part) => part.trim());
        return {
          key,
          name,
          hook,
          cta,
          destinationUrl,
        };
      });
  }

  async function loadExperiments() {
    pending = true;
    error = "";

    try {
      const response = await fetch("/api/experiments");
      if (!response.ok) {
        throw new Error(`Experiment index failed with ${response.status}`);
      }
      const data = (await response.json()) as { experiments?: Experiment[] };
      experiments = data.experiments ?? [];
      selectedId = selectedId || experiments[0]?.id || "";
    } catch (err) {
      error = err instanceof Error ? err.message : "Could not load experiments.";
    } finally {
      pending = false;
    }
  }

  async function internalRequest(path: string, body: Record<string, unknown>) {
    if (!token.trim()) {
      throw new Error("Operator token is required for mutating actions.");
    }

    const response = await fetch(path, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token.trim()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error || `Request failed with ${response.status}`);
    }

    return data;
  }

  async function runAction(task: () => Promise<void>) {
    actionPending = true;
    message = "";
    error = "";

    try {
      if (token.trim()) localStorage.setItem("growthrat-token", token.trim());
      await task();
      await loadExperiments();
    } catch (err) {
      error = err instanceof Error ? err.message : "Action failed.";
    } finally {
      actionPending = false;
    }
  }

  async function createExperiment() {
    await runAction(async () => {
      await internalRequest("/api/experiments", {
        ...createForm,
        variants: parseVariants(createForm.variants),
      });
      message = "Experiment created.";
    });
  }

  async function addMetric() {
    if (!selected) return;
    await runAction(async () => {
      await internalRequest(`/api/experiments/${selected.id}/metrics`, metricForm);
      metricForm.value = "";
      message = "Metric snapshot added.";
    });
  }

  async function addRevenueCatMetric() {
    if (!selected) return;
    await runAction(async () => {
      await internalRequest(
        `/api/experiments/${selected.id}/revenuecat`,
        revenueCatForm,
      );
      message = "RevenueCat snapshot requested.";
    });
  }

  async function addManualEvent() {
    await runAction(async () => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(eventForm),
      });
      if (!response.ok) {
        throw new Error(`Event request failed with ${response.status}`);
      }
      message = "Event recorded.";
    });
  }

  async function createReadout() {
    if (!selected) return;
    await runAction(async () => {
      await internalRequest(`/api/experiments/${selected.id}/readout`, readoutForm);
      message = "Readout created.";
    });
  }

  onMount(() => {
    token = localStorage.getItem("growthrat-token") ?? "";
    void loadExperiments();
  });
</script>

<div class="experiment-console">
  <div class="runtime-header">
    <div>
      <p class="eyebrow">Experiment OS</p>
      <h2>Run, measure, and close the loop</h2>
    </div>
    <button class="button" type="button" on:click={loadExperiments}>
      Refresh
    </button>
  </div>

  {#if pending}
    <p class="lead">Loading experiments.</p>
  {:else if error}
    <p class="pill">{error}</p>
  {:else}
    <div class="grid two runtime-detail">
      <article class="card">
        <h3>Experiment register</h3>
        {#if experiments.length === 0}
          <p>No D1 experiments are available yet.</p>
        {:else}
          <label class="field">
            Active experiment
            <select bind:value={selectedId}>
              {#each experiments as experiment}
                <option value={experiment.id}>{experiment.title}</option>
              {/each}
            </select>
          </label>
        {/if}

        {#if selected}
          <div class="status-row compact">
            <div>
              <strong>{selected.title}</strong>
              <p>{selected.hypothesis}</p>
            </div>
            <span class="pill {selected.status === 'running' ? 'ok' : ''}">
              {selected.status}
            </span>
          </div>

          <h3>Variants</h3>
          {#each selected.variants as variant}
            <div class="status-row compact">
              <div>
                <strong>{variant.name}</strong>
                <p>{variant.hook}</p>
                <p>{variant.cta}</p>
              </div>
              <span class="pill">{variant.variant_key}</span>
            </div>
          {/each}
        {/if}
      </article>

      <article class="card">
        <h3>Tracking links</h3>
        {#if selected}
          {#each selected.assets as asset}
            <div class="status-row compact">
              <div>
                <strong>{asset.title}</strong>
                <p>
                  <a href={`/r/${asset.tracking_id}`}>
                    /r/{asset.tracking_id}
                  </a>
                </p>
                <p>{asset.channel} to {asset.url}</p>
              </div>
              <span class="pill {asset.status === 'published' ? 'ok' : ''}">
                {asset.status}
              </span>
            </div>
          {/each}
        {/if}
      </article>
    </div>

    {#if selected}
      <div class="grid two runtime-detail">
        <article class="card">
          <h3>Behavioral events</h3>
          {#if selected.eventTotals.length === 0}
            <p>No behavior events recorded yet.</p>
          {:else}
            {#each selected.eventTotals as event}
              <div class="status-row compact">
                <strong>{event.event_type}</strong>
                <span class="metric small">{event.count}</span>
              </div>
            {/each}
          {/if}
        </article>

        <article class="card">
          <h3>Metric snapshots</h3>
          {#if selected.metricTotals.length === 0}
            <p>No metric snapshots recorded yet.</p>
          {:else}
            {#each selected.metricTotals as metric}
              <div class="status-row compact">
                <div>
                  <strong>{metric.metric_key}</strong>
                  <p>{metric.source} · {metric.latest_captured_at}</p>
                </div>
                <span class="metric small">{metric.total}</span>
              </div>
            {/each}
          {/if}
        </article>
      </div>

      <article class="card">
        <h3>Latest readout</h3>
        {#if selected.readouts.length === 0}
          <p>No readout has been filed. The experiment is still open.</p>
        {:else}
          <strong>{selected.readouts[0].decision}</strong>
          <p>{selected.readouts[0].summary}</p>
          <p>{selected.readouts[0].learning}</p>
          <p>{selected.readouts[0].next_action}</p>
        {/if}
      </article>
    {/if}

    <div class="card operator-panel">
      <div>
        <h3>Operator token</h3>
        <p>Required for creating experiments, importing metrics, and filing readouts.</p>
      </div>
      <label class="field">
        Internal secret
        <input
          bind:value={token}
          placeholder="Bearer token"
          type="password"
          autocomplete="off"
        />
      </label>
    </div>

    <div class="grid two runtime-detail">
      <form class="card form-stack" on:submit|preventDefault={createExperiment}>
        <h3>Create experiment</h3>
        <label class="field">
          Title
          <input bind:value={createForm.title} placeholder="Experiment title" />
        </label>
        <label class="field">
          Hypothesis
          <textarea bind:value={createForm.hypothesis} rows="3"></textarea>
        </label>
        <label class="field">
          Audience
          <input bind:value={createForm.audience} />
        </label>
        <label class="field">
          Channel
          <input bind:value={createForm.channel} />
        </label>
        <label class="field">
          Decision rule
          <textarea bind:value={createForm.decisionRule} rows="3"></textarea>
        </label>
        <label class="field">
          Variants: key | name | hook | cta | destination
          <textarea bind:value={createForm.variants} rows="5"></textarea>
        </label>
        <button class="button primary" type="submit" disabled={actionPending}>
          Create
        </button>
      </form>

      <form class="card form-stack" on:submit|preventDefault={addMetric}>
        <h3>Import manual metric</h3>
        <label class="field">
          Source
          <input bind:value={metricForm.source} />
        </label>
        <label class="field">
          Metric key
          <input bind:value={metricForm.metricKey} />
        </label>
        <label class="field">
          Value
          <input bind:value={metricForm.value} inputmode="decimal" />
        </label>
        <label class="field">
          Variant key
          <input bind:value={metricForm.variantKey} placeholder="optional" />
        </label>
        <button class="button primary" type="submit" disabled={actionPending}>
          Add metric
        </button>
      </form>

      <form class="card form-stack" on:submit|preventDefault={addManualEvent}>
        <h3>Record behavior event</h3>
        <label class="field">
          Tracking id
          <input bind:value={eventForm.trackingId} placeholder="week-one-reference" />
        </label>
        <label class="field">
          Event type
          <select bind:value={eventForm.eventType}>
            <option value="qualified_click">qualified_click</option>
            <option value="cta_click">cta_click</option>
            <option value="signup">signup</option>
            <option value="paywall_view">paywall_view</option>
            <option value="trial_start">trial_start</option>
            <option value="purchase">purchase</option>
            <option value="community_reply">community_reply</option>
            <option value="manual_signal">manual_signal</option>
          </select>
        </label>
        <button class="button primary" type="submit" disabled={actionPending}>
          Record event
        </button>
      </form>

      <form class="card form-stack" on:submit|preventDefault={addRevenueCatMetric}>
        <h3>Pull RevenueCat chart</h3>
        <label class="field">
          Chart name
          <input bind:value={revenueCatForm.chartName} />
        </label>
        <label class="field">
          Metric key
          <input bind:value={revenueCatForm.metricKey} />
        </label>
        <label class="field">
          Variant key
          <input bind:value={revenueCatForm.variantKey} placeholder="optional" />
        </label>
        <button class="button primary" type="submit" disabled={actionPending}>
          Pull chart
        </button>
      </form>
    </div>

    <form class="card form-stack" on:submit|preventDefault={createReadout}>
      <h3>Close with readout</h3>
      <label class="field">
        Status
        <select bind:value={readoutForm.status}>
          <option value="completed">completed</option>
          <option value="inconclusive">inconclusive</option>
          <option value="draft">draft</option>
        </select>
      </label>
      <label class="field">
        Decision
        <input bind:value={readoutForm.decision} />
      </label>
      <label class="field">
        Summary
        <textarea bind:value={readoutForm.summary} rows="3"></textarea>
      </label>
      <label class="field">
        Learning
        <textarea bind:value={readoutForm.learning} rows="3"></textarea>
      </label>
      <label class="field">
        Next action
        <textarea bind:value={readoutForm.nextAction} rows="3"></textarea>
      </label>
      <button class="button primary" type="submit" disabled={actionPending}>
        File readout
      </button>
    </form>

    {#if message}
      <p class="pill ok">{message}</p>
    {/if}
  {/if}
</div>
