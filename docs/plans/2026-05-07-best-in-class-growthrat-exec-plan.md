# Make GrowthRat a best-in-class RevenueCat advocate agent

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

If a repository-level `PLANS.md` exists, this plan follows it. If not, this plan follows the global `exec-plan` skill.

## Purpose / Big Picture

GrowthRat should become a working autonomous developer advocate and growth agent for RevenueCat, not just a public application website.

After this plan is implemented, RevenueCat should be able to treat GrowthRat as an async teammate:

1. RevenueCat representatives sign in and connect RevenueCat-owned services.
2. GrowthRat scans docs, SDKs, community signals, search demand, analytics, and past experiment results.
3. GrowthRat scores opportunities and proposes weekly work in Slack.
4. GrowthRat generates technical content, growth experiments, community replies, and structured product feedback.
5. RevenueCat approves sensitive external actions in Slack.
6. GrowthRat distributes approved work, measures results, and reports learnings back in Slack.
7. The operator has a break-glass view for failures, logs, costs, traces, and recovery, but does not need to manage daily work.

The immediate goal is to win the RevenueCat Agentic AI Advocate hiring process by showing real product judgment and useful pre-hire work. The durable commercial goal is to turn GrowthRat into a developer-advocacy and growth operating system for devtool/API companies.

## Progress

- [x] (2026-05-07T08:27:23Z) Created this ExecPlan from the current repo state, RevenueCat role brief, PRD, roadmap, production smoke evidence, and synthesized product direction.
- [x] (2026-05-07T09:10:00Z) Added D1 run-ledger, opportunity, approval-request, report-delivery schema and best-effort runtime helpers.
- [x] (2026-05-07T09:20:00Z) Wired weekly planning to scored opportunities, added approval requests for gated distribution, and mirrored weekly/chat traces to optional Langfuse.
- [x] (2026-05-07T09:30:00Z) Made Slack a stronger client surface with opportunity, plan/report, approve, reject, stop, and resume commands.
- [x] (2026-05-07T09:40:00Z) Published the full application letter routes and added the RevenueCat Agent Monetization Benchmark artifact.
- [x] (2026-05-07T10:39:18Z) Applied `0006_run_ledger_observability.sql` to remote D1 through the Cloudflare API and verified the new tables plus `d1_migrations` row.
- [x] (2026-05-07T11:05:52Z) Deployed current `main` to Cloudflare Worker
  version `26263bc7-52e8-47fc-80f7-644572652efa`, set
  `GROWTHRAT_CONNECTOR_ENCRYPTION_KEY`, and verified live activation,
  application, benchmark, and protected opportunity endpoints.
- [x] Publish the full application letter at a public stable URL.
- [x] Add Langfuse-based LLM/agent tracing while keeping D1/R2 as the canonical run ledger.
- [x] Build the run ledger, opportunity engine, Slack operating loop, approval flow, and first approval-backed measurement hooks.
- [x] Ship a pre-hire value asset for RevenueCat: the RevenueCat Agent Monetization Benchmark.

## Surprises & Discoveries

- Observation: The repo roadmap and activation docs currently describe the new connected-account runtime as deployed, but the live Worker has been observed serving stale activation output.
  Evidence: On 2026-05-07, `curl -sS https://growthrat.kirso.workers.dev/api/activation | jq '{hasConnectors: has("connectors"), missing: .secrets.missing}'` returned `hasConnectors: false` and included `TYPEFULLY_API_KEY` in missing secrets.
  Resolution: Later on 2026-05-07, Worker version `26263bc7-52e8-47fc-80f7-644572652efa` was deployed and `/api/activation` returned the connected-account model with no missing platform secrets and no `TYPEFULLY_API_KEY`.

- Observation: The full application letter exists in `docs/public/application-letter.md`, but the routed public page `/application` is an abbreviated content-page summary, not the full letter the application form asks for.
  Evidence: `docs/public/application-letter.md` starts with `# I Already Did The Job. Here's The Proof.` while `src/content/pages.ts` defines `/application` with a shorter section-based page.

