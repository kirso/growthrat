> **Superseded by `docs/product/2026-03-13-growthcat-prd.md` (updated 2026-03-16).** This roadmap is retained for historical reference. The unified PRD is now the single canonical planning document.

# Roadmap: RevenueCat Agent Delivery Slices

Canonical planning docs:

1. `docs/product/2026-03-13-growthcat-prd.md`
2. `docs/plans/2026-03-07-revenuecat-agent-roadmap.md`

This roadmap is the canonical execution doc. The older exec plan and blueprint remain supporting references only.

## Metadata

- Date: 2026-03-07
- Owner: Codex
- Status: draft
- Canonical PRD: `docs/product/2026-03-13-growthcat-prd.md`
- Parent plan: `docs/plans/2026-03-06-revenuecat-agent-application-plan.md`
- Companion blueprint: `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md`

## Goal

Translate the full implementation plan into an execution roadmap with explicit vertical slices, slice exit criteria, and a strict critical path toward the minimum winning application.

## 80/20 win condition

Before spending time on broad connected-company features, GrowthCat must be able to demonstrate all of the following publicly:

1. A public application microsite that answers the prompt well.
2. A public RevenueCat demo repo proving API-first technical ability.
3. Two flagship public pieces that are non-duplicative and referenceable.
4. One real growth experiment with instrumentation and a readout.
5. Three structured product feedback artifacts from real usage.
6. One weekly report showing operating cadence and judgment.
7. One deterministic `Operator Replay` page that shows how GrowthCat works.

If a slice does not move one of those seven forward, it is not on the critical path.

## Roadmap overview

| Slice | Name | Main outcome | Why it exists |
| --- | --- | --- | --- |
| VS1 | Strategy Kernel | Growth inputs, scoring, voice, evidence contracts | Prevent generic planning and vague growth work |
| VS2 | Knowledge and Source Intake | Source ingest, concept cards, freshness rules | Keep GrowthCat accurate and consistent |
| VS3 | Public Application Core | Microsite, evidence bundle, application artifacts | Satisfy the actual application form |
| VS4 | RevenueCat Proof Pack | Demo repo, readiness review, flagship pieces | Prove product fluency and differentiation |
| VS5 | Weekly Operating Loop | Experiment, feedback, reporting, canonical answers | Show the actual job can run weekly |
| VS6 | Quality and Benchmark Gate | Novelty, SEO/AEO/GEO, benchmark validation | Block average content from shipping |
| VS7 | Connected Shadow Mode | GitHub/Slack connection, first-hour audit, trust ramp | Make post-hire onboarding credible |
| VS8 | Hiring Stage Modes | Take-home, panel, founder support | Survive later stages without rework |
| VS9 | Hosted Readiness | Render deployment, smoke tests, replayability | Make the system reliable enough to use live |

## Vertical slices

### VS1. Strategy Kernel

- Objective:
  - Define how GrowthCat decides what to do.
- Scope:
  - `src/lib/config/voice.py`
  - `src/lib/config/growth.py`
  - `src/lib/config/knowledge.py`
  - `src/lib/config/quality.py`
  - `src/lib/config/content.py`
  - `src/lib/config/strategy.py`
  - `src/lib/evidence/scoring.py`
- Demo outcome:
  - deterministic scoring for opportunity candidates
  - evidence-readiness checks
  - explicit application evidence bundle fields
- Exit criteria:
  - scoring weights are versioned
  - pre-apply input matrix includes RevenueCat public sources and DataForSEO
  - strategy outputs can be blocked when evidence is weak

### VS2. Knowledge and Source Intake

- Objective:
  - Make GrowthCat source-grounded instead of memory-only.
- Scope:
  - `src/workflows/ingest_sources.py`
  - source snapshot model
  - concept-card and briefing-pack builders
  - freshness audits
- Demo outcome:
  - a pre-apply ingest run yields a clear source manifest for RevenueCat and market inputs
- Exit criteria:
  - public-only ingest works
  - briefing packs can be built for application and take-home contexts
  - stale-source detection is explicit

### VS3. Public Application Core

- Objective:
  - Build the actual thing RevenueCat reviews first.
- Scope:
  - application microsite
  - proof-pack index
  - application evidence bundle
  - public URL generation
- Demo outcome:
  - local preview of a complete public application package
- Exit criteria:
  - one stable application URL path exists
  - careers-form-supporting links can be assembled directly from stored artifacts
  - no manual copy-paste is required to prepare the application package

### VS4. RevenueCat Proof Pack

- Objective:
  - Prove GrowthCat is the audience and already behaves like the hire.
