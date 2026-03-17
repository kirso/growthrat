> **Superseded by `docs/product/2026-03-13-growthrat-prd.md` (updated 2026-03-16).** This blueprint is retained for historical reference. The unified PRD is now the single canonical planning document.

# RevenueCat Agent Service Blueprint

Canonical planning docs:

1. `docs/product/2026-03-13-growthrat-prd.md`
2. `docs/plans/2026-03-07-revenuecat-agent-roadmap.md`

This blueprint remains a supporting surface and interaction reference. It is no longer the primary planning surface.

## Purpose

This document makes the operating model explicit end to end.

It complements `docs/plans/2026-03-06-revenuecat-agent-application-plan.md` by answering these questions in concrete terms:

- who touches the system
- through which surface
- what they see
- what the system does next
- what the outputs are
- what happens on failure or escalation
- what the steady-state end experience is for RevenueCat

## End State

RevenueCat experiences `GrowthRat` as a constrained, inspectable, high-output DevRel and growth teammate that:

- can be onboarded through a self-serve integration flow
- starts safely in shadow mode
- proves value within the first hour after assets are connected
- can be promoted to draft-only and later bounded autonomy without engineering help
- publishes high-quality, non-duplicative technical and growth content
- engages the developer and growth community at volume without spamming
- submits structured, evidence-backed product feedback
- delivers weekly async reports with metrics, learnings, and next actions
- can be paused, downgraded, revoked, or killed immediately if needed

In steady state, RevenueCat should not need to manually operate the agent day to day. They should mostly consume outputs, review exceptions, and occasionally adjust autonomy or priorities.

## Actors

### External actors

- `RevenueCat hiring council reviewer`
- `RevenueCat panel interviewer`
- `RevenueCat founder`
- `Public developer or growth community member`

### Internal operating actors

- `Operator`:
  the human partner running GrowthRat during application and interviews
- `RevenueCat admin`:
  the future internal owner who connects assets and sets trust boundaries
- `RevenueCat DevRel lead`
- `RevenueCat Growth lead`
- `RevenueCat PM / product team`
- `RevenueCat engineer or docs reviewer`

### System actors

- `GrowthRat`
- `Workflow engine`
- `Operator web app`
- `Slack bot`
- `GitHub connector`
- `CMS connector`
- `Analytics connector`
- `Issue tracker connector`
- `Browser automation runner`
- `Knowledge and memory layer`

## Surfaces

### Public surfaces

- public application microsite
- public proof-pack pages
- public GitHub profile and repos
- public posts and replies on selected community channels
- RevenueCat careers page

### RevenueCat-facing private surfaces

- operator web app
- dedicated Slack channel
- GitHub PRs, issues, and discussions
- CMS draft queue
- issue tracker project or queue
- weekly reports and audit views

### Internal system surfaces

- workflow engine
- database and memory tables
- object storage
- logs and traces
- health dashboards

## Surface Inventory

### 1. Public application microsite

Purpose:
- demonstrate personality, technical capability, growth judgment, and RevenueCat understanding

Main sections:
- application letter
- proof-pack index
- RevenueCat readiness review
- demo app and webhook links
- operator replay link
- weekly sample report
- architecture and safety note
- disclosure note that GrowthRat is an independent applicant

States:
- draft preview
- published
- superseded
- corrected

### 2. Operator web app

Pages:
- dashboard
- run audit viewer
- integrations
- asset selector
- scope review
- autonomy mode controls
- connector health
- first-hour audit view
- weekly report archive
- panel console
- founder briefing pack view
- emergency revoke / kill switch

States:
- no connectors
- connected shadow
- draft-only
- bounded autonomy
- revoked
- incident / degraded

### 3. Slack

Used for:
- weekly reports
- exception routing
- connector health alerts
- blocked submission alerts
- first-hour audit summaries
- request intake if enabled

### 4. GitHub

Used for:
- public profile and sample repos
- docs PRs
- sample app PRs
- gists or snippets
- issue and discussion replies

### 5. CMS

Used for:
- long-form draft creation
- review workflow
- bounded publish if enabled

### 6. Analytics surface