- Observation: The current weekly planner is not yet a real idea engine.
  Evidence: `src/lib/pipeline.ts` currently chooses from fixed seed topics plus optional DataForSEO keyword ideas in `planTopics`.

- Observation: Slack exists as a command/event receiver, but it is not yet the product's primary client operating surface.
  Evidence: `src/lib/slack.ts` supports `help`, `status`, `plan`, `report`, `write`, `stop`, and `resume`; reaction events are recorded but do not promote drafts into approved distribution actions.

- Observation: This repo does not define `env.production` in `wrangler.jsonc`.
  Evidence: `wrangler secret put ... --env production` targeted a new
  `growthrat-production` Worker. The accidental Worker was deleted, and the
  secret was set on `growthrat` without `--env`.

## Decision Log

- Decision: Use Langfuse for immediate agent/LLM observability.
  Rationale: Langfuse Cloud Hobby is fast to adopt, has a useful free tier for interview proof, and provides trace/session/prompt/eval visibility without running our own service. D1/R2 still remain canonical so GrowthRat is not dependent on Langfuse for correctness.
  Date/Author: 2026-05-07 / Codex

- Decision: Keep Phoenix as a later optional self-hosted path, not the first observability dependency.
  Rationale: Phoenix OSS is attractive for control and zero vendor limits, but it requires hosting, storage, upgrades, and private access control. That is unnecessary before the application package and closed-loop advocate product are real.
  Date/Author: 2026-05-07 / Codex

- Decision: Treat RevenueCat as the client/employer, GrowthRat as the autonomous worker, and the operator as break-glass support.
  Rationale: The product must not be operator-centric. RevenueCat should connect services, set goals, approve sensitive actions, chat with GrowthRat, and receive reports. The operator should handle setup, interviews, infrastructure incidents, and exceptional judgment calls.
  Date/Author: 2026-05-07 / Codex

- Decision: The Run Ledger in D1/R2 is the source of truth; Langfuse is a trace mirror.
  Rationale: Future RevenueCat traces may include private context, but product correctness, auditability, approval state, and reporting must survive external observability outages or free-tier limits.
  Date/Author: 2026-05-07 / Codex

- Decision: The strongest pre-hire asset is the RevenueCat Agent Monetization Benchmark.
  Rationale: It delivers value to RevenueCat before hire by testing how well agents can build working subscription flows with RevenueCat docs, SDKs, MCP, and Test Store, then converting failures into useful docs/product/growth feedback.
  Date/Author: 2026-05-07 / Codex

## Outcomes & Retrospective

Implementation now covers the missing product loop: scored opportunities, run ledger, approval records, Slack commands, optional Langfuse traces, and a public benchmark asset. Remote D1 has the new schema. The live Cloudflare Worker now serves the current code and reports the connected-account activation model with both platform secrets configured. Remaining `rc_live` work is RevenueCat-owned connector activation, optional Langfuse secrets, Pipeline R2 sink configuration, and post-hire approval-policy validation.

## Context and Orientation

GrowthRat is an autonomous developer-advocacy and growth agent applying to RevenueCat's Agentic AI Advocate role. The job asks for an agent that can publish content, run experiments, engage communities, submit structured product feedback, and report weekly with a high degree of autonomy.

Current stack:

- `src/`: active Astro, Svelte, and Cloudflare Worker runtime.
- `src/worker.ts`: custom Worker entrypoint, Cloudflare Agent class, Workflow class, queue handler, and scheduled handler.
- `src/lib/pipeline.ts`: current weekly advocate loop, content/topic planning, feedback item creation, artifact creation, distribution queueing, and take-home task shim.
- `src/lib/experiments.ts`: experiment records, variants, assets, tracking events, metric snapshots, readouts, and weekly seeded experiment.
- `src/lib/slack.ts`: Slack config, request signing, commands, and basic event handling.
- `src/lib/community.ts`: community signal scanner, currently GitHub issue focused.
- `src/lib/connected-accounts.ts`: RevenueCat, Slack, CMS, GitHub, Postiz, DataForSEO, and X connected-account credential storage/verification.
- `src/lib/activation.ts`: public activation snapshot and protected request authorization.
- `docs/product/2026-03-13-growthrat-prd.md`: canonical PRD.
- `ROADMAP.md`: current roadmap and live production truth.
- `docs/ops/cloudflare-activation-checklist.md`: go-live checklist and latest production smoke evidence.

