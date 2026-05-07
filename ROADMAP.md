# GrowthRat Roadmap

This roadmap is the current execution plan for GrowthRat. Product requirements
live in [the PRD](docs/product/2026-03-13-growthrat-prd.md).

## North Star

GrowthRat should become the public proof that an autonomous agent can do real
Developer Advocacy and Growth work for RevenueCat:

- publish useful technical and growth content
- run measured growth experiments
- answer community questions well
- submit structured product feedback
- report weekly activity and learnings
- operate with bounded autonomy and visible audit trails

The roadmap favors public proof, safety, and platform simplicity over preserving
old implementation choices.

## Current State: 2026-05-07

The repo now has one runnable runtime:

- Astro 6 with focused Svelte 5 interactive components
- Cloudflare Workers through `@astrojs/cloudflare`
- Cloudflare Agents plus Durable Objects
- Cloudflare Workflows
- D1, R2, Queues, Pipeline stream, Workers AI, AI Gateway, and Vectorize
- custom Worker entrypoint in `src/worker.ts`
- D1 migrations and seed data in `migrations/0001_growthrat_core.sql` and
  `migrations/0002_experiment_operations.sql`
- agent runtime safety schema in `migrations/0003_agent_runtime_safety.sql`

The old Next.js and Convex runtime has been deleted. Historical behavior lives
only in the PRD, roadmap, public artifacts, and migration notes.

The current app has useful surfaces:

- public application
- proof pack
- article portfolio
- readiness review
- interview truth page
- operator replay
- panel console
- operator dashboard
- experiment operating surface
- go-live and pipeline surfaces
- deterministic Cloudflare API endpoints
- Svelte chat and runtime-status components
- source ingestion and source-grounded chat endpoints
- policy endpoint for kill switch and model-chat toggles
- Cloudflare Agent and Workflow classes
- protected manual weekly dry-run endpoint
- experiment APIs for create, metric import, RevenueCat chart snapshot, readout,
  public event capture, and tracking redirects

The current app is a gated production-capable proof system. It is not yet a
RevenueCat-owned live advocate because RevenueCat access, Slack/CMS/GitHub/social
credentials, and connector-specific approval rules are still post-hire
dependencies.

## Cloudflare Resource State

Verified in the Cloudflare account on 2026-05-06 and updated locally on
2026-05-07:

- D1 `growthrat` is provisioned and seeded.
- R2 `growthrat-artifacts` is provisioned.
- Queue `growthrat-jobs` is provisioned.
- Vectorize `growthrat-doc-index-bge-base` is provisioned with the 768-dimensional `@cf/baai/bge-base-en-v1.5` preset.
- Pipeline stream `growthrat_events` is provisioned.
- AI Gateway `growthrat` is provisioned.
- RevenueCat docs grounding is backed by the official `llms.txt` index, full
  Markdown mirrors where available, D1 chunk receipts, R2 source snapshots, and
  Vectorize embeddings.
- Workers AI calls now route through the `growthrat` AI Gateway from the chat
  and weekly-draft paths.
- Rate-limit bindings are declared for chat, model calls, and public event
  writes.
- AI Search provisioning failed, so Vectorize is the active retrieval path.
- A dedicated Secrets Store is blocked by account store quota; Wrangler secrets
  are the current production path.
- The `growthrat` Worker and `growthrat-weekly-loop` Workflow are deployed on
  workers.dev.

## Why Astro And Svelte

GrowthRat is mostly public content plus a few interactive tools. Astro gives the
public site fast HTML by default. Svelte powers chat, panel, dashboard, and
operator controls without making the whole application a client-heavy SPA.

This is a better fit than carrying a full app framework when the public site,
proof artifacts, and articles are the center of gravity.

## Why Cloudflare Native

Cloudflare fits this project because the product needs a small number of runtime
primitives that all live on one platform:

- edge web app
- stateful agent sessions
- durable multi-step jobs
- SQL state
- object artifacts
- async work queues
- event firehose
- secrets
- model gateway
- retrieval
- browser or sandbox validation

That reduces the number of hosts, webhook bridges, internal shared secrets, and
operational seams a solo operator has to maintain.

## Data Ownership

| Data need | Owner |
| --- | --- |
| Relational operational records | D1 |
| Live agent session and coordination state | Durable Objects |
| Large immutable artifacts and snapshots | R2 |
| High-volume event firehose | Pipeline stream now; R2 sink later |
| Retrieval index | Vectorize now; AI Search later if provisionable |
| Long-running weekly cadence | Workflows |
| Bursty async jobs | Queues |

## Current Rung

**Goal:** make the Cloudflare app safe enough to keep online while live
RevenueCat connectors are still unavailable.

Completed:

- `bun run dev` serves Astro.
- old runnable Next/Convex code has been removed.
- D1 migration maps the core operational tables.
- remote D1 is migrated and seeded.
- production Worker is deployed at `https://growthrat.kirso.workers.dev`.
- `growthrat-weekly-loop` is deployed with the Worker.
- public routes resolve.
- Svelte chat and runtime-status components exist.
- read-only proof/runtime/activation APIs exist.
- experiment register, tracking redirects, event capture, manual metric import,
  RevenueCat chart snapshots, and readouts exist.
