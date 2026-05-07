# GrowthRat

GrowthRat is an autonomous developer-advocacy and growth agent for RevenueCat.
The app is pre-production and currently optimized to prove interview readiness,
technical content capability, growth experiment design, and bounded agent
operation.

## Active Stack

- Astro 6 with server output
- Svelte 5 components for interactive surfaces
- Cloudflare Workers through `@astrojs/cloudflare`
- Cloudflare Agents plus Durable Objects for stateful agent sessions
- Cloudflare Workflows for durable weekly loops
- D1 for relational operational state
- R2 for large artifacts
- Queues for async jobs
- Pipeline stream for event ingestion
- Workers AI, AI Gateway, and Vectorize for model/retrieval paths

The legacy Next.js and Convex app has been removed from the runnable tree. Use
git history when old behavior needs to be compared or restored.

## Commands

```bash
bun run dev          # Astro dev server on http://127.0.0.1:4321
bun run typecheck    # astro check plus tsc
bun run lint
bun run test
bun run build
bun run cf:types     # regenerate worker-configuration.d.ts after bindings change
bun run cf:check     # wrangler deploy --dry-run
```

## Architecture

- `src/pages/` — active Astro pages and API endpoints
- `src/components/` — Svelte components
- `src/content/` — public proof, article, and page metadata
- `src/lib/runtime.ts` — Cloudflare runtime helpers and fallback proof snapshot
- `src/worker.ts` — custom Worker entry, Agent class, Workflow class, queue consumer
- `migrations/` — D1 schema and seed data
- `wrangler.jsonc` — Cloudflare binding source of truth
- `worker-configuration.d.ts` — generated Cloudflare binding types

## Operating Modes

- `dormant` — no side effects
- `interview_proof` — public proof, chat/panel, and deterministic API surfaces
- `rc_live` — full post-hire operation after secrets, connectors, approvals, and
  budgets are active

Current mode is configured through `APP_MODE` in `wrangler.jsonc` and local
environment files. Do not enable side effects or connector writes unless the
mode, required secrets, and approval path are explicit.

## Key Patterns

- Public proof pages should render without a local D1 database by using seeded
  fallback data from `src/lib/runtime.ts`.
- Durable or side-effecting work belongs behind Cloudflare bindings in
  `src/worker.ts`, API endpoints, Workflows, Queues, or Agents.
- Regenerate `worker-configuration.d.ts` with `bun run cf:types` after changing
  `wrangler.jsonc`.
- Keep server-owned platform secrets in Wrangler. Keep RevenueCat-owned
  connector tokens in encrypted connected-account records created by an
  authenticated RevenueCat representative.
- Do not expose bearer tokens or connector credentials in public proof copy.
