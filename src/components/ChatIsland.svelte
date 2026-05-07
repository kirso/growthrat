<script lang="ts">
  import { onMount, tick } from "svelte";
  import { markdownToHtml } from "@/lib/markdown";

  type Citation = { title: string; url: string | null };
  type Message = {
    role: "user" | "assistant";
    content: string;
    citations?: Citation[];
    source?: string;
  };

  export let variant: "embedded" | "compact" = "embedded";
  export let persist: boolean = true;
  export let suggested: string[] = [
    "What is proven vs post-hire activation?",
    "What would you do in your first week at RevenueCat?",
    "How would you handle webhook deduplication for agent-built apps?",
    "Why is RevenueCat the right monetization layer for agent-built apps?",
    "Which growth experiment would you run first?",
  ];

  const STORAGE_KEY = "growthrat-thread";
  const seedMessage: Message = {
    role: "assistant",
    content:
      "Ask about the application, proof pack, capability gaps, or the RevenueCat advocate workflow. Answers come from indexed RevenueCat docs and the application package.",
    source: "policy",
  };

  let input = "";
  let pending = false;
  let error = "";
  let threadId = "";
  let messages: Message[] = [seedMessage];
  let logEl: HTMLDivElement | null = null;

  $: showSuggested = messages.length <= 1 && !pending;

  function newThreadId() {
    return `thread-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  }

  onMount(() => {
    if (!persist) {
      threadId = newThreadId();
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { threadId?: string; messages?: Message[] };
        if (parsed.threadId) threadId = parsed.threadId;
        if (Array.isArray(parsed.messages) && parsed.messages.length) {
          messages = parsed.messages;
        }
      }
      if (!threadId) threadId = newThreadId();
    } catch {
      threadId = newThreadId();
    }
  });

  function persistState() {
    if (!persist || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ threadId, messages: messages.slice(-30) }),
      );
    } catch {
      // localStorage may be full or disabled — ignore.
    }
  }

  function confidenceFor(message: Message) {
    if (message.role === "user") return null;
    if (message.citations?.length) return { label: "grounded", cls: "live" };
    if (message.source === "needs_access") return { label: "needs access", cls: "warn" };
    return { label: "policy", cls: "sample" };
  }

  async function scrollToBottom() {
    await tick();
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;

    messages = [...messages, { role: "user", content: message }];
    input = "";
    pending = true;
    error = "";
    persistState();
    void scrollToBottom();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, threadId }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed (${response.status})`);
      }

      const data = (await response.json()) as {
        answer: string;
        source?: string;
        citations?: Citation[];
      };
      messages = [
        ...messages,
        {
          role: "assistant",
          content: data.answer,
          source: data.source,
          citations: data.citations ?? [],
        },
      ];
    } catch (err) {
      error = err instanceof Error ? err.message : "Chat request failed.";
    } finally {
      pending = false;
      persistState();
      void scrollToBottom();
    }
  }

  function clearThread() {
    messages = [seedMessage];
    threadId = newThreadId();
    persistState();
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    void send(input);
  }

  function pickSuggested(prompt: string) {
    input = prompt;
    void send(prompt);
  }
</script>

