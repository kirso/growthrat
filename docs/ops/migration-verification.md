# Migration Verification

This document verifies the Next.js/Convex features that were removed during the
Cloudflare migration and records the Cloudflare-native replacement path.

Baseline compared: `66dc220` (`Harden runtime and align migration docs`).

## Verified Missing Features And Replacement Path

| Old feature | Old source | Cloudflare replacement |
| --- | --- | --- |
| RC/operator auth and authorization | `app/api/auth/[...all]/route.ts`, `convex/auth.ts`, `convex/authz.ts` | RC representative account and connected-account schema in `migrations/0004_rc_account_onboarding.sql`; signed RC representative session endpoints in `/api/auth/*`; authenticated connector API at `/api/accounts/revenuecat/connectors`; `/sign-in` connector UI. Formal SSO remains post-RC preference hardening. |
| Connector onboarding and secret verification | `convex/onboarding.ts`, `convex/runtimeConnectors.ts` | `src/lib/connected-accounts.ts` encrypts RC-provided connector credentials and verifies RevenueCat, Slack, GitHub, Postiz, DataForSEO, CMS, and X/community providers. |
| Runtime agent config and review mode | `convex/agentConfig.ts` | `migrations/0005_advocate_runtime_port.sql`, `src/lib/agent-config.ts`, `/api/agent-config`. |
| Slack events, commands, and stop/resume | `app/api/slack/events/route.ts`, `convex/slackCommands.ts` | `src/lib/slack.ts`, `/api/slack/events`, signed Slack request verification, and `help/status/opportunities/plan/report/write/approve/reject/stop/resume` commands. |
| Content generation and quality gates | `convex/actions.ts`, `convex/workflows/index.ts` | `src/lib/pipeline.ts` creates source-grounded artifacts, validates blocking/advisory gates, and records artifact metadata. |
| Weekly planning workflow | `convex/workflows/index.ts` | `src/lib/pipeline.ts`, `/api/workflows/weekly-run`, and the Cloudflare Workflow entry in `src/worker.ts`. |
| Take-home task execution | `convex/workflows/taskExecution.ts` | `src/lib/pipeline.ts` and `/api/tasks/execute`. |
| DataForSEO keyword and SERP loop | `convex/actions.ts` | `src/lib/dataforseo.ts`, scored opportunities in D1, and `/api/opportunities`. |
| GitHub publishing and feedback issues | `convex/actions.ts` | `src/lib/github.ts` supports content file commits, issue creation, and RevenueCat repo signal scanning. |
| Social distribution | `convex/actions.ts` Typefully path | `src/lib/postiz.ts` and `/api/connectors/postiz`; Postiz replaces Typefully. |
| Community monitoring and reply drafts | `convex/actions.ts` community section | `src/lib/community.ts` and `/api/community/scan` scan RevenueCat GitHub issues and draft replies. |
| Persistent chat history | `convex/schema.ts` `chatMessages` | `migrations/0005_advocate_runtime_port.sql` and `src/lib/agent-chat.ts` store per-thread messages. |
| Usage and safety gates | `convex/usageEvents.ts`, `convex/rateLimits.ts` | Current `src/lib/policy.ts`, `src/lib/runtime.ts`, AI Gateway metadata, D1 counters, and kill switch. |
| Approval trail | `convex/approvalLog.ts`, `convex/slackApproval.ts` | `migrations/0006_run_ledger_observability.sql`, `src/lib/approvals.ts`, D1 approval requests, and Slack `approve`/`reject` commands. Reaction-to-approval remains a hardening item. |

## Remaining Hardening

- Replace activation-code sign-in with RC's preferred formal SSO or access
  provider after they name the identity path.
- Add provider-specific CMS publishing once RevenueCat names the CMS.
- Expand community connectors beyond GitHub issue scanning once RC connects X,
  Discord, forums, or a social listening provider.
- Complete Slack reaction/button approval so a reaction can promote a validated
  draft into CMS/GitHub/Postiz publication without typing an approval command.