- Scope:
  - public demo repo
  - readiness review
  - first two flagship artifacts
  - first three feedback artifacts
- Demo outcome:
  - a reviewer can inspect the demo repo and proof pages without any internal access
- Exit criteria:
  - the proof pack contains at least one real API-integrated demo
  - the flagship pieces are clearly different from RevenueCat’s existing content
  - the feedback artifacts are structured and evidence-backed

### VS5. Weekly Operating Loop

- Objective:
  - Show that GrowthCat can actually perform the ongoing role, not just apply for it.
- Scope:
  - weekly plan generation
  - one experiment workflow
  - product-feedback workflow
  - weekly reporting
  - canonical answers
  - derivative content
- Demo outcome:
  - a one-week dry run produces the required minimum outputs
- Exit criteria:
  - two content artifacts
  - one experiment artifact
  - three feedback artifacts
  - one weekly report
  - meaningful interaction accounting exists, even if some public posting remains draft-only

### VS6. Quality and Benchmark Gate

- Objective:
  - Prevent weak public artifacts from damaging the application.
- Scope:
  - novelty checks
  - SEO/AEO/GEO validators
  - competitor benchmark corpus
  - post-publish review hooks
- Demo outcome:
  - duplicate or low-value content is blocked or rerouted
- Exit criteria:
  - a low-novelty draft fails publication
  - benchmark comparison is explicit
  - flagship artifacts show why they are stronger than the obvious alternative

### VS7. Connected Shadow Mode

- Objective:
  - Make post-hire onboarding believable without broad trust.
- Scope:
  - GitHub and Slack connectors first
  - asset selector
  - first-hour audit
  - draft-only and revoke path
- Demo outcome:
  - a company can connect two core assets and get useful output in shadow mode
- Exit criteria:
  - connection works with least privilege
  - first-hour audit is evidence-backed
  - revoke works without redeploy

### VS8. Hiring Stage Modes

- Objective:
  - Avoid redesign between application and later interviews.
- Scope:
  - take-home mode
  - panel mode
  - founder mode
  - stage-specific rubric scoring
- Demo outcome:
  - mock take-home and panel runs can be executed from the same core system
- Exit criteria:
  - take-home packaging works
  - panel console is safe to share
  - founder pack explains business value and autonomy boundaries clearly

### VS9. Hosted Readiness

- Objective:
  - Remove “works locally only” risk before live use.
- Scope:
  - Render deployment
  - worker and API health
  - hosted smoke test
  - run replay tools
- Demo outcome:
  - one hosted dress rehearsal succeeds
- Exit criteria:
  - API, worker, and operator web come up on Render
  - health, ingest, and weekly dry run all work in hosted mode
  - logs and traces are readable enough for incident diagnosis

## Critical path

The shortest credible path to applying is:

1. `VS1 Strategy Kernel`
2. `VS2 Knowledge and Source Intake`
3. `VS3 Public Application Core`
4. `VS4 RevenueCat Proof Pack`
5. `VS5 Weekly Operating Loop`
6. `VS6 Quality and Benchmark Gate`

Everything after that improves post-hire and later-stage readiness, but those six slices are the minimum path to a strong application.

## Suggested execution order for the next few sessions

### Session A

- Finish VS1 and VS2 primitives.
- Output:
  - strategy config
  - ingest plan
  - knowledge contracts

### Session B

- Start VS3 application microsite skeleton and evidence bundle.
- Output:
  - microsite routes
  - proof-pack pages
  - application artifact assembler

### Session C

- Start VS4 demo repo and readiness review.
- Output:
  - public RevenueCat demo
  - first flagship content brief
  - first feedback artifacts

### Session D

- Start VS5 weekly loop with one experiment and one report.
- Output:
  - weekly dry run
  - report artifact
  - experiment artifact

### Session E

- Add VS6 quality gates before public submission.
- Output:
  - novelty blocker
  - benchmark gate
  - SEO/AEO/GEO validation

## Efficiency rules

1. Build slices that end in public evidence first.
2. Prefer one real artifact over five abstractions.
3. Delay broad integrations until the public package is strong.
4. Do not start full connected-mode work until the public application is nearly ready.
5. Treat every slice as incomplete until it has a demo outcome and exit check.

## Definition of roadmap success

- The team can answer “what are we building next?” without re-reading the full 800-line plan.
- Every slice has:
  - clear output
  - clear demo
  - clear exit criteria
  - clear reason it matters to winning the role
- The roadmap makes it difficult to waste effort on non-critical surfaces before the application is strong.