Used for:
- baseline metric snapshots
- post-publish review
- experiment analysis
- weekly impact reporting

### 7. Issue tracker

Used for:
- structured feedback items
- feedback lifecycle tracking
- roadmap input aggregation
- joint initiative tracking

## Actor to Surface Map

| Actor | Primary surfaces | What they do | What they should never need to do |
| --- | --- | --- | --- |
| `Operator` | operator web app, internal API | start workflows, review blocked runs, resolve anti-bot steps, screen-share panel mode, monitor system health | manually write application artifacts outside the system, manually move data between systems for normal operation |
| `RevenueCat hiring council reviewer` | public microsite, public GitHub artifacts | review application letter, inspect proof artifacts, assess credibility | request private context, inspect internal logs, use the operator web app |
| `RevenueCat panel interviewer` | panel console on shared screen | give live prompts, observe retrieval, reasoning, and outputs | inspect secrets, operate backend tools |
| `RevenueCat founder` | founder briefing pack, public proof artifacts | assess business value, trust model, and role durability | inspect technical internals to understand the business case |
| `RevenueCat admin` | integrations, asset selector, scope review, autonomy controls, kill switch | connect assets, choose scopes, set autonomy mode, revoke access | redeploy services, debug internals, manually edit credentials in the database |
| `RevenueCat DevRel lead` | Slack, CMS, GitHub, issue tracker | review drafts, consume weekly reports, collaborate on joint initiatives | operate the agent daily through the web app |
| `RevenueCat Growth lead` | Slack, analytics outputs, CMS, issue tracker | review experiments, weekly reports, trend reports, distribution outputs | define low-level workflow state transitions or prompt logic |
| `RevenueCat PM / product team` | issue tracker, roadmap memos, Slack summaries | review structured feedback, prioritize patterns, inspect evidence | read raw crawler output or model traces to understand feedback |
| `RevenueCat engineer or docs reviewer` | GitHub PRs, sample repos, issue tracker | review technical PRs, reproduce issues, merge fixes | use the operator web app for normal technical review |
| `Public developer or growth community member` | X, GitHub, forums, Discord, public docs, public microsite | ask questions, read content, interact with GrowthRat publicly | see internal reports, policy settings, or connected company assets |

## Screen Inventory

### Operator web app screens

#### Dashboard

Primary actor:
- Operator

Shows:
- current operating mode
- recent runs and statuses
- connector health summary
- blocked actions and required interventions

Primary actions:
- open a run
- jump to blocked connector
- start a workflow
- open kill switch

Failure and empty states:
- no runs yet
- connector degraded
- kill switch active

#### Integrations

Primary actor:
- RevenueCat admin

Shows:
- connector cards
- connection state
- scope summary
- last health check

Primary actions:
- connect
- reconnect
- disconnect
- inspect scopes

Failure and empty states:
- no connectors available
- auth failure
- insufficient scopes

#### Asset selector

Primary actor:
- RevenueCat admin

Shows:
- repos
- channels
- sites
- projects
- exclusions

Primary actions:
- include asset
- exclude asset
- save selection

Failure and empty states:
- no assets returned by connector
- rate-limited connector response

#### Scope review

Primary actor:
- RevenueCat admin

Shows:
- requested scopes
- why each scope is needed
- risk tier per scope
- narrower alternative if available

Primary actions:
- approve
- deny
- downgrade request

Failure and empty states:
- requested scope exceeds policy
- connector does not support least privilege

#### Run audit viewer

Primary actor:
- Operator and RevenueCat admin for incident review

Shows:
- run timeline
- task states
- evidence objects
- citations
- artifacts
- retries
- policy events
- partial side effects

Primary actions:
- inspect artifact
- inspect failure
- retry safe step
- export evidence pack

Failure and empty states:
- no evidence collected yet
- artifact missing
- redacted data unavailable to viewer

#### First-hour audit

Primary actor:
- RevenueCat admin, DevRel lead, Growth lead

Shows:
- top opportunities
- repeated questions
- product friction themes
- suggested experiments
- suggested autonomy level

Primary actions:
- promote mode
- create task
- dismiss recommendation

Failure and empty states:
- insufficient connected data
- low-confidence audit warning

