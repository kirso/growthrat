# Cloudflare Activation Checklist

This is the production gate for moving GrowthRat from `interview_proof` to
`rc_live`.

## Current Account Resources

Verified in the Cloudflare account on 2026-05-06:

| Product | Resource | Status |
| --- | --- | --- |
| D1 | `growthrat` / `ed57e939-16a5-4426-b650-1bb9f34f6abf` | provisioned and seeded |
| R2 | `growthrat-artifacts` | provisioned |
| Queues | `growthrat-jobs` | provisioned |
| Vectorize | `growthrat-doc-index` | provisioned |
| Pipelines | stream `growthrat_events` / `f2a8a2111c5741f8a388f955c581382e` | provisioned |
| AI Gateway | `growthrat` | provisioned |
| AI Search | none | deferred; provisioning failed |
| Secrets Store | default store | dedicated store blocked by account quota |
| Workers / Workflows | `growthrat` Worker, `growthrat-weekly-loop` Workflow | declared in config; deploy still required |

Remote D1 seed counts:

- 6 artifacts
- 1 experiment
- 3 feedback items
- 1 weekly report
- 0 workflow runs until the Worker is deployed and a dry run is triggered

## Runtime Proof URLs

| URL | Expected behavior |
| --- | --- |
| `/api/runtime` | Returns source, mode, binding names, and proof counts |
| `/api/proof` | Returns public proof artifact index |
| `/api/activation` | Returns resource, secret, and gate state without secret values |
| `/api/workflows/weekly-dry-run` | Protected POST that creates a dry weekly Workflow run |

The manual workflow endpoint must be called with either:

```bash
Authorization: Bearer $GROWTHRAT_INTERNAL_SECRET
```

or:

```bash
x-growthrat-secret: $GROWTHRAT_INTERNAL_SECRET
```

If `GROWTHRAT_INTERNAL_SECRET` is missing, the endpoint returns `503`. If the
token does not match, it returns `401`.

## Required Before `rc_live`

- Deploy the `growthrat` Worker with Wrangler.
- Confirm Cloudflare lists the `growthrat` Worker and `growthrat-weekly-loop`
  Workflow.
- Set all required Wrangler secrets:
  - `GROWTHRAT_INTERNAL_SECRET`
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `REVENUECAT_API_KEY`
  - `SLACK_BOT_TOKEN`
  - `TYPEFULLY_API_KEY`
- Trigger one protected weekly dry run.
- Confirm the dry run writes a `weekly-runs/<week>/plan.json` object to R2.
- Confirm `workflow_runs` receives a planned workflow row.
- Confirm public reads keep working if D1 is temporarily unavailable.
- Confirm publishing, Slack, and social side effects are still disabled in
  `interview_proof`.
- Only change `APP_MODE` to `rc_live` after approval, rate, budget, connector,
  and kill-switch checks are traced end to end.

## Current Blockers

- This shell has no `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, or
  Wrangler auth environment configured.
- AI Search provisioning failed for this account; Vectorize is the active
  retrieval system.
- Dedicated Secrets Store creation failed because the account already reached
  the current store quota.
- RevenueCat private access, Slack, CMS, GitHub org, Charts, and social
  credentials are post-hire dependencies.
