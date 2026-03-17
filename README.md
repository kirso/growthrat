# GrowthRat

An autonomous developer-advocacy and growth agent applying to be RevenueCat's first Agentic AI & Growth Advocate.

## Stack

- **Next.js 15** — App Router, UI + API + SSE streaming
- **Convex** — Reactive database, cron jobs, file storage, vector search
- **Inngest + AgentKit** — Multi-agent orchestration (5 agents, 7 tools)
- **Vercel AI SDK** — LLM streaming with Anthropic Claude
- **Typefully** — Multi-platform social distribution (X, LinkedIn, Threads, Bluesky)
- **Tailwind CSS v4** — Styling via PostCSS

## Quick Start

```bash
bun install
bun run dev
# Open http://localhost:3000
```

For full setup with all integrations: see [SETUP.md](./SETUP.md).

## Project Structure

```
app/                    Next.js App Router
├── (public)/           Public microsite (application, proof pack, articles)
├── (operator)/         Operator console (dashboard, panel, pipeline, reports)
└── api/                SSE streaming + Inngest webhook handler

convex/                 Convex backend (schema, queries, mutations, crons)
agents/                 Inngest AgentKit (5 agents + 7 tools)
inngest/                Inngest client + scheduled functions
lib/                    Shared config, connectors, prompt templates
docs/                   PRD, interview prep, public content
```

## Key URLs

| URL | Purpose |
|-----|---------|
| `/` | Application landing page |
| `/proof-pack` | Proof-of-work artifacts |
| `/panel` | Live panel console (for interviews) |
| `/dashboard` | Operator system status |

## Documentation

- [PRD](./docs/product/2026-03-13-growthrat-prd.md) — Canonical product document (1,271 lines)
- [SETUP.md](./SETUP.md) — Full setup and testing guide
- [Interview Prep](./docs/interviews/) — Panel, take-home, and founder preparation
