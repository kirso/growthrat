> **Superseded by `docs/product/2026-03-13-growthcat-prd.md` (updated 2026-03-16).** This exec plan is retained for historical reference. The unified PRD is now the single canonical planning document.

# ExecPlan: RevenueCat Agent Application and Trust-Ramped GTM OS

Canonical planning docs:

1. `docs/product/2026-03-13-growthcat-prd.md`
2. `docs/plans/2026-03-07-revenuecat-agent-roadmap.md`

This exec plan remains a detailed implementation reference. It is no longer the primary planning surface.

## Metadata

- Date: 2026-03-06
- Owner: Codex with operator review only for credentials, legal boundaries, and hard blockers
- Status: draft
- PRD refs: none in repo; requirements sourced from `docs/context/2026-03-06-revenuecat-role-brief.md`
- Related: `docs/context/2026-03-06-revenuecat-role-brief.md`, `docs/plans/2026-03-07-revenuecat-agent-roadmap.md`, official RevenueCat docs, official OpenClaw docs used for stack evaluation
- Companion blueprint: `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md`

## Outcome (user + business)

- Who benefits: the operator submitting the candidate agent, RevenueCat reviewers evaluating autonomy and judgment, and future companies that may connect their own assets to the same system.
- What changes for them: a greenfield agent platform can apply to the RevenueCat role using only public materials, publish a public application microsite, submit the application URL, demonstrate the first week of the actual job in public, and later onboard company assets through a trust-ramped integration flow without requiring broad direct access.
- Why now: the role explicitly tests autonomous execution from the first step. A plain application letter is not enough to win against strong competition; the system must prove it can create technical content, run grounded growth work, produce product feedback, and operate safely under limited access.
- Success looks like:
  - a public application microsite is live at a stable URL controlled by the operator
  - the careers-page submission is completed and a receipt artifact is stored locally, or a blocked-submission evidence package is archived if anti-bot checks intervene
  - a public first-week proof pack exists with 2 content pieces, 1 growth experiment, 3 structured feedback items, 1 weekly report, and 1 RevenueCat demo artifact
  - the agent `GrowthCat` has a distinct public identity with a stable voice profile, disclosure language, and competitive positioning
  - growth recommendations are backed by explicit evidence objects, baseline metrics, target metrics, and experiment design, not generic heuristics
  - flagship content passes deterministic, model-judged, and benchmark-based quality gates for novelty, technical depth, SEO, AEO, GEO, and audience fit before publication
  - the system can support quality-gated community engagement at the weekly target volume through derivative content, canonical answers, and channel-specific output formats
  - a company can connect GitHub, Slack, CMS, analytics, and issue-tracker assets through a self-serve integration flow and start in shadow mode
  - the system maintains a hybrid knowledge layer with source retrieval, structured memory, benchmark corpus entries, and hiring-stage briefing packs so GrowthCat can stay accurate and consistent under pressure
  - GrowthCat identifies opportunities autonomously from public and connected signals instead of waiting for weekly human topic assignment
  - the application package directly answers the careers-form evidence ask through a stable microsite URL plus supporting public GitHub and proof-pack links
  - the system can support application review, a 48-hour take-home assignment, panel interviews, and founder interview prep without re-architecting the core

## Problem and Current State (facts)

| ID | Severity | Symptom | Root Cause | Evidence (file path) | User/Business Impact | Proposed Fix |
| --- | --- | --- | --- | --- | --- | --- |
| RC-1 | High | No agent application system exists in the workspace. | The repo is greenfield and contains no code or infrastructure. | `docs/context/2026-03-06-revenuecat-role-brief.md` | There is no starting point for the public application artifact or the autonomous workflows that RevenueCat expects. | Create a production-shaped control plane, worker set, policy layer, and publishing pipeline from scratch. |
| RC-2 | High | The role requires a public application letter and careers-page submission authored by the agent, but there is no publishing or browser-submission workflow. | No public publishing surface, submission automation, or receipt capture exists. | `docs/context/2026-03-06-revenuecat-role-brief.md` | The candidate cannot complete the first hiring step in a way that demonstrates autonomy. | Build an application workflow that drafts, validates, publishes, submits, and archives evidence. |
| RC-3 | High | The role spans content, growth, community, product feedback, and weekly reporting, but no orchestrator or domain workers exist. | No task model, scheduler, memory store, or specialized workflows exist. | `docs/context/2026-03-06-revenuecat-role-brief.md` | A one-off application artifact would not prove the agent can perform the actual job after hiring. | Build a headless GTM and advocacy operating system with explicit weekly workflows and measurable outputs. |
| RC-4 | High | The role demands minimal human intervention, but there is no access model, policy engine, or action gating. | No service-account strategy, secret storage, or publish/reply controls exist. | `docs/context/2026-03-06-revenuecat-role-brief.md` | Unbounded autonomy would create brand, security, and compliance risk; over-reliance on the operator would fail the role intent. | Implement least-privilege connectors, policy-gated tool wrappers, audit logs, trust-ramped autonomy modes, and exception handling. |
| RC-5 | High | Winning the role likely requires stronger proof than a letter alone, but there is no first-week proof pack or RevenueCat-specific demonstration artifact. | The current plan does not force public evidence of product fluency or output quality. | `docs/context/2026-03-06-revenuecat-role-brief.md` | Stronger candidates may outcompete a generic application with real demos, experiments, and product feedback. | Add a public proof pack: demo app, RevenueCat readiness review, first-week outputs, and a transparent run/evidence trail. |
| RC-6 | High | Growth strategy quality could drift into generic advice because no evidence model or experiment governance exists. | No baseline metrics, evidence hierarchy, confidence scoring, or experiment templates exist. | `docs/context/2026-03-06-revenuecat-role-brief.md` | The agent may produce persuasive but weak strategies that do not survive take-home or panel scrutiny. | Build a growth evidence engine with metric ingestion, hypotheses, holdouts, thresholds, and postmortems. |
| RC-7 | High | RevenueCat may not give direct access at the start, but there is no self-serve integration or shadow-mode flow. | The prior plan assumed direct access rather than gradual connection of company assets. | `docs/context/2026-03-06-revenuecat-role-brief.md` | The system may be unusable in realistic onboarding where trust must be earned before broad permissions are granted. | Add BYO integration onboarding, asset selection, connector health checks, shadow mode, and autonomy promotion. |
| RC-8 | Medium | The hiring process includes take-home, panel, and founder stages, but there are no stage-specific workflows or output packs. | No take-home mode, panel mode, or founder briefing mode exists. | `docs/context/2026-03-06-revenuecat-role-brief.md` | The system may pass the application stage but stall or look improvised later in the process. | Add hiring-stage modes, interview-safe evidence views, and briefing packs. |
| RC-9 | Medium | OpenClaw is a tempting off-the-shelf agent runtime, but its official architecture centers on a host-bound Gateway with optional sandboxing and manual-login browser flows. | OpenClaw is designed as a local-first messaging agent runtime rather than a hosted, audited, trust-ramped company integration platform. | official OpenClaw docs referenced in this plan | Choosing the wrong foundation would create avoidable security, hosting, and control-surface mismatches. | Use a custom workflow platform as the core; optionally borrow isolated browser-profile patterns for strict sites, but do not make OpenClaw the runtime foundation. |
| RC-10 | High | The role explicitly rewards memorable agent identity and public presence, but the plan has no voice or persona system. | The current design optimizes for correctness and safety, not a distinctive agent identity. | `docs/context/2026-03-06-revenuecat-role-brief.md` | A bland application letter and generic public posts will underperform against named agents with clear personalities. | Add a versioned voice-profile system with name, tone, disclosure rules, recurring themes, and application-specific differentiation. |
| RC-11 | High | The role requires 50+ meaningful community interactions per week, but the plan only captures signals and limited outputs. | There is no explicit outbound engagement engine, weekly quota tracking, derivative pipeline, or meaningful-interaction scoring. | `docs/context/2026-03-06-revenuecat-role-brief.md` | The system may fail one of the clearest weekly expectations in the posting and look incomplete. | Add community engagement, derivative content, and interaction-quality scoring workflows with quota reporting. |
| RC-12 | High | The plan can generate content, but it lacks an explicit quality and duplication-prevention system that guarantees top-tier outputs. | No novelty registry, benchmark corpus, SEO/AEO/GEO validators, or post-publish learning loop exists yet. | `docs/context/2026-03-06-revenuecat-role-brief.md` | The agent may publish technically correct but generic content that fails to stand out against RevenueCat or competitor materials. | Add a hybrid quality system with deterministic checks, model judges, benchmark comparisons, and post-publish feedback loops. |
| RC-13 | High | The plan assumes retrieval from sources, but it does not yet define how GrowthCat will retain job-critical knowledge across application, take-home, panel, and founder stages. | No hybrid knowledge system, concept-card layer, hiring-stage briefing packs, or freshness audit exists. | `docs/context/2026-03-06-revenuecat-role-brief.md` | The agent may look informed in one run but inconsistent, slow, or forgetful across later hiring stages. | Add a hybrid knowledge architecture with source snapshots, structured memory, benchmark corpus, concept cards, stage briefing packs, and freshness audits. |
| RC-14 | High | The growth strategy layer is still too abstract to produce sharp weekly plans or application-ready evidence. | There is no explicit growth-input matrix, opportunity-discovery engine, topic-scoring formula, KPI tree, or first-30-day content map. | `docs/context/2026-03-06-revenuecat-role-brief.md`, `docs/plans/2026-03-06-revenuecat-agent-application-plan.md` | The system could sound rigorous while still making weak topic choices, weak experiment choices, or failing the application fields that ask for public proof links. | Add a concrete growth operating model with explicit input sources, scoring formulas, KPIs, first-month artifact map, and application evidence bundle outputs. |

- Current behavior: there is no local application. The workspace contains only the role brief captured from the user prompt.
- Pain/risk: without a system that can both apply and operate, the submission would either be manual, brittle, too shallow to prove fitness, or too risky to trust with real assets later.
- Root cause (if known): greenfield starting point combined with a role that expects autonomous, public, cross-functional execution from the first interaction and likely rewards candidates who show working systems rather than strong prose alone.
- System pattern behind the issues: the first deliverable must do triple duty as application asset, proof-of-work portfolio, and safe operating platform. The design must therefore cover public-only execution, connected-asset execution, growth evidence quality, and transparent hiring-stage support.

