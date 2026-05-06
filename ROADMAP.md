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

## Current State: 2026-05-06

The active codebase now runs on:

- Astro 6 with Svelte 5 islands
- Cloudflare Workers through `@astrojs/cloudflare`
- Cloudflare Agents plus Durable Objects
- Cloudflare Workflows
- D1, R2, Queues, Pipeline stream, Workers AI, AI Gateway, and Vectorize
- a custom Worker entrypoint in `src/worker.ts`
- D1 migration and seed data in `migrations/0001_growthrat_core.sql`

The legacy Next.js and Convex app remains in the repo as migration source code,
not the default served runtime.

The current app has useful surfaces:

- public application
- proof pack
- article portfolio
- readiness review
- operator replay
- panel console
- operator dashboard
- onboarding and runtime controls
- deterministic Cloudflare API endpoints
- one Svelte chat island
- a Cloudflare Agent class and Workflow class

The current app is still pre-production. It is not yet safe to treat as a fully
autonomous public agent because side-effect and LLM paths still need production
Cloudflare resources, secrets, connector activation, and a complete auth, mode,
rate, budget, connector, kill-switch, and approval pass.

## Architecture Direction

The strategic target is:

- Astro with Svelte islands on Cloudflare Workers
- Cloudflare Agents plus Durable Objects for live agent sessions
- Cloudflare Workflows for long-running weekly loops, retries, and approvals
- D1 for relational operational state
- Durable Object SQLite for hot per-agent state and coordination
- R2 for immutable artifacts, source snapshots, proof receipts, and run bundles
- Queues for async jobs and backpressure
- Pipeline stream for Worker-side event ingestion
- Secrets Store for connector credentials once account quota allows a dedicated
  store, with Wrangler secrets as the current deploy path
- AI Gateway for model routing, policy, observability, and spend controls
- Vectorize for RevenueCat docs and artifact retrieval
- AI Search later if Cloudflare managed-resource provisioning succeeds
- Browser Rendering, Sandbox, or Containers for validation where needed

Convex is a legacy implementation and migration source. It is not the target
architecture or default local runtime.

## Why Astro And Svelte Islands

GrowthRat is mostly public content plus a few interactive tools. Astro gives the
public site fast HTML by default. Svelte islands keep chat, panel, dashboard, and
operator controls interactive without making the whole application a client-heavy
SPA.

This is a better fit than carrying a full Next.js application if the public site,
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

## Convex vs. D1 Decision

The final target should not be "D1 only." The target should be a Cloudflare data
split:

| Data need | Owner |
| --- | --- |
| Relational operational records | D1 |
| Live agent session and coordination state | Durable Objects |
| Large immutable artifacts and snapshots | R2 |
| High-volume event firehose | Pipeline stream now; R2 sink later |
| Retrieval index | Vectorize now; AI Search later if provisionable |

Convex should be kept only while its schema, workflows, and useful behavior are
being migrated.

## Current Rung

**Goal:** make the Cloudflare foundation real enough to replace the default
Next/Convex app shell.

Exit criteria:

- `bun run dev` serves Astro, not Next.
- `astro.config.mjs`, `svelte.config.js`, `wrangler.jsonc`, and generated
  Worker types exist.
- D1 migration maps the core operational tables.
- public routes still resolve.
- one Svelte island and read-only proof/runtime APIs exist.
- Wrangler dry-run recognizes the declared bindings.

Status: completed for the first migration slice on 2026-05-06.

## Next Gate

**Goal:** make the Cloudflare app safe enough to keep online while live
RevenueCat connectors are still unavailable.

Required checks:

- every public Worker endpoint and legacy Convex export is classified as read,
  write, side-effect, or LLM
- public write and LLM paths fail closed on auth and mode
- budget and rate gates run before provider calls
- connector loss cannot silently approve, publish, or report success
- approval policy is explicit and test-covered
- panel token behavior is fail-closed in production
- missing secrets and remote-only Cloudflare products are documented as
  pre-production warnings

Exit artifact:

