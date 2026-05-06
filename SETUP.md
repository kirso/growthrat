# GrowthRat Setup

This guide describes the active Astro/Svelte/Cloudflare runtime and the legacy
Next/Convex migration source.

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
- Vectorize `growthrat-doc-index`
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

`wrangler.jsonc` declares these required production secrets:

```bash
GROWTHRAT_INTERNAL_SECRET=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
REVENUECAT_API_KEY=
SLACK_BOT_TOKEN=
TYPEFULLY_API_KEY=
```

Set them with:

```bash
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler secret put GROWTHRAT_INTERNAL_SECRET
```

Repeat for each secret. Local proof mode can run with warnings, but production
deployment should not.

## Smoke Routes

Public:

- `/`
- `/application`
- `/proof-pack`
- `/articles`
- `/articles/revenuecat-for-agent-built-apps`
- `/readiness-review`
- `/operator-replay`
- `/interview-truth`

Operator:

- `/sign-in`
- `/onboarding`
- `/dashboard`
- `/go-live`
- `/pipeline`
- `/experiments`
- `/feedback`
- `/report`
- `/panel`

APIs:

- `/api/runtime`
- `/api/proof`
- `/api/chat`

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

## Legacy Runtime

The old Next/Convex app is preserved as a migration source:

```bash
bun run dev:next
bunx convex dev
```

Do not treat the legacy runtime as the active architecture. New public pages,
Cloudflare endpoints, and agent infrastructure should land under `src/`,
`migrations/`, and `wrangler.jsonc`.