## Scope

In:

- Build a greenfield headless control plane for a RevenueCat application agent.
- Build the public application microsite workflow: research, thesis generation, drafting, validation, publication, careers-page submission, and receipt capture.
- Build a read-only `Operator Replay` microsite surface as a subtle easter egg that demonstrates how GrowthCat would operate in week one through precomputed evidence-backed artifacts rather than live model calls.
- Build a public first-week proof pack with:
  - 2 RevenueCat-relevant content artifacts
  - 1 growth experiment with explicit hypothesis and measurement
  - 3 structured product feedback items
  - 1 weekly report
  - 1 RevenueCat demo artifact such as demo app, webhook flow, or readiness review
- Build a growth evidence engine that stores source evidence, baseline metrics, target metrics, confidence, sample-size expectations, and postmortems.
- Build weekly autonomous workflows for content drafting, growth-experiment planning, community-signal capture, product-feedback generation, and weekly reporting.
- Build a versioned agent identity system for `GrowthCat` with disclosure language that makes clear it is an independent applicant and not a RevenueCat property.
- Build outbound community engagement workflows with quality-gated weekly quotas, per-channel formatting, reply generation, and interaction tracking.
- Build a derivative content pipeline that turns long-form outputs into X threads, GitHub gists, discussion replies, short summaries, and reusable snippets.
- Build a canonical answers and FAQ workflow that turns repeated community questions into stable guides used in later replies.
- Build community trend reporting and joint initiative tracking so the agent can collaborate with human DevRel and Growth teammates on shared projects.
- Build a content quality system with novelty detection, duplication prevention, SEO validation, AEO validation, GEO validation, competitor benchmark comparison, and post-publish learning loops.
- Build a content routing layer that decides whether a new idea should become a blog post, docs PR, sample app update, canonical answer, or derivative-only distribution.
- Build a hybrid knowledge system with:
  - source-of-truth corpora for RevenueCat, competitors, and public community content
  - structured memory for outputs, experiments, feedback, and trends
  - benchmark corpus for quality comparison
  - concept cards and metric dictionaries for fast reuse
  - hiring-stage briefing packs for application, take-home, panel, and founder modes
  - freshness audits so stale knowledge is refreshed before use
- Build a growth-input matrix that distinguishes owned runtime services from connected third-party inputs and ranks them by evidence quality.
- Build an opportunity-discovery engine that turns RevenueCat public signals, community demand, DataForSEO market data, and connected analytics into scored content, experiment, and feedback candidates.
- Build a first-30-day public artifact map that specifies the initial flagship content, experiment, feedback, and reporting outputs needed to win the application.
- Build an application evidence bundle that maps directly to the careers form fields for public URL and supporting public links.
- Build BYO integration onboarding for GitHub, Slack, CMS, analytics, issue tracker, and public publishing targets.
- Build trust-ramped autonomy modes: public-only, connected shadow, draft-only, bounded autonomy.
- Build a thin operator web app for integration setup, scope review, connector health, audit viewing, revoke/kill switch, and autonomy-mode promotion.
- Build hiring-stage modes for application review, take-home execution, panel demo, and founder briefing.
- Build hiring-stage evaluation rubrics so application, take-home, panel, and founder artifacts can be scored against RevenueCat-specific expectations.
- Build policy gating, least-privilege credential handling, audit logging, and exception routing.
- Build tests and dry-run scripts that prove the core journeys can execute locally and in hosted environments.
- Document deployment, runtime operations, and fallback behavior for blocked submission steps such as CAPTCHA and for manual-login-only channels such as X.

Out:

- Full multi-tenant billing or customer self-serve SaaS packaging.
- Broad social-channel execution on day one beyond one public posting path and one monitored community path.
- Paid media execution or ad-platform integrations in phase 1.
- Direct write access to any RevenueCat internal production systems.
- Replacing native company systems such as GitHub, Slack, or CMS with a new internal dashboard.
- Automatic founder-interview co-pilot during a live meeting.
- Generic agent marketplace packaging.

Anti-goals:

- Do not build a generic chatbot that lacks deterministic workflows, evidence objects, and auditability.
- Do not optimize for a polished dashboard before the application and proof-pack workflows are reliable.
- Do not grant broad org-admin access to prove autonomy.
- Do not choose a local-first personal agent runtime as the core architecture if it weakens hosting, security, or company-asset onboarding.
- Do not recommend growth actions without baseline metrics, evidence sources, or a falsifiable experiment plan.
- Do not wait for RevenueCat reps to hand-author editorial topics; GrowthCat must identify and justify opportunities independently, while still allowing strategic overrides later.

## Users and Journeys (UI/UX)

- Companion implementation surface map: `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md`
- This plan defines the engineering contracts. The companion blueprint defines the actor-to-surface map, screen inventory, notification routing, and RevenueCat-side end state that implementers must preserve.

Primary journeys (2 to 3):

Journey: Public-only application and proof-pack publication

- Entry: operator provides approved credentials for the public publishing target and the captured role brief; no RevenueCat private access is assumed.
- Steps:
  - User: operator starts `apply_for_role` workflow | UI: internal API and run console show `planning` state | System: creates `application_submission` run and snapshots public sources.
  - User: no action | UI: evidence pane fills with sources, claims, and confidence scores | System: research worker ingests public RevenueCat docs, SDK repos, blog, changelog, and agent-market context.
  - User: no action unless a policy blocker fires | UI: run console shows draft scorecards and proof-pack checklist | System: writer generates the application microsite, first-week artifacts, and RevenueCat-specific demo artifacts.
  - User: no action | UI: preview environment becomes available | System: evaluator verifies citations, links, code artifacts, novelty, and growth-experiment structure.
  - User: no action | UI: public URL and artifact links appear | System: publisher deploys the microsite and proof pack.
  - User: no action unless anti-bot challenge occurs | UI: careers submission panel shows `submitting`, `submitted`, or `blocked_submission` | System: submission worker enters the careers page, submits the public URL, and stores receipt artifacts.
- Success criteria:
  - public microsite is live
  - proof pack is complete and linked from the microsite
  - submission receipt or fallback evidence package exists
  - no unsupported claims are present in the public artifacts

Journey: Company admin connects assets and promotes autonomy

- Entry: a company admin opens the operator web app after deciding to trial the system without granting broad direct access.
- Steps:
  - User: admin opens integrations page | UI: available connectors and requested scopes are shown clearly | System: loads connector manifests and the minimum-scope policy matrix.
  - User: admin connects GitHub, Slack, CMS, analytics, or issue tracker through OAuth, app-install, or API token flow | UI: each connector shows selected assets, scopes, and health state | System: stores encrypted credentials metadata, validates scopes, and runs connector health checks.
  - User: admin selects repos, channels, sites, and workspaces to expose | UI: asset selector shows what is in scope and what remains excluded | System: persists `connected_assets` and generates a trust-ramp policy.
  - User: admin chooses `connected_shadow_mode` initially | UI: autonomy mode chip updates and explains permitted actions | System: agent starts reading connected assets, generating drafts and audits, but cannot publish or post externally.
  - User: admin reviews first-hour audit and selected draft outputs | UI: run console shows evidence-backed opportunities and blocked actions | System: generates a source-grounded action plan, connector-health summary, and recommended next autonomy level.
  - User: admin promotes to `draft_only_mode` or `bounded_autonomy_mode` if satisfied | UI: policy diff is shown before confirmation | System: updates action gates and rate limits without changing stored credentials.
- Success criteria:
  - a company can connect assets without engineering support from us
  - shadow mode produces useful outputs within the first hour
  - autonomy can be promoted or revoked without redeploying the system

Journey: Hiring-stage execution under pressure

- Entry: a task is triggered for take-home, panel, or founder preparation.
- Steps:
  - User: operator starts `take_home_mode`, `panel_mode`, or `founder_mode` | UI: stage-specific workspace opens with deadlines, artifact checklist, and evidence requirements | System: creates a bounded run using the stage template.
  - User: no action during take-home; operator may screen share during panel | UI: live console shows sources, active tasks, outputs, and policy decisions without exposing secrets | System: executes the stage workflow, verifies artifacts, and packages outputs.
  - User: operator reviews final stage pack | UI: stage summary shows final artifacts, citations, open risks, and confidence markers | System: archives the full run with replayable lineage.
- Success criteria:
  - take-home outputs can be produced within a 48-hour window with minimal operator intervention
  - panel-mode console is safe to screen share and shows competence rather than hidden guesswork
  - founder-mode pack translates technical capability into business and organizational value

Journey: Autonomous weekly opportunity discovery and planning

- Entry: a scheduled planning run or manual `discover_opportunities` run starts with public-only inputs before hire, then can include connected sources after onboarding.
- Steps:
  - User: no action unless an override is requested | UI: dashboard shows `planning` and input coverage summary | System: ingests RevenueCat public sources, community signals, DataForSEO demand data, and any connected analytics snapshots.
  - User: no action | UI: opportunity board shows candidate topics, experiments, and feedback items with scores and evidence links | System: `OpportunityDiscoveryWorker` classifies candidates into content, experiment, feedback, docs-update, canonical-answer, or derivative-only lanes.
  - User: optional strategic override only | UI: weekly plan preview shows what made the cut and what was deprioritized | System: scoring engine ranks candidates by RevenueCat relevance, agent-builder relevance, demand, novelty, artifact potential, distribution potential, feedback value, and effort.
  - User: no action in bounded-autonomy mode | UI: selected backlog appears with confidence and KPI targets | System: `WeeklyOpsOrchestrator` emits the final plan and creates execution tasks with evidence snapshots attached.
- Success criteria:
  - GrowthCat can produce a defensible weekly plan without waiting for human topic assignment
  - each selected item includes a rationale, expected outcome, and evidence links
  - deprioritized items remain inspectable instead of disappearing silently

Edge, failure, and abuse journeys (top 3 to 7):

