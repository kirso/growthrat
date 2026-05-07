<script lang="ts">
  import { onMount } from "svelte";

  type Session = {
    email: string;
    fullName?: string;
    role: string;
    expiresAt: string;
  };

  type ConnectorCheck = {
    key: string;
    label: string;
    status: "ready" | "gated" | "blocked";
    detail: string;
    authMode?: string;
    lastCheckedAt?: string;
  };

  type ConnectorDefinition = {
    key: string;
    label: string;
    description: string;
    fields: { key: string; label: string; type?: string; placeholder?: string }[];
  };

  const connectorDefinitions: ConnectorDefinition[] = [
    {
      key: "revenuecat",
      label: "RevenueCat API and Charts",
      description: "Project-level API access for Charts and monetization truth.",
      fields: [
        { key: "apiKey", label: "API key", type: "password" },
        { key: "projectId", label: "Project id" },
      ],
    },
    {
      key: "slack",
      label: "Slack workspace",
      description: "Async reports, commands, approvals, and team requests.",
      fields: [
        { key: "botToken", label: "Bot token", type: "password" },
        { key: "signingSecret", label: "Signing secret", type: "password" },
        { key: "defaultChannel", label: "Default channel" },
      ],
    },
    {
      key: "cms",
      label: "Blog CMS",
      description: "Long-form publishing destination after editorial approval.",
      fields: [
        { key: "baseUrl", label: "CMS base URL" },
        { key: "apiToken", label: "API token", type: "password" },
      ],
    },
    {
      key: "github",
      label: "GitHub organization",
      description: "Code samples, docs PRs, issues, and public community signal.",
      fields: [
        { key: "token", label: "Token", type: "password" },
        { key: "owner", label: "Owner" },
        { key: "contentRepo", label: "Content repo" },
      ],
    },
    {
      key: "postiz",
      label: "Postiz social distribution",
      description: "Approved multi-platform social drafts and schedules.",
      fields: [
        { key: "apiKey", label: "API key", type: "password" },
        {
          key: "baseUrl",
          label: "API base URL",
          placeholder: "https://api.postiz.com/public/v1",
        },
      ],
    },
    {
      key: "dataforseo",
      label: "DataForSEO keyword research",
      description: "Keyword, SERP, and demand research for weekly topic planning.",
      fields: [
        { key: "login", label: "Login" },
        { key: "password", label: "Password", type: "password" },
      ],
    },
    {
      key: "x",
      label: "X community monitoring",
      description: "Public community listening and approved reply drafting.",
      fields: [{ key: "bearerToken", label: "Access token", type: "password" }],
    },
  ];

  let session: Session | null = null;
  let connectors: ConnectorCheck[] = [];
  let selectedConnector = "revenuecat";
  let credentials: Record<string, string> = {};
  let signInForm = {
    fullName: "",
    email: "",
    activationCode: "",
  };
  let pending = true;
  let actionPending = false;
  let message = "";
  let error = "";

  $: selectedDefinition =
    connectorDefinitions.find((definition) => definition.key === selectedConnector) ??
    connectorDefinitions[0];

  function connectorStatus(key: string) {
    return connectors.find((connector) => connector.key === key);
  }

  function resetCredentials() {
    credentials = Object.fromEntries(
      selectedDefinition.fields.map((field) => [field.key, ""]),
    );
  }

  $: if (selectedDefinition && !selectedDefinition.fields.every((field) => field.key in credentials)) {
    resetCredentials();
  }

  async function loadSession() {
    pending = true;
    error = "";

    try {
      const response = await fetch("/api/auth/session", {
        credentials: "same-origin",
      });
      const data = (await response.json()) as {
        authenticated: boolean;
        session: Session | null;
      };
      session = data.authenticated ? data.session : null;
      if (session) await loadConnectors();
    } catch (err) {
      error = err instanceof Error ? err.message : "Could not load session.";
    } finally {
      pending = false;
    }
  }

  async function loadConnectors() {
    const response = await fetch("/api/accounts/revenuecat/connectors", {
      credentials: "same-origin",
    });
    const data = (await response.json().catch(() => ({}))) as {
      connectors?: ConnectorCheck[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error || `Connector request failed with ${response.status}`);
    }
    connectors = data.connectors ?? [];
  }

  async function signIn() {
    actionPending = true;
    error = "";
    message = "";

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(signInForm),
      });
      const data = (await response.json().catch(() => ({}))) as {
        session?: Session;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || `Sign-in failed with ${response.status}`);
      }
      session = data.session ?? null;
      signInForm.activationCode = "";
      await loadConnectors();
      message = "RevenueCat representative session started.";
    } catch (err) {
      error = err instanceof Error ? err.message : "Sign-in failed.";
    } finally {
      actionPending = false;
    }
  }

  async function logout() {
    actionPending = true;
    error = "";
    message = "";

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      session = null;
      connectors = [];
      message = "Signed out.";
    } catch (err) {
      error = err instanceof Error ? err.message : "Sign-out failed.";
    } finally {
      actionPending = false;
    }
  }

  async function connectAccount() {
    actionPending = true;
    error = "";
    message = "";

    try {
      const cleanCredentials = Object.fromEntries(
        Object.entries(credentials)
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => value),
      );
      const response = await fetch("/api/accounts/revenuecat/connectors", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          connectorType: selectedConnector,
          credentials: cleanCredentials,
          authMode: "api_key",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        connectors?: ConnectorCheck[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || `Connector save failed with ${response.status}`);
      }
      connectors = data.connectors ?? [];
      resetCredentials();
      message = `${selectedDefinition.label} connector saved and verified.`;
    } catch (err) {
      error = err instanceof Error ? err.message : "Connector save failed.";
    } finally {
      actionPending = false;
    }
  }

  onMount(() => {
    void loadSession();
  });
