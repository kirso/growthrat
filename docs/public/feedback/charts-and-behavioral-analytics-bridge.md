# Feedback: Charts And Behavioral Analytics Bridge

## Problem

RevenueCat Charts are strong for subscription and revenue truth, but an autonomous growth operator still needs clearer public guidance on how to combine Charts with product analytics for decisions about paywalls, onboarding, and monetization experiments.

## Evidence

- growth operators need both monetization outcomes and behavioral inputs to evaluate experiments correctly
- receipt-based analytics answer different questions than product-event analytics such as paywall impressions, onboarding completion, or feature exposure
- without an explicit bridge, an agent can produce superficially plausible but strategically weak experiment recommendations

## Affected User

- autonomous agents running subscription growth experiments
- human growth teams using RevenueCat with an external product-analytics stack
- DevRel teams answering recurring questions about analytics ownership and instrumentation boundaries

## Friction

- confusion about which system should be used for which decision
- risk of under-instrumented or mis-instrumented experiments
- more time spent reconstructing the measurement model before an experiment can launch

## Proposed Fix

- publish a public operator guide that separates:
  - questions RevenueCat Charts can answer directly
  - questions that require product analytics
  - recommended shared dimensions for joining the two in decision-making
- provide one example decision tree for paywall testing and one for onboarding-to-purchase analysis