- Case: careers page presents CAPTCHA or anti-bot challenge -> Expected UX: workflow stops at `blocked_submission`, stores screenshot and pre-filled evidence package, and emits a single operator action item limited to challenge resolution.
- Case: generated growth strategy lacks baseline metric, evidence objects, or falsifiable success threshold -> Expected UX: evaluator blocks publication, marks the strategy as `unsupported_growth_recommendation`, and opens a remediation task.
- Case: opportunity candidates exist but source coverage is weak or demand data is missing -> Expected UX: planner still emits low-confidence exploratory candidates, labels them clearly, and avoids promoting them to flagship content or experiments.
- Case: connected analytics source exposes vanity metrics only -> Expected UX: first-hour audit warns that strategy confidence is low and recommends minimum additional data sources before autonomous experiments run.
- Case: admin grants overly broad connector scopes -> Expected UX: scope review fails and lists the narrower scopes required before activation.
- Case: company wants social posting but the site requires manual browser login or strict anti-bot behavior -> Expected UX: the connector stays in manual-assisted mode with a dedicated browser profile and explicit operator-only login step.
- Case: generated code sample or demo app fails local verification -> Expected UX: artifact remains draft-only, failing checks are attached, and a remediation task is added to the backlog.
- Case: admin revokes a connector or hits kill switch mid-run -> Expected UX: active workflow checkpoints safely, future side-effecting actions stop, and the run is marked `revoked` with partial outputs preserved.

## UX Requirements

- States:
  - loading: internal task surfaces must show `captured`, `planning`, `researching`, `executing`, `evaluating`, `draft_ready`, `published`, `submitted`, `reported`, `blocked`, `failed`, and `revoked` states.
  - empty: weekly reports and first-hour audits must explicitly state when insufficient evidence exists instead of fabricating conclusions.
  - error: each failed external action must surface connector name, retry count, safe remediation, and whether partial side effects occurred.
  - partial success: workflows must allow publication success plus submission failure, or shadow-audit success plus connector-health failure, with resumable checkpoints.
- Copy:
  - success messages must include artifact links, evidence counts, and next scheduled action.
  - validation messages must name unsupported claims, missing metrics, weak experiment design, missing credentials, or failed tests explicitly.
  - error messages must exclude secrets, auth tokens, and personal data.
- Accessibility:
  - the public application microsite must use semantic headings, keyboard-accessible links, alt text for any images, and readable contrast.
  - the operator web app must support keyboard navigation for integration setup, revoke controls, and run inspection.
  - screen-share-safe panel mode must hide secrets and minimize noisy animations.
- Responsive:
  - the public microsite must render cleanly on mobile widths down to 360 px.
  - the operator app must be usable on standard laptop widths and readable in narrow split-screen layouts during live interviews.
- Performance budgets:
  - p95 internal API response for task status under 500 ms.
  - p95 planner run under 60 seconds for weekly queue creation and under 120 seconds for first-hour audit creation.
  - public microsite first contentful paint under 2.5 seconds on a standard mobile connection.
  - careers-form browser submission must complete or fail explicitly within 90 seconds.
  - integration health check for a new connector should finish in under 30 seconds per connector.

## Constraints and Invariants

- Data integrity:
  - every externally published claim must reference at least one approved source artifact.
  - every growth recommendation must include at minimum: audience, objective, evidence objects, baseline metric, target metric, confidence, and stop condition.
  - every flagship content artifact must store its intended audience, target query cluster, novelty classification, benchmark score, and publish-validation result.
  - every weekly plan item must store a scored opportunity record with its input sources, weighted score breakdown, chosen lane, and reason for selection or rejection.
  - every hiring-stage run must record which briefing pack and concept-card set were used.
  - every task run must have immutable input snapshot metadata and output artifact links.
  - application submission must be idempotent by role slug, public URL hash, and careers-page target.
  - weekly report counts must derive from stored task outcomes and metric snapshots, not from generated text alone.
  - experiment outcomes must preserve the original hypothesis and evaluation threshold even if later edited.
- Privacy/security:
  - secrets must never be stored in prompt history or long-term memory tables.
  - the system must use service accounts, OAuth installs, or app installs with least-privilege scopes per connector.
  - browser sessions used for careers submission or publishing must run in isolated ephemeral containers unless a strict site requires a dedicated manual-login host profile.
  - public replies must not expose non-public product information, support records, or roadmap commitments.
  - kill switch and per-connector revoke must be available at all times.
- Knowledge hygiene:
  - source snapshots must record origin, capture date, product area, and confidence tier.
  - structured memory must store summaries and state, not raw secrets or unnecessary personal data.
  - hiring-stage briefing packs must be versioned and refreshable when source snapshots change materially.
- Platform/tooling:
  - build a custom hosted workflow platform with Python for the control plane and evaluation stack, plus a thin TypeScript web app for integrations and audit operations.
  - host the API service, operator web app, and long-running background workers on Render.
  - use Render private services and service-to-service networking for internal-only surfaces.
  - keep Temporal Cloud outside Render so workflow durability and schedules remain independent from app container restarts.
  - use managed Postgres and object storage outside the app containers; default to Neon for MVP Postgres and R2 or S3-compatible storage for artifacts unless a later production migration requires different vendors.
  - use direct vendor SDKs and internal wrappers instead of a heavy generic multi-agent framework as the core.
  - host long-running control-plane components separately from execution sandboxes.
- do not use OpenClaw as the runtime foundation; its official design centers on a host-bound Gateway, optional sandboxing, and manual-login browser patterns that are mismatched with this hosted trust-ramped platform.
- do not depend on Vercel AI SDK, OpenRouter, or another agent SDK as the core orchestration layer; use direct provider clients behind internal abstractions and add third-party SDKs only where they reduce surface-specific UI work.
- Growth intelligence must follow an evidence hierarchy:
  - connected first-party product and analytics signals
  - connected search and content-performance signals
  - public RevenueCat and competitor signals
  - public market data such as DataForSEO
  - heuristics only as a last resort, explicitly marked as low confidence
- Must-not-change behaviors:
  - the application letter and proof pack must be authored and published by agent workflows, not written manually off-system.
  - all external actions must remain audit-logged even when manual overrides are allowed.
  - the operator may configure policy, connect assets, and resolve blocked challenges, but must not be required for ordinary weekly execution in the target autonomy mode.
  - no growth strategy may be marked ready for publication if the evidence threshold is not met.
  - no flagship content artifact may be published if it fails novelty, technical correctness, SEO, AEO, GEO, or benchmark gates.

## Decisions (record early)

| Decision | Options | Choice | Rationale |
| -------- | ------- | ------ | --------- |
| Core runtime foundation | OpenClaw, custom workflow platform, generic agent framework | Custom workflow platform | OpenClaw's official docs describe a local-first Gateway that owns messaging surfaces, optional sandboxing, and host-browser manual login flows. That is not the right core for a hosted, audited, trust-ramped company integration platform. |
| Implementation languages | Python only, TypeScript only, mixed stack | Python control plane plus TypeScript operator web app | Python is the right default for orchestration, evaluation, content analysis, and experiment logic; TypeScript is useful for the thin integration and audit UI. |
| Workflow engine | Cron plus queue, Celery, Temporal | Temporal | Durable long-running workflows, retries, schedules, resumable checkpoints, and stage-specific runs fit the autonomy requirement. |
| Hosting platform | Render, Railway, Fly.io, custom cloud stack | Render | Render best matches this shape: API service, operator web app, long-running workers, private networking, and low-ops deployment. It is more structured than Railway for a serious hosted v1 and lower-ops than Fly.io for this use case. |
| Local development topology | fully containerized, host-only, hybrid | hybrid | Run Postgres and Temporal in Docker while running the API, worker, and operator UI on the host. This keeps iteration fast while still validating the real service boundaries. |
| Operator UI | No UI, full dashboard, thin integration and audit app | Thin integration and audit app | Public-only mode can be headless, but company asset connection, scope review, shadow-mode promotion, and kill switch require a small but real UI. |
| Public application publishing target | GitHub Gist, GitHub Pages/static site, long-form blog CMS | GitHub Pages or equivalent static public microsite, with gist fallback | A stable microsite with supporting artifacts is a stronger proof asset than a single text-only gist. |
| Social posting model | Full API automation, browser-only automation, staged model | Staged model with API first and manual-browser fallback for strict sites | Official OpenClaw docs explicitly recommend manual host-browser login for X. We should assume some channels need assisted login and keep that explicit. |
| Growth strategy evaluation model | qualitative-only, analytics-only, evidence and experiment model | evidence and experiment model | The agent must survive panel and take-home scrutiny; every recommendation needs measurable backing and falsifiable outcomes. |
| Metrics store | warehouse only, Postgres only, Postgres plus analytical runtime | Postgres plus analytical runtime | Postgres should store operational records and metric snapshots; analytical workloads should use DuckDB or warehouse connectors without polluting operational tables. |
| RevenueCat demonstration artifact | content only, demo app only, mixed public proof pack | mixed public proof pack | Winning likely requires both strong ideas and working evidence of product fluency. |
| Agent SDK dependency | Vercel AI SDK, OpenRouter, direct provider clients, mixed approach | direct provider clients behind internal abstractions; Vercel AI SDK only if needed for the operator web UI; OpenRouter optional as non-primary fallback | The core problem is workflow reliability and evidence control, not model-call ergonomics. Extra abstraction at the orchestration layer is unnecessary for MVP. |
| Content quality architecture | basic linting, model-only judging, hybrid deterministic plus model judges plus benchmark corpus | hybrid deterministic plus model judges plus benchmark corpus | This is the only reliable way to block duplicate, vague, or category-average content before publication. |
| Knowledge architecture | vector search only, structured memory only, hybrid retrieval and memory | hybrid retrieval and memory | GrowthCat needs current factual retrieval plus durable state, benchmark memory, and stage-specific briefing packs. |
| Growth intelligence sources for pre-apply mode | heuristics only, RevenueCat public sources only, public sources plus market-intelligence APIs | RevenueCat public sources plus public market-intelligence APIs, starting with DataForSEO and our own analytics | The application must prove autonomous opportunity selection before any private RevenueCat access exists. |

## Technical Approach (high level)

### UX/UI surfaces and component changes

- Build a thin operator web app under `apps/operator-web/` with these pages:
  - integrations
  - asset selector
  - scope review
  - connector health
  - run audit viewer
  - autonomy mode control
  - emergency revoke / kill switch
- Keep the public application microsite under `site/` with supporting pages for:
  - application letter
  - proof pack index
  - RevenueCat readiness review
  - architecture and safety notes
  - weekly report snapshot
