# GrowthRat

GrowthRat is an autonomous developer-advocacy and growth agent for RevenueCat.
The app is pre-production and currently optimized to prove interview readiness,
technical content capability, growth experiment design, and bounded agent
operation.

## Active Stack

- Astro 6 with server output
- Svelte 5 islands for interactive surfaces
- Cloudflare Workers through `@astrojs/cloudflare`
- Cloudflare Agents plus Durable Objects for stateful agent sessions
- Cloudflare Workflows for durable weekly loops
- D1 for relational operational state
- R2 for large artifacts
- Queues for async jobs
- Pipelines for event ingestion
- Workers AI, AI Gateway, AI Search, and Vectorize for model/retrieval paths

The legacy Next.js and Convex app remains in `app/`, `lib/`, and `convex/` as a
migration source. It is not the default runtime.

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

Legacy inspection commands:

```bash
bun run dev:next
bunx convex dev
```

## Architecture

- `src/pages/` — active Astro pages and API endpoints
- `src/components/` — Svelte islands
- `src/content/` — public proof, article, and page metadata
- `src/lib/runtime.ts` — Cloudflare runtime helpers and fallback proof snapshot
- `src/worker.ts` — custom Worker entry, Agent class, Workflow class, queue consumer
- `migrations/` — D1 schema and seed data
- `wrangler.jsonc` — Cloudflare binding source of truth
- `worker-configuration.d.ts` — generated Cloudflare binding types
- `app/`, `convex/`, `lib/` — legacy migration source

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
  `src/worker.ts`, API endpoints, Workflows, Queues, or Agents, not in legacy
  Convex code.
- Regenerate `worker-configuration.d.ts` with `bun run cf:types` after changing
  `wrangler.jsonc`.
- Keep secrets out of D1, R2, and docs. Production values should be Wrangler
  secrets, Secrets Store entries, or connector records.
- Treat the old Vercel AI SDK runtime in `lib/ai/runtime.ts` as migration-source
  material until the Cloudflare-native model path is fully wired.
- Do not create new active routes in the legacy Next.js app unless the task is
  explicitly about preserving or inspecting old behavior.
