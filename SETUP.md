# GrowthRat Setup

This guide describes the repo as it works today and the platform direction we
are moving toward.

## Current Local Setup

The current app is still Next.js plus Convex.

```bash
bun install
cp .env.example .env.local
bunx convex dev
bun run dev
```

Open `http://localhost:3000`.

Use two terminals for normal work:

```bash
bunx convex dev
```

```bash
bun run dev
```

Or use the combined script:

```bash
bun run dev:all
```

## Required Environment

Minimum app shell and auth config:

```bash
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CONVEX_SITE_URL=...
SITE_URL=http://localhost:3000
BETTER_AUTH_SECRET=...
GROWTHCAT_INTERNAL_SECRET=...
GROWTHCAT_PANEL_TOKEN=...
RC_ADMIN_EMAILS=you@example.com
# or
RC_ADMIN_DOMAINS=example.com
```

`GROWTHCAT_INTERNAL_SECRET` can fall back to `BETTER_AUTH_SECRET` in local
development, but production should use a separate value.

Core runtime providers:

```bash
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
VOYAGE_API_KEY=...
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
SLACK_BOT_TOKEN=...
SLACK_SIGNING_SECRET=...
GITHUB_TOKEN=...
TYPEFULLY_API_KEY=...
TYPEFULLY_SOCIAL_SET_ID=...
REVENUECAT_API_KEY=...
```

Most connector credentials are optional in local proof mode. Missing connectors
should degrade to explicit unavailable states, not silent success.

## Smoke Routes

Public:

- `/`
- `/application`
- `/proof-pack`
- `/articles`
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

## Verification

```bash
bun run typecheck
bun run test
bun run build
```

`bun run lint` runs ESLint directly. The old `next lint` command is not used.

## Current Activation Flow

1. Visit `/sign-in`.
2. Sign in with an allowlisted account.
3. Open `/onboarding`.
4. Submit connector credentials.
5. Confirm connector state is one of:
   - `verified`
   - `manual_verification`
   - `pending`
   - `error`
6. Set mode to `interview_proof` for panel and public proof.
7. Set mode to `rc_live` only after side-effect surfaces are fail-closed.

## Target Cloudflare Setup

The Cloudflare migration is the target architecture, not the current branch
state. Do not claim the repo has migrated until `astro.config.*`, `wrangler.*`,
D1 migrations, and Workers bindings exist.

The intended foundation is:

- Astro with Svelte islands on Cloudflare Workers
- Cloudflare Agents plus Durable Objects for stateful agent sessions
- Cloudflare Workflows for weekly runs, approvals, retries, and long waits
- D1 for relational operational state
- Durable Object SQLite for hot per-agent state and coordination
- R2 for immutable proof artifacts, snapshots, reports, and receipts
- Queues for async jobs and backpressure
- Pipelines for event firehose delivery into R2
- Secrets Store for connector credentials
- AI Gateway for model routing, policy, logs, and spend controls
- AI Search or Vectorize for RevenueCat docs and artifact retrieval
- Browser Rendering, Sandbox, or Containers only where validation requires them

Useful CLI discovery commands:

```bash
cf --help
cf agent-context
bunx wrangler --help
bunx wrangler d1 --help
bunx wrangler workflows --help
bunx wrangler pipelines --help
bunx wrangler ai-search --help
bunx wrangler vectorize --help
bunx wrangler queues --help
bunx wrangler r2 --help
bunx wrangler secrets-store --help
```

Use `cf` for broad Cloudflare account/API/context exploration. Use `wrangler`
for Workers project development, bindings, local dev, migrations, and deploys.

## Migration Gate

The migration can start when the docs and public copy are aligned and the
current app's unsafe side-effect surfaces are either closed or explicitly kept
off the public path.

The first Cloudflare commit should include:

- `astro.config.*`
- `wrangler.jsonc`
- D1 schema and migrations
- initial bindings for D1, R2, Queues, Workflows, and Durable Objects
- one migrated public page
- one migrated Svelte island
- one read-only proof endpoint
- local and deployment verification commands
