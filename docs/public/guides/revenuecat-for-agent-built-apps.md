# RevenueCat for Agent-Built Apps

## Quick Answer

Use RevenueCat as the subscription control plane, not as a vague billing abstraction.

For an agent-built app, the clean implementation path is:

1. model store products in RevenueCat
2. map those products to entitlements
3. group packages into offerings for paywall decisions
4. read `CustomerInfo` at runtime for access checks
5. use webhooks plus subscriber re-reads for backend synchronization
6. use Test Store to verify the full purchase loop before store-side release friction appears

That separation matters because autonomous builders need fast feedback loops and explicit trust boundaries.

## Who This Is For

This guide is for:

- autonomous agents building subscription apps from scratch
- operators supervising agent-built mobile or hybrid apps
- teams evaluating whether RevenueCat is usable without constant human stitching across docs

The focus is narrow on the GrowthCat wedge:

- offerings
- entitlements
- `CustomerInfo`
- webhooks
- Test Store
- agent-built app architecture

## The Core Model

An agent should reason about RevenueCat in four layers.

### Layer 1: Products

Products are the store-side items customers can buy.

Examples:

- monthly subscription
- annual subscription
- introductory plan

The mistake to avoid is treating products as access rules. Products are commerce objects.

### Layer 2: Entitlements

Entitlements are the access rules your app actually cares about.

Examples:

- `pro`
- `team`
- `premium_export`

An agent should make feature decisions from entitlements, not from raw product IDs. That keeps the app logic stable even when packaging changes.

### Layer 3: Offerings

Offerings group packages for merchandising and paywall selection.

Examples:

- default paywall
- onboarding paywall
- win-back paywall

This is where a growth operator can run different merchandising strategies without rewriting access logic.

### Layer 4: CustomerInfo

`CustomerInfo` is the runtime state the app should read to answer:

- what access does this user have now?
- which entitlements are active?
- should the feature unlock or stay gated?

For an autonomous builder, `CustomerInfo` is the contract between subscription configuration and in-app behavior.

## Reference Architecture

The agent-safe architecture looks like this:

```text
app store products
  -> RevenueCat products
  -> entitlements
  -> offerings/packages
  -> client fetches CustomerInfo
  -> app unlocks or gates features
  -> purchase events emit webhooks
  -> backend normalizes events and re-reads subscriber state when needed
```

This architecture splits concerns cleanly:

- RevenueCat owns subscription truth and entitlement mapping
- the client owns presentation and access checks
- the backend owns synchronization, auditability, and downstream state updates

## What The Agent Should Build First

If an agent is starting with a blank repo, the first implementation order should be:

1. define the entitlement model
2. configure products and packages
3. create one default offering
4. wire the paywall to offering data
5. read `CustomerInfo` after app launch and purchase events
6. add a webhook handler
7. verify the loop in Test Store

That order avoids a common failure mode where the paywall ships before the access model is stable.

## Runtime Trust Boundaries

An agent needs explicit rules for what to trust.

### Trust `CustomerInfo` for feature access

Use `CustomerInfo` to decide whether the user should have access right now.

Do not hardcode product IDs into feature gates unless there is no entitlement abstraction.

### Trust webhooks for backend awareness, not blind finality

Webhooks are the backend event surface. They are useful for:

- syncing internal records
- triggering post-purchase workflows
- updating internal dashboards

But a careful agent should still define when to re-read subscriber state before applying irreversible downstream changes.

### Trust entitlements for app behavior, not packaging

A pricing or package change should not require the app to relearn what “pro access” means.

## Webhooks And Subscriber Sync

For agent-built apps, webhook handling should be explicit and boring.

Recommended flow:

1. receive RevenueCat webhook
2. normalize the event payload
3. identify the `app_user_id`
4. update lightweight internal state
5. re-read subscriber state when the downstream action needs confirmation
6. write an idempotent sync record

This keeps the backend resilient when:

- events arrive more than once
- product packaging changes
- an operator needs to reconcile state later

## Test Store Workflow

Test Store is one of the highest-leverage surfaces for autonomous builders because it shortens the path between configuration and verification.

Use it to validate:

- paywall rendering against offerings
- purchase success and entitlement activation
- runtime `CustomerInfo` changes
- webhook handling logic
- post-purchase unlock behavior

For a serious agent workflow, Test Store should be part of the default implementation loop, not an afterthought.

## Build Loop For Agent Operators

The weekly loop should look like this:

1. change packaging or paywall logic
2. validate in Test Store
3. confirm `CustomerInfo` drives unlock behavior correctly
4. inspect webhook normalization and sync output
5. publish technical notes or product feedback if friction appears

This is why RevenueCat is a strong fit for agent-built apps: it provides a public model that can be turned into repeatable loops instead of one-off manual setup.

## Common Mistakes

### Mistake 1: using product IDs as the access model

That makes packaging changes harder than they need to be.

### Mistake 2: treating offerings as access rules

Offerings are merchandising surfaces. Entitlements are access rules.

### Mistake 3: skipping the backend sync design

An agent can ship a client-only unlock path quickly, but the backend still needs a defensible webhook and reconciliation strategy.

### Mistake 4: testing too late

If Test Store is not in the loop early, the agent spends too much time reasoning about subscription state instead of validating it.

## What This Enables For Growth

A clean technical model creates better growth work later:

- offerings make paywall selection testable
- entitlements keep feature gating stable across pricing changes
- `CustomerInfo` makes unlock behavior measurable
- webhooks give the backend a reliable event surface
- Test Store shortens iteration time before public rollout

That is the bridge from implementation quality to growth velocity.

## Bottom Line

RevenueCat works well for agent-built apps when the agent treats it as a structured operating model:

- products for commerce
- entitlements for access
- offerings for merchandising
- `CustomerInfo` for runtime truth
- webhooks for backend sync
- Test Store for fast validation

That model is simple enough for autonomous builders to execute and strong enough to support production-grade growth loops afterward.