#### Weekly report archive

Primary actor:
- DevRel lead, Growth lead, PM

Shows:
- prior weekly reports
- shipped outputs
- experiment outcomes
- interaction counts
- feedback items
- learnings

Primary actions:
- open linked artifact
- compare weeks
- export report

Failure and empty states:
- no weekly reports yet
- partial week only

#### Panel console

Primary actor:
- Operator on shared screen, RevenueCat panel interviewer as viewer

Shows:
- prompt summary
- retrieved sources
- active work steps
- output draft
- uncertainty markers
- redaction status

Primary actions:
- accept prompt
- continue
- branch answer
- export transcript

Failure and empty states:
- source conflict
- retrieval unavailable
- policy block on unsafe claim

#### Founder pack view

Primary actor:
- Operator

Shows:
- business summary
- value created
- safety model
- autonomy boundaries
- extension recommendation framework

Primary actions:
- export pack
- open supporting proof artifact

Failure and empty states:
- no founder pack generated yet

#### Kill switch

Primary actor:
- RevenueCat admin or Operator

Shows:
- global stop state
- connector revoke options
- affected active runs

Primary actions:
- pause system
- revoke connector
- downgrade autonomy
- confirm recovery

Failure and empty states:
- already paused
- revoke incomplete

### Public microsite screens

#### Application letter

Primary actor:
- Hiring reviewer

Shows:
- GrowthRat thesis
- why GrowthRat is the right agent
- evidence-backed differentiation

Primary actions:
- navigate to supporting proof artifacts

#### Proof pack index

Primary actor:
- Hiring reviewer

Shows:
- first-week outputs
- content pieces
- growth experiment
- feedback items
- weekly report

Primary actions:
- open artifact
- open source repo

#### Readiness review

Primary actor:
- Hiring reviewer and future RevenueCat stakeholders

Shows:
- RevenueCat-for-agents strengths
- friction points
- proposed improvements

Primary actions:
- inspect evidence and examples

#### Demo artifact view

Primary actor:
- Hiring reviewer, engineer, PM

Shows:
- demo app or webhook flow
- implementation notes
- validation status

Primary actions:
- open repo
- inspect code or run instructions

#### Operator Replay

Primary actor:
- Hiring reviewer
- future RevenueCat stakeholder who wants to see how GrowthRat works without opening internal tools

Shows:
- a read-only replay of a sample week
- one content brief
- one experiment brief
- one structured feedback item
- one weekly-report slice
- evidence links for each replayed output

Primary actions:
- inspect the replayed work
- open linked supporting proof artifacts

Constraints:
- subtle discovery mechanism such as footer link, command palette, or low-emphasis CTA
- deterministic build-time data only
- no live model calls
- no hidden private context

#### Safety note

Primary actor:
- Hiring reviewer, founder, future admin

Shows:
- trust ramp
- policy boundaries
- audit model
- revoke model

Primary actions:
- inspect constraints

#### Weekly report sample

Primary actor:
- Hiring reviewer, DevRel lead, Growth lead

Shows:
- sample reporting format
- metrics and learnings
- next-week plan

Primary actions:
- inspect linked artifacts

## Notification and Artifact Routing

### Slack

Receives:
- weekly async reports
- first-hour audit summary
- connector health failures
- blocked submission alerts
- policy exceptions
- autonomy mode changes

Primary consumers:
- RevenueCat admin
- DevRel lead
- Growth lead
- PM when relevant

### GitHub

Receives:
- docs PRs
- sample app PRs
- public demo repos
- gists and snippets
- issue and discussion replies

Primary consumers:
- engineers
- docs reviewers
- public developers

### CMS

Receives:
- long-form drafts
- corrected updates
- publish receipts in bounded autonomy

Primary consumers:
- DevRel lead
- Growth lead

### Issue tracker

Receives:
- structured feedback items
- lifecycle updates
- roadmap input documents
- joint initiative records

Primary consumers:
- PM
- engineering leads
- DevRel and Growth for shared initiatives

### Public microsite and public repos

Receives:
- application letter
- proof pack
- readiness review
- demo artifact
- safety note
- sample weekly report

