<script lang="ts">
  type TakeHomeResult = {
    prompt: string;
    deadline: string;
    subtasks: number;
    packageKey?: string | null;
    runLedgerId?: string | null;
    results: Array<{
      workflowRunId: string;
      runLedgerId: string | null;
      status: string;
      artifactId: string | null;
      reportId: string | null;
      plan: {
        contentTopics: string[];
        feedbackTopics: string[];
        experimentTopic: string | null;
      };
    }>;
  };

  type State =
    | { kind: "idle" }
    | { kind: "auth"; status: number; message: string }
    | { kind: "error"; message: string }
    | { kind: "data"; result: TakeHomeResult };

  let prompt = [
    "Create a technical tutorial and growth plan for helping agent developers add RevenueCat to an app.",
    "Include source-grounded content, distribution plan, product feedback, and measurement.",
  ].join("\n");
  let deadline = "48 hours";
  let pending = false;
  let state: State = { kind: "idle" };

  async function execute() {
    pending = true;
    state = { kind: "idle" };

    try {
      const response = await fetch("/api/tasks/execute", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, deadline }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        result?: TakeHomeResult;
        error?: string;
      };

      if (response.status === 401 || response.status === 403 || response.status === 503) {
        state = {
          kind: "auth",
          status: response.status,
          message:
            data.error ||
            "Take-home execution requires a RevenueCat representative session or internal activation token.",
        };
        return;
      }

      if (!response.ok || !data.result) {
        throw new Error(data.error || `Task execution failed with ${response.status}`);
      }

      state = { kind: "data", result: data.result };
    } catch (error) {
      state = {
        kind: "error",
        message: error instanceof Error ? error.message : "Task execution failed.",
      };
    } finally {
      pending = false;
    }
  }
</script>

<div class="take-home-console">
  <form class="card form-stack" on:submit|preventDefault={execute}>
    <span class="tag">Take-home mode</span>
    <h3>Prompt intake</h3>
    <p>
      This executes in dry-run mode: decompose the prompt, retrieve sources,
      generate draft artifacts, run quality gates, create reports, and package
      the receipt without external publishing.
    </p>
    <label class="field">
      Assignment prompt
      <textarea bind:value={prompt} rows="7"></textarea>
    </label>
    <label class="field">
      Deadline
      <input bind:value={deadline} />
    </label>
    <button class="button primary" type="submit" disabled={pending}>
      Execute take-home package
    </button>
  </form>

  <section class="take-home-result">
    {#if state.kind === "idle"}
      <div class="take-home-empty">
        <span class="truth sample">ready</span>
        <h3>Waiting for a prompt.</h3>
        <p>
          The output is stored in the run ledger and, when R2 is available, as a
          package receipt for review.
        </p>
      </div>
    {:else if state.kind === "auth"}
      <div class="take-home-empty">
        <span class="truth warn">{state.status}</span>
        <h3>{state.message}</h3>
        <a class="button primary" href="/sign-in">Sign in</a>
      </div>
    {:else if state.kind === "error"}
      <div class="take-home-empty">
        <span class="truth warn">error</span>
        <p>{state.message}</p>
      </div>
    {:else}
      <div class="card">
        <span class="tag">Package</span>
        <h3>{state.result.subtasks} autonomous subtasks</h3>
        <p>Deadline: {state.result.deadline}</p>
        {#if state.result.packageKey}
          <p>R2 receipt: <code>{state.result.packageKey}</code></p>
        {/if}
        {#if state.result.runLedgerId}
          <p>Run ledger: <code>{state.result.runLedgerId}</code></p>
        {/if}
      </div>

      <div class="take-home-runs">
        {#each state.result.results as result}
          <article class="card">
            <div class="card-header">
              <span class="tag">{result.status}</span>
              <span class="truth sample">dry run</span>
            </div>
            <h3>{result.plan.contentTopics[0] ?? result.workflowRunId}</h3>
            <p>Workflow: <code>{result.workflowRunId}</code></p>
            <p>Artifact: {result.artifactId ?? "none"}</p>
            <p>Report: {result.reportId ?? "none"}</p>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .take-home-console {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 22px;
    align-items: start;
  }
  .take-home-result {
    display: grid;
    gap: 14px;
  }
  .take-home-empty {
    display: grid;
    min-height: 360px;
    place-items: center;
    gap: 12px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-lg);
    background: var(--white);
    padding: 36px 20px;
    text-align: center;
  }
  .take-home-empty h3,
  .take-home-empty p {
    margin: 0;
  }
  .take-home-empty p {
    max-width: 46ch;
    color: var(--muted);
  }
  .take-home-runs {
    display: grid;
    gap: 12px;
  }
  .take-home-runs code,
  .take-home-result code {
    border-radius: var(--radius-xs);
    background: var(--surface);
    padding: 1px 5px;
    font-family: var(--font-mono);
    font-size: 12px;
  }
  @media (max-width: 860px) {
    .take-home-console {
      grid-template-columns: 1fr;
    }
  }
</style>