- Use Slack messages and thread replies as the primary internal notification and exception surface through `src/connectors/slack.py`.
- Expose generated artifacts through object storage URLs and signed internal links.
- Build a screen-share-safe panel console view in the operator web app that shows prompts, sources, outputs, and policy decisions without secrets.
- Keep the actor-to-surface map, screen inventory, and notification routing explicit in `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md`; any implementation that changes a surface or ownership boundary must update the blueprint in the same change.
- Implement these operator web screens with no hidden steps:
  - `dashboard`: current mode, recent runs, connector health, and blocked actions
  - `integrations`: connector cards, connect/disconnect actions, scope summaries, health status
  - `asset-selector`: exact repos, channels, sites, projects, and exclusions in scope
  - `scope-review`: requested scopes, rationale, risk tier, and approval checkpoint
  - `run-audit-viewer`: run timeline, evidence objects, citations, artifacts, policy events, retries, and partial side effects
  - `first-hour-audit`: connected-asset findings, opportunities, risks, and suggested next mode
  - `weekly-report-archive`: prior reports, metrics, learnings, and linked artifacts
  - `panel-console`: live prompt, retrieval list, draft output, uncertainty markers, and safe redactions
  - `founder-pack-view`: business narrative, value summary, constraints, and role-extension recommendation
  - `kill-switch`: global stop, connector revoke, and downgrade controls with confirmation state
- Implement these public microsite screens with stable URLs and versioned artifacts:
  - `/`: application letter and thesis
  - `/proof-pack`: index of first-week deliverables
  - `/readiness-review`: RevenueCat-for-agents audit
  - `/demo`: demo app, webhook flow, or equivalent proof artifact
  - `/operator-replay`: hidden or subtle lab page that replays a sample week, showing candidate content ideas, experiment briefs, feedback tickets, and weekly reporting through precomputed data only
  - `/safety`: architecture, trust ramp, and policy boundaries
  - `/report`: sample weekly async report
- The `Operator Replay` surface must be deterministic and static for the application:
  - no live model inference
  - no hidden API calls required to understand it
  - precomputed JSON or build-time artifacts only
  - explicit evidence links for each replayed step

### Service blueprint, actor/surface map, and notification routing

- Treat `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md` as an implementation artifact, not a marketing note.
- Preserve this actor-to-surface ownership model:
  - `Operator` uses the operator web app and internal APIs only.
  - `RevenueCat hiring council reviewer` uses the public microsite and linked public GitHub artifacts only.
  - `RevenueCat admin` uses integrations, asset selector, scope review, autonomy controls, and revoke controls.
  - `RevenueCat DevRel lead` consumes Slack reports, CMS drafts, GitHub PRs, and joint-initiative outputs.
  - `RevenueCat Growth lead` consumes experiment briefs, weekly reports, trend reports, and derivative-content outputs.
  - `RevenueCat PM / product team` consumes structured issue-tracker feedback, roadmap memos, and evidence bundles.
  - `RevenueCat engineer or docs reviewer` consumes GitHub PRs, sample repos, and technical feedback tickets.
  - `Public community member` sees only public posts, replies, docs, and public proof artifacts.
- Preserve this notification and artifact routing:
  - Slack: weekly reports, exceptions, first-hour audit summaries, autonomy changes, connector health failures
  - GitHub: docs PRs, sample app updates, gists, issue replies, discussion replies
  - CMS: long-form drafts, review-ready updates, bounded-publish receipts
  - issue tracker: structured feedback items, lifecycle changes, roadmap-input docs, joint initiative records
  - public microsite and GitHub Pages: application letter, proof pack, readiness review, demo artifacts, safety note
  - operator web app only: scope review, hidden evidence objects, run timelines, kill switch, credential status
- Preserve this RevenueCat-side end state:
  - hiring reviewers only need the public microsite and linked proof artifacts to decide whether to advance the candidate
  - after onboarding, RevenueCat admins should only need the operator web app for connection, mode changes, and revocation
  - DevRel, Growth, Product, and Engineering should receive outputs in the tools they already use and should not need to open the operator web app for routine weekly work
  - day-to-day operation should look like a teammate producing outputs, not a dashboard that humans must continuously drive

### API/routes and contract changes

- `POST /internal/tasks/apply-for-role`
  - input: role slug, source snapshot IDs, publish target, submission target, dry_run flag
  - output: run ID and initial state
- `POST /internal/tasks/build-proof-pack`
  - input: role slug, proof-pack template, publish target, dry_run flag
  - output: run ID and artifact checklist
- `POST /internal/tasks/weekly-cycle`
  - input: cadence window, max content items, max feedback items, max community actions
  - output: run ID and planned subtask count
- `POST /internal/tasks/first-hour-audit`
  - input: organization ID, connected asset IDs, autonomy mode
  - output: run ID and estimated evidence coverage
- `POST /internal/tasks/take-home-mode`
  - input: prompt bundle, deadline, artifact template
  - output: run ID and stage checklist
- `POST /internal/tasks/panel-mode`
  - input: prompt, timebox, presentation constraints
  - output: run ID and console session ID
- `POST /internal/tasks/founder-mode`
  - input: audience notes, meeting goals
  - output: run ID and briefing-pack artifact IDs
- `POST /integrations/{connector}/connect`
  - input: OAuth callback or token payload
  - output: connection ID and scope summary
- `POST /integrations/{connection_id}/assets/select`
  - input: selected assets and exclusions
  - output: connected asset IDs and policy diff preview
- `POST /integrations/{connection_id}/promote-autonomy`
  - input: target mode and operator note
  - output: updated policy and effective permissions summary
- `POST /integrations/{connection_id}/revoke`
  - input: revoke reason
  - output: revoked state and affected runs
- `GET /internal/runs/{run_id}`
  - output: status, artifacts, citations, evidence objects, failures, policy events

### Domain/service orchestration changes

- `ApplicationOrchestrator` owns end-to-end application flow from role brief to published microsite to careers submission.
- `ProofPackOrchestrator` builds the first-week public artifacts and RevenueCat-specific demonstration outputs.
- `IdentityProfileManager` owns the `GrowthCat` name, voice profile, disclosure language, and competitive differentiation copy blocks used across public outputs.
- `KnowledgeBaseOrchestrator` owns source ingestion, concept-card generation, benchmark-corpus updates, and briefing-pack assembly.
- `GrowthInputsOrchestrator` normalizes RevenueCat public sources, DataForSEO responses, community signals, search-console style data, and connected analytics into comparable evidence objects.
- `OpportunityDiscoveryWorker` creates and scores candidate content, experiment, docs-update, canonical-answer, and product-feedback opportunities from the current evidence set.
- `WeeklyPlanningWorker` converts scored opportunities into a constrained weekly plan and exposes the selection rationale plus what was left on the table.
- `HybridRetriever` combines metadata filtering, lexical search, and vector retrieval over source snapshots and benchmark corpus entries.
- `KnowledgeFreshnessAuditor` detects stale source snapshots, outdated concept cards, and briefing packs that need rebuilds.
- `ResearchWorker` ingests approved sources, extracts claims, and builds citation manifests.
- `GrowthIntelligenceWorker` turns metrics, public signals, and connected-asset data into evidence-backed growth hypotheses.
- `ExperimentPlannerWorker` creates experiment plans with expected lift, sample-size assumptions, stop conditions, and rollback criteria.
- `WriterWorker` drafts the application letter, content pieces, feedback memos, founder briefing, and report summaries.
- `CommunityEngagementWorker` drafts and, where allowed, publishes replies, posts, and comments against per-channel quotas and quality gates.
- `DerivativeContentWorker` transforms long-form artifacts into channel-specific derivatives such as threads, gists, short summaries, and reply snippets.
- `CanonicalAnswersWorker` clusters repeated questions into reusable canonical answers and FAQ artifacts.
- `CommunityTrendReporter` summarizes recurring external topics, questions, and sentiment into internal trend reports.
- `JointInitiativeWorker` proposes, tracks, and reports collaborative initiatives with human DevRel and Growth teammates.
- `ContentRoutingWorker` decides whether a candidate idea becomes a flagship article, docs PR, sample update, canonical answer, or derivative-only artifact.
- `NoveltyRegistryWorker` compares candidate ideas against RevenueCat docs, blog, changelog, GitHub, samples, competitor corpus, and our own artifact history.
- `ContentQualityValidator` runs deterministic checks, model judges, and benchmark comparisons before any flagship artifact is eligible for publication.
- `SEOValidator` checks keyword/query intent, metadata, schema, internal links, and cannibalization risk.
- `AEOValidator` checks answer-first structure, FAQ/HowTo extractability, comparison blocks, and query-matching headings.
- `GEOValidator` checks citation-worthiness, authority signals, statistics, dated sources, and extractable passage quality.
- `PostPublishReviewWorker` reviews performance, referenceability, and downstream impact, then feeds that back into topic and format selection.
- `EvaluatorWorker` scores grounding, novelty, code validity, strategy quality, and policy compliance before any external action.
- `HiringRubricEvaluator` scores outputs against stage-specific criteria for application review, take-home, panel, and founder expectations.
- `BriefingPackBuilder` assembles compressed context packs for application, take-home, panel, founder, and weekly-ops modes.
- `PublisherWorker` handles static-site deployment and CMS or gist fallback publication.
- `SubmissionWorker` drives browser automation for careers submission and stores receipt evidence.
- `ConnectorOrchestrator` manages OAuth installs, scope validation, asset selection, health checks, and revoke actions.
- `TrustRampOrchestrator` manages transitions among public-only, connected shadow, draft-only, and bounded autonomy.
- `WeeklyOpsOrchestrator` handles recurring content, experiment, community, feedback, and reporting workflows.
- `HiringStageOrchestrator` coordinates take-home mode, panel mode, and founder mode.
- `ApplicationEvidenceBundleBuilder` composes the exact public URLs and artifact links needed for the careers form and supporting-links field.
- `ExceptionRouter` posts blocked states to Slack and persists resumable checkpoints.

### Growth intelligence inputs, scoring, and strategy contracts