Important terms:

- RevenueCat representative: an authorized RevenueCat person who signs in, connects services, sets goals/policies, approves sensitive actions, and receives reports.
- Operator: the human partner for setup, interviews, manual intervention, infrastructure recovery, and exceptional judgment.
- GrowthRat: the autonomous agent that does advocacy and growth work.
- Run Ledger: the canonical D1/R2 record of every meaningful agent decision, source, artifact, approval, side effect, metric, and learning.
- Langfuse trace: an observability mirror for model calls, prompt versions, retrieval context, costs, latency, and agent sessions.
- `interview_proof`: public proof mode with no live RevenueCat side effects.
- `rc_live`: RevenueCat-owned live operation after connected accounts, approval policy, rate limits, budget limits, and kill switch are verified.

## Target Architecture

The target product has three surfaces.

First, RevenueCat-facing operation:

- Slack is the primary day-to-day interface.
- RevenueCat representatives ask for status, propose work, approve publishing, request experiments, and receive weekly reports.
- `/sign-in`, `/onboarding`, `/dashboard`, `/experiments`, and future client pages support account connection and inspection.

Second, autonomous agent runtime:

- Cloudflare Workflows own weekly cadence and long-running runs.
- Cloudflare Queues own bursty or slow async jobs.
- D1 owns relational state: runs, opportunities, artifacts, experiments, feedback, approvals, connector state, reports, and policy counters.
- R2 owns immutable run bundles, source snapshots, proof artifacts, report bundles, and benchmark artifacts.
- Vectorize owns retrieval over RevenueCat docs and GrowthRat proof sources.
- Workers AI and AI Gateway own model execution and rate/cost/policy routing.
- Langfuse receives sampled traces for model calls, retrieval, prompts, and decision spans.

Third, operator break-glass:

- Operator can inspect failed jobs, connector errors, traces, provider outages, policy blocks, and costs.
- Operator can pause/resume automation and rotate platform secrets.
- Operator should not be needed to run the weekly advocacy loop once RevenueCat access exists.

High-level data flow:

```text
RevenueCat docs, SDK repos, GitHub, X/forums, search demand, Postiz, RC Charts
  -> signal scanners
  -> D1 opportunities + R2 source snapshots
  -> opportunity scorer
  -> weekly plan
  -> Slack proposal
  -> content/experiment/feedback/community generation
  -> quality gates + approval request
  -> approved distribution through CMS/GitHub/Postiz/community connectors
  -> events + external metrics + RevenueCat metrics
  -> experiment readout
  -> weekly Slack report
  -> next-week opportunity scoring
```

Observability flow:

```text
Every run/event/approval/metric
  -> D1 Run Ledger
  -> R2 immutable bundle for larger payloads
  -> Langfuse trace mirror for model/retrieval/debug visibility
  -> Slack report summary for RevenueCat
```

## Plan of Work

### Milestone 0: Reset production truth and application readiness

This milestone fixes the credibility risk. RevenueCat must not see stale Typefully output, missing connector state, or an abbreviated application letter.

Files and work:

- `src/content/pages.ts`: either replace `/application` with the full application letter content or add a clear `/application-letter` page backed by `docs/public/application-letter.md`.
- `src/pages/[...slug].astro`: add support for rendering the full Markdown-backed application letter if needed.
- `README.md`, `ROADMAP.md`, and `docs/ops/cloudflare-activation-checklist.md`: update deployment truth after the live Worker is actually redeployed and verified.
- Cloudflare deployment: keep using the real `growthrat` Worker target,
  deploy current `main`, set `GROWTHRAT_CONNECTOR_ENCRYPTION_KEY`, and verify
  `/api/activation` has the new connected-account model.

