# PRD: GrowthRat

## Metadata

- Status: active
- Updated: 2026-05-07
- Owner: kirso
- Original date: 2026-03-13

## Summary

GrowthRat is an autonomous developer-advocacy and growth agent built to apply
for, and perform, RevenueCat's Agentic AI and Growth Advocate contract role.

The system must win a public hiring process through visible proof of work, then
operate as a constrained, inspectable weekly advocacy and growth system with
minimal human intervention.

## Source Requirement

The source role brief is
`docs/context/2026-03-06-revenuecat-role-brief.md`.

RevenueCat is hiring an autonomous or semi-autonomous AI agent that can:

- publish technical and growth content
- run growth experiments
- engage with agent developer and growth communities
- submit structured product feedback
- report weekly metrics and learnings
- operate with a high degree of autonomy

The application must be authored and published by the agent on its own behalf.

## Problem

A weak application fails because it is only a letter, produces generic content,
requires constant human steering, or cannot prove safe judgment.

GrowthRat must prove:

- RevenueCat API and product understanding
- technical content quality
- growth strategy quality
- autonomous execution
- measured experiments
- useful product feedback
- clear process articulation
- safe operating boundaries

## Hiring Stages

### Stage 1: Application

Required:

- public application letter at a stable URL
- public proof pack
- technical and growth artifacts
- evidence that GrowthRat can interact with APIs and produce content
- submitted public URL through RevenueCat's careers page

GrowthRat adds:

- live chat and panel surfaces
- source-grounded chat through Vectorize and AI Gateway
- operator replay
- readiness review
- weekly-report sample
- product-feedback artifacts

### Stage 2: Take-Home

GrowthRat must complete a technical content and growth strategy task within 48
hours, autonomously enough that the output proves the role rather than merely
answers the prompt.

### Stage 3: Panel Interview

GrowthRat must answer live prompts while the operator shares the screen. The
panel should see retrieval, reasoning, uncertainty, and output quality in real
time.

### Stage 4: Founder Interview

The operator must explain business value, autonomy boundaries, safety model,
role-extension criteria, and why GrowthRat will be useful without becoming an
ops burden.

## Goals

- Publish a stronger-than-letter application package.
- Demonstrate the first week of the actual role in public.
- Build a weekly operating loop for content, growth, community, feedback, and
  reporting.
- Show autonomy with evidence, quality gates, and safety controls.
- Keep the product small enough for a solo operator to understand and run.

## Non-Goals

- Building a general-purpose agent platform.
- Building a broad multi-tenant SaaS.
- Replacing GitHub, Slack, RevenueCat, or a CMS with custom clones.
- Running paid media.
- Automating social spam.
- Shipping broad integrations before public proof is credible.

## Users

Primary external users:

- RevenueCat hiring council
- RevenueCat interview panel
- RevenueCat founder
- public developers and growth operators reading GrowthRat artifacts

Primary internal users:

- GrowthRat operator
- future RevenueCat teammate who connects Slack, CMS, Charts, GitHub, or other
  assets

## Product Scope

### P0: Application Proof

- public application letter
- proof pack
- article and feedback surfaces
- readiness review
- interview truth page
- panel console
- chat widget
- operator dashboard
- local setup and verification docs

### P1: Safe Operating Loop

- weekly planner
- content generation and review
- growth experiment brief and readout
- community-answer queue
- product-feedback queue
- weekly async report
- connector health and mode controls
- audit trail for side effects

Current implementation status:

- experiment register, variants, tracking assets, behavior events, metric
  snapshots, RevenueCat chart snapshot endpoint, and readouts are wired in D1
- `/experiments` provides the operator surface for creating experiments,
  importing metrics, recording events, pulling RevenueCat charts, and filing
  readouts
- `/r/:trackingId` records experiment clicks and redirects to the tracked asset
- `/api/events` records public experiment events, including tracked page views
- weekly Workflow now ensures a weekly experiment exists and writes tracking
  links into the proof bundle
- source ingestion writes RevenueCat/GrowthRat source chunks into D1 and
  Vectorize
- chat and weekly draft generation retrieve sources, cite them, and call Workers
  AI through AI Gateway behind policy gates
- rate-limit bindings, D1 budget counters, model-chat toggle, and kill switch
  protect public chat/model/event paths

### P2: RevenueCat-Connected Operation

- Slack-first interaction model
- CMS publishing path
- RevenueCat Charts and Metrics API access
- GitHub collaboration
- X or social distribution through approved tooling
- product roadmap input document from repeated feedback patterns

## Weekly Responsibilities

| Cadence | Responsibility | Target |
| --- | --- | --- |
| Weekly | Published content pieces | 2+ |
| Weekly | Growth experiments | 1+ |
| Weekly | Meaningful community interactions | 50+ |
| Weekly | Structured product feedback items | 3+ |
| Weekly | Async check-in report | 1 |

A community interaction counts only if it answers a real question or advances a
discussion, adds new value, is technically correct, is on-topic, and is not a
low-effort promotional reply.

## First Month Requirements

- Ingest RevenueCat documentation, SDKs, and APIs.
- Publish 10 original technical or growth-focused pieces.
- Set up Slack, CMS, and Charts/Metrics API access.
- Complete one product feedback cycle.
- Establish public identity on X and GitHub with RevenueCat affiliation.

## Three Month Requirements

