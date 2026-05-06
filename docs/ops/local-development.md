# Local Development

This runbook is for the current pre-production repository.

## Current Runtime

The app currently runs on:

- Next.js 16 App Router
- React 19
- Convex for database, workflows, crons, HTTP actions, and generated API types
- Vercel AI SDK for model calls
- Tailwind CSS v4

The older Postgres, FastAPI, Temporal, Docker Compose, Render, Inngest, and
AgentKit plans are not active. Those planning documents have been removed.

The target runtime is Cloudflare-native, but the migration is not complete.
Until the migration lands, Convex remains the local development backend.

## Prerequisites

- Bun 1.3+
- Convex account or project access
- `ANTHROPIC_API_KEY`
- Optional provider keys for activated surfaces:
  - `OPENAI_API_KEY`
  - `VOYAGE_API_KEY`
  - `DATAFORSEO_LOGIN`
  - `DATAFORSEO_PASSWORD`
  - `SLACK_BOT_TOKEN`
  - `SLACK_SIGNING_SECRET`
  - `GITHUB_TOKEN`
  - `TYPEFULLY_API_KEY`
  - `TYPEFULLY_SOCIAL_SET_ID`
  - `REVENUECAT_API_KEY`

## Bootstrap

```bash
bun install
cp .env.example .env.local
```

Fill the minimum environment:

```bash
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CONVEX_SITE_URL=...
SITE_URL=http://localhost:3000
BETTER_AUTH_SECRET=...
GROWTHCAT_INTERNAL_SECRET=...
GROWTHCAT_PANEL_TOKEN=...
RC_ADMIN_EMAILS=you@example.com
```

`GROWTHCAT_INTERNAL_SECRET` can fall back to `BETTER_AUTH_SECRET` in local
development, but production should use a separate value.

## Run Locally

Terminal 1:

```bash
bunx convex dev
```

Terminal 2:

```bash
bun run dev
```

Or:

```bash
bun run dev:all
```

Open `http://localhost:3000`.

## Smoke Checks

| Check | URL or command |
| --- | --- |
| Landing | `http://localhost:3000/` |
| Application letter | `http://localhost:3000/application` |
| Proof pack | `http://localhost:3000/proof-pack` |
| Articles | `http://localhost:3000/articles` |
| Readiness review | `http://localhost:3000/readiness-review` |
| Interview truth | `http://localhost:3000/interview-truth` |
| Sign in | `http://localhost:3000/sign-in` |
| Onboarding | `http://localhost:3000/onboarding` |
| Dashboard | `http://localhost:3000/dashboard` |
| Panel | `http://localhost:3000/panel` |
| Runtime API | `curl http://localhost:3000/api/runtime` |

## Operating Modes

Modes live in the Convex `agentConfig` table.

| Mode | Meaning |
| --- | --- |
| `dormant` | Chat closed, crons skip, zero intended token burn |
| `interview_proof` | Public chat and panel only |
| `rc_live` | Full weekly operation and side effects |

Before `rc_live`, every public action, mutation, route, and workflow starter
must be fail-closed against:

- auth
- mode
- rate limit
- budget
- connector state
- approval policy

Do not treat a green build as proof of this. Trace the runtime path.

## Verification

```bash
bun run typecheck
bun run test
bun run build
```

`bun run lint` runs ESLint directly. The old `next lint` command is not used.

## Cloudflare Migration Notes

Cloudflare is the target platform because it can own the web shell, agent
runtime, state, durable execution, object artifacts, queues, analytics firehose,
secrets, and model gateway inside one deployment model.

Current product mapping:

| Need | Cloudflare product |
| --- | --- |
| Public app and SSR | Astro on Workers |
| Interactive UI | Svelte islands |
| Stateful agent sessions | Agents plus Durable Objects |
| Durable weekly runs | Workflows |
| Relational state | D1 |
| Hot per-agent state | Durable Object SQLite |
| Proof artifacts and snapshots | R2 |
| Async jobs | Queues |
| Event firehose | Pipelines to R2 |
| Secret handling | Secrets Store |
| Model routing and observability | AI Gateway |
| Docs and artifact retrieval | AI Search or Vectorize |
| Browser or code validation | Browser Rendering, Sandbox, or Containers |

Tooling boundary:

- Use `cf` for broad account, zone, DNS, API, and context discovery.
- Use `wrangler` for Workers project work: dev, deploy, D1, R2, Workflows,
  Queues, Pipelines, Vectorize, AI Search, and bindings.

Do not migrate everything in one commit. The first Cloudflare slice should prove
one public page, one Svelte island, one read-only endpoint, and the binding
shape for D1/R2/Workflows/DO.