- Treat growth strategy as a scored operating system, not a brainstorming prompt.
- Input classes in pre-apply mode:
  - RevenueCat public docs, blog, changelog, GitHub org, and sample repos
  - public community demand from GitHub issues/discussions, forums, X, and Discord where readable
  - DataForSEO market intelligence:
    - Labs API for keyword ideas, ranked keywords, relevant pages, domain intersection, and page intersection
    - SERP API for live result structure and intent validation
    - AI Optimization API for AI-keyword demand and LLM mention opportunities
    - Content Analysis API for topic and mention trends
  - our own public-site analytics after publication
- Input classes in connected mode:
  - RevenueCat Charts API or export
  - Google Search Console
  - GA4 or PostHog
  - docs search logs
  - Slack questions
  - issue-tracker and support-summary patterns
- Opportunity lanes:
  - flagship searchable content
  - flagship shareable or referenceable content
  - experiment
  - docs PR or sample update
  - canonical answer
  - derivative-only distribution
  - product feedback
- Scoring formula for each candidate opportunity:
  - `score = (revenuecat_relevance * 0.20) + (agent_builder_relevance * 0.15) + (demand_signal * 0.15) + (novelty_delta * 0.15) + (artifact_potential * 0.10) + (distribution_potential * 0.10) + (feedback_value * 0.10) + (ease_to_execute * 0.05)`
  - store the raw component scores and the final weighted score
  - any candidate lacking evidence objects, target audience, or a lane classification is ineligible for weekly selection
- Weekly content portfolio rule:
  - at least one searchable flagship
  - at least one shareable or referenceable flagship
  - derivatives generated from both
  - at least one experiment linked to one of the week’s flagship assets
- KPI tree by layer:
  - awareness: search visibility, AI mentions, impressions, inbound mentions
  - engagement: replies, saves, dwell, repo visits, discussion participation
  - authority: references, citations, canonical-answer reuse, linked mentions
  - activation: demo clicks, repo clones, docs visits, signup-intent proxy actions
  - product impact: feedback items acknowledged, docs PRs merged, shipped improvements influenced
- Strategy output contract:
  - audience
  - problem
  - evidence objects
  - target query cluster or distribution hypothesis
  - chosen lane
  - baseline metric
  - target metric
  - confidence
  - stop condition
  - why this beats the next-best candidate this week

### First 30-day public artifact map and application evidence bundle

- First 30-day public artifact map:
  - 4 implementation guides for agent-built RevenueCat workflows
  - 2 growth or operator playbooks tied to monetization, paywalls, or Charts-informed experimentation
  - 2 canonical answer hubs for repeated "how do I use RevenueCat as an agent?" questions
  - 1 RevenueCat-for-agents readiness review
  - 1 benchmark or experiment report grounded in public results
- Minimum pre-apply 80/20 package required before submitting:
  - public microsite with application letter
  - proof-pack index
  - one public RevenueCat demo repo
  - two flagship public pieces
  - one live growth experiment artifact
  - three structured feedback artifacts
  - one sample weekly report
  - one deterministic `Operator Replay` page
- Application evidence bundle fields:
  - `public_application_url`
  - `public_demo_repo_url`
  - `public_proof_pack_url`
  - `public_operator_replay_url`
  - `public_github_profile_url`
  - optional `public_x_profile_url`
  - `supporting_links` list for the careers field asking for public evidence of technical content, growth work, and API usage

### DB schema/migrations/data backfill strategy

- Create initial migrations under `migrations/0001_initial.py` for:
  - `organizations`
  - `sources`
  - `source_snapshots`
  - `tasks`
  - `task_runs`
  - `artifacts`
  - `citations`
  - `evidence_items`
  - `metric_snapshots`
  - `strategy_briefs`
  - `opportunity_candidates`
  - `growth_hypotheses`
  - `experiments`
  - `experiment_observations`
  - `voice_profiles`
  - `content_registry`
  - `publish_validations`
  - `keyword_clusters`
  - `query_cluster_signals`
  - `benchmark_corpus_entries`
  - `concept_cards`
  - `metric_dictionary_entries`
  - `briefing_packs`
  - `knowledge_freshness_events`
  - `post_publish_reviews`
  - `community_interaction_scores`
  - `engagement_actions`
  - `canonical_answers`
  - `community_trend_reports`
  - `joint_initiatives`
  - `hiring_stage_evaluations`
  - `policy_events`
  - `autonomy_policies`
  - `connector_credentials_meta`
  - `integration_connections`
  - `connected_assets`
  - `publications`
  - `submission_receipts`
  - `community_signals`
  - `feedback_items`
  - `feedback_lifecycle_events`
  - `weekly_reports`
- Use `pgvector` on normalized source chunks, prior artifacts, and connected knowledge summaries for semantic retrieval.
- Build lexical and metadata indexes alongside `pgvector` so retrieval can combine exact-match product terms, freshness, source type, and semantic similarity.
- Add a local analytical runtime with DuckDB for experiment analysis, cohort slicing, and CSV/export processing without turning Postgres into an analytics engine.
- No historical backfill is required because the repo is greenfield.
- Seed initial source rows from `docs/context/2026-03-06-revenuecat-role-brief.md` and later from approved public RevenueCat documentation snapshots.

### Jobs/workers/webhooks and idempotency

- Scheduled jobs:
  - daily source refresh
  - daily knowledge freshness audit
  - weekly planning run
  - weekly report delivery
  - connector health audit
  - stale-artifact freshness audit
- Event-driven jobs:
  - docs update ingestion
  - community signal ingestion
  - connected analytics sync
  - issue-tracker update sync
- One-off jobs:
  - application microsite generation
  - proof-pack generation
  - public publication
  - careers-form submission
  - first-hour audit
  - take-home run
  - founder briefing pack generation
- Idempotency rules:
  - application submission keyed by role slug plus public URL hash plus submission target hash
  - publication keyed by artifact content hash plus target
  - feedback item creation keyed by evidence-cluster hash
  - community reply keyed by source URL hash plus response policy bucket
  - experiment creation keyed by hypothesis hash plus target channel plus metric family
  - autonomy promotion keyed by organization ID plus connection set plus target mode
- Retry rules:
  - safe retries for network and connector failures
  - no blind retry for external form submission after partial success; require receipt check first
  - no automatic retry for revoked connectors

### Analytics/observability events and schema updates

- Emit structured events:
  - `task_created`
  - `task_planned`
  - `evidence_collected`
  - `draft_generated`
  - `draft_failed_grounding`
  - `growth_hypothesis_created`
  - `growth_hypothesis_blocked`
  - `experiment_started`
  - `experiment_finished`
  - `artifact_published`
  - `application_submission_started`
  - `application_submitted`
  - `application_submission_blocked`
  - `feedback_item_created`
  - `feedback_status_changed`
  - `connector_connected`
  - `connector_health_failed`
  - `autonomy_mode_changed`
  - `weekly_report_sent`
  - `kill_switch_activated`
  - `knowledge_snapshot_refreshed`
  - `briefing_pack_rebuilt`
- Attach fields:
  - run ID
  - organization ID
  - workflow type
  - target connector
  - source snapshot IDs
  - evidence count
  - quality score
  - strategy confidence
  - policy bucket
  - retry count
- Send traces and logs to a central sink and persist high-value summaries in Postgres.
- Tag all failures with `feature=agent-application-gtm-os` and connector name.

### Config/constants centralization under `src/lib/config/**`

- `src/lib/config/settings.py`: environment variables, runtime toggles, URLs, model names, and retry limits.
- `src/lib/config/policies.py`: risk tiers, publish rules, disallowed topics, rate limits, manual-assist rules, and fallback behaviors.
- `src/lib/config/connectors.py`: connector names, scope requirements, asset types, and health-check intervals.
- `src/lib/config/prompts.py`: stable prompt templates and response-shape contracts.
- `src/lib/config/content.py`: templates for the public microsite, weekly report, feedback memo, readiness review, and founder briefing.
- `src/lib/config/growth.py`: metric families, evidence thresholds, experiment templates, sample-size defaults, and stop conditions.
- `src/lib/config/voice.py`: `GrowthCat` identity, public persona, independent-applicant disclosure rules, tone controls, recurring themes, and competitive positioning language.
- `src/lib/config/quality.py`: novelty thresholds, publish-gate rules, benchmark dimensions, SEO/AEO/GEO checks, and meaningful-interaction criteria.
- `src/lib/config/knowledge.py`: source tiers, concept-card schemas, briefing-pack composition rules, freshness thresholds, and retrieval policies.
- `src/lib/config/strategy.py`: growth-input matrix, opportunity-scoring weights, weekly portfolio rules, KPI trees, and application evidence bundle defaults.

### Reused helpers/components and why

- No existing repo helpers are available to reuse.
- Create shared helpers early and reuse them across all workers:
  - `src/lib/llm/client.py` for model invocation and structured outputs
  - `src/lib/citations/grounding.py` for claim-to-source matching
  - `src/lib/evidence/scoring.py` for growth evidence weighting and confidence scoring
  - `src/lib/experiments/design.py` for experiment templates and guardrails
  - `src/lib/content/novelty.py` for duplicate detection, topic classification, and similarity checks
  - `src/lib/content/benchmarking.py` for competitor and internal benchmark scoring
  - `src/lib/content/quality.py` for publish-gate aggregation and validator orchestration
  - `src/lib/knowledge/retrieval.py` for hybrid retrieval and source ranking
  - `src/lib/knowledge/concept_cards.py` for distilled RevenueCat and growth concept cards
  - `src/lib/knowledge/briefing_packs.py` for hiring-stage context assembly
  - `src/lib/policies/guard.py` for action gating
  - `src/lib/storage/artifacts.py` for artifact persistence and URL generation
  - `src/lib/connectors/base.py` for credential loading, rate limiting, and logging
  - `src/lib/connectors/oauth.py` for shared OAuth and app-install callbacks
  - `src/lib/browser/session.py` for isolated browser-session lifecycle and manual-login support
- These shared helpers prevent duplicated model, citation, strategy, policy, and connector code across workflows.

### Stateful flow transition contracts (required when lifecycle/status changes are in scope)