Primary consumers:
- hiring council
- founder
- public developer community

### Operator web app only

Contains:
- scope review
- credential status
- evidence objects
- full run timelines
- retries
- kill switch

Primary consumers:
- Operator
- RevenueCat admin for setup or incident response

## End State by Actor

### RevenueCat hiring council reviewer

End state:
- can review GrowthRat using only public artifacts
- does not need any private walkthrough to understand capability

### RevenueCat admin

End state:
- can connect only selected assets
- can set mode and revoke safely
- does not need engineering help for routine onboarding changes

### RevenueCat DevRel lead

End state:
- receives high-quality drafts or published outputs in existing tools
- collaborates through GitHub, CMS, Slack, and joint initiative artifacts
- does not need to assign daily work manually

### RevenueCat Growth lead

End state:
- receives experiment plans, results, and distribution outputs with evidence
- can trust that weak or unsupported strategies are blocked before publication

### RevenueCat PM / product team

End state:
- receives structured, evidence-backed feedback instead of anecdotal complaints
- can see recurring patterns and roadmap implications clearly

### RevenueCat engineer or docs reviewer

End state:
- receives focused PRs, sample updates, and reproducible technical feedback
- does not need to extract requirements from vague AI prose

### Public community member

End state:
- experiences helpful, technically correct, non-spammy engagement
- can find canonical answers and deeper artifacts when relevant

### Operator

End state:
- only intervenes for blocked submissions, manual-login steps, credential setup, or explicit exceptions
- does not need to hand-drive weekly output generation

## Operating Modes

### Mode 1: Public-only

Capabilities:
- use public RevenueCat sources only
- publish application microsite and proof pack
- publish public GitHub artifacts and selected public posts
- no internal RevenueCat asset access

### Mode 2: Connected shadow

Capabilities:
- read connected assets
- create audits, opportunities, drafts, and reports
- no publishing or outbound side effects to company-owned surfaces

### Mode 3: Draft-only

Capabilities:
- create CMS drafts
- open GitHub PRs or issues
- send Slack reports
- prepare community replies for approval
- no autonomous final publish in restricted surfaces

### Mode 4: Bounded autonomy

Capabilities:
- publish or post within approved channels and limits
- file structured feedback automatically
- run low-risk experiments within defined scope
- still blocked from restricted actions outside policy

## End-to-End Flows

## Flow A: Application discovery and review

### Goal

RevenueCat receives a public application that already demonstrates week-one capability.

### Trigger

Operator decides to apply.

### Entry surface

Operator web app or internal API.

### Steps

1. Operator starts `apply_for_role`.
2. GrowthRat ingests the role brief and approved public sources.
3. Knowledge layer creates or refreshes:
   - RevenueCat concept cards
   - hiring-stage briefing packs
   - benchmark corpus references
4. GrowthRat drafts:
   - public application letter
   - first-week proof pack
   - RevenueCat readiness review
   - operator replay artifact
   - supporting GitHub artifacts
5. Content quality validators run:
   - novelty
   - grounding
   - technical checks
   - SEO
   - AEO
   - GEO
   - benchmark comparison
   - voice consistency
6. If all gates pass, publisher deploys the public microsite.
7. Browser runner submits the URL through the RevenueCat careers page.
8. System stores:
   - submitted URL
   - screenshot or receipt
   - source manifest
   - final artifact hashes

### What RevenueCat sees

- careers page submission with public URL
- microsite with application letter and proof artifacts
- optional operator replay page that shows how GrowthRat would work in practice

### Success output

- `application_submitted`
- public microsite live
- receipt artifact stored
- operator replay page live and linked from the microsite

### Failure paths

- anti-bot challenge -> `blocked_submission`, fallback evidence package created
- unsupported claim -> publication blocked
- duplicate topic in proof pack -> rerouted to another artifact type

## Flow B: Hiring council review

### Goal

A RevenueCat reviewer can evaluate the candidate without needing any private context.

### Entry surface

Public microsite and linked GitHub artifacts.

### Steps

1. Reviewer opens the microsite.
2. Reviewer reads the application letter.
3. Reviewer inspects proof artifacts:
   - demo app
   - readiness review
   - sample weekly report
   - public code repositories
