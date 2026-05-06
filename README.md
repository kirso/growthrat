# GrowthRat

GrowthRat is an autonomous developer-advocacy and growth agent applying to be
RevenueCat's first Agentic AI and Growth Advocate.

The product goal is not a generic agent platform. GrowthRat must prove, in
public, that it can understand RevenueCat, publish useful technical and growth
artifacts, run measurable experiments, turn usage into product feedback, and
operate with bounded autonomy.

## Current Status

This repository is pre-production.

There are two important layers:

- **Current implementation:** Next.js 16, React 19, Convex, Vercel AI SDK, and
  Tailwind. This is the running application today.
- **Target architecture:** Astro with Svelte islands on Cloudflare Workers,
  backed by Cloudflare Agents, Durable Objects, Workflows, D1, R2, Queues,
  Pipelines, Secrets Store, AI Gateway, and AI Search or Vectorize.

Convex is still the current runtime and migration source. It is no longer the
long-term architecture assumption.

## Why The Target Moved

The application is content-heavy with a few highly interactive surfaces:

- public application letter
- proof pack and articles
- interview chat and panel console
- operator workflows
- weekly reports and feedback artifacts

Astro fits the public site because most pages should ship as fast HTML, while
Svelte islands handle the interactive pieces. Cloudflare fits the agent runtime
because the same platform can host the web app, stateful agents, durable runs,
SQL state, object artifacts, queues, observability, and edge-executed validation
without adding a separate application host.

## Canonical Docs

- [PRD](./docs/product/2026-03-13-growthrat-prd.md) - product requirements and
  role coverage
- [Roadmap](./ROADMAP.md) - current execution plan and architecture direction
- [Setup](./SETUP.md) - current local setup plus Cloudflare migration notes
- [Local development](./docs/ops/local-development.md) - operational runbook
- [Role brief](./docs/context/2026-03-06-revenuecat-role-brief.md) - original
  RevenueCat job requirement source
- [Interview prep](./docs/interviews/) - panel, take-home, founder, and
  knowledge-base material
- [Public artifacts](./docs/public/) - application letter, content samples,
  feedback, reports, and proof material

Superseded Render, Temporal, FastAPI, and old Convex-native planning documents
have been removed so the repo has one product doc and one roadmap.

## Quick Start

Current implementation:

```bash
bun install
cp .env.example .env.local
bunx convex dev
bun run dev
```

Open `http://localhost:3000`.

Run checks:

```bash
bun run typecheck
bun run test
bun run build
```

`bun run lint` runs ESLint directly. Next.js no longer provides the old
`next lint` command in this app.

## Project Structure

```text
app/                    Current Next.js App Router application
  (public)/             Application, proof pack, articles, onboarding, reviews
  (operator)/           Dashboard, panel, pipeline, reports, controls
  api/                  Chat, panel SSE, proof runs, runtime, onboarding

convex/                 Current Convex backend and migration source
  schema.ts             Current data model
  agent.ts              GrowthRat agent configuration
  workflows/            Current durable workflow implementation
  crons.ts              Scheduled jobs
  actions.ts            External API and LLM calls
  mutations.ts          Current DB writes and workflow starters

lib/                    Shared current-runtime modules
  ai/runtime.ts         LLM runtime chokepoint
  connectors/           Current connector clients
  cms/publish.ts        Article publishing helper

docs/                   Product, ops, interview, and public proof docs
```

## Operating Modes

The current Convex runtime has three modes in `agentConfig`:

| Mode | Chat/Panel | Crons and Workflows | Use case |
| --- | --- | --- | --- |
| `dormant` | Off | Off | Idle, zero token burn |
| `interview_proof` | On | Off | Interview and public proof |
| `rc_live` | On | On | Full post-hire operation |

Before production, public write surfaces and LLM actions must be fail-closed
against auth, mode, rate, budget, and connector state.

## Key URLs

| URL | Purpose |
| --- | --- |
| `/` | Application landing page |
| `/application` | Full application letter |
| `/proof-pack` | Proof-of-work artifacts |
| `/articles` | Published content portfolio |
| `/interview-truth` | Proven vs. requires activation |
| `/panel` | Live panel console |
| `/dashboard` | Operator status |
| `/onboarding` | Connector setup |
| `/go-live` | Capability map and preflight checks |

## Platform References

- Cloudflare Astro guide:
  <https://developers.cloudflare.com/workers/frameworks/framework-guides/astro/>
- Astro islands:
  <https://docs.astro.build/en/concepts/islands/>
- Astro Svelte integration:
  <https://docs.astro.build/en/guides/integrations-guide/svelte/>
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