- a short security and activation checklist linked from `SETUP.md` or this
  roadmap

## Work Package 1: Truth Surface Cleanup

Status: completed.

Scope:

- replace stale PRD and roadmap architecture assumptions
- update local development and setup docs
- delete superseded planning docs
- update knowledge-base and rendered public-copy claims about RevenueCat Charts
  and Metrics API

Out of scope:

- broad UI rewrite
- broad product redesign
- committing unrelated dirty worktree edits

## Work Package 2: Current Runtime Safety

Purpose: keep the active Cloudflare app and legacy migration source from
undermining the public application while live operation is still gated.

Tasks:

- inventory all public Worker endpoints and legacy Convex exports
- put LLM calls behind one enforced policy path
- require auth and mode checks for public write surfaces
- make Slack approval fail closed when Slack is unavailable
- prevent unauthenticated chat-history and usage-event writes
- add tests for dormant, interview proof, and rc live modes
- keep missing-secret and remote-binding warnings visible in setup docs

Do this before enabling `rc_live`.

## Work Package 3: Cloudflare Foundation

Purpose: prove the new stack in a small, reversible slice.

Status: completed for the foundation slice.

Completed slice:

- added Astro project structure
- added Svelte integration
- added Cloudflare adapter
- added `wrangler.jsonc`
- added D1 schema and first migration
- added bindings for D1, R2, Durable Objects, Queues, Workflows, Pipeline
  stream, Workers AI, AI Gateway, and Vectorize
- migrated public and operator URLs into Astro pages
- migrated one interactive Svelte island
- exposed read-only proof and runtime endpoints
- verified typecheck, lint, tests, build, and Wrangler dry-run

Exit criteria:

- remote Cloudflare resources are created
- D1 database ID is added to `wrangler.jsonc`
- remote D1 migrations are applied
- production secrets are set
- live connectors remain disabled until approval, rate, budget, and
  kill-switch gates are verified

## Work Package 4: Data Model Migration

Purpose: move from Convex tables to Cloudflare-native ownership.

Map current Convex data:

- artifacts -> D1 rows plus R2 bodies for large content
- sources -> D1 metadata plus R2 snapshots plus Vectorize index
- experiments -> D1
- feedback -> D1
- weekly reports -> D1 metadata plus R2 rendered report
- usage events -> Pipeline stream, with D1 summaries only if operationally needed
- chat sessions -> Durable Objects plus D1/R2 transcripts where required
- connector state -> D1 metadata plus Secrets Store references

Exit criteria:

- migration mapping exists for every current table
- no large artifact body is forced into D1 if R2 is the better owner
- every secret value is excluded from D1 and R2 exports

## Work Package 5: Agent Runtime Rebuild

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

- weekly planner can run in dry mode
- content draft can be produced with source receipts
- approval wait survives restart
- report bundle is written to R2
- operator can inspect run state without database edits

## Work Package 6: Public Proof And Application Readiness

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

## Deletions

The following docs are intentionally removed:

- `docs/plans/2026-03-06-revenuecat-agent-application-plan.md`
- `docs/plans/2026-03-07-revenuecat-agent-roadmap.md`
- `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md`
- `convex/README.md`

Reason:

- they describe old Render, Temporal, FastAPI, Inngest, or Convex-native plans
- they duplicate the PRD and roadmap
- keeping them creates false architecture authority

## Open Decisions

- Retry AI Search provisioning later or stay on Vectorize for retrieval?
- How much of the current Next UI should be migrated versus redesigned?
- Which public proof pages need permanent URLs before submission?
- Which current Convex data should be exported before migration?
- What exact approval policy should apply to post-hire CMS and social posts?

## Non-Negotiables

- Do not expose unauthenticated side effects.
- Do not let missing Slack or connector config auto-approve work.
- Do not claim production autonomy until provider calls, approval paths, and
  write paths are fail-closed.
- Do not preserve old docs just because they are detailed.
- Do not migrate broad surfaces before the first Cloudflare slice proves the
  binding model.
