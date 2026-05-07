<script lang="ts">
  type Citation = { title: string; url: string | null };
  type Message = {
    role: "user" | "assistant";
    content: string;
    citations?: Citation[];
    source?: string;
  };

  let input = "What is proven vs post-hire activation?";
  let pending = false;
  let error = "";
  let messages: Message[] = [
    {
      role: "assistant",
      content:
        "Ask about the application, proof pack, capability gaps, or the RevenueCat advocate workflow.",
      source: "policy",
    },
  ];

  function confidenceFor(message: Message) {
    if (message.role === "user") return null;
    if (message.citations?.length) return { label: "grounded", cls: "live" };
    if (message.source === "policy") return { label: "policy", cls: "sample" };
    if (message.source === "needs_access") return { label: "needs access", cls: "warn" };
    return { label: "policy", cls: "sample" };
  }

  async function submit() {
    const message = input.trim();
    if (!message || pending) return;

    messages = [...messages, { role: "user", content: message }];
    input = "";
    pending = true;
    error = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with ${response.status}`);
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
    }
  }
</script>

<div class="chat-panel">
  <div class="chat-log" aria-live="polite">
    {#each messages as message}
      {@const conf = confidenceFor(message)}
      <div class={`message ${message.role === "user" ? "user" : ""}`}>
        {#if conf}
          <div class="message-head">
            <span class={`truth ${conf.cls}`}>{conf.label}</span>
          </div>
        {/if}
        <div class="message-body">{message.content}</div>
        {#if message.citations?.length}
          <div class="message-sources">
            <span class="message-sources-label">Sources</span>
            {#each message.citations as citation, index}
              {#if citation.url}
                <a href={citation.url} target="_blank" rel="noopener">
                  <span class="cite-num">[{index + 1}]</span>
                  <span class="cite-title">{citation.title}</span>
                </a>
              {:else}
                <span>
                  <span class="cite-num">[{index + 1}]</span>
                  <span class="cite-title">{citation.title}</span>
                </span>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <form class="chat-form" on:submit|preventDefault={submit}>
    <input
      bind:value={input}
      aria-label="Ask GrowthRat"
      placeholder="Ask about proof, capabilities, or activation"
    />
    <button type="submit" disabled={pending}>
      {pending ? "Thinking…" : "Ask"}
    </button>
  </form>

  {#if error}
    <p class="truth warn">{error}</p>
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
  .message-body {
    color: inherit;
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
</style>