| Transition ID | From State | To State | Trigger and owner entrypoint | Required side effects | Source evidence paths | Forbidden transitions and error behavior |
| --- | --- | --- | --- | --- | --- | --- |
| APP-1 | `captured` | `researching` | `POST /internal/tasks/apply-for-role` handled by `ApplicationOrchestrator` | snapshot inputs, create source retrieval job, create run record | `docs/context/2026-03-06-revenuecat-role-brief.md` | Forbid direct jump to `published`; return 409 if source snapshot is missing |
| APP-2 | `researching` | `draft_ready` | `ResearchWorker` and `WriterWorker` complete citation manifest and microsite draft | persist citations, evidence objects, thesis options, and proof-pack checklist | `docs/context/2026-03-06-revenuecat-role-brief.md` | Forbid transition if citation coverage or proof-pack completeness is below threshold; set `blocked_grounding` |
| APP-3 | `draft_ready` | `published` | `PublisherWorker` deploys microsite and proof pack | persist canonical URL, content hash, deployment receipt | `docs/context/2026-03-06-revenuecat-role-brief.md` | Forbid transition if policy or strategy-quality gate fails; set `blocked_policy` |
| APP-4 | `published` | `submitting` | `SubmissionWorker` starts careers-form automation | launch isolated browser, create submission attempt row | `docs/context/2026-03-06-revenuecat-role-brief.md` | Forbid direct jump to `submitted` without attempt row; return 409 |
| APP-5 | `submitting` | `submitted` | careers page accepts form submission | persist receipt screenshot, response metadata, and final summary | `docs/context/2026-03-06-revenuecat-role-brief.md` | If success signal is ambiguous, set `submission_verification_required` instead of `submitted` |
| APP-6 | `submitting` | `blocked_submission` | anti-bot challenge or connector failure occurs | persist screenshot, HTML snapshot if allowed, and operator action item | `docs/context/2026-03-06-revenuecat-role-brief.md` | Forbid auto-retry until duplicate check and challenge classification complete |
| CONN-1 | `pending_connection` | `connected_shadow` | `POST /integrations/{connector}/connect` followed by successful asset selection | persist connection metadata, selected assets, scope summary, and health results | connector config under `src/lib/config/connectors.py` | Forbid jump to `bounded_autonomy` before scope review and first-hour audit complete |
| CONN-2 | `connected_shadow` | `draft_only` | `POST /integrations/{connection_id}/promote-autonomy` handled by `TrustRampOrchestrator` | persist policy diff, rate limits, and promotion audit event | policy config under `src/lib/config/policies.py` | Forbid if connector health is failing or kill switch is active |
| CONN-3 | `draft_only` | `bounded_autonomy` | promotion request after review of draft outputs | persist final allowed actions and revoke token checkpoints | policy config under `src/lib/config/policies.py` | Forbid if required evidence thresholds for content or strategy are not met |
| CONN-4 | `connected_shadow` or `draft_only` or `bounded_autonomy` | `revoked` | revoke endpoint or kill switch action | stop future side effects, checkpoint active runs, emit alert | policy config under `src/lib/config/policies.py` | Forbid any further publish/post actions until a new connection is approved |
| GROW-1 | `planned` | `executing` | weekly scheduler or `first_hour_audit` releases a growth hypothesis to `ExperimentPlannerWorker` | create hypothesis row, baseline snapshot, and experiment brief | `src/lib/config/growth.py` | Forbid if no baseline metric or evidence objects exist; set `blocked_growth_evidence` |
| GROW-2 | `executing` | `reported` | `ReporterWorker` posts summary after evaluator completion | persist report row, metric snapshot, postmortem, and recommendations | `src/lib/config/growth.py` | Forbid if experiment threshold was not defined at start; mark `invalid_experiment_design` |
| HIRE-1 | `captured` | `stage_ready` | `HiringStageOrchestrator` builds take-home, panel, or founder workspace | create stage artifact checklist and deadline metadata | `docs/context/2026-03-06-revenuecat-role-brief.md` | Forbid entry if deadline, output format, or prompt bundle is missing |

### Delivery roadmap and vertical slice strategy

- Treat this implementation plan as the full-system contract and `docs/plans/2026-03-07-revenuecat-agent-roadmap.md` as the build-order contract.
- Critical-path principle:
  - ship the smallest public system that proves the job can be done
  - delay connected-asset onboarding and broad autonomy until the public application and first-week proof pack are strong
- Vertical-slice rule:
  - every slice must end in a demoable artifact, not just new abstractions
  - every slice must reduce hiring risk directly by improving one of: application quality, proof of product fluency, growth evidence, weekly operating credibility, or hiring-stage readiness
- Enforced priority order:
  - strategy kernel and scoring
  - source ingest and knowledge primitives
  - public application and evidence bundle
  - RevenueCat proof artifacts
  - weekly operating loop
  - trust-ramped connected mode
  - interview and founder modes
- Non-goal for the roadmap:
  - do not parallelize too early across infra and broad product surfaces if it delays the public 80/20 package

## Work Plan (ordered, checkable, with artifacts)

Phase 1: Foundation and evaluation model

1. [ ] Phase 1A. Discovery, source capture, and scoring model
   - Objective: create durable source snapshots plus the evidence, knowledge, growth-input, and strategy-quality models so the build is self-contained and measurable.
   - Artifact paths: `docs/context/2026-03-06-revenuecat-role-brief.md`, `src/lib/config/content.py`, `src/lib/config/growth.py`, `src/lib/config/knowledge.py`, `src/lib/config/strategy.py`, `src/workflows/ingest_sources.py`, `src/lib/evidence/scoring.py`
   - Dependencies/prerequisites: none beyond the current role brief and approved public docs.
   - Risk notes: if the evidence and knowledge schemas are weak, later content, hiring-stage context, and growth evaluation will become subjective and noisy.
   - Verification for that step: confirm role brief snapshot can be parsed into source records, evidence items, concept cards, cited paragraphs, strategy briefs, and opportunity candidates; confirm strategy scorecards reject unsupported recommendations and that weighted opportunity scoring is deterministic.

2. [ ] Phase 1B. Repository skeleton and runtime foundation
   - Objective: establish the Python project, dependency management, FastAPI service, Temporal workers, base package layout, TypeScript operator web app shell, and hybrid local-development workflow.
   - Artifact paths: `pyproject.toml`, `uv.lock`, `src/api/main.py`, `src/workers/__init__.py`, `src/lib/config/settings.py`, `apps/operator-web/package.json`, `apps/operator-web/src/app/`, `docker-compose.yml`, `infra/render/`, `docs/ops/local-development.md`, `scripts/dev/bootstrap_local.sh`, `scripts/dev/run_local_smoke.sh`, `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md`
   - Dependencies/prerequisites: step 1 complete.
   - Risk notes: weak package boundaries at this stage will create duplicated logic later.
   - Verification for that step: API health endpoint responds locally, Temporal worker boots against the local Temporal container, web app shell renders through bun, config loads without secrets committed, local bootstrap scripts work, Render service definitions validate, and the blueprint still matches the implemented screens and surfaces.

3. [ ] Phase 1C. Persistence, artifact model, and analytical runtime
   - Objective: add Postgres schema, migration tooling, object storage abstraction, and DuckDB-based analytical runtime for experiment analysis.
   - Artifact paths: `migrations/0001_initial.py`, `src/lib/storage/db.py`, `src/lib/storage/artifacts.py`, `src/lib/analytics/duckdb_runtime.py`, `src/models/*.py`
   - Dependencies/prerequisites: step 2 complete.
   - Risk notes: task-state, evidence, and connector schema mistakes are expensive to unwind after workflows depend on them.
   - Verification for that step: migrations apply cleanly; task, artifact, evidence, and metric rows round-trip in tests; analytical runtime can read exported metrics and produce deterministic summaries.

4. [ ] Phase 1D. Core shared helpers and policy guardrails
   - Objective: build reusable LLM client, citation grounding, evidence scoring, experiment design, policy guard, connector base classes, and structured logging.
   - Artifact paths: `src/lib/llm/client.py`, `src/lib/citations/grounding.py`, `src/lib/evidence/scoring.py`, `src/lib/experiments/design.py`, `src/lib/knowledge/retrieval.py`, `src/lib/knowledge/concept_cards.py`, `src/lib/knowledge/briefing_packs.py`, `src/lib/policies/guard.py`, `src/lib/connectors/base.py`, `src/lib/logging.py`
   - Dependencies/prerequisites: steps 2 and 3 complete.
   - Risk notes: if these helpers are leaky, every worker will encode policy and quality behavior differently.
   - Verification for that step: unit tests prove deterministic structured-output parsing, guard enforcement, evidence scoring, hybrid retrieval ranking, and briefing-pack generation.

5. [ ] Phase 1E. Hybrid knowledge and memory layer
   - Objective: build the retrieval, memory, concept-card, benchmark, and hiring-stage briefing-pack system that keeps GrowthCat accurate and consistent across runs.
   - Artifact paths: `src/workflows/build_concept_cards.py`, `src/workflows/build_briefing_packs.py`, `src/workflows/run_knowledge_freshness_audit.py`, `src/models/concept_card.py`, `src/models/briefing_pack.py`, `tests/e2e/test_knowledge_readiness.py`
   - Dependencies/prerequisites: steps 1 through 4 complete.
   - Risk notes: if the knowledge layer is too shallow, GrowthCat will be slow and inconsistent; if it is too raw, later stages will become noisy and expensive.
   - Verification for that step: knowledge readiness checks pass for application, take-home, panel, and founder packs; stale concept cards trigger rebuilds correctly.

Phase 2: Public proof of work and application

6. [ ] Phase 2A. RevenueCat proof-of-competence pack
   - Objective: build public artifacts that demonstrate actual product fluency rather than generic thought leadership, while also establishing a distinctive public identity.
   - Artifact paths: `examples/revenuecat-demo-app/`, `examples/revenuecat-webhook-demo/`, `docs/public/revenuecat-agent-readiness-review.md`, `docs/public/first-30-day-artifact-map.md`, `src/lib/config/voice.py`, `tests/e2e/test_revenuecat_demo_pack.py`
   - Dependencies/prerequisites: steps 1 through 5 complete.
   - Risk notes: if the demos are superficial or the identity feels generic, the application will still look interchangeable with other candidates.
   - Verification for that step: demo artifacts build locally, source claims are grounded, the readiness review produces concrete product/documentation feedback items, and voice-profile linting confirms consistent public tone and disclosure.

