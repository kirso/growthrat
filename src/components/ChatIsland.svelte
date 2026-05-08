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
  type Props = {
    variant?: "embedded" | "compact";
    persist?: boolean;
    suggested?: string[];
  };

  let {
    variant = "embedded",
    persist = true,
    suggested = [
      "What would you ship in your first week?",
      "How would you handle duplicate webhooks for an agent-built app?",
      "Which growth experiment would you run first, and how would you measure it?",
      "Why is RevenueCat the right place to handle subscriptions for agent-built apps?",
      "What works today, and what's still waiting on RevenueCat?",
    ],
  }: Props = $props();

  const STORAGE_KEY = "growthrat-thread";
  const seedMessage: Message = {
    role: "assistant",
    content:
      "Hi — I'm GrowthRat. Ask me about RevenueCat, what I shipped before applying, or what I'd do in the role. I look things up in the docs before I answer and tell you where each part came from.",
    source: "policy",
  };
  const offlineMessage =
    "GrowthRat chat is offline to avoid model spend. Contact the operator if you need live access.";

  let input = $state("");
  let pending = $state(false);
  let error = $state("");
  let threadId = $state("");
  let messages = $state<Message[]>([seedMessage]);
  let logEl = $state<HTMLDivElement | null>(null);
  let offline = $state(false);

  const showSuggested = $derived(messages.length <= 1 && !pending && !offline);

  function newThreadId() {
    return `thread-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  }

  async function loadPolicy() {
    try {
      const response = await fetch("/api/policy");
      if (!response.ok) return;
      const policy = (await response.json()) as {
        killSwitch?: boolean;
        modelChatEnabled?: boolean;
      };
      if (policy.killSwitch || policy.modelChatEnabled === false) {
        offline = true;
        messages = [
          {
            role: "assistant",
            content: offlineMessage,
            source: "policy",
          },
        ];
      }
    } catch {
      // If policy cannot load, leave the API-side fail-closed guard in charge.
    }
  }

  onMount(() => {
    if (!persist) {
      threadId = newThreadId();
      void loadPolicy();
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
    void loadPolicy();
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
    if (message.citations?.length) return { label: "from the docs", cls: "live" };
    if (message.source === "needs_access") return { label: "would need your data", cls: "warn" };
    return { label: "my take", cls: "sample" };
  }

  async function scrollToBottom() {
    await tick();
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    if (offline) {
      error = offlineMessage;
      return;
    }

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
        const body = (await response.json().catch(() => ({}))) as {
          detail?: string;
          error?: string;
        };
        throw new Error(body.detail || body.error || `Chat request failed (${response.status})`);
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
            {#each message.citations as citation, i (citation.url ?? citation.title)}
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
      {#each suggested as prompt (prompt)}
        <button type="button" class="suggested-pill" onclick={() => pickSuggested(prompt)}>
          {prompt}
        </button>
      {/each}
    </div>
  {/if}

  <form class="chat-form" onsubmit={handleSubmit}>
    <input
      bind:value={input}
      aria-label="Ask GrowthRat"
      placeholder={offline ? "Chat is offline" : "Ask about RevenueCat, my work, or what I'd do"}
      autocomplete="off"
      disabled={offline}
    />
    <button type="submit" disabled={pending || offline || !input.trim()}>
      {pending ? "…" : "Ask"}
    </button>
  </form>

  {#if error}
    <p class="chat-error">{error}</p>
  {/if}

  {#if persist && messages.length > 1}
    <button type="button" class="chat-clear" onclick={clearThread} title="Start a new conversation">
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
  .message-body {
    white-space: pre-wrap;
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
