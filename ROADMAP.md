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

The current codebase runs on:

- Next.js 16 App Router
- React 19
- Convex database, actions, workflows, crons, and generated API types
- Vercel AI SDK
- Tailwind CSS v4

The current app has useful surfaces:

- public application
- proof pack
- article portfolio
- readiness review
- operator replay
- panel console
- operator dashboard
- onboarding and runtime controls
- Convex workflow and agent code

The current app is still pre-production. It is not yet safe to treat as a fully
autonomous public agent because side-effect and LLM paths still need a complete
auth, mode, rate, budget, connector, and approval pass.

## Architecture Direction

The strategic target is:

- Astro with Svelte islands on Cloudflare Workers
- Cloudflare Agents plus Durable Objects for live agent sessions
- Cloudflare Workflows for long-running weekly loops, retries, and approvals
- D1 for relational operational state
- Durable Object SQLite for hot per-agent state and coordination
- R2 for immutable artifacts, source snapshots, proof receipts, and run bundles
- Queues for async jobs and backpressure
- Pipelines for event ingestion and analytics delivery to R2
- Secrets Store for connector credentials
- AI Gateway for model routing, policy, observability, and spend controls
- AI Search or Vectorize for RevenueCat docs and artifact retrieval
- Browser Rendering, Sandbox, or Containers for validation where needed

Convex is the current implementation and migration source. It is not the target
architecture.

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
| High-volume event firehose | Pipelines to R2 |
| Retrieval index | AI Search or Vectorize |

Convex should be kept only while the current application is running or while its
schema and data are being migrated.

## Current Rung

**Goal:** make repo truth match the product decision.

Exit criteria:

- PRD no longer encodes Convex as the product requirement.
- ROADMAP reflects Astro, Svelte islands, and Cloudflare-native target.
- README and setup docs distinguish current runtime from target runtime.
- obsolete Render, Temporal, FastAPI, Inngest, and old Convex-native planning
  docs are removed.
- stale "Charts has no REST API" claims are removed from docs and public copy.
- public artifacts remain in place as proof, not planning docs.

## Next Gate

**Goal:** make the current app safe enough to keep online while the Cloudflare
migration starts.

Required checks:

- every public Convex action and mutation is classified as read, write,
  side-effect, or LLM
- public write and LLM paths fail closed on auth and mode
- budget and rate gates run before provider calls
- connector loss cannot silently approve, publish, or report success
- approval policy is explicit and test-covered
- panel token behavior is fail-closed in production
- lint command is replaced with a valid ESLint command

Exit artifact:

- a short security and activation checklist linked from `SETUP.md` or this
  roadmap

## Work Package 1: Truth Surface Cleanup

Status: in progress.

Scope:

- replace stale PRD and roadmap architecture assumptions
- update local development and setup docs
- delete superseded planning docs
- update knowledge-base and rendered public-copy claims about RevenueCat Charts
  and Metrics API

Out of scope:

- broad UI rewrite
- platform migration implementation
- committing unrelated dirty worktree edits

## Work Package 2: Current Runtime Safety

Purpose: keep the current Next plus Convex app from undermining the public
application while migration work begins.

Tasks:

- inventory all public Convex exports
- put LLM calls behind one enforced policy path
- require auth and mode checks for public write surfaces
- make Slack approval fail closed when Slack is unavailable
- prevent unauthenticated chat-history and usage-event writes
- add tests for dormant, interview proof, and rc live modes
- update `package.json` lint script

Do this before enabling `rc_live`.

## Work Package 3: Cloudflare Foundation

Purpose: prove the new stack in a small, reversible slice.

First slice:

- add Astro project structure
- add Svelte integration
- add Cloudflare adapter
- add `wrangler.jsonc`
- add D1 schema and first migration
- add bindings for D1, R2, one Durable Object, one Queue, and one Workflow
- migrate one public page
- migrate one interactive Svelte island
- expose one read-only proof endpoint
- verify local dev and deploy commands

Exit criteria:

- the slice builds locally
- the slice runs with Wrangler
- the page renders without requiring Convex
- the endpoint reads from D1 or static seed data
- no existing public proof URL is broken

## Work Package 4: Data Model Migration

Purpose: move from Convex tables to Cloudflare-native ownership.

Map current Convex data:

- artifacts -> D1 rows plus R2 bodies for large content
- sources -> D1 metadata plus R2 snapshots plus AI Search or Vectorize index
- experiments -> D1
- feedback -> D1
- weekly reports -> D1 metadata plus R2 rendered report
- usage events -> Pipelines to R2, with D1 summaries only if operationally needed
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
3. Agent retrieves sources from AI Search or Vectorize.
4. Agent calls models through AI Gateway.
5. Agent writes artifacts to R2 and metadata to D1.
6. Workflows manage waits, retries, approvals, and weekly cadence.
7. Queues handle slow or bursty jobs.
8. Pipelines capture analytics events for later analysis.

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

- Use AI Search first or Vectorize first for RevenueCat docs retrieval?
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