Acceptance:

- `https://growthrat.kirso.workers.dev/api/activation` returns a `connectors` array.
- Activation no longer mentions `TYPEFULLY_API_KEY`.
- `https://growthrat.kirso.workers.dev/api/auth/session` returns JSON, not `302 /`.
- Full public application letter is reachable at a stable URL.
- Application-form links all open from a clean browser.

### Milestone 1: Make roles and client experience explicit

This milestone prevents the product from becoming operator-centric.

Files and work:

- `docs/product/2026-03-13-growthrat-prd.md`: add a "Roles and Operating Model" section that states:
  - GrowthRat is the autonomous advocate.
  - RevenueCat is the client/employer and connects services.
  - RevenueCat communicates primarily through Slack and receives reports/results.
  - Operator is break-glass/manual-intervention support.
- `src/content/pages.ts`: update public product-truth pages to reflect the same role model.
- `src/components/ConnectorConsole.svelte`: ensure copy says RevenueCat representatives connect RevenueCat-owned services after approval.
- Future client page: add `/client` or strengthen `/dashboard` as the RevenueCat-facing surface, while keeping raw internals separate for operator-only use.

Acceptance:

- A reviewer can explain the roles after reading one page.
- No public copy implies the operator runs weekly work manually.
- No public copy implies GrowthRat already has RevenueCat private access.

### Milestone 2: Add Run Ledger and Langfuse observability

This milestone makes GrowthRat inspectable. RevenueCat should be able to ask "why did you do this?" and get a traceable answer.

Files and work:

- Add migration `migrations/0006_run_ledger_observability.sql` with tables:
  - `agent_runs`: one row per weekly run, Slack request, benchmark run, take-home task, or manual prompt.
  - `agent_run_events`: append-only event stream with `run_id`, `event_type`, `actor`, `status`, `source_ids_json`, `detail_json`, `cost_usd`, and `latency_ms`.
  - `opportunities`: scored backlog items for content, experiments, feedback, or community work.
  - `approval_requests`: approval state for Slack/CMS/GitHub/Postiz/community side effects.
  - `report_deliveries`: Slack report delivery attempts and results.
- Add `src/lib/run-ledger.ts`:
  - `startRun(env, input)`
  - `recordRunEvent(env, input)`
  - `finishRun(env, input)`
  - `listRuns(env, filters)`
  - `getRunDetail(env, id)`
- Add `src/lib/observability/langfuse.ts`:
  - read `LANGFUSE_ENABLED`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, `LANGFUSE_SAMPLE_RATE`
  - create traces/spans for model calls, retrieval, scoring, quality gates, and Slack reports
  - fail open for observability writes, but record observability failure in D1 if possible
- Wire `src/lib/content-draft.ts`, `src/lib/pipeline.ts`, `src/lib/community.ts`, and `src/lib/agent-chat.ts` through run-ledger and Langfuse helpers.
- Update `wrangler.jsonc`, `worker-configuration.d.ts`, `SETUP.md`, and `docs/ops/local-development.md` for Langfuse variables/secrets.

Langfuse references to verify before implementation:

- Langfuse JavaScript/TypeScript SDK docs: https://langfuse.com/docs/sdk/typescript
- Langfuse tracing docs: https://langfuse.com/docs/tracing
- Langfuse pricing/free tier: https://langfuse.com/pricing

Acceptance:

- Every weekly run has a durable `agent_runs` row.
- Every model-backed draft has retrieval, model, cost/latency, and quality-gate events.
- If Langfuse credentials are missing, the app still works and D1 records the run.
- With Langfuse enabled, at least one local/prod run is visible in Langfuse with trace name, run id, model, metadata, and output status.

### Milestone 3: Build the idea and opportunity engine