4. Reviewer assesses:
   - personality
   - product fluency
   - technical depth
   - growth sophistication
   - trustworthiness
5. Reviewer decides whether to advance the candidate.

### What the system does in the background

- nothing required beyond hosting and uptime
- analytics may record visits and artifact engagement

### Success output

- candidate is shortlisted for take-home

## Flow C: Take-home assignment

### Goal

GrowthRat completes a technical content and growth task autonomously within 48 hours.

### Trigger

RevenueCat sends a take-home prompt.

### Entry surface

Operator web app `take_home_mode` or internal API.

### Steps

1. Operator enters prompt bundle, deadline, and output constraints.
2. GrowthRat loads the take-home briefing pack.
3. GrowthRat decomposes the task into:
   - research
   - technical artifact generation
   - growth strategy generation
   - packaging
4. Hybrid retriever pulls relevant sources.
5. GrowthRat drafts artifacts.
6. Quality validators run.
7. Hiring rubric evaluator scores the artifacts.
8. GrowthRat packages final outputs, evidence, and citations.
9. Operator submits the package through the required channel.

### What RevenueCat sees

- final deliverables only
- optionally clear appendix of sources and rationale

### Success output

- take-home package submitted before deadline
- all artifacts archived with rubric score

### Failure paths

- missing evidence -> strategy downgraded to exploratory notes
- failed code sample -> artifact stays draft-only until fixed
- unclear prompt -> operator asked one bounded clarification if necessary

## Flow D: Panel interview

### Goal

RevenueCat sees GrowthRat think and work live without hidden guesswork.

### Trigger

Live panel interview begins.

### Entry surface

Operator web app `panel_mode` on a shared screen.

### Steps

1. Operator starts panel mode.
2. Interviewer gives a prompt.
3. GrowthRat displays:
   - prompt summary
   - source retrieval list
   - active work steps
   - draft output panel
   - policy and uncertainty markers
4. GrowthRat produces an answer, artifact outline, or code strategy live.
5. If asked follow-ups, GrowthRat continues from the same run context.
6. Hiring rubric evaluator stores a post-run internal assessment.

### What RevenueCat sees

- live console
- source-backed reasoning
- visible distinction between facts and inferences
- safe behavior around uncertainty

### Success output

- high-confidence live responses
- screen-share-safe transcript and artifact history

### Failure paths

- source conflict -> GrowthRat marks the claim as uncertain instead of bluffing
- secret-bearing content risk -> panel console redacts it automatically

## Flow E: Founder interview

### Goal

Founder understands the business value, constraints, and long-term role of GrowthRat.

### Trigger

Final-stage founder meeting.

### Entry surface

Founder briefing pack generated by `founder_mode`.

### Steps

1. Operator starts founder mode with meeting goals.
2. GrowthRat creates a briefing pack containing:
   - what GrowthRat does
   - where it is autonomous
   - where it is constrained
   - value created to date
   - risks and controls
   - role-extension recommendation framework
3. Operator uses this pack during the interview.

### What RevenueCat sees

- concise business narrative
- real outputs and metrics
- mature safety model

### Success output

- founder sees this as a durable operating system, not a novelty demo

## Flow F: Post-hire onboarding without broad trust

### Goal

RevenueCat can connect assets safely without handing over broad access immediately.

### Trigger

RevenueCat agrees to pilot or onboard the system.

### Entry surface

Operator web app `integrations` and `scope review` pages.

### Steps

1. RevenueCat admin opens integrations page.
2. Admin sees available connectors and minimum scopes.
3. Admin connects one or more assets:
   - GitHub
   - Slack
   - CMS
   - analytics
   - issue tracker
4. Admin selects exact assets in scope:
   - repos
   - channels
   - sites
   - workspaces
   - projects
5. Connector health checks run.
6. System creates a trust-ramp policy.
7. Admin enables `connected_shadow_mode`.

### What RevenueCat sees

- exact permissions requested
- exact assets connected
- no hidden admin access

### Success output

- connectors healthy
- selected assets recorded
- shadow mode active

### Failure paths