<div class={`chat-panel chat-${variant}`}>
  <div class="chat-log" bind:this={logEl} aria-live="polite">
    {#each messages as message, idx (idx)}
      {@const conf = confidenceFor(message)}
      <div class={`message ${message.role === "user" ? "user" : ""}`}>
        {#if conf}
          <div class="message-head">
            <span class={`truth ${conf.cls}`}>{conf.label}</span>
          </div>
        {/if}
        <div class="message-body">
          {#if message.role === "assistant"}
            {@html markdownToHtml(message.content)}
          {:else}
            {message.content}
          {/if}
        </div>
        {#if message.citations?.length}
          <div class="message-sources">
            <span class="message-sources-label">Sources</span>
            {#each message.citations as citation, i}
              {#if citation.url}
                <a href={citation.url} target="_blank" rel="noopener">
                  <span class="cite-num">[{i + 1}]</span>
                  <span class="cite-title">{citation.title}</span>
                </a>
              {:else}
                <span>
                  <span class="cite-num">[{i + 1}]</span>
                  <span class="cite-title">{citation.title}</span>
                </span>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/each}
    {#if pending}
      <div class="message thinking">
        <span class="thinking-dot"></span>
        <span class="thinking-dot"></span>
        <span class="thinking-dot"></span>
      </div>
    {/if}
  </div>

  {#if showSuggested}
    <div class="suggested" aria-label="Suggested questions">
      {#each suggested as prompt}
        <button type="button" class="suggested-pill" on:click={() => pickSuggested(prompt)}>
          {prompt}
        </button>
      {/each}
    </div>
  {/if}

  <form class="chat-form" on:submit={handleSubmit}>
    <input
      bind:value={input}
      aria-label="Ask GrowthRat"
      placeholder="Ask about proof, capabilities, or activation"
      autocomplete="off"
    />
    <button type="submit" disabled={pending || !input.trim()}>
      {pending ? "…" : "Ask"}
    </button>
  </form>

  {#if error}
    <p class="chat-error">{error}</p>
  {/if}

  {#if persist && messages.length > 1}
    <button type="button" class="chat-clear" on:click={clearThread} title="Start a new conversation">
      Clear thread
    </button>
  {/if}
</div>

<style>
  .message {
    display: grid;
    gap: 8px;
  }
  .message-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .message-body :global(p) {
    margin: 0 0 8px;
  }
  .message-body :global(p:last-child) {
    margin-bottom: 0;
  }
  .message-body :global(ul),
  .message-body :global(ol) {
    margin: 0 0 8px 18px;
    padding: 0;
  }
  .message-body :global(li) {
    margin: 4px 0;
  }
  .message-body :global(strong) {
    color: var(--ink);
    font-weight: 600;
  }
  .message-body :global(code) {
    border-radius: var(--radius-xs);
    background: var(--surface);
    padding: 1px 5px;
    font-family: var(--font-mono);
    font-size: 0.92em;
  }
  .message-body :global(a) {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .message-body :global(pre) {
    margin: 8px 0;
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--ink);
    padding: 10px;
  }
  .message-body :global(pre code) {
    display: block;
    background: transparent;
    padding: 0;
    color: var(--paper);
    white-space: pre;
  }
  .message-body :global(ul) {
    margin: 6px 0;
    padding-left: 20px;
  }
  .message-body :global(li) {
    margin: 2px 0;
  }
  .message-sources-label {
    color: var(--faint);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .message-sources a,
  .message-sources span {
    display: inline-flex;
    gap: 8px;
    align-items: baseline;
  }
  .cite-num {
    color: var(--faint);
    font-family: var(--font-mono);
    font-size: 11px;
  }
  .cite-title {
    color: var(--muted);
    font-family: var(--font-body);
    font-size: 13px;
  }
  .message-sources a:hover .cite-title {
    color: var(--accent);
  }

  .message.thinking {
    display: flex;
    gap: 5px;
    border-color: transparent;
    background: transparent;
    padding: 8px 14px;
  }
  .thinking-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--faint);
    animation: pulse 1.2s ease-in-out infinite;
  }
  .thinking-dot:nth-child(2) { animation-delay: 0.15s; }
  .thinking-dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes pulse {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }

  .suggested {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }
  .suggested-pill {
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--white);
    color: var(--muted);
    padding: 6px 11px;
    font-family: var(--font-body);
    font-size: 12px;
    line-height: 1.3;
    text-align: left;
    cursor: pointer;
    transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
  }
  .suggested-pill:hover {
    border-color: var(--ink);
    color: var(--ink);
    background: var(--surface-soft);
  }

  .chat-error {
    margin: 0;
    color: var(--status-warn);
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .chat-clear {
    align-self: flex-end;
    border: 0;
    background: none;
    color: var(--faint);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
  }
  .chat-clear:hover {
    color: var(--muted);
  }

  .chat-compact .chat-log {
    max-height: none;
    flex: 1;
  }
</style>
