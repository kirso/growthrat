<script lang="ts">
  import { onMount } from "svelte";

  type OpportunitySource = { title?: string; url?: string };

  type Opportunity = {
    id?: string | number;
    title?: string;
    lane?: string;
    score?: number;
    rationale?: string;
    sources?: { title?: string; url?: string }[];
    components?: Record<string, number>;
    nextAction?: string;
  };

  type RawOpportunity = Opportunity & {
    source_type?: string;
    source_url?: string | null;
    source_ids_json?: string;
    components_json?: string;
    recommended_action?: string;
  };

  type State =
    | { kind: "loading" }
    | { kind: "auth"; status: number; message: string }
    | { kind: "error"; message: string }
    | { kind: "data"; opportunities: Opportunity[] };

  let state: State = { kind: "loading" };
  let lane = "";

  async function load() {
    state = { kind: "loading" };
    try {
      const url = lane
        ? `/api/opportunities?lane=${encodeURIComponent(lane)}`
        : "/api/opportunities";
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        state = {
          kind: "auth",
          status: res.status,
          message:
            res.status === 401
              ? "This view requires an authenticated RevenueCat session."
              : "Your session does not have access to the opportunity engine.",
        };
        return;
      }
      if (!res.ok) {
        state = { kind: "error", message: `Request failed (${res.status})` };
        return;
      }
      const data = (await res.json()) as { ok?: boolean; opportunities?: RawOpportunity[] };
      state = {
        kind: "data",
        opportunities: (data.opportunities ?? []).map(normalizeOpportunity),
      };
    } catch (err) {
      state = {
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      };
    }
  }

  onMount(load);

  function setLane(next: string) {
    lane = next;
    void load();
  }

  const tabs = [
    { id: "", label: "All" },
    { id: "content", label: "Content" },
    { id: "experiment", label: "Experiments" },
    { id: "feedback", label: "Feedback" },
    { id: "community", label: "Community" },
  ];

  function parseRecord(value: unknown): Record<string, number> | undefined {
    const parsed = typeof value === "string" ? safeParse(value) : value;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const entries = Object.entries(parsed as Record<string, unknown>)
      .map(([key, next]) => [key, Number(next)] as const)
      .filter(([, next]) => Number.isFinite(next));
    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  function parseSources(raw: RawOpportunity): OpportunitySource[] | undefined {
    if (raw.sources?.length) return raw.sources;

    const sources: OpportunitySource[] = [];
    if (raw.source_url) {
      sources.push({
        title: raw.source_type || raw.source_url,
        url: raw.source_url,
      });
    }

    const sourceIds = safeParse(raw.source_ids_json);
    if (Array.isArray(sourceIds)) {
      for (const item of sourceIds) {
        if (typeof item === "string" && item.trim()) {
          sources.push({ title: item.trim() });
        }
      }
    }

    return sources.length ? sources : undefined;
  }

  function safeParse(value: unknown) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function normalizeOpportunity(raw: RawOpportunity): Opportunity {
    return {
      id: raw.id,
      title: raw.title,
      lane: raw.lane,
      score:
        typeof raw.score === "number"
          ? raw.score
          : Number.isFinite(Number(raw.score))
            ? Number(raw.score)
            : undefined,
      rationale: raw.rationale,
      sources: parseSources(raw),
      components: raw.components ?? parseRecord(raw.components_json),
      nextAction: raw.nextAction ?? raw.recommended_action,
    };
  }
</script>

<div class="opp-shell">
  <div class="opp-controls">
    <div class="opp-tabs" role="tablist">
      {#each tabs as tab}
        <button
          type="button"
          class="opp-tab"
          class:active={lane === tab.id}
          on:click={() => setLane(tab.id)}
          role="tab"
          aria-selected={lane === tab.id}
        >
          {tab.label}
        </button>
      {/each}
    </div>
    <button type="button" class="opp-refresh" on:click={load} title="Refresh">↻ Refresh</button>
  </div>

  {#if state.kind === "loading"}
    <div class="opp-empty">
      <span class="thinking-dot"></span>
      <span class="thinking-dot"></span>
      <span class="thinking-dot"></span>
    </div>
  {:else if state.kind === "auth"}
    <div class="opp-empty opp-auth">
      <span class="truth warn">{state.status}</span>
      <h3>{state.message}</h3>
      <p>
        The opportunity engine writes to D1 with a scored backlog of content,
        experiment, feedback, and community work. RevenueCat representatives
        access this view after sign-in.
      </p>
      <a class="button primary" href="/sign-in">Sign in</a>
    </div>
  {:else if state.kind === "error"}
    <div class="opp-empty">
      <span class="truth warn">error</span>
      <p>{state.message}</p>
      <button type="button" class="button" on:click={load}>Retry</button>
    </div>
  {:else if state.opportunities.length === 0}
    <div class="opp-empty">
      <span class="truth pending">empty</span>
      <p>No scored opportunities yet. Run a refresh to score the backlog.</p>
    </div>
  {:else}
    <ol class="opp-list">
      {#each state.opportunities as opp, idx (opp.id ?? idx)}
        <li class="opp-row">
          <div class="opp-rank">{String(idx + 1).padStart(2, "0")}</div>
          <div class="opp-body">
            <div class="opp-header">
              <h3>{opp.title ?? "Untitled opportunity"}</h3>
              <div class="opp-meta">
                {#if opp.lane}<span class={`tag ${opp.lane}`}>{opp.lane}</span>{/if}
                {#if typeof opp.score === "number"}
                  <span class="opp-score">score {opp.score.toFixed(2)}</span>
                {/if}
              </div>
            </div>
            {#if opp.rationale}<p class="opp-rationale">{opp.rationale}</p>{/if}
            {#if opp.components && Object.keys(opp.components).length}
              <ul class="opp-components">
                {#each Object.entries(opp.components) as [name, value]}
                  <li><span>{name}</span><strong>{value}</strong></li>
                {/each}
              </ul>
            {/if}
            {#if opp.sources?.length}
              <ul class="opp-sources">
                {#each opp.sources as src}
                  <li>
                    {#if src.url}
                      <a href={src.url} target="_blank" rel="noopener">{src.title ?? src.url}</a>
                    {:else}
                      {src.title ?? "Source"}
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}
            {#if opp.nextAction}
              <p class="opp-next"><span>Next action:</span> {opp.nextAction}</p>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .opp-shell {
    display: grid;
    gap: 18px;
  }
  .opp-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .opp-tabs {
    display: inline-flex;
    gap: 4px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--white);
    padding: 4px;
  }
  .opp-tab {
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    padding: 6px 14px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 160ms ease, color 160ms ease;
  }
  .opp-tab:hover {
    color: var(--ink);
  }
  .opp-tab.active {
    background: var(--ink);
    color: var(--white);
  }
  .opp-refresh {
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--white);
    color: var(--muted);
    padding: 7px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    cursor: pointer;
  }
  .opp-refresh:hover {
    color: var(--ink);
    border-color: var(--ink);
  }

  .opp-empty {
    display: grid;
    place-items: center;
    gap: 14px;
    padding: 56px 24px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--white);
    color: var(--muted);
    text-align: center;
  }
  .opp-empty h3 {
    margin: 0;
  }
  .opp-empty p {
    max-width: 48ch;
    margin: 0;
    color: var(--muted);
  }
  .opp-empty .thinking-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--faint);
    animation: pulse 1.2s ease-in-out infinite;
  }
  .opp-empty .thinking-dot:nth-child(2) { animation-delay: 0.15s; }
  .opp-empty .thinking-dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes pulse {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }

  .opp-list {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .opp-row {
    display: grid;
    grid-template-columns: 60px 1fr;
    gap: 18px;
    padding: 22px;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--white);
  }
  .opp-rank {
    color: var(--faint);
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 500;
  }
  .opp-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }
  .opp-header h3 {
    margin: 0;
    font-size: 18px;
  }
  .opp-meta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .opp-score {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .opp-rationale {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 14px;
    line-height: 1.55;
  }
  .opp-components {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }
  .opp-components li {
    display: inline-flex;
    gap: 6px;
    align-items: baseline;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 3px 9px;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 11px;
  }
  .opp-components strong {
    color: var(--ink);
  }
  .opp-sources {
    display: grid;
    gap: 4px;
    margin: 10px 0 0;
    padding: 0 0 0 14px;
    color: var(--muted);
    font-size: 13px;
  }
  .opp-next {
    margin: 12px 0 0;
    padding: 10px 12px;
    border-left: 2px solid var(--cta);
    background: var(--surface-soft);
    color: var(--ink);
    font-size: 13px;
    line-height: 1.5;
  }
  .opp-next span {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-right: 6px;
  }
</style>
