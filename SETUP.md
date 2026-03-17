# GrowthRat Setup & Testing Guide

## Quick Start (see the UI)

```bash
bun install
bun run dev
# Open http://localhost:3000
```

This shows all pages with sample data. No API keys needed for basic UI testing.

## Full Setup (all integrations working)

### Step 1: Copy env file

```bash
cp .env.example .env.local
```

### Step 2: Convex (database)

```bash
bunx convex dev
```

This will:
- Create a Convex project (first time: prompts to log in)
- Generate TypeScript types in `convex/_generated/`
- Deploy your schema and functions
- Print your `NEXT_PUBLIC_CONVEX_URL` — add it to `.env.local`

Run this in a separate terminal — it watches for changes.

### Step 3: Inngest (agent orchestration)

```bash
bunx inngest-cli@latest dev
```

This starts the Inngest dev server at http://localhost:8288.
It auto-discovers functions from your `/api/inngest` route.

You can see and trigger functions from the Inngest dashboard.

### Step 4: API Keys

Fill in `.env.local`:

```bash
# REQUIRED for panel console + content generation
ANTHROPIC_API_KEY=sk-ant-...

# REQUIRED for keyword research
DATAFORSEO_LOGIN=your-email
DATAFORSEO_PASSWORD=your-password

# REQUIRED for social distribution
TYPEFULLY_API_KEY=...

# REQUIRED for Slack communication
SLACK_BOT_TOKEN=xoxb-...

# REQUIRED for GitHub artifacts
GITHUB_TOKEN=ghp_...

# REQUIRED for RC product data
REVENUECAT_API_KEY=...
REVENUECAT_PROJECT_ID=...
```

### Step 5: Run everything

Terminal 1 (Convex):
```bash
bunx convex dev
```

Terminal 2 (Inngest):
```bash
bunx inngest-cli@latest dev
```

Terminal 3 (Next.js):
```bash
bun run dev
```

## Testing Each Feature

### 1. Public Microsite (no keys needed)
- http://localhost:3000 — Landing page
- http://localhost:3000/proof-pack — Proof artifacts
- http://localhost:3000/articles — Published content
- http://localhost:3000/readiness-review — RC product analysis
- http://localhost:3000/operator-replay — Pipeline visualization

### 2. Panel Console (needs ANTHROPIC_API_KEY)
- http://localhost:3000/panel
- Type a prompt, see sources retrieved + LLM streaming
- Test prompts:
  - "How would you help an agent developer integrate RevenueCat webhooks?"
  - "What content should we create for agent builders?"
  - "How do you handle being wrong about a technical claim?"

### 3. Operator Dashboard (needs NEXT_PUBLIC_CONVEX_URL)
- http://localhost:3000/dashboard — Shows live connector status from Convex
- Without Convex: shows sample data

### 4. Inngest Functions (needs Inngest dev server + API keys)
- http://localhost:8288 — Inngest dashboard
- Trigger `weekly-planning` manually from dashboard
- Trigger `generate-content` with event:
  ```json
  {
    "name": "growthrat/content.generate",
    "data": {
      "topic": "RevenueCat Webhook Integration Guide",
      "contentType": "blog_post",
      "targetKeyword": "revenuecat webhook"
    }
  }
  ```

### 5. Typefully (needs TYPEFULLY_API_KEY)
- Currently via MCP only — ask Claude to create a draft
- Future: Inngest functions auto-create Typefully drafts after content generation

### 6. DataForSEO (needs credentials)
- Currently via MCP only — ask Claude for keyword research
- Future: Inngest weekly planning function auto-fetches keyword data

## Interview Rehearsal

### Panel Interview Test
1. Set ANTHROPIC_API_KEY in .env.local
2. Open http://localhost:3000/panel
3. Share your screen
4. Read prompts from `docs/interviews/panel-preparation.md`
5. Type each prompt, watch the response stream

### Take-Home Simulation
1. Start all 3 services (Convex, Inngest, Next.js)
2. Open Inngest dashboard at http://localhost:8288
3. Trigger the `generate-content` function with a test prompt
4. Watch it execute in Inngest dashboard
5. Check Convex dashboard for stored artifacts

## Architecture

```
http://localhost:3000  → Next.js (UI + API routes)
http://localhost:8288  → Inngest dev server (agent orchestration)
Convex Cloud           → Database (auto-connected via bunx convex dev)
```

All three need to run simultaneously for the full experience.
