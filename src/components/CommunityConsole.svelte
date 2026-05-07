<script lang="ts">
  import { onMount } from "svelte";

  type CommunitySignal = {
    id: string;
    channel: string;
    external_url: string;
    topic: string;
    context: string;
    response_draft: string | null;
    quality_status: string;
    posted_at: string | null;
    created_at: string;
  };

  type State =
    | { kind: "loading" }
    | { kind: "auth"; status: number; message: string }
    | { kind: "error"; message: string }
    | { kind: "data"; signals: CommunitySignal[] };

  let state: State = { kind: "loading" };
  let scanning = false;
  let message = "";
  let error = "";

  function truthFor(status: string) {
    if (status === "posted" || status === "approved") return "live";
    if (status === "queued" || status === "draft") return "sample";
    if (status === "rejected" || status === "error") return "warn";
    return "pending";
  }

  async function load() {
    state = { kind: "loading" };
    error = "";

    try {
      const response = await fetch("/api/community/scan", {
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as {
        signals?: CommunitySignal[];
        error?: string;
      };

      if (response.status === 401 || response.status === 403 || response.status === 503) {
        state = {
          kind: "auth",
          status: response.status,
          message:
            data.error ||
            "Community signal review requires a RevenueCat representative session.",
        };
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || `Community request failed with ${response.status}`);
      }

      state = { kind: "data", signals: data.signals ?? [] };
    } catch (err) {
      state = {
        kind: "error",
        message: err instanceof Error ? err.message : "Could not load community signals.",
      };
    }
  }

  async function scan() {
    scanning = true;
    message = "";
    error = "";

    try {
      const response = await fetch("/api/community/scan", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as {
        result?: { scanned?: boolean; reason?: string; signals?: unknown[] };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || `Scan failed with ${response.status}`);
      }

      message = data.result?.scanned
        ? `Stored ${data.result.signals?.length ?? 0} community signals.`
        : `Scan skipped: ${data.result?.reason ?? "not active"}.`;
      await load();
    } catch (err) {
      error = err instanceof Error ? err.message : "Community scan failed.";
    } finally {
      scanning = false;
    }
  }

  onMount(load);
</script>

<div class="community-console">
  <div class="community-head">
    <div>
      <p class="eyebrow">Community loop</p>
      <h2>Signal queue and reply drafts</h2>
    </div>
    <div class="community-actions">
      <button class="button" type="button" on:click={load}>Refresh</button>
      <button class="button primary" type="button" disabled={scanning} on:click={scan}>
        Scan public signals
      </button>
    </div>
  </div>

  {#if message}
    <p class="pill ok">{message}</p>
  {/if}
  {#if error}
    <p class="pill">{error}</p>
  {/if}

  {#if state.kind === "loading"}
    <div class="community-empty">Loading community signal state.</div>
  {:else if state.kind === "auth"}
    <div class="community-empty">
      <span class="truth warn">{state.status}</span>
      <h3>{state.message}</h3>
      <p>
        After sign-in, GrowthRat can scan approved public surfaces, draft
        source-grounded replies, and keep posting behind approval policy.
      </p>
      <a class="button primary" href="/sign-in">Sign in</a>
    </div>
  {:else if state.kind === "error"}
    <div class="community-empty">
      <span class="truth warn">error</span>
      <p>{state.message}</p>
      <button class="button" type="button" on:click={load}>Retry</button>
    </div>
  {:else if state.signals.length === 0}
    <div class="community-empty">
      <span class="truth pending">empty</span>
      <h3>No community signals stored yet.</h3>
      <p>
        The first scan uses approved public sources and keeps all replies as
        drafts. No community post is sent from this page.
      </p>
    </div>
  {:else}
    <div class="community-list">
      {#each state.signals as signal}
        <article class="community-row">
          <div>
            <div class="community-meta">
              <span class="tag">{signal.channel}</span>
              <span class={`truth ${truthFor(signal.quality_status)}`}>
                {signal.quality_status}
              </span>
            </div>
            <h3>{signal.topic}</h3>
            <p>{signal.context}</p>
            {#if signal.response_draft}
              <blockquote>{signal.response_draft}</blockquote>
            {/if}
          </div>
          <a class="button" href={signal.external_url} target="_blank" rel="noopener">
            Open source
          </a>
        </article>
      {/each}
    </div>
  {/if}
</div>

<style>
  .community-console {
    display: grid;
    gap: 18px;
  }
  .community-head,
  .community-actions {
    display: flex;
    align-items: end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .community-actions {
    align-items: center;
  }
  .community-head h2 {
    margin-bottom: 0;
  }
  .community-empty {
    display: grid;
    place-items: center;
    gap: 12px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--white);
    padding: 48px 20px;
    text-align: center;
  }
  .community-empty h3,
  .community-empty p {
    margin: 0;
  }
  .community-empty p {
    max-width: 54ch;
    color: var(--muted);
  }
  .community-list {
    display: grid;
    gap: 14px;
  }
  .community-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 18px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--white);
    padding: 22px;
  }
  .community-meta {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }
  .community-row h3 {
    margin-bottom: 6px;
  }
  .community-row p {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
  }
  .community-row blockquote {
    margin: 14px 0 0;
    border-left: 3px solid var(--cta);
    background: var(--surface-soft);
    padding: 12px 14px;
    color: var(--ink-soft);
    font-size: 14px;
    line-height: 1.55;
  }
  @media (max-width: 860px) {
    .community-row {
      grid-template-columns: 1fr;
    }
  }
</style>