7. [ ] Phase 2B. Application microsite and proof-pack publication workflow
   - Objective: implement the end-to-end flow that researches approved sources, drafts the application letter, assembles the proof pack, evaluates it, and publishes it.
   - Artifact paths: `src/workflows/apply_for_role.py`, `src/workflows/build_proof_pack.py`, `src/workflows/build_operator_replay.py`, `src/workflows/build_application_evidence_bundle.py`, `src/workflows/publish_public_letter.py`, `site/templates/application.html`, `site/templates/proof-pack.html`, `site/templates/operator-replay.html`, `site/data/operator-replay.json`, `src/evals/application_letter.py`, `tests/e2e/test_application_letter_flow.py`, `tests/e2e/test_operator_replay_page.py`
   - Dependencies/prerequisites: steps 1 through 6 complete.
   - Risk notes: the published artifact is both the hiring deliverable and the first public demonstration of the platform.
   - Verification for that step: end-to-end test produces a local preview microsite, citation manifest, proof-pack checklist, deterministic operator-replay artifact, and publication output without unsupported claims.

8. [ ] Phase 2C. Careers-page submission automation and fallback package
   - Objective: automate URL submission to the RevenueCat careers page with safe duplicate protection and evidence capture.
   - Artifact paths: `src/workflows/submit_careers_application.py`, `src/lib/browser/session.py`, `tests/e2e/test_careers_submission_flow.py`, `docs/ops/careers-submission-fallback.md`
   - Dependencies/prerequisites: step 7 complete and credentials available.
   - Risk notes: anti-bot defenses can block full automation; duplicate-submission risk must be explicitly managed.
   - Verification for that step: mock submission passes, duplicate submission is blocked, and challenge flow produces a fallback package.

Phase 3: Quality, distribution, and weekly-output engine

9. [ ] Phase 3A. Content quality, novelty, and benchmark system
   - Objective: add duplication prevention, content routing, SEO/AEO/GEO validators, benchmark corpus scoring, and post-publish learning loops.
   - Artifact paths: `src/workflows/validate_content.py`, `src/workflows/route_content_candidate.py`, `src/workflows/review_post_publish.py`, `src/lib/content/novelty.py`, `src/lib/content/benchmarking.py`, `src/lib/content/quality.py`, `src/lib/config/quality.py`, `tests/e2e/test_content_quality_gates.py`
   - Dependencies/prerequisites: steps 1 through 7 complete.
   - Risk notes: if novelty and benchmark scoring are weak, the agent will still publish category-average content under a stronger label.
   - Verification for that step: duplicated topics are blocked or rerouted, SEO/AEO/GEO checks surface explicit failures, and benchmark scoring rejects weak drafts.

10. [ ] Phase 3B. Weekly advocate workflows and growth engine
   - Objective: implement recurring content, experiment, feedback, community engagement, derivative distribution, canonical answers, trend reporting, and reporting workflows with evidence-backed strategy generation.
   - Artifact paths: `src/workflows/discover_opportunities.py`, `src/workflows/weekly_cycle.py`, `src/workflows/generate_content.py`, `src/workflows/create_feedback_items.py`, `src/workflows/plan_experiment.py`, `src/workflows/run_community_engagement.py`, `src/workflows/build_canonical_answers.py`, `src/workflows/report_community_trends.py`, `src/workflows/report_weekly.py`, `src/evals/growth_strategy.py`, `tests/e2e/test_weekly_cycle.py`
   - Dependencies/prerequisites: steps 3 through 9 complete.
   - Risk notes: trying to automate publishing before the evidence model and interaction-quality scoring are stable would create noisy output or spammy community behavior.
   - Verification for that step: scheduled dry-run generates the target artifact counts, explicit growth hypotheses, derivative content artifacts, canonical answers, meaningful-interaction counts, and a report with traceable source and metric links.

Phase 4: Connected assets and trust-ramped onboarding

11. [ ] Phase 4A. Integration hub and trust ramp
   - Objective: add self-serve connector onboarding, asset selection, health checks, and autonomy-mode promotion so companies can connect assets safely.
   - Artifact paths: `apps/operator-web/src/app/integrations/`, `apps/operator-web/src/app/assets/`, `apps/operator-web/src/app/scope-review/`, `apps/operator-web/src/app/audits/`, `apps/operator-web/src/app/settings/kill-switch/`, `src/connectors/github.py`, `src/connectors/slack.py`, `src/connectors/cms.py`, `src/connectors/analytics.py`, `src/connectors/issues.py`, `src/workflows/first_hour_audit.py`, `tests/e2e/test_connection_shadow_mode.py`, `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md`
   - Dependencies/prerequisites: steps 2 through 4 complete.
   - Risk notes: connector sprawl and inconsistent scope handling are the fastest path to unsafe autonomy.
   - Verification for that step: startup scope audit fails on overly broad creds; shadow mode produces a first-hour audit; promote and revoke flows work without redeploy; blueprint actor-to-surface and screen inventory remain accurate.

Phase 5: Hiring-stage readiness and runtime operations

12. [ ] Phase 5A. Hiring-stage modes and interview console
   - Objective: add take-home mode, panel mode, and founder mode with stage-specific artifact packaging, explicit evaluation rubrics, and screen-share-safe views.
   - Artifact paths: `src/workflows/take_home_mode.py`, `src/workflows/panel_mode.py`, `src/workflows/founder_mode.py`, `src/evals/hiring_stage_rubrics.py`, `apps/operator-web/src/app/panel/`, `apps/operator-web/src/app/founder/`, `tests/e2e/test_hiring_modes.py`
   - Dependencies/prerequisites: steps 4 through 10 complete.
   - Risk notes: if these modes are bolted on later, the live interview experience will feel improvised.
   - Verification for that step: mock 48-hour run, mock live prompt run, founder briefing pack generation, and rubric scoring all succeed with archived evidence.

13. [ ] Phase 5B. Observability, reports, and runtime operations
   - Objective: add traces, metrics, weekly report delivery, run replay tools, and operator runbooks for blocked states and incident response.
   - Artifact paths: `src/observability/events.py`, `src/observability/tracing.py`, `docs/ops/runtime-operations.md`, `docs/ops/policy-escalations.md`, `docs/ops/incident-response.md`, `scripts/replay_run.py`
   - Dependencies/prerequisites: steps 3 through 12 complete.
   - Risk notes: without clear observability, the system will be difficult to defend during interviews and difficult to repair under time pressure.
   - Verification for that step: synthetic failure paths emit structured logs, traces, and actionable Slack exceptions without sensitive data.

14. [ ] Phase 5C. Hosted deployment and readiness review
   - Objective: deploy the control plane, workers, storage integrations, analytical runtime, schedules, and operator web app to Render and run a live dress rehearsal.
   - Artifact paths: `infra/render/render.yaml`, `infra/deploy/README.md`, `docs/ops/production-checklist.md`, `tests/smoke/test_hosted_readiness.py`
   - Dependencies/prerequisites: steps 1 through 13 complete.
   - Risk notes: production differences in Render networking, secrets, browser runtimes, OAuth callbacks, or object-storage permissions can invalidate local assumptions.
   - Verification for that step: hosted smoke test on Render completes health check, source ingest, microsite preview generation, first-hour audit, weekly dry-run report, and private-service communication.

## Verification (choose the smallest set that matches scope)

Baseline:

- [ ] `uv sync`
- [ ] `uv run ruff check .`
- [ ] `uv run mypy src`
- [ ] `uv run pytest`

If API and workflow-heavy:

- [ ] `uv run pytest tests/unit`
- [ ] `uv run pytest tests/integration`
- [ ] `uv run pytest tests/e2e/test_application_letter_flow.py`
- [ ] `uv run pytest tests/e2e/test_careers_submission_flow.py`
- [ ] `uv run pytest tests/e2e/test_weekly_cycle.py`
- [ ] `uv run pytest tests/e2e/test_connection_shadow_mode.py`
- [ ] `uv run pytest tests/e2e/test_hiring_modes.py`

If operator web app is in scope:

- [ ] `cd apps/operator-web && bun install`
- [ ] `cd apps/operator-web && bun run lint`
- [ ] `cd apps/operator-web && bun run typecheck`
- [ ] `cd apps/operator-web && bun run test`
- [ ] `cd apps/operator-web && bun run test:e2e`

If validating the hybrid local stack:

- [ ] `cp .env.example .env`
- [ ] `./scripts/dev/bootstrap_local.sh`
- [ ] `uv sync`
- [ ] `uv run uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000`
- [ ] `uv run python -m src.workers.temporal_worker`
- [ ] `cd apps/operator-web && bun install && bun run dev`
- [ ] `./scripts/dev/run_local_smoke.sh`

If browser automation is in scope:

- [ ] `uv run playwright install chromium`
- [ ] `uv run pytest tests/e2e -m browser`

If ready for hosted smoke validation:

- [ ] `docker compose up --build`
- [ ] `uv run pytest tests/smoke/test_hosted_readiness.py`
- [ ] Render preview deploy succeeds for API, worker, and operator web services

Manual QA (map to journeys):

- [ ] Journey 1 happy path: start `apply_for_role`, inspect generated microsite and proof pack, confirm stable public URL, and confirm stored submission receipt.
- [ ] Journey 1 edge case: simulate CAPTCHA or anti-bot challenge and confirm fallback package plus single actionable operator task.
- [ ] Microsite easter egg check: open `/operator-replay`, confirm it is discoverable but subtle, fully read-only, deterministic, and showcases a sample content brief, experiment brief, feedback item, and weekly report slice with evidence links.
- [ ] Journey 2 happy path: connect GitHub and Slack in shadow mode, run first-hour audit, review opportunity list, and promote one connector set to draft-only mode.
- [ ] Journey 2 edge case: revoke a connector mid-run and confirm side-effecting actions stop while checkpoints are preserved.
- [ ] Journey 3 happy path: trigger a mock take-home run and confirm packaged outputs, citations, and deadline metadata are preserved.
- [ ] Journey 3 edge case: run panel mode with screen share constraints and confirm no secret-bearing values appear in the live console.
- [ ] Local stack happy path: bootstrap Docker infra, start API, worker, and operator UI on the host, then confirm `healthz`, `config-summary`, and `/api/health` all respond.
- [ ] Local stack edge case: stop Temporal locally and confirm the worker fails loudly without crashing the API or operator UI.
- [ ] Growth quality check: submit a strategy with no baseline metric and confirm evaluator blocks it before publication.
- [ ] Opportunity-discovery check: run the weekly planner with RevenueCat public sources plus mock DataForSEO inputs and confirm it ranks candidates deterministically, exposes score components, and avoids promoting low-confidence ideas to flagship work.
- [ ] Community quality check: simulate a week of outbound engagement and confirm 50+ meaningful interactions are tracked without violating per-channel caps or quality gates.
- [ ] Identity check: review the application microsite, proof pack, and derivative outputs and confirm the voice profile remains consistent and disclosed correctly.
- [ ] Content quality check: attempt to publish a duplicate or low-novelty topic and confirm the routing layer sends it to docs PR, canonical answer, or derivative-only mode instead of a flagship article.
- [ ] SEO/AEO/GEO check: validate a flagship article and confirm metadata, extractable passages, FAQ or comparison blocks, schema, and citation signals all pass before publication.
- [ ] Knowledge readiness check: rebuild application, take-home, panel, and founder briefing packs and confirm they include fresh source snapshots, concept cards, and benchmark references.
- [ ] Surface map check: compare implemented pages, notifications, and actor permissions against `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md` and confirm there are no hidden steps or undocumented surfaces.
- [ ] RevenueCat-side end-state check: verify that hiring reviewers can evaluate the application through public artifacts only, and that routine post-onboarding work can be consumed through Slack, GitHub, CMS, and the issue tracker without requiring the operator web app.