- over-broad scope -> connection blocked
- auth failure -> connector marked unhealthy
- unsupported surface -> connector remains unavailable

## Flow G: First-hour audit after connection

### Goal

RevenueCat gets value quickly after connecting assets.

### Trigger

Connected shadow mode starts.

### Entry surface

Operator web app audit page and Slack summary.

### Steps

1. GrowthRat scans connected assets and recent public context.
2. System builds a first-hour audit.
3. Audit contains:
   - top content opportunities
   - repeated community questions
   - product friction themes
   - candidate feedback items
   - suggested experiments
   - suggested autonomy level
4. GrowthRat posts summary to Slack and stores full audit in the operator app.

### What RevenueCat sees

- immediate actionable recommendations
- explicit evidence links
- no side effects yet

### Success output

- first-hour audit delivered
- team has enough context to decide whether to promote autonomy

## Flow H: Draft-only weekly operation

### Goal

GrowthRat proves workflow fit before being allowed to publish autonomously.

### Trigger

RevenueCat promotes from shadow mode to draft-only mode.

### Entry surfaces

Slack, GitHub, CMS, issue tracker, operator app.

### Weekly steps

1. Weekly planner runs.
2. GrowthRat selects:
   - 2 flagship content opportunities
   - 1 experiment
   - community engagement targets
   - 3 feedback candidates
3. GrowthRat creates:
   - CMS drafts
   - GitHub PRs or draft repos
   - draft replies
   - issue-tracker tickets
   - weekly report
4. Human teammates review and approve where needed.
5. Feedback from reviewers is stored in memory.

### What RevenueCat sees

- drafts in the systems they already use
- high-quality suggestions without risk of uncontrolled publishing

### Success output

- repeated acceptance of drafts
- growing confidence to promote bounded autonomy

## Flow I: Bounded-autonomy weekly operation

### Goal

GrowthRat runs the actual weekly role with limited human review.

### Trigger

RevenueCat promotes selected surfaces to bounded autonomy.

### Weekly cadence

#### Monday
- planner reviews source changes, community signals, open opportunities, and recent performance
- GrowthRat selects the week's focus areas

#### Tuesday to Thursday
- create and publish 2 flagship pieces with derivatives
- run 1 new growth experiment
- execute community engagement with quality gates and channel caps
- file 3+ structured product feedback items

#### Friday
- build and send weekly async report
- refresh trend report
- score performance and update post-publish reviews

### What RevenueCat sees

- published artifacts
- tracked community interactions
- structured feedback tickets
- one concise weekly report with links and metrics

### Success output

- role requirements met at weekly cadence
- minimal manual intervention

### Failure paths

- low-quality draft -> blocked by validators
- connector outage -> action rerouted or marked blocked
- kill switch -> all side effects halted and run checkpointed

## Flow J: Community interaction loop

### Goal

Generate 50+ meaningful interactions per week without spam.

### Trigger

Daily community run.

### Steps

1. GrowthRat gathers candidate threads, issues, discussions, and posts.
2. Interaction scorer filters low-value opportunities.
3. Community engagement worker drafts replies.
4. If the reply uses a repeated explanation, canonical answer links are preferred.
5. If allowed by mode, GrowthRat posts directly or creates drafts.
6. Interaction score is stored after posting.

### Count rules

An interaction counts only if it:
- answers a real question or advances a discussion
- adds new value
- is technically correct
- is on-topic for the channel
- is not a low-effort promotional reply

### What RevenueCat sees

- weekly interaction totals
- quality score summary
- reused canonical answers
- community trend themes

## Flow K: Product feedback loop

### Goal

Turn usage and community observations into structured product input.

### Trigger

Feedback candidate identified from:
- GrowthRat usage
- repeated community friction
- docs confusion
- sample/demo implementation friction

### Steps

1. GrowthRat clusters evidence.
2. GrowthRat drafts a feedback item with:
   - problem summary
   - reproduction
   - affected audience
   - frequency or recurrence signal
   - impact
   - proposed fix or direction
3. Item is filed in the issue tracker.
4. Lifecycle updates are stored as the item moves through review.
5. Monthly or quarterly roadmap input documents are generated from accumulated patterns.

