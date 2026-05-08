# GrowthRat

GrowthRat is an autonomous developer-advocacy and growth agent applying to be
RevenueCat's first Agentic AI and Growth Advocate.

The product goal is not a generic agent platform. GrowthRat must prove, in
public, that it can understand RevenueCat, publish useful technical and growth
artifacts, run measurable experiments, turn usage into product feedback, and
operate with bounded autonomy.

## Current Status

This repository is a gated production-capable proof system. It is still not a
RevenueCat-owned live advocate until a RevenueCat representative signs in,
connects the required accounts, and approves live operation.

The active app shell is now:

- Astro 6
- Svelte 5 interactive components
- Cloudflare Workers through `@astrojs/cloudflare`
- Cloudflare Agents plus Durable Objects
- Cloudflare Workflows
- D1, R2, Queues, Pipeline stream, Workers AI, AI Gateway, and Vectorize
- experiment operations for variants, tracking links, behavioral events, metric
  snapshots, RevenueCat chart pulls, and readouts
- scored opportunity planning, approval requests, a D1 run ledger, and Slack
  report formatting for the weekly advocate loop
- client/operator surfaces for runtime state, Slack approvals, weekly reports,
  community signals, product feedback, and take-home task execution
- RevenueCat docs ingestion into Vectorize and source-grounded chat
- optional Langfuse trace mirroring with D1 remaining the source of truth
- rate, budget, and kill-switch policy gates for chat/model/event paths

The old Next.js and Convex implementation has been removed from the runnable
repo. Historical behavior now lives in docs and migration notes only; the code
has one runtime path.

## Why This Stack

GrowthRat is mostly public proof artifacts with a few interactive surfaces.
Astro keeps the public pages fast by default, while Svelte powers only the
operator controls, chat, and panel surfaces that need client-side interaction.

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
  components/           Interactive Svelte components
  content/              Public proof metadata
  lib/                  Cloudflare runtime helpers
  worker.ts             Custom Worker entry, Agent class, Workflow class

migrations/             D1 migrations and seed rows
wrangler.jsonc          Cloudflare binding source of truth
worker-configuration.d.ts
                        Generated Cloudflare runtime types

