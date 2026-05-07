# GrowthRat Setup

This guide describes the active Astro/Svelte/Cloudflare runtime.

## Local Setup

```bash
bun install
bun run dev
```

Open `http://127.0.0.1:4321`.

The dev server uses the Cloudflare workerd runtime through the Astro Cloudflare
adapter. Some bindings are remote-only products, so local runs may warn about
AI and Vectorize. Those warnings are expected because those products use remote
Cloudflare resources even during local development.

## Required Cloudflare Files

The active runtime depends on:

- `astro.config.mjs`
- `svelte.config.js`
- `wrangler.jsonc`
- `worker-configuration.d.ts`
- `src/worker.ts`
- `migrations/0001_growthrat_core.sql`

Regenerate binding types after changing `wrangler.jsonc`:

```bash
bun run cf:types
```

## Local D1

Initialize the local D1 database:

```bash
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler d1 migrations apply growthrat --local
```

Useful checks:

```bash
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler d1 execute growthrat --local --command "select count(*) from artifacts"
```

If D1 is not initialized, public pages still render and API endpoints fall back
to seeded in-code proof counts.

## Cloudflare Resources

The current account-backed resources are:

- D1 `growthrat` — `ed57e939-16a5-4426-b650-1bb9f34f6abf`
- R2 `growthrat-artifacts`
- Queue `growthrat-jobs`
- Vectorize `growthrat-doc-index-bge-base`
- Pipeline stream `growthrat_events` — `f2a8a2111c5741f8a388f955c581382e`
- AI Gateway `growthrat`
- Secrets Store uses the account default store. A dedicated store could not be
  created because the account has reached the current store quota.

Remote D1 has already been migrated and seeded. To re-apply the idempotent
migration manually:

```bash
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler d1 migrations apply growthrat --remote
```

AI Search provisioning currently fails for this account with Cloudflare managed
resource provisioning errors, so the active retrieval binding is Vectorize.

## Required Secrets

The platform declares these required production secrets:

```bash
GROWTHRAT_INTERNAL_SECRET=
GROWTHRAT_CONNECTOR_ENCRYPTION_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
```

Set them with:

```bash
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler secret put GROWTHRAT_INTERNAL_SECRET
```

Repeat for each platform secret. `GROWTHRAT_INTERNAL_SECRET` starts the first
RC representative session and remains the CLI/API fallback for protected
operations. RevenueCat, Slack, CMS, GitHub, Postiz, and other product tokens are
not deployment secrets in `rc_live`; they are provided by a signed-in RevenueCat
representative through connected-account onboarding and encrypted before
storage.

Langfuse is optional and disabled by default with `LANGFUSE_ENABLED=false`.
When enabled, set `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and optionally
`LANGFUSE_PROJECT_ID` for trace links. D1 remains the canonical run ledger even
if Langfuse is unavailable or over quota.

## Smoke Routes

Public:

- `/`
- `/application`
- `/application-letter`
- `/proof-pack`
- `/articles`
- `/articles/revenuecat-for-agent-built-apps`
- `/articles/revenuecat-agent-monetization-benchmark`
- `/readiness-review`
- `/operator-replay`
- `/interview-truth`

Operator:

- `/sign-in`
- `/onboarding`
- `/dashboard`
- `/go-live`
- `/pipeline`
- `/opportunities`
- `/experiments`
- `/feedback`
- `/report`
- `/panel`

APIs:

- `/api/runtime`
- `/api/proof`
- `/api/chat`
- `/api/activation`
- `/api/agent-config`
- `/api/opportunities`
- `/api/runs`
- `/api/accounts/revenuecat/connectors`
- `/api/connectors/postiz`
- `/api/connectors/postiz/upload-from-url`
- `/api/slack/events`
- `/api/community/scan`
- `/api/tasks/execute`
- `/api/workflows/weekly-dry-run`
- `/api/workflows/weekly-run`

Agent route:

- `/agents/growth-rat-agent/main`

## Verification

```bash
bun run typecheck
bun run lint
bun run test
bun run build
bun run cf:check
```

Observed non-fatal warnings in local pre-production:

- Missing required secrets until `.dev.vars`, `.env`, or Wrangler secrets are
  populated.
- AI and Vectorize warn because they are remote-backed Cloudflare products.
- Wrangler may generate generic Pipeline types if the account auth token cannot
  fetch the live Pipeline stream schema.
- The Agents SDK currently emits a Vite warning about `zod/v3` and
  `fromJSONSchema`; the build still completes.

## Activation Checklist

Use [docs/ops/cloudflare-activation-checklist.md](docs/ops/cloudflare-activation-checklist.md)
before changing `APP_MODE` from `interview_proof` to `rc_live`.
