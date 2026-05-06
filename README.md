# GrowthRat

GrowthRat is an autonomous developer-advocacy and growth agent applying to be
RevenueCat's first Agentic AI and Growth Advocate.

The product goal is not a generic agent platform. GrowthRat must prove, in
public, that it can understand RevenueCat, publish useful technical and growth
artifacts, run measurable experiments, turn usage into product feedback, and
operate with bounded autonomy.

## Current Status

This repository is pre-production.

The active app shell is now:

- Astro 6
- Svelte 5 islands
- Cloudflare Workers through `@astrojs/cloudflare`
- Cloudflare Agents plus Durable Objects
- Cloudflare Workflows
- D1, R2, Queues, Pipelines, AI, AI Search, and Vectorize bindings

The old Next.js and Convex implementation still exists under `app/`, `lib/`,
and `convex/` as the migration source. It is no longer the default served app.

## Why This Stack

GrowthRat is mostly public proof artifacts with a few interactive surfaces.
Astro ships the public pages as fast HTML by default. Svelte islands hydrate the
interactive panel/chat pieces only where needed.

Cloudflare fits the agent runtime because the same deployment can own the web
shell, stateful agent sessions, durable jobs, SQL state, object artifacts,
queues, event ingestion, secrets, model gateway, retrieval, and edge validation.

## Quick Start

```bash
bun install
bun run dev
```

Open `http://127.0.0.1:4321`.

Run checks:

```bash
bun run typecheck
bun run lint
bun run test
bun run build
bun run cf:check
```

`bun run cf:types` regenerates `worker-configuration.d.ts` after any
`wrangler.jsonc` binding change.

## Project Structure

```text
src/                    Active Astro, Svelte, and Workers runtime
  pages/                Public pages and API endpoints
  components/           Svelte islands
  content/              Public proof metadata
  lib/                  Cloudflare runtime helpers
  worker.ts             Custom Worker entry, Agent class, Workflow class

migrations/             D1 migrations and seed rows
wrangler.jsonc          Cloudflare binding source of truth
worker-configuration.d.ts
                        Generated Cloudflare runtime types

app/                    Legacy Next.js migration source
convex/                 Legacy Convex backend and data-model source
lib/                    Legacy shared modules and tests
docs/                   Product, ops, interview, and public proof docs
```

## Key URLs

| URL | Purpose |
| --- | --- |
| `/` | Application landing page |
| `/application` | Full application letter |
| `/proof-pack` | Proof-of-work artifacts |
| `/articles` | Published content portfolio |
| `/articles/revenuecat-for-agent-built-apps` | Flagship technical sample |
| `/readiness-review` | RevenueCat agent-builder readiness review |
| `/interview-truth` | Proven vs. requires activation |
| `/panel` | Live panel surface |
| `/dashboard` | Operator status |
| `/api/runtime` | Runtime and binding snapshot |
| `/api/proof` | Proof artifact index |

## Cloudflare Resource Model

| Need | Owner |
| --- | --- |
| Public app and SSR | Astro on Workers |
| Interactive UI | Svelte islands |
| Stateful agent sessions | Agents plus Durable Objects |
| Durable weekly runs | Workflows |
| Relational state | D1 |
| Large immutable artifacts | R2 |
| Async jobs | Queues |
| Event firehose | Pipelines |
| Model execution and gateway | Workers AI and AI Gateway |
| RevenueCat docs retrieval | AI Search or Vectorize |

## Platform References

- Cloudflare Astro guide:
  <https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/>
- Astro Cloudflare adapter:
  <https://docs.astro.build/en/guides/integrations-guide/cloudflare/>
- Astro islands:
  <https://docs.astro.build/en/concepts/islands/>
- Astro Svelte integration:
  <https://docs.astro.build/en/guides/integrations-guide/svelte/>
- Svelte docs:
  <https://svelte.dev/docs/svelte/overview>
- Cloudflare Agents:
  <https://developers.cloudflare.com/agents/>
- Cloudflare Workflows:
  <https://developers.cloudflare.com/workflows/>
- Cloudflare D1:
  <https://developers.cloudflare.com/d1/>
- Cloudflare Pipelines:
  <https://developers.cloudflare.com/pipelines/>
- RevenueCat API v2:
  <https://www.revenuecat.com/docs/api-v2>