- Publish 30+ pieces that other agent developers and growth operators reference.
- Become a go-to public answer source for using RevenueCat as an agent.
- Deliver a substantive roadmap input document based on observed patterns.
- Collaborate with human Developer Advocacy and Growth teammates on at least two
  joint initiatives.

## Six Month Requirements

- Show measurable RevenueCat visibility impact in agent developer and growth
  ecosystems.
- Own a content stream end to end.
- Contribute to at least one shipped product improvement that originated from
  GrowthRat feedback.
- Recommend whether the role should be extended, expanded, or changed.

## Integration Requirements

- **Slack-first interaction:** RevenueCat should be able to talk to GrowthRat in
  a dedicated Slack channel for status, requests, approvals, reports, and
  questions.
- **CMS publishing:** GrowthRat should generate content in a reviewable format
  and publish through the approved CMS path after approval.
- **Charts and Metrics API:** GrowthRat should use RevenueCat's programmatic
  metrics endpoints where available, not stale assumptions about dashboard-only
  access.
- **GitHub:** GrowthRat should be able to publish samples, file docs PRs, and
  produce public artifacts under its own identity.
- **Public identity:** GrowthRat should operate with clear RevenueCat
  affiliation if hired and clear independent-applicant disclosure before hire.

## Architecture Principles

Product requirements are platform independent. The old PRD incorrectly made
Convex the architecture requirement. That is no longer true.

Current repo state:

- Astro with focused Svelte interaction on Cloudflare Workers
- Cloudflare Agents and Durable Objects for stateful agent sessions
- Cloudflare Workflows for durable long-running runs
- D1 for relational operational state
- Durable Object SQLite for hot per-agent state
- R2 for immutable proof artifacts and snapshots
- Queues for async work
- Pipeline stream for event ingestion
- Rate Limit bindings for chat, model calls, and public event writes
- Secrets Store for connector credentials once account quota allows a dedicated
  store
- AI Gateway for model routing, controls, logs, and spend management
- Vectorize for RevenueCat docs and artifact retrieval
- AI Search later if Cloudflare managed-resource provisioning succeeds
- Browser Rendering, Sandbox, or Containers only when validation requires them

The old Next.js and Convex implementation has been removed from the runnable
codebase. The product and data lessons remain in this PRD, public artifacts,
and Cloudflare migration docs.

## Convex vs. D1 Decision

The decision is not "Convex or D1" in isolation.

For the Cloudflare target, D1 should own relational operational state:

- artifacts
- runs
- approvals
- connector state
- experiments
- feedback
- community interactions
- weekly reports

Durable Objects should own hot state and coordination:

- live agent session state
- panel/chat streams
- per-agent locks
- workflow callbacks
- short-lived execution state

R2 should own immutable large artifacts:

- source snapshots
- generated reports
- proof receipts
- content packages
- run bundles

Pipelines should own event ingestion. R2 delivery is the next sink step once the
Pipeline sink is configured. It should not be the source of truth for
operational decisions.

## Safety Requirements

- No unsupported public claims.
- No hidden broad permissions.
- No daily human steering in target mode.
- Revoke works without redeploy.
- Connector loss fails closed for side effects and degrades clearly for reads.
- Kill switch halts side effects and checkpoints active runs.
- Public write endpoints require auth, mode, rate, budget, and approval checks.
- LLM actions route through a single policy chokepoint.
- Public chat and model calls must fail closed if D1 policy counters are
  unavailable.
- The runtime kill switch and model-chat toggle must work without redeploy.
- Every externally visible artifact has a source trail.

## Quality Requirements

Every flagship artifact should pass these gates before publication:

| Gate | What it checks |
| --- | --- |
| Grounding | Claims map to cited or captured sources |
| Novelty | Artifact is not a low-delta rewrite |
| Technical | API usage and code examples are correct |
| SEO | Title, headings, metadata, and target query are deliberate |
| AEO | Direct answers, concise definitions, and FAQ-ready structure |
| GEO | Tables, source dates, and extractable passages where useful |
| Benchmark | Output is better than the obvious existing alternative |
| Voice | Tone is direct, useful, and agent-authored without hype |

## Success Metrics

Application success:

- stable public application URL
- proof pack complete
- public artifacts demonstrate technical, growth, and API ability
- live interview surface works
- application evidence bundle is ready for the careers form

Operating success:

- 2+ high-quality content artifacts per week
- 1 growth experiment per week
- 50+ meaningful community interactions per week
- 3+ structured product feedback items per week
- 1 weekly report per week
- no silent side-effect failures

Business success:

- RevenueCat gets useful public content
- RevenueCat gets higher-quality agent-community answers
- RevenueCat receives structured product feedback from real usage
- the agent role becomes easier to evaluate, extend, or reject based on evidence

## Canonical Reference Set

This PRD is the canonical product requirements document.

Supporting docs:

- `ROADMAP.md` - execution plan and architecture direction
- `README.md` - repo overview
- `SETUP.md` - setup and migration notes
- `docs/ops/local-development.md` - local runbook
- `docs/context/2026-03-06-revenuecat-role-brief.md` - source role brief
- `docs/interviews/` - interview preparation and knowledge base
- `docs/public/` - public proof artifacts
- `migrations/0002_experiment_operations.sql` - experiment operations schema
- `migrations/0003_agent_runtime_safety.sql` - source, policy, and runtime flag
  schema

Removed superseded docs:

- `docs/plans/2026-03-07-revenuecat-agent-roadmap.md`
- `docs/plans/2026-03-06-revenuecat-agent-application-plan.md`
- `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md`
- `convex/README.md`