This milestone makes GrowthRat autonomous in choosing work.

Files and work:

- Add `src/lib/opportunities.ts`:
  - collect candidate ideas from RevenueCat docs, GitHub issues, keyword demand, community signals, prior reports, Postiz analytics, and RevenueCat metric gaps.
  - score ideas across developer pain, RevenueCat fit, technical depth, search/social demand, measurable outcome, effort, risk, confidence, and freshness.
  - write scored opportunities to D1.
- Replace fixed `planTopics` in `src/lib/pipeline.ts` with an opportunity-backed planner.
- Add `/api/opportunities` for authenticated list/create/rescore.
- Add UI section to `/dashboard` or a new `/opportunities` page showing top ideas, why they were selected, sources, and recommended next action.
- Extend `docs/product/2026-03-13-growthrat-prd.md` with opportunity scoring as a core product requirement.

Initial scoring model:

```text
score =
  developer_pain * 0.22
  + revenuecat_fit * 0.20
  + technical_depth * 0.16
  + demand_signal * 0.14
  + measurable_outcome * 0.12
  + freshness * 0.08
  + confidence * 0.08
  - effort_penalty
  - risk_penalty
```

Acceptance:

- A weekly plan can be generated without hardcoded topic seeds.
- Every selected item links back to source evidence and score components.
- Slack `plan` can explain why the agent chose the work.

### Milestone 4: Close the growth experiment loop

This milestone turns experiments from records into learning systems.

Files and work:

- Extend `src/lib/experiments.ts` so experiments can be created from opportunities.
- Add experiment states: `proposed`, `approved`, `running`, `measuring`, `completed`, `inconclusive`, `stopped`.
- Add automatic readout generation from tracked events, manual metrics, Postiz analytics, and RevenueCat chart snapshots.
- Wire Postiz analytics helpers in `src/lib/postiz.ts` into experiment metrics.
- Wire `fetchRevenueCatChartSnapshot` in `src/lib/revenuecat.ts` into weekly readouts when connected.
- Add Slack report sections for:
  - hypothesis
  - variants
  - channel
  - spend/cost
  - primary metrics
  - RevenueCat monetization metrics
  - decision
  - next action

Acceptance:

- A new experiment can be proposed from an opportunity.
- Tracking links are generated for variants.
- At least one metric source can be imported.
- A readout can be generated without manual database edits.
- Weekly Slack report includes the experiment result and next recommendation.

### Milestone 5: Make Slack the RevenueCat operating surface

This milestone makes GrowthRat feel like an async teammate.

Files and work:

- Expand `src/lib/slack.ts` with command router and structured responses:
  - `status`
  - `plan`
  - `opportunities`
  - `experiments`
  - `experiment <id>`
  - `approve <id>`
  - `reject <id> because <reason>`
  - `report`
  - `draft <topic>`
  - `feedback <topic>`
  - `stop`
  - `resume`
- Add approval event handling:
  - Slack reactions/buttons update `approval_requests`.
  - Approval promotes planned distribution actions into executable actions only if policy allows.
  - Rejection stores reason and prevents side effects.
- Add `src/lib/slack-report.ts`:
  - weekly plan message
  - approval request message
  - experiment readout message
  - weekly async report message
- Add tests for Slack signatures, command parsing, approval promotion, and fail-closed behavior.

Acceptance:

- RevenueCat can ask what GrowthRat is doing in Slack.
- RevenueCat can approve/reject a draft in Slack.
- Slack reaction/button approval changes D1 state.
- No external publish action happens in `interview_proof`.
- Missing Slack connector fails closed and records a run event.

### Milestone 6: Finish connected-account activation and side-effect adapters

This milestone makes live operation real after RevenueCat grants access.

Files and work:

- `src/lib/connected-accounts.ts`: harden verification and audit for connector rotation/revocation.
- `src/lib/github.ts`: ensure content commit, docs PR, and feedback issue paths are explicit and tested.
- `src/lib/postiz.ts`: finish draft/schedule/analytics integration and error reporting.
- Add CMS adapter boundary:
  - generic reviewable Markdown export first
  - provider-specific CMS adapter only after RevenueCat names the CMS
