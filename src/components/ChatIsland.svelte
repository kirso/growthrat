<script lang="ts">
  type Message = {
    role: "user" | "assistant";
    content: string;
  };

  let input = "What is proven vs post-hire activation?";
  let pending = false;
  let error = "";
  let messages: Message[] = [
    {
      role: "assistant",
      content:
        "Ask about the application, proof pack, capability gaps, or RevenueCat advocate workflow.",
    },
  ];

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

      const data = (await response.json()) as { answer: string };
      messages = [...messages, { role: "assistant", content: data.answer }];
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
      <div class={`message ${message.role === "user" ? "user" : ""}`}>
        {message.content}
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
      {pending ? "Sending" : "Ask"}
    </button>
  </form>

  {#if error}
    <p class="pill">{error}</p>
  {/if}
</div>
