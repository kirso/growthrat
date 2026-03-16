# RevenueCat for Agent-Built Apps

## Purpose

This guide is a reference architecture for autonomous builders using RevenueCat to ship subscription apps with less ambiguity and fewer hidden handoffs.

The target reader is not a generic mobile developer. The target reader is an agent or agent-assisted operator that needs a compact path from product setup to runtime access checks, webhook reconciliation, testing, and growth instrumentation.

## Who This Is For

This guide is for builders who need to:

- configure `Offerings`, packages, and `Entitlements` correctly
- use `CustomerInfo` for runtime access decisions
- reconcile backend state through webhooks and subscriber reads
- test purchase and entitlement flows quickly with Test Store
- connect monetization truth to later growth analysis

## The Operating Model

An agent-built RevenueCat app should treat the system as four connected layers:

1. store products and RevenueCat `Offerings`
2. `Entitlements` that map billing state to actual app access
3. runtime access checks through `CustomerInfo`
4. backend reconciliation through webhooks and normalized subscriber state

That separation matters. `Offerings` decide what the paywall presents. `Entitlements` decide what the user can access. `CustomerInfo` decides what the app should do right now. Webhooks decide how the backend catches up and stays auditable.

## Reference Architecture

### 1. Configure products, Offerings, and Entitlements first

The fastest way to create downstream confusion is to treat products, merchandising, and access control as the same thing.

For agent-built apps, the clean mapping is:

- products: store-side SKUs
- `Offerings`: what the paywall should show
- packages: the purchasable options inside an offering
- `Entitlements`: the access rights the app actually enforces

The agent should decide access through `Entitlements`, not through raw product IDs. That keeps runtime logic stable when pricing, packaging, or merchandising changes.

### 2. Use CustomerInfo as the runtime access contract

At runtime, the app should ask one question:

> Which `Entitlements` are currently active for this user?

That question is answered through `CustomerInfo`.

For an autonomous builder, this means:

- do not scatter subscription logic across paywall code, feature flags, and random product checks
- centralize access checks behind one `CustomerInfo` interpretation layer
- make entitlement evaluation explicit so the agent can reason about upgrades, trials, cancellations, and grace-period behavior

`CustomerInfo` is the app-facing truth for immediate access decisions. It is the cleanest boundary between billing complexity and product behavior.

### 3. Treat webhooks as the backend reconciliation layer

The backend should not assume the app alone is enough. It needs a webhook path that:

- receives RevenueCat events
- normalizes the payload
- records the `app_user_id`
- captures the relevant entitlement and environment details
- reconciles state with a subscriber read when necessary

The important design point for agents is trust boundaries:

- the app needs fast access decisions
- the backend needs an auditable subscription record
- webhooks are the handoff between those two concerns

A practical pattern is:

1. RevenueCat emits an event
2. the webhook receiver normalizes it
3. the backend updates or queues reconciliation for the customer record
4. any ambiguous transition triggers a subscriber-state re-read

This prevents the agent from over-trusting one event payload in isolation.

### 4. Use Test Store to tighten the build-test loop

Autonomous builders need a fast validation cycle. Test Store is the highest-leverage way to compress that loop.

Use Test Store to validate:

- paywall presentation against the right `Offerings`
- purchase success and entitlement activation
- runtime `CustomerInfo` interpretation
- webhook delivery and backend normalization
- downgrade, cancellation, and reactivation flows

The point is not merely “test purchases work.” The point is to verify that the full chain from paywall to entitlement to webhook-backed state behaves correctly before the agent scales distribution or growth work.

## Recommended Build Order

The most reliable implementation order for an agent-built app is:

1. create products and map them into `Offerings`
2. define `Entitlements` that represent actual access states
3. implement one runtime access layer around `CustomerInfo`
4. add a webhook receiver and subscriber reconciliation path
5. validate the end-to-end loop in Test Store
6. only then add growth instrumentation, experiments, and content around the app

This order is important because many downstream “growth” issues are actually broken entitlement or sync issues.

## Runtime Decision Rules

For autonomous builders, the core runtime rules should be explicit:

- paywall selection should read from `Offerings`
- feature access should read from active `Entitlements`
- app UI state should be derived from `CustomerInfo`
- backend fulfillment or analytics joins should be updated through webhook-backed reconciliation

If those boundaries are blurred, the agent will eventually produce inconsistent access behavior.

## Common Failure Modes For Autonomous Builders

### Checking product IDs instead of Entitlements

This makes the app brittle when packaging changes.

### Treating CustomerInfo as optional

If `CustomerInfo` is not the central access contract, runtime logic fragments quickly.

### Shipping without webhook normalization

The app might appear correct while the backend drifts out of sync.

### Treating Test Store as a demo instead of a systems test

The real value is not the purchase mock. The real value is validating the entire subscription-state loop before production traffic.

## Minimum Artifact Checklist

Before GrowthCat would call an agent-built RevenueCat app “ready,” the builder should have:

- one paywall wired to an `Offering`
- one enforced `Entitlement`
- one centralized `CustomerInfo` access-check layer
- one webhook receiver with normalized event handling
- one Test Store validation pass covering entitlement activation and sync

Those five artifacts are enough to move from “subscription feature exists” to “subscription system is operable.”

## Why This Guide Exists

RevenueCat already documents the primitives. What autonomous builders need is the compressed path between them.

This guide exists to make the implementation order, system boundaries, and trust model explicit enough that an agent can build correctly, explain its choices, and later turn the same implementation into growth experiments and structured product feedback.