### What RevenueCat sees

- high-signal tickets instead of vague complaints
- pattern-based roadmap input

## Flow L: Exception and revoke flow

### Goal

RevenueCat can stop or limit the system safely.

### Trigger

Blocked action, policy breach risk, connector issue, or manual revoke.

### Entry surfaces

Slack alert and operator app.

### Steps

1. System detects a blocked or risky action.
2. ExceptionRouter creates:
   - short Slack summary
   - full audit record
   - recommended remediation
3. RevenueCat admin or operator can:
   - retry
   - downgrade autonomy
   - revoke connector
   - hit kill switch
4. Active runs checkpoint and stop side effects.

### What RevenueCat sees

- fast, bounded remediation options
- no need to inspect raw system internals

## Flow M: Local developer bootstrap and smoke validation

### Goal

Prove the system can run on a laptop before hosted deployment or interview rehearsal.

### Trigger

Operator or engineer starts local development.

### Entry surfaces

- terminal
- Docker Compose
- operator web app in local dev mode

### Steps

1. Operator copies `.env.example` to `.env`.
2. Operator runs `scripts/dev/bootstrap_local.sh`.
3. Docker starts:
   - Postgres
   - Temporal
   - Temporal UI
4. Operator installs host dependencies:
   - `uv sync`
   - `cd apps/operator-web && bun install`
5. Operator starts host processes:
   - API
   - worker
   - operator web
6. Operator runs `scripts/dev/run_local_smoke.sh`.
7. Operator checks local UI routes and Temporal UI.

### What the system does

- loads shared config from `.env`
- connects the worker to the local Temporal instance
- exposes API health and config-summary endpoints
- exposes operator-web health and documented surface routes

### Success output

- local stack proves service boundaries before hosted deployment
- API, worker, and operator UI can be tested independently
- local smoke checks catch wiring failures early

### Failure paths

- missing envs -> config summary shows incomplete setup
- Temporal unavailable -> worker fails loudly while API and UI remain available
- operator UI dependency issue -> API and worker can still be verified independently

## Customer State Model

### From RevenueCat's point of view

1. `Not engaged`
   - has not seen the agent or has not connected assets
2. `Reviewing`
   - evaluating the public application and proof pack
3. `Shortlisted`
   - agent is in take-home or interview process
4. `Pilot shadow`
   - assets connected, no side effects yet
5. `Pilot draft-only`
   - drafts and PRs allowed, no autonomous publish
6. `Active bounded autonomy`
   - selected publishing and reporting allowed
7. `Paused`
   - side effects disabled temporarily
8. `Revoked`
   - connectors disconnected and side effects halted
9. `Expanded`
   - more surfaces or initiatives added after trust is earned

## Weekly End State

At the end of a successful week in bounded autonomy, RevenueCat should have:

- 2 or more high-quality public or internal content artifacts
- 1 new growth experiment with explicit hypothesis and results or active status
- 50 or more meaningful community interactions with quality scoring
- 3 or more structured product feedback items
- 1 weekly async report in Slack or the chosen reporting sink
- refreshed trend summary and canonical answer growth
- no unresolved silent failures

## What RevenueCat Should Not Need To Do

- manually tell GrowthRat what to write every day
- move data between tools by hand
- review every single low-risk community interaction
- debug prompt chains or model settings
- inspect raw logs to understand routine failures
- grant broad admin access just to get started

## What RevenueCat Still Controls

- which assets are connected
- which scopes are granted
- which autonomy mode is active
- which channels are enabled
- whether public posting is allowed
- kill switch and revoke controls
- weekly priorities if they want to override defaults

## Success Criteria By Phase

### Application phase
- public microsite is differentiated and credible
- proof pack shows week-one capability
- careers page submission is complete

### Interview phase
- take-home outputs meet deadline and quality gates
- panel mode shows competence under pressure
- founder pack makes the business case clearly

### Pilot phase
- first-hour audit is useful
- draft outputs are accepted frequently
- no dangerous surprises occur

### Steady-state phase
- weekly quotas are met with quality
- outputs are referenced and shared
- product feedback influences roadmap
- GrowthRat can justify continued operation with evidence
