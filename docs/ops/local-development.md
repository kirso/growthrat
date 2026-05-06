# Local Development

This runbook is for the active pre-production Astro, Svelte, and Cloudflare
runtime.

## Current Runtime

The app currently runs on:

- Astro 6
- Svelte 5 interactive components
- Cloudflare Workers through `@astrojs/cloudflare`
- Cloudflare Agents plus Durable Objects
- Cloudflare Workflows
- D1 for relational operational state
- R2 for immutable proof artifacts
- Queues for async work
- Pipeline stream for event ingestion
- AI Gateway, Workers AI, and Vectorize bindings for the target model/retrieval
  layer
- D1 experiment operations for variants, tracking links, behavior events, metric
  snapshots, RevenueCat chart snapshots, and readouts

The Next.js and Convex runtime has been removed. This repo now has one runnable
application path.

## Prerequisites

- Bun 1.3+
- Wrangler 4.88+ from the project dev dependency
- Cloudflare account for remote resource creation
- Optional provider keys for activated surfaces:
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `REVENUECAT_API_KEY`
  - `REVENUECAT_PROJECT_ID`
  - `SLACK_BOT_TOKEN`
  - `TYPEFULLY_API_KEY`

## Bootstrap

```bash
bun install
bun run cf:types
WRANGLER_LOG_PATH=/tmp/wrangler.log wrangler d1 migrations apply growthrat --local
```

If you skip D1 initialization, the app still renders with fallback proof counts.

## Run Locally

```bash
bun run dev
```

Open `http://127.0.0.1:4321`.

## Smoke Checks

| Check | URL or command |
| --- | --- |
| Landing | `http://127.0.0.1:4321/` |
| Application letter | `http://127.0.0.1:4321/application` |
| Proof pack | `http://127.0.0.1:4321/proof-pack` |
| Articles | `http://127.0.0.1:4321/articles` |
| Readiness review | `http://127.0.0.1:4321/readiness-review` |
| Interview truth | `http://127.0.0.1:4321/interview-truth` |
| Dashboard | `http://127.0.0.1:4321/dashboard` |
| Experiments | `http://127.0.0.1:4321/experiments` |
| Panel | `http://127.0.0.1:4321/panel` |
| Runtime API | `curl http://127.0.0.1:4321/api/runtime` |
| Proof API | `curl http://127.0.0.1:4321/api/proof` |
| Activation API | `curl http://127.0.0.1:4321/api/activation` |
| Experiment API | `curl http://127.0.0.1:4321/api/experiments` |
| Tracking redirect | `http://127.0.0.1:4321/r/week-one-reference` |

## Experiment Operations

Use `/experiments` for the operator UI. Mutating actions require
`GROWTHRAT_INTERNAL_SECRET`.

The loop is:

1. create or select an experiment
2. use generated `/r/:trackingId` links in approved distribution
3. collect redirect clicks and tracked page views through `/api/events`
4. import manual channel metrics until social connectors are active
5. pull RevenueCat chart snapshots once `REVENUECAT_API_KEY` and
   `REVENUECAT_PROJECT_ID` are configured
6. file a readout before counting the experiment as complete

## Operating Modes

`APP_MODE` lives in `wrangler.jsonc` for local and deployed Workers.

| Mode | Meaning |
| --- | --- |
| `dormant` | Public proof only, no runtime side effects |
| `interview_proof` | Public proof, deterministic chat, panel-safe answers |
| `rc_live` | Full weekly operation after credentials and gates are verified |

Before `rc_live`, every write, model call, connector action, community action,
and publishing path must be fail-closed against:

- auth
- mode
- rate limit
- budget
- connector state
- approval policy
- kill switch

Do not treat a green build as proof of this. Trace the runtime path.

## Verification

```bash
bun run typecheck
bun run lint
bun run test
bun run build
bun run cf:check
```

## Tooling Boundary

- Use `wrangler` for Workers project work: types, dev, deploy, D1, R2,
  Workflows, Queues, Pipelines, Vectorize, and bindings.
- Use `cf` for broad Cloudflare account/API/context discovery when available.