- Add X/community connector boundary:
  - storage and search provider abstraction
  - no autonomous sensitive replies
- Add side-effect policy wrapper:
  - all publish/reply/issue actions pass through `enforceSideEffectPolicy`
  - approval id required
  - idempotency key required

Acceptance:

- Connector loss cannot silently publish or report success.
- Connector setup, verification, rotation, and revocation are audit logged.
- Postiz replacement is complete; no Typefully runtime references remain except historical migration notes.
- Side effects require `rc_live`, approval, rate/budget allowance, connector health, and idempotency key.

### Milestone 7: Deliver pre-hire value through the RevenueCat Agent Monetization Benchmark

This milestone is the attention-getting asset.

Build a public benchmark that tests how well autonomous agents can go from a new app idea to a working RevenueCat subscription flow.

Files and work:

- Add `docs/public/benchmarks/revenuecat-agent-monetization-benchmark.md`.
- Add `src/content/articles.ts` entry and public route for the benchmark report.
- Add `docs/blueprints/revenuecat-agent-benchmark-methodology.md`:
  - prompt set
  - agent setup
  - RevenueCat docs/MCP paths used
  - Test Store validation checklist
  - scoring rubric
  - failure taxonomy
- Add `src/lib/benchmark.ts` and D1 tables in the same or later migration if runtime-backed:
  - benchmark runs
  - tasks
  - validation checks
  - failure points
  - recommendations
- Create a GitHub repo or folder for reproducible benchmark assets once the methodology is stable.

Benchmark questions:

- Can an agent map products, entitlements, offerings, and access checks correctly?
- Can an agent use Test Store to validate purchase behavior?
- Can an agent explain when to trust `CustomerInfo`, webhooks, and subscriber reads?
- Which docs paths are enough?
- Where does the agent stall or hallucinate?
- What should RevenueCat publish to make agent adoption easier?

Acceptance:

- Public benchmark report has methodology, results, failure modes, and concrete RevenueCat recommendations.
- It includes a Slack-style report that shows how GrowthRat would communicate value back to RevenueCat.
- It is useful even if GrowthRat is not hired.

### Milestone 8: Upgrade take-home and panel readiness

This milestone prepares for the public hiring process after application review.

Files and work:

- Replace `executeTakeHomeTask` in `src/lib/pipeline.ts` with a real task workflow:
  - decompose prompt
  - create run ledger entry
  - retrieve sources
  - create deliverable plan
  - generate artifacts
  - run quality gates
  - package report
  - post/update Slack if connected
- Add `/api/tasks/:id` and a task detail UI.
- Add panel-console stages:
  - sources retrieved
  - reasoning/plan
  - generated answer
  - quality/confidence
  - follow-up context
- Add fixtures for likely take-home prompts from `docs/interviews/take-home-preparation.md`.

Acceptance:

- A new take-home prompt produces a traceable deliverable package with artifacts, citations, run events, and quality gates.
- Panel console can answer live prompts with visible source/citation state and confidence boundaries.

### Milestone 9: Package commercial product direction without distracting from the job

This milestone lets the product become commercial later while staying focused on RevenueCat now.

Files and work:

- Add a private or public strategy note under `docs/product/`:
  - target category: autonomous developer advocacy and growth OS for devtool/API companies
  - wedge: RevenueCat agent advocate
  - buyer: DevRel/Growth leaders at developer-product companies
  - model: managed autonomous agent first, SaaS later
  - pricing hypothesis
  - security/audit requirements
- Do not add multi-tenant billing or account abstraction before the RevenueCat application is submitted and production truth is fixed.

Acceptance:

- Commercial strategy exists as a doc, but implementation remains single-client/single-agent until the role application is won or rejected.

## Concrete Steps

Run these commands from `/Users/kirso/Developer/ai-growth-agent`.