- protected manual weekly dry-run API exists.
- source ingest API exists at `/api/sources/ingest` for the seed corpus and
  RevenueCat docs batches from the public `llms.txt` index.
- production retrieval uses D1, R2, and Vectorize for RevenueCat docs chunks,
  with index-only fallbacks for listed docs whose Markdown mirror is
  unavailable.
- production retrieval now represents 333 RevenueCat docs index entries: 314
  full Markdown mirrors and 19 explicit index-only fallbacks.
- chat retrieves indexed sources, cites them, and uses Workers AI through AI
  Gateway behind policy gates.
- model calls have edge rate limits, D1 daily budget counters, and kill-switch
  controls.
- public event writes have edge rate limits and D1 daily budget counters.
- Wrangler dry-run recognizes the declared bindings.
- protected weekly dry run created a D1 workflow row and wrote an R2 proof bundle.
- a tracking redirect, manual metric import, and draft experiment readout were
  smoke-tested in production.

Remaining:

- configure production secrets for RevenueCat, Slack, CMS, GitHub, and Typefully
  before calling connector paths live
- configure a custom domain if `growthrat.com` should be the public URL
- configure Pipeline R2 sink if we want event lake persistence
- activate RevenueCat, Slack, CMS, GitHub, and social connectors after hire

## Next Gate

**Goal:** move from interview proof to live RevenueCat operation.

Required checks:

- public write and LLM paths fail closed on policy, budget, and rate checks
- budget and rate gates run before provider calls
- connector loss cannot silently approve, publish, or report success
- approval policy is explicit and test-covered
- panel token behavior is fail-closed in production
- missing secrets and remote-only Cloudflare products are documented as
  pre-production warnings
- protected dry run writes a weekly plan to R2 and a workflow row to D1
- protected dry run writes a source-grounded draft or a clear source/model gate
  reason to R2
- an experiment can be created, measured, and closed without direct database
  edits

Exit artifact:

- complete [Cloudflare activation checklist](docs/ops/cloudflare-activation-checklist.md)

## Work Package 1: Truth Surface Cleanup

Status: completed.

Scope:

- replace stale architecture assumptions
- update local development and setup docs
- delete superseded runnable code paths
- remove stale references to deleted implementation files
- update public-copy claims to separate live proof from activation targets

## Work Package 2: Runtime Safety

Purpose: keep the active Cloudflare app from overclaiming autonomy while live
operation is still gated.

Tasks:

- keep `/api/activation` truthful
- keep `/api/workflows/weekly-dry-run` protected and fail-closed
- put LLM calls behind one enforced policy path
- require policy checks for public write surfaces
- make Slack approval fail closed when Slack is unavailable
- add tests for dormant, interview proof, and rc live modes
- keep missing-secret and remote-binding warnings visible in setup docs

Status: core runtime path implemented. Connector-specific approval remains before
`rc_live`.

## Work Package 3: Agent Runtime

Purpose: rebuild the actual autonomy loop on the target platform.

Target flow:

1. Agent receives prompt, cron tick, Slack command, or workflow callback.
2. Agent reads current state from Durable Object and D1.
3. Agent retrieves sources from Vectorize.
4. Agent calls models through AI Gateway.
5. Agent writes artifacts to R2 and metadata to D1.
6. Workflows manage waits, retries, approvals, and weekly cadence.
7. Queues handle slow or bursty jobs.
8. Pipeline streams capture analytics events for later analysis.

Exit criteria:

- weekly planner runs in dry mode
- experiment variants and tracking links are created by the weekly plan
- content draft can be produced with source receipts or a clear source/model gate
  reason
- approval wait survives restart
- report bundle is written to R2
- operator can inspect run state without database edits

## Work Package 4: Public Proof And Application Readiness

Purpose: keep the application package credible while architecture changes.

Tasks:

- keep public letter current
- keep proof pack links stable
- update claims when RevenueCat or Cloudflare docs change
- maintain interview truth page with proven vs. not-yet-activated status
- make panel demo deterministic enough for a live interview
- document exact application submission URL and field answers

Exit criteria:

- public site can be reviewed without local context
- no stale "this does not exist" product claim remains
- panel interview can be run from a clean browser session
- operator can explain current vs. target architecture in under two minutes

## Open Decisions

- Retry AI Search provisioning later or stay on Vectorize for retrieval?
- Configure a Pipeline R2 sink now or wait until event volume exists?
- Which public proof pages need permanent URLs before submission?
- What exact approval policy should apply to post-hire CMS and social posts?

## Non-Negotiables

- Do not expose unauthenticated side effects.
- Do not let missing Slack or connector config auto-approve work.
- Do not claim production autonomy until provider calls, approval paths, and
  write paths are fail-closed.
- Do not preserve old runtime code just because it was detailed.
- Do not switch to `rc_live` before the activation checklist passes.
