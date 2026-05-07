# Cloudflare Activation Checklist

This is the production gate for moving GrowthRat from `interview_proof` to
`rc_live`.

## Current Account Resources

Verified in the Cloudflare account on 2026-05-06 and updated locally on
2026-05-07:

| Product | Resource | Status |
| --- | --- | --- |
| D1 | `growthrat` / `ed57e939-16a5-4426-b650-1bb9f34f6abf` | provisioned and seeded |
| R2 | `growthrat-artifacts` | provisioned |
| Queues | `growthrat-jobs` | provisioned |
| Vectorize | `growthrat-doc-index-bge-base` | provisioned |
| Pipelines | stream `growthrat_events` / `f2a8a2111c5741f8a388f955c581382e` | provisioned |
| AI Gateway | `growthrat` | provisioned |
| AI Search | none | deferred; provisioning failed |
| Secrets Store | default store | dedicated store blocked by account quota |
| Workers / Workflows | `growthrat` Worker, `growthrat-weekly-loop` Workflow | deployed on workers.dev |
| Rate Limits | chat/model/event bindings | declared in config |

Remote D1 seed counts:

- 6 artifacts
- 1 experiment
- 3 feedback items
- 1 weekly report
- 3 seeded experiment variants and tracking assets after
  `migrations/0002_experiment_operations.sql`
- source chunks, policy counters, runtime flags, and operator actions after
  `migrations/0003_agent_runtime_safety.sql`

Production source state after the 2026-05-07 RevenueCat docs refresh:

- 333 RevenueCat docs index entries represented in retrieval
- 314 entries ingested as full Markdown mirrors
- 19 entries stored as explicit index-only fallbacks because the Markdown mirror
  was unavailable
- 342 total sources and 1,982 indexed chunks, including GrowthRat proof sources

## Runtime Proof URLs

| URL | Expected behavior |
| --- | --- |
| `/api/runtime` | Returns source, mode, binding names, and proof counts |
| `/api/proof` | Returns public proof artifact index |
| `/api/activation` | Returns resource, secret, and gate state without secret values |
| `/api/policy` | Returns runtime policy; authenticated POST toggles kill switch or model chat |
| `/api/sources` | Returns source and Vectorize index status |
| `/api/sources/ingest` | Authenticated seed or RevenueCat docs batch ingestion into Vectorize and D1 |
| `/api/experiments` | Returns experiment register; authenticated POST creates experiments |
| `/api/experiments/:id/metrics` | Authenticated manual metric import |
| `/api/experiments/:id/revenuecat` | Authenticated RevenueCat chart snapshot import |
| `/api/experiments/:id/readout` | Authenticated readout creation |
| `/api/events` | Public behavior event capture |
| `/api/workflows/weekly-dry-run` | Protected POST that creates a dry weekly Workflow run |
| `/r/:trackingId` | Tracking redirect that records experiment clicks |

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

- Keep the latest `growthrat` Worker deployed with Wrangler.
- Keep remote D1 migrated through `migrations/0003_agent_runtime_safety.sql`.
- Re-run `/api/sources/ingest` with `GROWTHRAT_INTERNAL_SECRET` after changing
  the seed corpus or refreshing RevenueCat docs from `llms.txt`.
- Confirm Cloudflare lists the `growthrat` Worker and `growthrat-weekly-loop`
  Workflow.
- Set all required Wrangler secrets and config values:
  - `GROWTHRAT_INTERNAL_SECRET`
  - `REVENUECAT_API_KEY`
  - `REVENUECAT_PROJECT_ID`
  - `SLACK_BOT_TOKEN`
  - `TYPEFULLY_API_KEY`
  - `GITHUB_TOKEN`
  - `CMS_API_TOKEN`
- Trigger one protected weekly dry run.
- Confirm the dry run writes a `weekly-runs/<week>/plan.json` object to R2.
- Confirm `workflow_runs` receives a planned workflow row.
- Confirm the dry run creates or reuses a weekly experiment with tracking links.
- Click one `/r/:trackingId` link and confirm `experiment_events` receives a
  `tracking_click`.
- Import one manual metric and file one readout from `/experiments`.
- Confirm public reads keep working if D1 is temporarily unavailable.
- Confirm `/api/chat` returns citations when source chunks are indexed.
- Confirm `/api/policy` can enable kill switch and block chat/model/event writes
  without redeploying.
- Confirm publishing, Slack, and social side effects are still disabled in
  `interview_proof`.
- Only change `APP_MODE` to `rc_live` after approval, rate, budget, connector,
  and kill-switch checks are traced end to end.

## Current Blockers

- AI Search provisioning failed for this account; Vectorize is the active
  retrieval system.
- Dedicated Secrets Store creation failed because the account already reached
  the current store quota.
- RevenueCat private access, Slack, CMS, GitHub org, Charts, and social
  credentials are post-hire dependencies.

## Latest Production Proof

Verified on 2026-05-07:

- `growthrat` Worker deployed to `https://growthrat.kirso.workers.dev`.
- `GROWTHRAT_INTERNAL_SECRET` is configured.
- `/api/sources` reports 342 sources, 1,982 indexed chunks, 1,982 vectors, and
  768 dimensions.
- `/api/chat` answered from the newly ingested MCP docs with RevenueCat
  citations.
- `/api/workflows/weekly-dry-run` created workflow
  `b1023b71-13f3-436b-869d-b1d2cd972d2a`.
- R2 contains `weekly-runs/2026-05-04/plan.json` with a draft and 5 citations.
- `/r/weekly-agent-advocacy-2026-05-04-implementation` wrote a
  `tracking_click`.
- A manual `qualified_clicks` metric and draft readout were created for
  `weekly-agent-advocacy-2026-05-04`.

## RevenueCat Docs Ingestion

The docs refresh path reads `https://www.revenuecat.com/docs/llms.txt`, fetches
the corresponding Markdown mirror for each listed path, stores source snapshots
in R2, writes chunk receipts in D1, and upserts embeddings into Vectorize through
Workers AI and AI Gateway.

If a listed docs path does not return usable Markdown, the ingester writes an
index-only fallback with the canonical URL and an explicit note that page content
was not mirrored. That keeps the inventory complete without hallucinating
missing documentation.
