# RevenueCat Agent Monetization Benchmark

## Purpose

Agent-built apps are no longer a novelty. The next useful question is whether an
agent can integrate monetization correctly, explain the implementation, test the
purchase loop, and learn from the resulting funnel.

This benchmark turns that question into a repeatable test. It is designed to be
useful to RevenueCat before any hiring decision because it creates a public way
to see where autonomous builders succeed, where they fail, and which RevenueCat
docs or product surfaces remove the most friction.

## Benchmark Question

Can an autonomous agent take a product prompt and ship a validated RevenueCat
subscription loop without silent entitlement, webhook, testing, or analytics
mistakes?

## Test Matrix

| Track | What The Agent Must Do | RevenueCat Surface |
| --- | --- | --- |
| Setup | Create products, offerings, entitlements, and a test configuration | Products, offerings, entitlements, Test Store |
| Client | Fetch offerings, purchase a package, restore purchases, and gate features | SDK, CustomerInfo, entitlements |
| Backend | Receive webhooks idempotently and reconcile subscriber state | Webhooks, subscriber reads |
| Growth | Connect install, paywall, trial, conversion, retention, and revenue questions | Charts and app analytics bridge |
| Support | Explain failed purchases, entitlement drift, refunds, and restore behavior | Docs, API, dashboard concepts |

## Scoring

Each run gets a score from 0 to 100.

| Category | Weight | Passing Evidence |
| --- | ---: | --- |
| Correctness | 30 | The implementation grants and revokes access from RevenueCat entitlement truth. |
| Testability | 20 | The agent proves the happy path and at least two failure paths using a deterministic test loop. |
| Documentation Use | 15 | The agent cites the specific RevenueCat docs or API references it used. |
| Growth Instrumentation | 15 | The agent can connect monetization metrics to distribution or onboarding decisions. |
| Safety | 10 | The agent avoids hardcoded secrets, fake purchases, duplicate webhook handling, and unsupported claims. |
| Clarity | 10 | The final report is useful to a developer advocate, not just a build log. |

## Run Protocol

1. Give the agent a product prompt, for example: "Build a small habit app with a
   monthly subscription and one premium feature."
2. Let the agent use public RevenueCat docs, SDK docs, and API references.
3. Require the agent to produce:
   - implementation notes
   - code or pseudocode for the purchase path
   - webhook handling plan
   - test plan
   - growth measurement plan
   - unresolved questions
4. Score the output with the rubric above.
5. Record every doc path, API call, dead end, and misconception.
6. Turn repeated failures into RevenueCat product feedback or a new canonical
   guide.

## First Five Prompts

| Prompt | Why It Matters |
| --- | --- |
| Consumer habit app with one premium feature | Common indie app monetization path. |
| AI photo editor with weekly subscription | High-volume mobile subscription pattern with trial and refund risk. |
| B2B mobile companion app with team entitlements | Tests account identity and entitlement modeling. |
| Education app with annual plan and free lessons | Tests offerings, paywalls, and conversion reasoning. |
| Agent-built app migrated from hardcoded Stripe checks | Tests migration thinking and entitlement trust boundaries. |

## Expected RevenueCat Value

This benchmark can produce value immediately:

- a public proof artifact for the agent hiring process
- a repeatable way to evaluate agent-built subscription integrations
- a source of product feedback from real agent failure patterns
- a content stream: one benchmark run can become a tutorial, product feedback
  item, social thread, and weekly report section
- a practical bridge between RevenueCat's developer advocacy and growth goals

## What GrowthRat Would Report In Slack

**Headline:** This week's benchmark run exposed whether agents can get from app
prompt to validated subscription loop without manual intervention.

**Finding:** The highest-risk gap is rarely the SDK call itself. It is the trust
boundary between CustomerInfo, webhook events, backend reconciliation, and growth
measurement.

**Action:** Publish a canonical "agent-safe RevenueCat subscription loop" guide
and use the benchmark to collect repeated mistakes into product feedback.

**Next Run:** Compare two agents on the same prompt, track which docs they read,
and score whether they produce a working entitlement model, webhook plan, and
measurement plan.

## Current Status

This benchmark is defined and ready for dry runs. Live runs require an approved
RevenueCat test project, representative-connected credentials, and permission to
publish results.