docs/                   Product, ops, interview, and public proof docs
```

## Key URLs

| URL | Purpose |
| --- | --- |
| `/` | Application landing page |
| `/application` | Full application letter |
| `/application-letter` | Stable alias for the full application letter |
| `/proof-pack` | Proof-of-work artifacts |
| `/articles` | Published content portfolio |
| `/articles/revenuecat-for-agent-built-apps` | Flagship technical sample |
| `/articles/revenuecat-agent-monetization-benchmark` | Agent monetization benchmark |
| `/readiness-review` | RevenueCat agent-builder readiness review |
| `/feedback` | Structured product feedback queue |
| `/report` | Weekly async report and delivery receipts |
| `/interview-truth` | Proven vs. requires activation |
| `/panel` | Live panel surface |
| `/dashboard` | Operator status, run ledger, approvals, and connectors |
| `/slack` | Slack command, approval, and report-delivery operating loop |
| `/community` | Community signal and reply-draft queue |
| `/take-home` | Authenticated take-home task execution surface |
| `/go-live` | Activation checklist surface |
| `/pipeline` | Weekly loop surface |
| `/opportunities` | Authenticated scored opportunity backlog surface |
| `/experiments` | Experiment operating surface |
| `/api/runtime` | Runtime and binding snapshot |
| `/api/proof` | Proof artifact index |
| `/api/activation` | Resource, platform secret, connected-account, and gate snapshot |
| `/api/auth/register` | RC representative session start after activation code |
| `/api/auth/session` | RC representative session check |
| `/api/agent-config` | Authenticated mode, review, focus topic, and budget policy config |
| `/api/accounts/revenuecat/connectors` | Authenticated RC connected-account registry |
| `/api/ops/status` | Authenticated operator snapshot for runs, approvals, reports, and connectors |
| `/api/policy` | Runtime policy and protected kill-switch/model toggle updates |
| `/api/opportunities` | Authenticated opportunity backlog list/rescore endpoint |
| `/api/runs` | Authenticated D1 run-ledger list/detail endpoint |
| `/api/sources` | Source/retrieval index status |
| `/api/sources/ingest` | Protected seed or RevenueCat docs batch ingestion into Vectorize |
| `/api/experiments` | Experiment register and authenticated create endpoint |
| `/api/experiments/:id/metrics` | Authenticated manual metric import |
| `/api/experiments/:id/revenuecat` | Authenticated RevenueCat chart snapshot |
| `/api/experiments/:id/readout-preview` | Public non-mutating readout suggestion from current events and metrics |
| `/api/experiments/:id/readout` | Authenticated experiment readout creation |
| `/api/experiments/:id/auto-readout` | Authenticated deterministic readout from captured events and metrics |
| `/api/connectors/postiz` | Authenticated Postiz social connector health and draft/schedule endpoint |
| `/api/connectors/postiz/upload-from-url` | Authenticated Postiz media upload by public asset URL |
| `/api/slack/events` | Slack event/mention/reaction receiver with signature verification |
| `/api/community/scan` | Authenticated GitHub community-signal scanner and reply drafter |
| `/api/tasks/execute` | Authenticated take-home style task decomposition/execution |
| `/api/events` | Public behavior event capture |
| `/api/workflows/weekly-dry-run` | Protected manual weekly Workflow dry run |
| `/api/workflows/weekly-run` | Protected full advocate-loop run |
| `/r/:trackingId` | Tracking redirect with experiment event logging |

## Cloudflare Resource Model

| Need | Owner |
| --- | --- |
| Public app and SSR | Astro on Workers |
| Interactive UI | Svelte components |
| Stateful agent sessions | Agents plus Durable Objects |
| Durable weekly runs | Workflows |
| Relational state | D1 |
| Large immutable artifacts | R2 |
| Async jobs | Queues |
| Event firehose | Pipeline stream |
| Model execution and gateway | Workers AI and AI Gateway |
| RevenueCat docs retrieval | Vectorize now; AI Search later if account provisioning succeeds |
| Growth experiment measurement | D1 experiment tables plus Pipeline event stream |
| Agent observability mirror | Optional Langfuse traces; D1 run ledger is canonical |
| Runtime safety | Rate Limit bindings plus D1 policy counters and runtime flags |

The activation gate lives in
[docs/ops/cloudflare-activation-checklist.md](docs/ops/cloudflare-activation-checklist.md).
The migration recovery matrix lives in
[docs/ops/migration-verification.md](docs/ops/migration-verification.md).

## RevenueCat Docs Grounding

The production retrieval path uses RevenueCat's public `llms.txt` docs index as
the source inventory. The ingester stores full Markdown mirrors when RevenueCat
serves them and writes an index-only placeholder for listed paths whose Markdown
mirror is unavailable, so the system represents every indexed docs entry without
inventing missing page content.

Current production state from the 2026-05-08 refresh:

- 339 RevenueCat docs source rows represented
- 1,979 RevenueCat docs chunks indexed
- 347 total sources and 1,987 indexed chunks including GrowthRat proof and role
  sources
- bundled GrowthRat proof corpus freshness reports `fresh`

## Experiment Loop

GrowthRat now has a pre-production experiment operating system:

1. create an experiment with a hypothesis, audience, channel, decision rule, and
   variants
2. generate tracking links under `/r/:trackingId`
3. record behavior through redirect clicks, tracked page views, and manual events
4. import external metrics manually when connectors are unavailable
5. pull RevenueCat chart snapshots when the RevenueCat account is connected
   by an RC representative
6. preview a readout without mutating state so reviewers can see the current
   decision logic before sign-in
7. generate or file a readout with decision, learning, next action, and metric
   summary

This is enough to prove the weekly growth-experiment discipline before
RevenueCat signs in and connects Slack, CMS, GitHub, Postiz social, keyword,
community monitoring, and private Charts access through the connected-account
flow. The actual external traffic experiment is intentionally last: it should
run only after the proof/product surfaces, approval loop, and measurement state
are correct.

## Runtime Safety

All public chat/model paths now pass through one policy layer:

1. edge rate-limit binding
2. D1 daily counter
3. runtime kill switch
4. model-chat toggle
5. AI Gateway metadata/logging

Protected UI mutations use a signed RC representative session. The same
`GROWTHRAT_INTERNAL_SECRET` remains as the initial activation code and CLI/API
fallback. Live connector credentials are RC-provided connected accounts
encrypted with `GROWTHRAT_CONNECTOR_ENCRYPTION_KEY`, not production deployment
env vars. The policy endpoint can toggle `kill_switch` and
`model_chat_enabled` without redeploying.

## Platform References

- Cloudflare Astro guide:
  <https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/>
- Astro Cloudflare adapter:
  <https://docs.astro.build/en/guides/integrations-guide/cloudflare/>
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
- Postiz Public API:
  <https://docs.postiz.com/public-api>
- RevenueCat API v2:
  <https://www.revenuecat.com/docs/api-v2>
- Langfuse Public API:
  <https://langfuse.com/docs/api-and-data-platform/features/public-api/>