Observability:

- [ ] All runs emit `task_created`, `evidence_collected`, `draft_generated`, `artifact_published`, and failure events with run IDs.
- [ ] Growth artifacts include evidence counts, baseline metrics, targets, confidence scores, and stop conditions.
- [ ] External-action logs include connector name and retry count but no secrets.
- [ ] Submission artifacts include screenshot plus response metadata.
- [ ] Weekly report counts reconcile against persisted task outcomes and metric snapshots.
- [ ] Kill-switch activation and connector revocation create explicit audit events.
- [ ] Hiring-stage runs emit rubric scores and attach them to archived artifacts.
- [ ] Blueprint-linked surfaces and state names reconcile with emitted run events and UI labels.
- [ ] Render service logs show healthy API, worker, and operator web processes with expected environment wiring.

## Risks and Mitigations

- Risk: careers page blocks browser automation with CAPTCHA or bot detection.
  - Detection: submission workflow enters `blocked_submission` with captured screenshot and page metadata.
  - Mitigation: build a fallback package that pre-fills the URL and preserves evidence so the operator only resolves the blocking challenge.
  - Rollback/fallback: mark application submission as operator-assisted for that single step while preserving all other autonomous behavior.
- Risk: published application letter, proof pack, or weekly content contains unsupported claims.
  - Detection: evaluator flags low citation coverage or missing claim mappings.
  - Mitigation: block publication until claim grounding passes threshold and source links are attached.
  - Rollback/fallback: unpublish or supersede the artifact and emit a correction run.
- Risk: the agent republishes an idea RevenueCat or a competitor already covered without adding a new angle.
  - Detection: novelty registry classifies the draft as duplicate or low-delta against internal and competitor corpus entries.
  - Mitigation: reroute the candidate into refresh, docs update, canonical answer, or derivative-only path instead of flagship publication.
  - Rollback/fallback: archive the blocked draft and attach the overlap analysis to the planning run.
- Risk: growth strategies are generic, vanity-metric-driven, or not falsifiable.
  - Detection: evaluator flags missing baseline, target metric, confidence, or stop condition.
  - Mitigation: require evidence objects and experiment design before any strategy is marked ready.
  - Rollback/fallback: downgrade the output to exploratory notes rather than a recommended strategy.
- Risk: the system demonstrates the application flow but not the actual job loop.
  - Detection: proof pack or weekly dry-run fails to produce target artifacts or cannot map outputs to the role requirements.
  - Mitigation: keep first-week outputs and RevenueCat-specific proof artifacts in phase 1 scope.
  - Rollback/fallback: narrow public claims about autonomy and present the system as semi-autonomous until the weekly loop is stable.
- Risk: connector scopes are too broad or leaked into prompts.
  - Detection: startup scope audit fails; secret scanners and prompt redaction checks trigger in CI.
  - Mitigation: load secrets only at connector boundary, store only metadata in DB, and require scoped service accounts or OAuth installs per connector.
  - Rollback/fallback: revoke affected creds, rotate secrets, and disable external actions until audit passes.
- Risk: social channels require manual login or trigger anti-bot controls.
  - Detection: connector health or posting attempts classify the channel as manual-assist-only.
  - Mitigation: support a dedicated manual-login browser profile with explicit operator ownership and keep the connector in assisted mode.
  - Rollback/fallback: disable autoposting for that channel and continue draft generation only.
- Risk: the agent sounds generic or inconsistent across the application letter, proof pack, and public posts.
  - Detection: voice-profile evaluation flags tone drift, weak differentiation, or missing disclosure language.
  - Mitigation: version the voice profile, lint public artifacts against it, and require a differentiation block in the microsite.
  - Rollback/fallback: downgrade low-confidence outputs to draft-only and regenerate with tighter prompt and style constraints.
- Risk: scope expands into a generalized agent platform before the application is finished.
  - Detection: work-plan artifacts drift away from application submission, proof pack, trust ramp, or hiring-stage readiness.
  - Mitigation: require every new task to map to a stated success criterion.
  - Rollback/fallback: freeze new connector work and complete the application and proof-pack workflows first.
- Risk: hosted environment behaves differently from local browser, OAuth, or storage assumptions.
  - Detection: hosted smoke test fails despite local pass.
  - Mitigation: create environment parity through containerized browser runtime, explicit callback URLs, and infrastructure definitions.
  - Rollback/fallback: keep a stable staging environment and do not run live submission or partner demos from ad hoc laptops.

## Open Questions (blocking vs non-blocking)

- [ ] (Blocking) Which public publishing target is approved for the application microsite: GitHub Pages, personal domain, or another public site? Owner: operator. Needed by: before step 7.
- [ ] (Blocking) Does the RevenueCat careers page include CAPTCHA, rate limiting, or other anti-bot measures that require special handling? Owner: operator via discovery run. Needed by: before step 8 live execution.
- [ ] (Blocking) Which connector should receive weekly reports during MVP: Slack, Notion, or email? Owner: operator. Needed by: before step 10.
- [ ] (Blocking) Which issue tracker target should structured product feedback use in MVP: local markdown artifacts, GitHub issues, or Linear/Jira? Owner: operator. Needed by: before step 10.
- [ ] (Blocking) Which minimal connected analytics sources can be supported in phase 1: RevenueCat Charts export, Google Analytics, PostHog, or warehouse CSVs? Owner: operator. Needed by: before step 11.
- [ ] (Blocking) Which exact public handles and domain slugs will `GrowthCat` use across the application microsite, GitHub, and social distribution? Owner: operator. Needed by: before step 6.
- [ ] (Blocking) Which 5 to 10 query clusters should flagship SEO/AEO/GEO content target first: agentic app monetization, RevenueCat setup, agent-built paywalls, Charts workflows, or others? Owner: operator. Needed by: before step 9.
- [ ] (Blocking) Which DataForSEO endpoints and quota budget are approved for phase 1 opportunity discovery: Labs only, Labs plus SERP, or full Labs plus SERP plus AI Optimization plus Content Analysis? Owner: operator. Needed by: before step 1 live execution.
- [ ] (Blocking) Which public analytics stack will measure our own published artifacts before private RevenueCat access exists: Google Search Console plus GA4, Search Console plus PostHog, or another combination? Owner: operator. Needed by: before step 7.
- [ ] (Non-blocking) Should the public application artifact be a single long-form microsite or a microsite with separate supporting evidence pages? Owner: operator. Needed by: before public polish pass.
- [ ] (Non-blocking) Should community engagement remain draft-only until after the application is submitted? Owner: operator. Needed by: before step 10 live execution.
- [ ] (Non-blocking) Which one or two social channels are worth supporting first after application submission: X, GitHub Discussions, or Discord? Owner: operator. Needed by: before step 10 live execution.

## Definition of Done

- [ ] Primary journeys match expected UX and state transitions.
- [ ] Top edge journeys are handled with clear next steps, manual-assist fallbacks, and resumable checkpoints.
- [ ] Verification section is completed for the chosen scope.
- [ ] No duplicated helpers exist for model calls, citations, evidence scoring, experiment design, policies, or connector wrappers.
- [ ] No hardcoded origins, credentials, or unsafe connector scopes exist.
- [ ] Docs are updated for runtime operations, trust-ramp promotion, submission fallback, incident response, and policy escalations.
- [ ] Public application microsite is live at a stable URL.
- [ ] Public first-week proof pack is live and linked from the microsite.
- [ ] Public artifacts use a consistent named agent identity, voice profile, and disclosure language.
- [ ] Careers-page submission is completed or a blocked-submission fallback package is archived with evidence.
- [ ] Weekly dry-run produces the required artifact counts and one delivered report.
- [ ] RevenueCat proof-of-competence artifacts build and pass their verification steps.
- [ ] A company can connect at least GitHub and Slack through the operator app, run a first-hour audit in shadow mode, and promote or revoke autonomy without engineering help.
- [ ] All growth strategies stored by the system include evidence objects, baseline metrics, target metrics, confidence, and stop conditions.
- [ ] Weekly plans are produced from stored opportunity candidates with score breakdowns, lane selection, and explicit rationale.
- [ ] Weekly operations can generate and track quality-gated meaningful-interaction counts, derivative content outputs, canonical answers, and community trend reports.
- [ ] Joint initiatives with human teammates can be proposed, tracked, and reported through the system.
- [ ] Hiring-stage artifacts include rubric-based evaluations for application review, take-home, panel, and founder stages.
- [ ] Knowledge readiness checks pass for application, take-home, panel, and founder briefing packs with fresh source snapshots and concept-card coverage.
- [ ] Flagship content artifacts pass novelty, technical correctness, SEO, AEO, GEO, and benchmark gates before publication.
- [ ] Duplicate or low-delta ideas are rerouted appropriately instead of being published as new flagship content.
- [ ] Post-publish reviews feed performance and referenceability signals back into planning, topic selection, and benchmark updates.
- [ ] All external actions are audit-logged and traceable to task runs, source snapshots, evidence objects, and policy events.