Baseline:

```bash
git status --short --branch
bun run typecheck
bun run lint
bun run test
bun run build
bun run cf:check
```

Expected: clean branch before edits unless intentionally dirty, and all checks pass. If Cloudflare local warnings appear for remote-only bindings, record exact warning text and whether the command exits successfully.

Production truth check:

```bash
curl -sS https://growthrat.kirso.workers.dev/api/activation | jq '{hasConnectors: has("connectors"), missing: .secrets.missing, gateLabels: [.gates[].label]}'
curl -sS -I https://growthrat.kirso.workers.dev/api/auth/session | sed -n '1,12p'
```

Expected after Milestone 0: `hasConnectors` is `true`, missing platform secrets are the new platform secret model, no `TYPEFULLY_API_KEY`, and `/api/auth/session` returns JSON rather than `302 /`.

Deploy current Worker:

```bash
bunx wrangler deploy --keep-vars
```

Expected: deployment succeeds and the live Worker serves the current `main` runtime.

Set Langfuse secrets:

```bash
bunx wrangler secret put LANGFUSE_PUBLIC_KEY
bunx wrangler secret put LANGFUSE_SECRET_KEY
```

Expected: secrets are set without printing values. `LANGFUSE_BASE_URL` can be a non-secret var if using Langfuse Cloud. If using EU or self-hosted Langfuse, set the corresponding base URL.

Important: this repo has no `env.production` block. Do not pass
`--env production` unless an explicit environment is added to `wrangler.jsonc`;
otherwise Wrangler targets `growthrat-production`.

Apply D1 migrations:

```bash
bunx wrangler d1 migrations apply growthrat --remote
```

Expected: migrations apply once and report already-applied on safe reruns.

Verification after each milestone:

```bash
bun run typecheck
bun run lint
bun run test
bun run build
bun run cf:check
```

Live smoke after deployment:

```bash
curl -sS https://growthrat.kirso.workers.dev/api/runtime
curl -sS https://growthrat.kirso.workers.dev/api/activation
curl -sS https://growthrat.kirso.workers.dev/application-letter
curl -sS https://growthrat.kirso.workers.dev/api/sources
```

Expected: endpoints return current shape, no stale deployment output, and public application letter is reachable.

## Validation and Acceptance

This plan is complete only when these behavior-based checks pass.

Application readiness:

- The public application letter answers the exact RevenueCat prompt.
- Proof links open from a clean browser.
- Public claims separate proof mode from post-hire activation.
- Activation output reflects the current code and connector model.

Autonomous advocate readiness:

- GrowthRat can create a weekly plan from scored opportunities, not fixed seeds.
- GrowthRat can explain why each selected opportunity matters.
- GrowthRat can generate source-grounded content with citations and quality gates.
- GrowthRat can create and measure an experiment.
- GrowthRat can file structured product feedback.
- GrowthRat can draft community replies from source evidence.
- GrowthRat can report the week in Slack.

RevenueCat client readiness:

- RevenueCat representatives can sign in and connect accounts.
- RevenueCat can communicate with GrowthRat in Slack.
- RevenueCat can approve/reject sensitive actions in Slack.
- RevenueCat receives weekly output, metrics, learnings, and next actions.

Operator readiness:

- Operator can inspect failed jobs, policy blocks, provider errors, trace links, costs, and run history.
- Operator can pause/resume or kill switch automation without redeploy.
- Operator is not required for normal weekly execution.

Observability readiness:

- D1/R2 contain complete run records.
- Langfuse shows traceable model/retrieval sessions when enabled.
- Missing Langfuse credentials or Langfuse outage does not break core workflows.
- Slack reports can be generated from the run ledger.

Best-in-class proof:

- RevenueCat Agent Monetization Benchmark is public and useful.
- It produces concrete docs/product/growth feedback RevenueCat can act on before hiring GrowthRat.

## Idempotence and Recovery

Most steps are safe to rerun:

- D1 migrations should be written idempotently and are tracked by Wrangler.
- Source ingestion should upsert by stable source keys and content hashes.
- Vectorize upserts should use deterministic vector ids for source chunks.
- Distribution actions must include idempotency keys.
- Slack report delivery should record attempts and avoid duplicate sends unless explicitly forced.
- Langfuse trace writes are best-effort and can be skipped without corrupting D1/R2 truth.

Recovery notes:

- If deployment fails because of Cloudflare auth, do not mark production work complete. Fix Wrangler auth first.
- If the live Worker serves stale code after deploy, compare `git rev-parse HEAD`, deployment logs, and `/api/activation` shape before continuing.
- If Wrangler tries to target `growthrat-production`, stop and remove
  `--env production`; the active Worker is `growthrat`.
- If Langfuse integration causes Worker build/runtime issues, disable with `LANGFUSE_ENABLED=false` and keep D1 run ledger active.
- If a connector is revoked or fails verification, side effects must fail closed and Slack should report the degraded state.
- If a weekly run partially completes, restart from the run ledger state and avoid duplicating distribution through idempotency keys.

## Artifacts and Notes

Current public proof artifacts:

- `docs/public/application-letter.md`
- `docs/public/guides/revenuecat-for-agent-built-apps.md`
- `docs/public/growth/revenuecat-charts-product-analytics-for-agent-growth.md`
- `docs/public/experiments/week-one-distribution-test.md`
- `docs/public/reports/week-one-async-check-in.md`
- `docs/public/feedback/agent-onboarding-reference-path-gap.md`
- `docs/public/feedback/charts-and-behavioral-analytics-bridge.md`
- `docs/public/feedback/webhook-sync-trust-boundaries.md`
- `docs/public/revenuecat-agent-readiness-review.md`

Resolved production contradiction from the pre-deploy state:

```json
{
  "hasConnectors": false,
  "missing": [
    "REVENUECAT_API_KEY",
    "SLACK_BOT_TOKEN",
    "TYPEFULLY_API_KEY",
    "GITHUB_TOKEN",
    "CMS_API_TOKEN"
  ]
}
```

Verified current-runtime direction:

```json
{
  "hasConnectors": true,
  "platformSecrets": [
    "GROWTHRAT_INTERNAL_SECRET",
    "GROWTHRAT_CONNECTOR_ENCRYPTION_KEY"
  ],
  "connectors": [
    "revenuecat",
    "slack",
    "cms",
    "github",
    "postiz",
    "dataforseo",
    "x"
  ]
}
```

## Interfaces and Dependencies

Repository dependencies:

- Bun scripts in `package.json`.
- Astro 6 and `@astrojs/cloudflare`.
- Svelte 5 interactive components.
- Cloudflare Workers, D1, R2, Queues, Workflows, Durable Objects, Pipelines, Rate Limit bindings, Workers AI, AI Gateway, and Vectorize.
- Postiz Public API for social scheduling/distribution.
- RevenueCat API v2 and Charts/Metrics API access after RevenueCat connects credentials.
- Slack Events API and Web API after RevenueCat connects Slack.
- GitHub API after RevenueCat or the operator connects appropriate repository credentials.
- DataForSEO or equivalent search/keyword provider after credentials are connected.
- Langfuse Cloud Hobby for immediate trace UI and eval/prompt observability.

External docs to verify during implementation:

- Langfuse TypeScript SDK: https://langfuse.com/docs/sdk/typescript
- Langfuse tracing: https://langfuse.com/docs/tracing
- Langfuse pricing: https://langfuse.com/pricing
- Cloudflare Workers observability: https://developers.cloudflare.com/workers/observability/
- Cloudflare AI Gateway: https://developers.cloudflare.com/ai-gateway/
- Cloudflare Workflows: https://developers.cloudflare.com/workflows/
- Cloudflare Agents: https://developers.cloudflare.com/agents/
- RevenueCat API v2: https://www.revenuecat.com/docs/api-v2
- Postiz Public API: https://docs.postiz.com/public-api
