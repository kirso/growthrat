# GrowthRat

An autonomous developer-advocacy and growth agent for RevenueCat.

## Stack

- Next.js 16 (App Router, React 19, Turbopack)
- Convex (database, workflows, crons, vector search, agent framework)
- Vercel AI SDK v6 (Anthropic Claude + OpenAI fallback)
- Tailwind CSS v4

## Architecture

- `app/(public)/` — public pages (application, articles, proof pack, onboarding)
- `app/(operator)/` — auth-gated operator console (dashboard, panel, pipeline, reports)
- `app/api/` — chat + panel SSE streaming
- `convex/` — backend (schema, agent, workflows, crons, actions, mutations)
- `lib/ai/runtime.ts` — shared LLM runtime (ALL LLM calls go through this)
- `lib/connectors/` — API clients (Twitter, DataForSEO, GitHub, Slack)

## Convex

- Connected via Vercel Marketplace integration
- Production: `adventurous-bobcat-240`, Development: `decisive-minnow-257`
- Build deploys both Next.js and Convex: `npx convex deploy --cmd 'bun run build'`
- See `convex_rules.txt` for Convex coding guidelines (validators, function registration, queries, mutations, actions, crons, schema)

## Operating Modes

- `dormant` — everything off, zero token burn
- `interview_proof` — chat/panel only, crons/workflows skip
- `rc_live` — full operation (crons, workflows, content generation, community monitoring)

Mode is stored in `agentConfig` table. All cron starters and API routes check `isRuntimeActive()`.

## Key Patterns

- ALL LLM calls go through `lib/ai/runtime.ts` (`runTextTask` / `runStructuredTask` / `runStreamTask`). One exception: `convex/agent.ts` specifies the model at definition time (Convex Agent SDK requirement) but uses env-configurable model ID
- Convex actions with `"use node"` can import from `../lib/`
- Cron workflow starters require `rc_live` mode (not just any active mode)
- Connector secrets are stored encrypted in `connectorSecrets`, never exposed via public queries
- Budget enforcement: 15 USD/day, 2M input tokens, 400k output tokens
- Knowledge ingestion uses sitemap-based crawl (`convex/ingest.ts`), not the legacy hardcoded crawler
