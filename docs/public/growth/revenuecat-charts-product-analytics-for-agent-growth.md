# RevenueCat Charts Plus Product Analytics For Agent-Run Growth

## Purpose

This guide defines how GrowthCat uses RevenueCat Charts alongside product analytics to make monetization decisions without mixing incompatible metrics.

The goal is not to replace RevenueCat Charts with a general analytics stack. The goal is to use each system for the decisions it is actually qualified to answer.

## Who This Is For

- autonomous agents running subscription growth loops
- human growth operators working on subscription apps powered by RevenueCat
- Developer Advocacy and Growth teams that need a clean measurement model for paywall and onboarding decisions

## Core Rule

Use RevenueCat Charts for monetization truth.
Use product analytics for behavioral truth.
Join them at the decision layer, not by pretending one system can stand in for the other.

## What RevenueCat Charts Should Answer

RevenueCat Charts should be the source of truth for questions like:

- did a user convert to paying
- how much revenue or proceeds did a package generate
- how did trial conversion change
- which store, product, offering, or entitlement drove better subscription outcomes
- whether retention, churn, and renewal metrics moved after a change

These are monetization questions. They should not depend on client-side event instrumentation.

## What Product Analytics Should Answer

Product analytics should be the source of truth for questions like:

- how many users saw a paywall
- which onboarding step preceded the paywall view
- how many users tapped a specific CTA
- which user segments saw different value moments before purchase
- whether feature exposure changed the likelihood of seeing or reaching a paywall

These are behavioral questions. They should not be approximated from receipt data.

## Shared Dimensions GrowthCat Would Standardize

To make the two systems useful together, GrowthCat would standardize a small set of shared dimensions across events, reports, and experiment briefs:

- app user ID
- platform and store
- offering identifier
- package or product identifier
- paywall variant or experiment key
- onboarding path or acquisition cohort
- event timestamp windows

This is enough to reason about what users did before purchase and what they ultimately paid for.

## Decision Framework

GrowthCat would separate decisions into three buckets.

### Bucket 1: Monetization outcome decisions

Use RevenueCat Charts first.

Examples:

- which offering generated higher conversion to paying
- whether proceeds improved after a pricing or merchandising change
- whether trial conversion improved after a paywall update

### Bucket 2: Behavioral funnel decisions

Use product analytics first.

Examples:

- whether onboarding completion changed paywall reach
- whether a new CTA increased paywall opens
- whether a value-explanation step reduced dropoff before purchase

### Bucket 3: Combined operator decisions

Use both systems together.

Examples:

- whether a new onboarding path increased paywall views without hurting downstream conversion to paying
- whether a paywall copy change raised paywall CTR but lowered revenue quality
- whether a segment that reaches the paywall more often also converts into higher-value packages

## Measurement Model For A Paywall Test

When GrowthCat runs a paywall experiment, the measurement model should be explicit before launch.

### Behavioral metrics

Use product analytics for:

- paywall impressions
- paywall CTA taps
- onboarding completion before paywall
- exposure to value moments before purchase

### Monetization metrics

Use RevenueCat Charts for:

- conversion to paying
- revenue and proceeds
- trial conversion if a trial is involved
- retention or renewal movement if the test window is long enough

### Guardrails

Do not call a test a win if only the behavioral metric improved.
Do not call a test a win if only revenue moved but the exposure path changed in a way you cannot explain.

## Example: Agent-Run Weekly Experiment Loop

1. identify the behavior hypothesis
   - example: more users should reach the paywall after a shorter onboarding path
2. instrument the behavioral path in product analytics
3. define the monetization outcome metrics in RevenueCat Charts
4. launch the variant with shared identifiers
5. review behavior first, then monetization outcomes
6. record the conclusion in a weekly report with both metric types separated

This keeps the operator honest.

## Failure Modes GrowthCat Would Avoid

### Failure mode 1: Using RevenueCat Charts as a funnel tool

Charts are not a replacement for behavioral instrumentation. They answer the paid outcome, not every upstream step.

### Failure mode 2: Declaring a win from click-through alone

A paywall that gets more taps but lower proceeds is not a clean win.

### Failure mode 3: Running experiments without shared identifiers

If the offering, package, or paywall variant cannot be joined back to both behavioral and monetization views, the experiment will generate noise instead of guidance.

## What Makes This Valuable For RevenueCat

This guide gives RevenueCat a public answer to one of the most common operator mistakes: treating receipt analytics and product analytics as interchangeable.

That matters for agent-run growth because weak agents often produce plausible but low-quality advice by collapsing those systems together.

A strong public guide makes GrowthCat more useful in three ways:

- it improves experiment quality
- it sharpens product feedback from growth operators
- it creates a canonical answer GrowthCat can reuse across GitHub, X, and forums

## Recommended Canonical Answer

If someone asks, "Should I use RevenueCat Charts or product analytics for paywall experiments?" the short answer is:

Use RevenueCat Charts for monetization truth and product analytics for behavioral truth. If the decision depends on both, define the shared dimensions before you launch the test.

## Bottom Line

RevenueCat Charts are strongest when they stay the source of truth for monetization outcomes.
Product analytics is strongest when it stays the source of truth for behavior.

GrowthCat’s job is to join those two cleanly so experiments are measurable, comparable, and worth acting on.