</script>

<div class="connector-console">
  {#if pending}
    <p class="lead">Loading representative session.</p>
  {:else if session}
    <div class="card operator-panel">
      <div>
        <span class="tag">Authenticated</span>
        <h3>{session.email}</h3>
        <p>
          This session can connect RevenueCat-owned accounts and operate
          protected product surfaces without pasting bearer tokens into the UI.
        </p>
      </div>
      <button class="button" type="button" disabled={actionPending} on:click={logout}>
        Sign out
      </button>
    </div>

    <div class="grid two runtime-detail">
      <article class="card">
        <h3>Connector state</h3>
        {#each connectorDefinitions as definition}
          {@const status = connectorStatus(definition.key)}
          <button
            class="connector-row"
            type="button"
            on:click={() => {
              selectedConnector = definition.key;
              resetCredentials();
            }}
          >
            <span>
              <strong>{definition.label}</strong>
              <small>{status?.detail ?? definition.description}</small>
            </span>
            <span class="pill {status?.status === 'ready' ? 'ok' : ''}">
              {status?.status ?? "gated"}
            </span>
          </button>
        {/each}
      </article>

      <form class="card form-stack" on:submit|preventDefault={connectAccount}>
        <span class="tag">Connect account</span>
        <h3>{selectedDefinition.label}</h3>
        <p>{selectedDefinition.description}</p>
        {#each selectedDefinition.fields as field}
          <label class="field">
            {field.label}
            <input
              bind:value={credentials[field.key]}
              type={field.type ?? "text"}
              placeholder={field.placeholder ?? ""}
              autocomplete="off"
            />
          </label>
        {/each}
        <button class="button primary" type="submit" disabled={actionPending}>
          Save connector
        </button>
      </form>
    </div>
  {:else}
    <div class="grid two runtime-detail">
      <form class="card form-stack" on:submit|preventDefault={signIn}>
        <span class="tag">RevenueCat access</span>
        <h3>Representative sign-in</h3>
        <p>
          After interview approval, a RevenueCat representative can open an
          authenticated session and connect owned accounts from this page.
        </p>
        <label class="field">
          Full name
          <input bind:value={signInForm.fullName} autocomplete="name" />
        </label>
        <label class="field">
          RevenueCat email
          <input
            bind:value={signInForm.email}
            type="email"
            autocomplete="email"
          />
        </label>
        <label class="field">
          Activation code
          <input
            bind:value={signInForm.activationCode}
            type="password"
            autocomplete="one-time-code"
          />
        </label>
        <button class="button primary" type="submit" disabled={actionPending}>
          Start session
        </button>
      </form>

      <article class="card">
        <h3>What happens after sign-in</h3>
        <p>
          The app stores connector credentials as encrypted connected-account
          records in D1, verifies provider access when possible, and keeps
          publishing side effects behind runtime policy.
        </p>
        <p>
          Connector tokens are not production environment variables in live
          RevenueCat operation.
        </p>
      </article>
    </div>
  {/if}

  {#if message}
    <p class="pill ok">{message}</p>
  {/if}
  {#if error}
    <p class="pill">{error}</p>
  {/if}
</div>
