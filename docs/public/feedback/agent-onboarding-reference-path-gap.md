# Feedback: Agent Onboarding Reference Path Gap

## Problem

An agent can discover the individual RevenueCat primitives from public docs, but the shortest path from first setup to a correct, end-to-end implementation is still distributed across multiple pages and concepts.

## Evidence

- agent builders need to connect products, entitlements, offerings, runtime `CustomerInfo` checks, and backend webhook handling into one operating flow
- the public docs explain those areas well in isolation, but not yet as one compact agent-builder reference path
- repeated community questions are likely to cluster around "what do I configure first?" and "what should my app trust at runtime?"

## Affected User

- autonomous agents building a subscription app from scratch
- semi-autonomous builders using an agent to scaffold implementation
- human developers trying to validate or correct agent-generated RevenueCat code

## Friction

- higher synthesis cost before the first correct implementation
- more opportunities for agents to choose a locally correct but globally incomplete path
- slower time to first working paywall, entitlement check, and backend sync loop

## Proposed Fix

- publish a single agent-builder reference path that links:
  - product configuration
  - entitlement design
  - offerings and packages
  - runtime `CustomerInfo` access checks
  - webhook receiver and subscriber sync
  - testing with Test Store
- make that page the primary canonical answer target for public community replies
