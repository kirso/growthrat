<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import ChatIsland from "./ChatIsland.svelte";

  export let mode = "interview_proof";

  let open = false;

  function toggle() {
    open = !open;
  }
  function close() {
    open = false;
  }

  function handleKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      toggle();
    } else if (e.key === "Escape" && open) {
      close();
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKey);
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKey);
    }
  });
</script>

<button
  type="button"
  class="fc-bubble"
  class:hidden={open}
  on:click={toggle}
  aria-label="Open GrowthRat chat (⌘K)"
  title="Talk to GrowthRat — ⌘K"
>
  <span class="fc-dot"></span>
  Talk to GrowthRat
  <kbd>⌘K</kbd>
</button>

<div class="fc-drawer" class:open aria-hidden={!open}>
  <header class="fc-head">
    <div>
      <strong>GrowthRat</strong>
      <span class="fc-mode">{mode} · grounded</span>
    </div>
    <button type="button" class="fc-close" on:click={close} aria-label="Close chat">
      ✕
    </button>
  </header>
  {#if open}
    <div class="fc-body">
      <ChatIsland variant="compact" persist={true} />
    </div>
  {/if}
</div>

{#if open}
  <button
    type="button"
    class="fc-backdrop"
    aria-label="Close chat"
    on:click={close}
  ></button>
{/if}

<style>
  .fc-bubble {
    position: fixed;
    bottom: 22px;
    right: 22px;
    z-index: 50;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--white);
    color: var(--ink);
    padding: 10px 16px 10px 14px;
    box-shadow: var(--shadow-card);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  }
  .fc-bubble:hover {
    border-color: var(--ink);
    transform: translateY(-1px);
  }
  .fc-bubble.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(8px);
  }
  .fc-bubble kbd {
    border: 1px solid var(--line);
    border-radius: 5px;
    background: var(--surface-soft);
    padding: 1px 6px;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
  }
  .fc-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--cta);
    box-shadow: 0 0 0 3px rgba(23, 136, 113, 0.16);
  }

  .fc-drawer {
    position: fixed;
    bottom: 22px;
    right: 22px;
    z-index: 51;
    display: flex;
    flex-direction: column;
    width: min(420px, calc(100vw - 32px));
    height: min(620px, calc(100vh - 80px));
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--paper);
    box-shadow: var(--shadow-card);
    opacity: 0;
    pointer-events: none;
    transform: translateY(12px);
    transition: opacity 200ms ease, transform 200ms ease;
    overflow: hidden;
  }
  .fc-drawer.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .fc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
    background: var(--white);
  }
  .fc-head strong {
    color: var(--ink);
    font-family: var(--font-display);
    font-weight: 650;
    letter-spacing: -0.01em;
  }
  .fc-mode {
    margin-left: 8px;
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.02em;
  }
  .fc-close {
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    padding: 4px 6px;
  }
  .fc-close:hover {
    color: var(--ink);
  }

  .fc-body {
    flex: 1;
    min-height: 0;
    padding: 14px 14px 16px;
    overflow: hidden;
  }
  .fc-body :global(.chat-panel) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
  }
  .fc-body :global(.chat-log) {
    max-height: none;
    flex: 1;
  }

  .fc-backdrop {
    position: fixed;
    inset: 0;
    z-index: 49;
    border: 0;
    background: rgba(15, 20, 25, 0.18);
    cursor: pointer;
  }

  @media (max-width: 600px) {
    .fc-drawer {
      bottom: 0;
      right: 0;
      width: 100vw;
      height: 84vh;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }
    .fc-bubble {
      bottom: 14px;
      right: 14px;
    }
  }
</style>
