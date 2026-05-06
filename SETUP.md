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
AI, AI Search, and Vectorize. Those warnings are expected until production
Cloudflare resources are created and credentials are connected.

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

## Cloudflare Resources To Create

Remote deployment requires real Cloudflare resources matching `wrangler.jsonc`:

```bash
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler d1 create growthrat
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler r2 bucket create growthrat-artifacts
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler queues create growthrat-jobs
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler vectorize create growthrat-doc-index --dimensions 1536 --metric cosine
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler pipelines setup --name growthrat-events
```

After creating the D1 database, add the generated `database_id` to
`wrangler.jsonc`, rerun `bun run cf:types`, then apply remote migrations:

```bash
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler d1 migrations apply growthrat --remote
```

AI Search and Secrets Store should be created from the Cloudflare dashboard or
the current Wrangler/API commands available in the account.

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
- AI, AI Search, and Vectorize warn because they are remote-backed Cloudflare
  products.
- Wrangler may generate generic Pipeline types if the account auth token cannot
  fetch the live Pipeline schema.
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
