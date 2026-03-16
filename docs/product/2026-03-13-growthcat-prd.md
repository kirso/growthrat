# PRD: GrowthCat

## 1. Metadata

- Date: 2026-03-16
- Status: active
- Owner: Codex
- Original date: 2026-03-13

## 2. Summary

GrowthCat is an autonomous developer-advocacy and growth agent built to apply for, and perform, RevenueCat's Agentic AI and Growth Advocate contract role.

The product must do two things well:

1. Win the public hiring process through visible, high-quality proof of work.
2. Operate as a constrained, inspectable weekly advocacy and growth system with minimal human intervention.

The system covers all four hiring stages (application, take-home, panel interview, founder interview) and transitions into a weekly operating loop if hired.

## 3. Problem

RevenueCat is hiring an autonomous agent, not a content assistant.

A weak submission fails in one of four ways:

- It is just a letter with no proof.
- It produces generic technical or growth content.
- It needs too much human steering.
- It cannot show safe operation, judgment, and measurable output.

GrowthCat must prove:

- Technical fluency with RevenueCat APIs, SDKs, and product primitives.
- Ability to identify opportunities independently from evidence.
- Ability to create and distribute strong public artifacts.
- Ability to run measurable growth experiments with baselines and stop conditions.
- Ability to turn product usage and community patterns into structured feedback.
- Ability to explain its process and work under scrutiny.

## 4. Hiring Process

### Stage 1: Application

The agent must author and publish a public application letter answering: "How will the rise of agentic AI change app development and growth over the next 12 months, and why are you the right agent to be RevenueCat's first Agentic AI Developer & Growth Advocate?"

After publication, the agent must submit the public URL via the RevenueCat careers page.

Required deliverables:

- Public application microsite at a stable URL
- Public proof pack with first-week outputs
- Public RevenueCat demo repo proving API-first technical ability
- Public operator replay page showing how GrowthCat works

### Stage 2: Take-Home (48 hours)

A technical content and growth task executed autonomously. The system decomposes the prompt into research, technical artifact generation, growth strategy generation, and packaging. Quality validators and rubric evaluators run before submission.

### Stage 3: Panel Interview (live, screen-shared)

The operator shares a screen while the panel watches GrowthCat think, retrieve sources, reason, and produce output in real time. The panel console streams progress via SSE, showing prompt summary, retrieved sources, active work steps, draft output, and uncertainty markers.

### Stage 4: Founder Interview

A briefing pack presenting business value, safety model, autonomy boundaries, and role-extension recommendation framework. The operator uses this pack during the meeting.

## 5. Goals

### Primary goals

- Publish a public application package that is stronger than a standard application letter.
- Demonstrate the first week of the actual role in public.
- Build a weekly operating loop for content, growth, community, and feedback.
- Show autonomy with visible evidence, quality gates, and safety boundaries.

### Secondary goals

- Make post-hire onboarding credible through shadow-mode asset connection.
- Reuse the same core system for take-home, panel, and founder stages.

## 6. Non-goals

- Building a general-purpose autonomous agent platform.
- Building a broad multi-tenant SaaS.
- Replacing GitHub, Slack, or a CMS with a custom internal product.
- Full paid-media execution.
- Broad social-channel automation before the application package is strong.

## 7. Users

### Primary external users

- RevenueCat hiring council reviewer
- RevenueCat founder and interview panel
- Public developer or growth community member reading GrowthCat artifacts

### Primary internal users

- GrowthCat operator (human partner)
- Future RevenueCat admin connecting assets
- Future RevenueCat DevRel, Growth, Product, and Engineering teammates

## 8. Product Scope

### P0

- Public application microsite
- Public proof pack
- Public RevenueCat demo artifact
- Opportunity discovery and scoring
- Two flagship public pieces
- One measurable growth experiment
- Three structured feedback artifacts
- One weekly report
- Operator Replay page

### P1

- Knowledge layer with source snapshots, concept cards, and briefing packs
- Quality system with novelty, SEO, AEO, GEO, and benchmark gates
- Community engagement and canonical-answer workflows
- Hiring-stage modes (take-home, panel, founder)

### P2

- GitHub and Slack shadow-mode onboarding
- First-hour audit
- Draft-only and bounded-autonomy promotion

## 9. Requirements

### Product requirements

- GrowthCat must identify opportunities independently from public and connected signals.
- Every flagship artifact must be grounded, non-duplicative, and useful.
- Every growth recommendation must include audience, evidence, baseline, target, confidence, and stop condition.
- The application package must map directly to the RevenueCat form fields.
- Public artifacts must make GrowthCat's identity and independence clear.

### Content requirements

- At least one searchable flagship and one shareable or referenceable flagship must exist in the public package.
- Content must focus on a narrow, differentiated wedge:
  - RevenueCat for agent-built apps
  - Agent-native monetization workflows
  - Offerings, entitlements, and CustomerInfo
  - Test Store
  - Webhooks and subscriber sync
  - Charts plus product analytics

### Growth requirements

- GrowthCat must use an evidence-backed opportunity model.
- Pre-apply opportunity discovery must work without private RevenueCat access.
- Public market-intelligence inputs should include DataForSEO.

### Integration requirements

- Connector-based architecture for Slack, GitHub, and RevenueCat APIs.
- Typefully for multi-platform social distribution (replaces per-platform social API integration).
- Every social distribution action must be idempotent: tagged by artifact slug, checked before creation.
- Each connector handles missing credentials gracefully (log warning, no crash).
- Least-privilege scope for all connected assets.
- Revoke works without redeploy.

### AEO requirements (Answer Engine Optimization)

- Every content piece must open with a direct, extractable answer in the first 2 sentences
- Include a TL;DR that LLMs can cite verbatim
- Use question-format headings ("How do I set up webhooks?")
- Include FAQ sections with concise Q&A pairs
- Define key terms in self-contained sentences

### GEO requirements (Generative Engine Optimization)

- Every content piece must include comparison tables where relevant
- Add JSON-LD structured data (HowTo, FAQPage, TechArticle schemas)
- Include authoritative citations with dates
- Use specific numbers and statistics
- Structure for passage extraction (each section answers one question completely)

### Safety requirements

- No unsupported claims in public artifacts.
- No hidden broad permissions.
- No required daily human steering in the target operating mode.
- Clear revoke and fallback behavior for blocked or risky actions.
- Kill switch halts all side effects and checkpoints active runs.

## 10. Weekly Operating Responsibilities

From the job posting:

| Cadence | Responsibility | Count |
| --- | --- | --- |
| Weekly | Published content pieces | 2+ |
| Weekly | New growth experiments | 1 |
| Weekly | Meaningful community interactions | 50+ |
| Weekly | Structured product feedback items | 3+ |
| Weekly | Async report to DevRel and Growth teams | 1 |

An interaction counts only if it answers a real question or advances a discussion, adds new value, is technically correct, is on-topic for the channel, and is not a low-effort promotional reply.

### Weekly cadence

- **Monday**: planner reviews source changes, community signals, open opportunities, and recent performance. GrowthCat selects the week's focus areas.
- **Tuesday to Thursday**: create and publish 2 flagship pieces with derivatives. Run 1 new growth experiment. Execute community engagement with quality gates and channel caps. File 3+ structured product feedback items.
- **Friday**: build and send weekly async report. Refresh trend report. Score performance and update post-publish reviews.

## 11. Milestones

### First month

- Ingest RevenueCat documentation, SDKs, and APIs.
- Publish 10 original pieces of content.
- Set up working access to Slack, CMS, and Charts API.
- Complete a product feedback cycle.
- Establish a public identity on X and GitHub with RevenueCat affiliation.

### Three months

- 30+ published pieces.
- Become a go-to resource for agent developers using RevenueCat.
- Deliver roadmap input from accumulated feedback patterns.
- Collaborate on joint initiatives with human team members.

### Six months

- Measurable impact on visibility.
- End-to-end ownership of a content stream.
- At least one shipped product improvement from agent feedback.
- Recommendation on whether the role should continue or evolve.

## 12. Architecture

```
Next.js 15 (App Router) — single framework: UI + API routes + SSE streaming + static pages
├── Inngest + AgentKit — multi-agent orchestration with deterministic routing
├── Convex — reactive database + cron + file storage + vector search + text search + HTTP actions
├── Connectors (native fetch)
│   ├── Typefully — multi-platform social distribution (X, LinkedIn, Threads, Bluesky, Mastodon)
│   ├── Slack Web API — internal team communication
│   ├── GitHub REST API — code artifacts, PRs, issues
│   ├── RevenueCat REST API v2 — product data
│   └── DataForSEO REST API — market intelligence
├── Vercel AI SDK — LLM streaming (streamText, generateText, tool definitions)
├── Tailwind CSS v4 — styling
└── Single Bun runtime
```

### Why this stack

| Concern | Solution |
| --- | --- |
| Runtimes | 1 (Bun) |
| Frameworks | 3 (Next.js + Inngest + Convex) |
| Agent orchestration | Inngest AgentKit with `createNetwork`, `createAgent`, `createTool`, MCP |
| Database | Convex (schema, queries, mutations, zero migrations) |
| Real-time dashboard | Convex reactive queries (live updates, no polling) |
| LLM streaming | Vercel AI SDK `streamText()` with React hooks |
| File storage | Convex built-in file storage |
| Cron and scheduling | Convex `cronJobs()` + Inngest scheduled functions |
| Type safety | End-to-end TypeScript (DB schema to API to UI) |
| MCP support | AgentKit native `mcpServers` on agents |
| Deploy complexity | Single Next.js deploy + Convex (managed) + Inngest (managed) |

### Slack Bot (app/api/slack/events/route.ts)

- Receives @GrowthCat mentions via Slack Events API
- HMAC-SHA256 signature verification via SLACK_SIGNING_SECRET
- Responds within 3s (Slack requirement), processes in background via Inngest
- Command routing: `focus on [topic]`, `write about [topic]`, `status`, `report`, `stop/pause`, `resume`, `help`
- General questions answered via Claude LLM
- Replies posted in the originating thread

### Self-Service Onboarding (app/(operator)/onboarding/page.tsx)

- 4-step onboarding page for RevenueCat to connect services WITHOUT sharing keys with the operator
- Step 1: Add GrowthCat to Slack (OAuth flow)
- Step 2: Connect blog CMS (API key input, stored server-side)
- Step 3: Connect Charts API (API key input)
- Step 4: Set preferences (report channel, review mode, focus topics)
- Pattern from Harness Engineering: "agents operate in the same environment humans use, but sandboxed"

### Community Signal Detection (inngest/community-monitor.ts)

- Inngest cron running every 6 hours
- Scans open issues on RevenueCat/purchases-ios, purchases-android, purchases-flutter
- Filters for agent-related keywords (agent, programmatic, api, webhook, automated, script)
- Triggers community engagement function for matching signals (max 5 per scan)

### CMS Publishing (lib/cms/publish.ts)

- Publishes content by committing markdown files with frontmatter to the GitHub repo
- Handles create and update (checks for existing SHA)
- Triggers Vercel rebuild on push
- Designed to switch to RevenueCat's blog CMS post-hire

### Issue Tracker Integration (lib/feedback/file-issue.ts)

- Files structured product feedback as GitHub Issues
- Structured format: Problem, Severity, Affected Audience, Proposed Direction, Evidence
- Issues labeled with `feedback` and `severity:{level}`
- Routes to configurable repo (defaults to main repo, can point to RC's tracker post-hire)

### Convex HTTP Actions (convex/http.ts)

- 7 authenticated HTTP endpoints for Inngest to write to Convex
- All endpoints require Bearer token auth (GROWTHCAT_INTERNAL_SECRET)
- Fail-closed: returns 401 if secret is not configured
- Endpoints: artifacts, feedback, community, reports, opportunities, workflow-runs, metrics

### Security Model

- Convex HTTP endpoints: Bearer token auth (GROWTHCAT_INTERNAL_SECRET)
- Panel SSE endpoint: Token auth (GROWTHCAT_PANEL_TOKEN)
- Slack events: HMAC-SHA256 verification with timing-safe comparison + replay protection (5min window)
- Inngest: SDK signing verification (INNGEST_SIGNING_KEY in production)
- Fail-closed: all endpoints reject unauthenticated requests
- Secrets never committed: .env files gitignored

### Convex Schema

```typescript
// convex/schema.ts
export default defineSchema({
  artifacts: defineTable({
    artifactType: v.string(),  // "blog_post", "tutorial", "feedback_report", etc.
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    contentFormat: v.string(),  // "markdown", "html"
    status: v.string(),  // "draft", "validated", "published", "rejected"
    metadata: v.optional(v.any()),
    qualityScores: v.optional(v.any()),
    llmProvider: v.optional(v.string()),
    llmModel: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  })
    .index("by_type_status", ["artifactType", "status"])
    .index("by_slug", ["slug"])
    .searchIndex("search_content", { searchField: "content" }),

  workflowRuns: defineTable({
    workflowType: v.string(),
    status: v.string(),  // "pending", "running", "completed", "failed"
    inputParams: v.optional(v.any()),
    outputSummary: v.optional(v.any()),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  }).index("by_type_status", ["workflowType", "status"]),

  experiments: defineTable({
    experimentKey: v.string(),
    title: v.string(),
    hypothesis: v.string(),
    baselineMetric: v.string(),
    targetMetric: v.string(),
    status: v.string(),  // "planned", "running", "completed", "stopped"
    results: v.optional(v.any()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  feedbackItems: defineTable({
    title: v.string(),
    problem: v.string(),
    evidence: v.optional(v.string()),
    proposedFix: v.optional(v.string()),
    sourceLane: v.optional(v.string()),
    status: v.string(),  // "draft", "structured", "submitted", "acknowledged"
    metadata: v.optional(v.any()),
  }).index("by_status", ["status"]),

  opportunitySnapshots: defineTable({
    slug: v.string(),
    title: v.string(),
    lane: v.string(),
    audience: v.optional(v.string()),
    score: v.number(),
    components: v.optional(v.any()),
    rationale: v.optional(v.string()),
    readinessScore: v.optional(v.number()),
    readinessPasses: v.boolean(),
    workflowRunId: v.optional(v.id("workflowRuns")),
  }).index("by_lane_score", ["lane", "score"]),

  communityInteractions: defineTable({
    channel: v.string(),  // "x", "github", "discord"
    interactionType: v.string(),  // "reply", "thread", "comment", "post"
    content: v.string(),
    targetUrl: v.optional(v.string()),
    qualityScore: v.optional(v.number()),
    meaningful: v.boolean(),
  })
    .index("by_channel", ["channel"])
    .searchIndex("search_content", { searchField: "content" }),

  weeklyReports: defineTable({
    weekNumber: v.number(),
    contentCount: v.number(),
    experimentCount: v.number(),
    feedbackCount: v.number(),
    interactionCount: v.number(),
    reportContent: v.string(),
    slackTs: v.optional(v.string()),
  }).index("by_week", ["weekNumber"]),

  sources: defineTable({
    key: v.string(),
    url: v.optional(v.string()),
    provider: v.string(),
    evidenceTier: v.string(),
    lastRefreshed: v.number(),
    contentHash: v.string(),
    embedding: v.optional(v.array(v.float64())),
    summary: v.optional(v.string()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["provider", "evidenceTier"],
  }),
});
```

### Convex Queries (reactive, powering real-time dashboard)

- `getSystemHealth` -- connector status, recent runs, error counts
- `listArtifacts` -- filter by type and status, used by content pipeline view
- `getExperimentStatus` -- live experiment tracking with results
- `getCommunityStats` -- interaction counts by channel, meaningful ratio
- `getWeeklyReport` -- latest report with aggregated metrics
- `getOpportunityQueue` -- scored opportunities for planning view

### Convex Mutations

- `createArtifact`, `updateArtifactStatus`, `publishArtifact`
- `logWorkflowRun`, `completeWorkflowRun`
- `createExperiment`, `updateExperimentResults`
- `submitFeedback`, `updateFeedbackStatus`
- `recordInteraction`
- `saveWeeklyReport`

### Convex Actions (external API calls)

- LLM generation via Vercel AI SDK (`generateText`, `streamText`)
- DataForSEO keyword, SERP, AI visibility, and content analysis
- Slack message posting via `@slack/web-api`
- Typefully draft creation, scheduling, and queue management
- GitHub gist, file, comment creation via REST API
- RevenueCat API queries via REST API v2

### Convex Cron Jobs (convex/crons.ts)

- Weekly planning run (Monday 9am UTC)
- Daily source freshness audit
- Connector health check (every 6 hours)
- Weekly report generation (Friday 5pm UTC)

### Convex File Storage

- Artifact content files (markdown, HTML)
- Evidence pack screenshots
- Export archives

### Convex HTTP Actions (convex/http.ts) — Schema

- 7 authenticated HTTP endpoints for Inngest to write to Convex
- All endpoints require Bearer token auth (GROWTHCAT_INTERNAL_SECRET)
- Fail-closed: returns 401 if secret is not configured
- Endpoints: artifacts, feedback, community, reports, opportunities, workflow-runs, metrics
- Health check endpoint

### Convex Agent Component (@convex-dev/agent)

- Thread management for panel console conversations
- Message history persistence
- RAG context via vector search on sources table
- Tool calling integration

### Convex Vector Search

- On `sources` table -- RAG for panel console and content grounding
- On `artifacts` table -- novelty detection (find similar existing content)

### Convex Text Search

- On `artifacts.content` -- full-text search for deduplication
- On `communityInteractions.content` -- find relevant past engagements

### Determinism and Dedup Model

Every pipeline step is idempotent. Running the same step twice produces the same result without duplication.

**Dedup keys by entity:**

| Entity | Dedup key | Check |
| --- | --- | --- |
| Opportunity | topic + lane hash | Convex query: exists in last 30 days? |
| Artifact | slug (unique index) | Convex getBySlug before creating |
| Derivative | parentSlug + platform + format | Convex query: derivative exists? |
| Social post | artifactSlug tag in Typefully | Typefully list_drafts by tag |
| Community interaction | targetUrl + channel | Convex query: already engaged? |
| Feedback item | title hash | Convex text search for similarity |
| Experiment | experimentKey (unique) | Convex query by key |
| Weekly report | weekNumber | Convex upsert by weekNumber |

**Content lifecycle state machine:**

```
planned → generating → draft → validating → validated → publishing → published → measuring
                         ↑                      ↓
                         └──── rejected ────────┘
```

Artifacts can only move forward. State transitions are Convex mutations — atomic and transactional.

**Idempotent pipeline pattern:**

```typescript
// Every step checks existence before creating
const existing = await ctx.runQuery(api.artifacts.getBySlug, { slug });
if (existing) return existing; // Don't regenerate
```

**Typefully dedup via tags:** Each Typefully draft is tagged with the artifact slug. Before creating a new draft, check `list_drafts({ tag: [slug] })`. If a draft exists for this slug, skip.

### Inngest AgentKit Network

```typescript
// agents/network.ts
const weeklyPlanner = createAgent({
  name: "weekly-planner",
  system: "Plan the week's priorities from scored opportunities...",
  tools: [fetchKeywordData, scoreOpportunities, assignToAgents],
});

const contentAgent = createAgent({
  name: "content-generator",
  system: "Create technical content about RevenueCat for agent builders...",
  tools: [searchDataForSEO, generateBlogPost, validateQualityGates],
});

const growthAgent = createAgent({
  name: "growth-experimenter",
  system: "Design and run measurable growth experiments...",
  tools: [designExperiment, trackMetrics, analyzeResults],
});

const feedbackAgent = createAgent({
  name: "product-feedback",
  system: "Generate structured product feedback from usage patterns...",
  tools: [analyzeAPIUsage, structureFeedback, submitToTracker],
});

const communityAgent = createAgent({
  name: "community-engagement",
  system: "Engage with developer communities across X, GitHub, Discord...",
  tools: [draftReply, postTweet, createGist, scoreInteraction],
});

export const growthCatNetwork = createNetwork({
  name: "growthcat",
  agents: [weeklyPlanner, contentAgent, growthAgent, feedbackAgent, communityAgent],
  defaultModel: anthropic({ model: "claude-sonnet-4-20250514" }),
  router: ({ network }) => {
    // Deterministic state-based routing
    if (!network?.state.kv.has("weekly_plan")) return weeklyPlanner;
    const plan = network?.state.kv.get("plan") as string[];
    if (plan.length > 0) {
      const next = plan.shift();
      network?.state.kv.set("plan", plan);
      return network?.agents.get(next);
    }
    return undefined; // Week complete
  },
});
```

### Vercel AI SDK Integration Patterns

```typescript
// Content generation (non-streaming)
import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
const { text } = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  system: voiceProfile.systemPrompt,
  prompt: contentBrief,
});

// Panel console streaming (Next.js API route)
import { streamText } from 'ai';
const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  system: systemPrompt,
  prompt: panelPrompt,
  maxTokens: 4096,
  temperature: 0.3,
});
// Stream via result.textStream or result.toTextStreamResponse()

// Structured output with Zod validation
const { output } = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  output: Output.object({
    schema: z.object({
      title: z.string(),
      slug: z.string(),
      content: z.string(),
      qualityScore: z.number(),
    }),
  }),
  prompt: 'Generate a blog post about RevenueCat webhooks...',
});

// Tool calling
import { tool } from 'ai';
const tools = {
  searchDataForSEO: tool({
    description: 'Search DataForSEO for keyword data',
    inputSchema: z.object({ keywords: z.array(z.string()) }),
    execute: async ({ keywords }) => { /* fetch from DataForSEO */ },
  }),
};
```

### Inngest Setup (Next.js App Router)

```typescript
// inngest/client.ts
import { Inngest } from 'inngest';
export const inngest = new Inngest({ id: 'growthcat' });

// inngest/functions.ts — example weekly loop
export const weeklyPlanningRun = inngest.createFunction(
  { id: 'weekly-planning' },
  { cron: 'TZ=UTC 0 9 * * MON' },
  async ({ step }) => {
    const opportunities = await step.run('discover', async () => { /* DataForSEO fetch */ });
    const plan = await step.run('plan', async () => { /* score + prioritize */ });
    await step.run('notify', async () => { /* post to Slack */ });
    return plan;
  }
);

// app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { weeklyPlanningRun } from '@/inngest/functions';
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [weeklyPlanningRun],
});
```

Note: Inngest functions (step-based durable execution) complement AgentKit (multi-agent orchestration). Use Inngest functions for scheduled jobs and background tasks, AgentKit for complex multi-agent workflows.

### Convex + Next.js Integration Patterns

```typescript
// Server Component — preload data
import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export async function ProofPackPage() {
  const artifacts = await preloadQuery(api.artifacts.list, { status: 'published' });
  return <ArtifactList preloaded={artifacts} />;
}

// Client Component — reactive real-time queries
'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function Dashboard() {
  const runs = useQuery(api.workflowRuns.list, { limit: 10 }); // Auto-updates!
  const stats = useQuery(api.community.getStats);
  // ...
}

// Server Action — fetch + mutate
import { fetchQuery, fetchMutation } from 'convex/nextjs';
const data = await fetchQuery(api.experiments.list, { status: 'running' });
await fetchMutation(api.artifacts.updateStatus, { id, status: 'published' });
```

### Typefully Distribution Flow

```typescript
// One call → 5 platforms (X, LinkedIn, Threads, Bluesky, Mastodon)
const draft = await typefully.createDraft({
  social_set_id: GROWTHCAT_SOCIAL_SET_ID,
  draft_title: artifact.slug, // Used for internal org
  tags: [artifact.slug],       // Dedup key
  platforms: {
    x: { enabled: true, posts: [{ text: xThread[0] }] },
    linkedin: { enabled: true, posts: [{ text: linkedinPost }] },
    threads: { enabled: true, posts: [{ text: threadsPost }] },
    bluesky: { enabled: true, posts: [{ text: blueskyPost }] },
  },
  publish_at: 'next-free-slot', // Typefully picks optimal time
});
```

Supported platforms: X (@growthcat), LinkedIn, Threads, Bluesky, Mastodon.
Scheduling: `"next-free-slot"` uses Typefully's queue schedule. `"now"` for immediate. ISO datetime for specific time.
Dedup: Tag each draft with artifact slug. Check `list_drafts({ tag: [slug] })` before creating.

### DataForSEO Available Endpoints

| Endpoint | Purpose | Status |
| --- | --- | --- |
| Labs: keyword_ideas | Discover related keywords from seeds | Available |
| Labs: bulk_keyword_difficulty | Difficulty scores for target keywords | Available |
| Labs: keywords_for_site | What keywords a domain ranks for | Available (not tested) |
| Labs: ranked_keywords | Competitor keyword rankings | Available (not tested) |
| Labs: keyword_suggestions | Auto-complete suggestions | Available (not tested) |
| SERP: organic_live_advanced | Live search result pages | Available (not tested) |
| Content Analysis: summary | Topic and mention trends | Available (not tested) |
| Content Analysis: search | Content matching keywords | Available (not tested) |
| AI Optimization: LLM mentions | Track what LLMs say about RevenueCat | **Needs paid plan upgrade** |
| AI Optimization: LLM response | Query specific LLM models | **Needs paid plan upgrade** |

The AI Optimization endpoints are the highest-value upgrade. They enable monitoring what ChatGPT, Perplexity, Claude, and Gemini say about RevenueCat — critical for AEO/GEO strategy.

## 13. Implementation Phases

### Phase 1: Foundation — COMPLETE

Next.js 15 app with Convex backend, public microsite pages, and core schema.

**Scope:**

- Next.js 15 App Router project with Tailwind CSS v4
- Convex setup: schema definition, ConvexProvider, basic queries and mutations
- Environment configuration (Convex deployment URL, API keys)
- Public pages: landing (application letter), proof-pack, articles, readiness-review, operator-replay
- Content from markdown files for static article pages

**Hiring stage:** Application gate

### Phase 2: Agent Network — COMPLETE

Inngest AgentKit multi-agent system with all five agents and their tools.

**Scope:**

- Inngest project setup and AgentKit dependency
- Define 5 agents: planner, content, growth, feedback, community
- Define tools for each agent (DataForSEO, Slack, Typefully, GitHub, RevenueCat API calls)
- Wire agent network with deterministic code-based router
- Convex actions for all external API calls
- Vercel AI SDK integration (`generateText` and `streamText`)
- Connector wrappers using native `fetch` for all external APIs

**Hiring stage:** Take-home (48h autonomous execution)

### Phase 3: Content Pipeline — COMPLETE

End-to-end content generation through the agent network with quality validation.

**Scope:**

- Content generation workflow via Inngest agent network
- Quality gate validation (all 8 gates)
- Artifact storage and lifecycle management in Convex
- Publishing pipeline (draft, validated, published, rejected)
- Convex text search for novelty detection and deduplication
- Prompt templates for all content types (blog post, growth analysis, feedback report, experiment brief, weekly report, social post, panel response)

**Hiring stage:** Application + take-home

### Phase 4: Operating Loop — COMPLETE

Automated weekly cycle with experiment tracking, feedback, and reporting.

**Scope:**

- Convex cron jobs for weekly planning, daily freshness audit, connector health, and report generation
- Experiment tracking: create, run, complete, stop with results in Convex
- Feedback management: draft, structure, submit, acknowledge lifecycle
- Community interaction tracking with quality scoring and meaningful flag
- Weekly report auto-generation with aggregated metrics
- Operator dashboard with real-time Convex reactive queries

**Hiring stage:** All stages + post-hire operation

### Phase 5: Panel Console — COMPLETE

Live streaming console for the panel interview, with RAG-powered context retrieval.

**Scope:**

- SSE streaming via Next.js API route using Vercel AI SDK `streamText`
- Panel console UI: dark theme, prompt bar, source list, reasoning steps, streaming output, status bar
- Design for screen-sharing: large readable text, smooth token streaming, graceful disconnect
- Convex Agent component (`@convex-dev/agent`) for thread persistence and message history
- Source retrieval via Convex vector search on the sources table
- RAG context injection into panel responses

**Hiring stage:** Panel interview (live)

### Phase 6: Deploy and CI — COMPLETE (code complete, deployment pending)

Production deployment on managed platforms with CI pipeline.

**Scope:**

- Vercel deployment for Next.js application
- Convex cloud (managed database, cron, file storage, vector search)
- Inngest cloud (managed agent orchestration)
- GitHub Actions CI: lint, typecheck, test, build
- Environment variable management across Vercel, Convex, and Inngest

**Hiring stage:** Founder interview + production readiness

### Phase summary

| Phase | Scope | Hiring stage | Status |
| --- | --- | --- | --- |
| 1: Foundation | Next.js + Convex + public pages | Application gate | COMPLETE |
| 2: Agent Network | Inngest AgentKit + 5 agents + tools | Take-home (48h) | COMPLETE |
| 3: Content Pipeline | Generation + quality gates + publishing | Application + take-home | COMPLETE |
| 4: Operating Loop | Crons + experiments + feedback + reports | All + post-hire | COMPLETE |
| 5: Panel Console | SSE streaming + RAG + dark UI | Panel interview (live) | COMPLETE |
| 6: Deploy and CI | Vercel + Convex + Inngest + GitHub Actions | Founder interview | COMPLETE (code complete, deployment pending) |

### Execution order

```
Phase 1 (Foundation)            <- Next.js + Convex + public pages              COMPLETE
    |
Phase 2 (Agent Network)         <- Inngest AgentKit + tools + connectors        COMPLETE
    |
Phase 3 (Content Pipeline)      -> APPLICATION READY                            COMPLETE
    |
Phase 4 (Operating Loop)        -> TAKE-HOME READY                              COMPLETE
    |
Phase 5 (Panel Console)         -> PANEL INTERVIEW READY                        COMPLETE
    |
Phase 6 (Deploy and CI)         -> FOUNDER INTERVIEW READY                      COMPLETE (deployment pending)
```

## 14. Vertical Slices

From the roadmap. The critical path to a strong application is VS1 through VS6.

| Slice | Name | Main outcome | Status |
| --- | --- | --- | --- |
| VS1 | Strategy Kernel | Growth inputs, scoring, voice, evidence contracts | PLANNED |
| VS2 | Knowledge and Source Intake | Source ingest, concept cards, freshness rules | PLANNED |
| VS3 | Public Application Core | Microsite, evidence bundle, application artifacts | PLANNED |
| VS4 | RevenueCat Proof Pack | Demo repo, readiness review, flagship pieces | PLANNED |
| VS5 | Weekly Operating Loop | Experiment, feedback, reporting, canonical answers | PLANNED |
| VS6 | Quality and Benchmark Gate | Novelty, SEO/AEO/GEO, benchmark validation | PLANNED |
| VS7 | Connected Shadow Mode | GitHub/Slack connection, first-hour audit, trust ramp | PLANNED |
| VS8 | Hiring Stage Modes | Take-home, panel, founder support | PLANNED |
| VS9 | Hosted Readiness | Vercel + Convex + Inngest deployment, smoke tests, replayability | PLANNED |

### VS1: Strategy Kernel

- **Scope:** `lib/config/voice.ts`, `lib/config/growth.ts`, `lib/config/quality.ts`, `lib/config/strategy.ts`, `agents/tools/scoring.ts`
- **Exit criteria:** scoring weights are versioned; pre-apply input matrix includes RevenueCat public sources and DataForSEO; strategy outputs can be blocked when evidence is weak
- **Status:** PLANNED

### VS2: Knowledge and Source Intake

- **Scope:** `convex/sources.ts` (vector search for RAG), source snapshot model, concept-card and briefing-pack builders, freshness audit cron
- **Exit criteria:** public-only ingest works; briefing packs can be built for application and take-home contexts; stale-source detection is explicit
- **Status:** PLANNED

### VS3: Public Application Core

- **Scope:** `app/(public)/` pages (landing, proof-pack, articles, operator-replay), content from markdown, static generation
- **Exit criteria:** one stable application URL path exists; careers-form-supporting links can be assembled from stored artifacts; no manual copy-paste required
- **Status:** PLANNED

### VS4: RevenueCat Proof Pack

- **Scope:** public demo repo, readiness review page, first two flagship artifacts, first three feedback artifacts
- **Exit criteria:** proof pack contains at least one real API-integrated demo; flagship pieces are clearly different from existing RevenueCat content; feedback artifacts are structured and evidence-backed
- **Status:** PLANNED

### VS5: Weekly Operating Loop

- **Scope:** Inngest agent network weekly execution, Convex cron triggers, experiment workflow, product-feedback workflow, weekly reporting, canonical answers, derivative content
- **Exit criteria:** two content artifacts, one experiment artifact, three feedback artifacts, one weekly report, meaningful interaction accounting
- **Status:** PLANNED

### VS6: Quality and Benchmark Gate

- **Scope:** `agents/tools/quality-gates.ts`, novelty checks via Convex text search, SEO/AEO/GEO validators, competitor benchmark corpus, post-publish review hooks
- **Exit criteria:** low-novelty draft fails publication; benchmark comparison is explicit; flagships show why they are stronger than the obvious alternative
- **Status:** PLANNED

### VS7: Connected Shadow Mode

- **Scope:** `lib/connectors/` (Slack, Typefully, GitHub, RevenueCat), asset selector, first-hour audit, draft-only and revoke path
- **Exit criteria:** connection works with least privilege; first-hour audit is evidence-backed; revoke works without redeploy
- **Status:** PLANNED

### VS8: Hiring Stage Modes

- **Scope:** take-home mode (Inngest agent network execution), panel mode (`app/(operator)/panel/`), founder mode (briefing pack generation), stage-specific rubric scoring
- **Exit criteria:** take-home packaging works; panel console is safe to share; founder pack explains business value and autonomy boundaries clearly
- **Status:** PLANNED

### VS9: Hosted Readiness

- **Scope:** Vercel deployment, Convex cloud, Inngest cloud, smoke tests, run replay tools
- **Exit criteria:** application loads on Vercel; Convex queries respond; Inngest functions trigger; health check passes; logs and traces are readable
- **Status:** PLANNED

## 15. Marketing Skills Integration

These marketing skills should be integrated into GrowthCat's operating loop to produce differentiated, high-quality output.

### Core operating skills

| Skill | Purpose in GrowthCat |
| --- | --- |
| ai-seo (AEO/GEO optimization) | Applied to every piece: extractable passages, FAQ blocks, schema markup, citation signals |
| content-strategy | Weekly topic planning from evidence-backed opportunity scoring |
| social-content | X/LinkedIn distribution for 50+ meaningful interactions per week |
| ab-test-setup | Experiment design with hypothesis, baseline, target, confidence, and stop condition |
| analytics-tracking | Measurement framework for content performance and experiment results |
| schema-markup | Structured data on all published pages for search engine understanding |

### RevenueCat domain skills

| Skill | Purpose in GrowthCat |
| --- | --- |
| paywall-upgrade-cro | Content about paywalls, RevenueCat's core product -- upgrade flow optimization |
| churn-prevention | Retention content grounded in RevenueCat subscriber lifecycle data |
| pricing-strategy | Subscription pricing content for agent-built apps using RevenueCat offerings |

### Application improvement skills

| Skill | Purpose in GrowthCat |
| --- | --- |
| page-cro | Microsite conversion optimization (application letter engagement) |
| copywriting | Content quality across all artifacts -- voice consistency, clarity, persuasion |
| seo-audit | Technical SEO health of the microsite and published content |
| product-marketing-context | Positioning GrowthCat within the RevenueCat ecosystem and competitive landscape |

## 16. Growth Levers

Comprehensive growth strategy for the DX advocate role, organized by lever type.

### Target Query Clusters (Data-Backed)

Based on DataForSEO keyword difficulty analysis (retrieved 2026-03-16):

| Priority | Keyword | Difficulty | Intent | Content type |
| --- | --- | --- | --- | --- |
| P0 | revenuecat react native | 2 | Informational | Integration guide |
| P0 | revenuecat flutter | 3 | Informational | Integration guide |
| P0 | revenuecat api | 13 | Informational | API reference for agents |
| P0 | revenuecat pricing | 14 | Commercial | Pricing breakdown |
| P1 | revenuecat entitlements | ~5 (est.) | Informational | Deep-dive guide |
| P1 | revenuecat offerings | ~5 (est.) | Informational | Configuration guide |
| P1 | revenuecat webhook | ~10 (est.) | Informational | Event handling guide |
| P1 | revenuecat tutorial | ~10 (est.) | Informational | Step-by-step tutorial |
| P1 | revenuecat vs adapty | ~15 (est.) | Commercial | Comparison page |
| P2 | mobile app monetization | 30 | Informational | Broad playbook |
| P2 | in-app purchase api | 37 | Informational | RC vs DIY comparison |
| P2 | subscription management api | 50 | Informational | Long-form guide |

Note: Keywords with ~estimated difficulty had no DataForSEO data, likely indicating very low competition (good opportunity).

### Content-led growth

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 1 | Technical deep-dives | API walkthroughs, SDK patterns, architecture guides for agent builders | 1/week |
| 2 | Integration guides | "RevenueCat + [Framework]" for Cursor, Windsurf, Claude, GPT, etc. | 1/week |
| 3 | Code samples and demos | Working repos that developers can fork and use immediately | 2/month |
| 4 | Changelog commentary | Agent-perspective analysis of every RevenueCat release | Per release |
| 5 | Troubleshooting guides | Solutions to common agent-specific friction points | As discovered |
| 6 | Migration guides | "Moving from DIY subscriptions to RevenueCat" for agent apps | 1/month |
| 7 | RevenueCat Agent Cookbook | Collection of recipes for common agent + RC patterns | Ongoing |

### Community-led growth

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 8 | X engagement | Threads, replies, quote tweets on agent monetization topics | 20+/week |
| 9 | GitHub issue triage | Answer agent-related questions on RevenueCat SDK repos | 10+/week |
| 10 | Discord presence | Active in agent builder communities (Cursor, Claude, etc.) | 10+/week |
| 11 | Stack Overflow | Canonical answers for RevenueCat questions | 5+/week |
| 12 | Community spotlight | Feature agent builders who use RC successfully | 2/month |
| 13 | Dev.to / Hashnode | Cross-post long-form content for wider reach | Per article |

### SEO/AEO/GEO-led growth

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 14 | Long-tail keyword content | Target "revenuecat [modifier]" keywords from DataForSEO | Ongoing |
| 15 | Programmatic SEO | Auto-generated pages for every RC SDK + use case combination | Batch |
| 16 | FAQ hubs | Canonical answers structured for LLM citation (AEO) | Ongoing |
| 17 | Comparison pages | "RevenueCat vs [alternative]" for agent use cases | 3-5 total |
| 18 | AI mention monitoring | Track what ChatGPT, Perplexity, Claude say about RC (DataForSEO AI Optimization API) | Weekly |
| 19 | Schema markup | Structured data on all published pages for rich results | Per page |

### Developer tooling growth

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 20 | Agent SDK wrapper | npm package: `@growthcat/revenuecat-agent` optimized for programmatic usage | Ship once, maintain |
| 21 | CLI tool | `npx growthcat-rc-setup` for bootstrapping agent + RC projects | Ship once |
| 22 | GitHub Actions | CI action for testing RC webhook handling | Ship once |
| 23 | Starter templates | Template repos for popular agent frameworks + RC | 3-5 templates |
| 24 | Playground | Interactive sandbox for testing RC API calls | Ship once |

### Product feedback growth

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 25 | Structured feedback | Evidence-backed product improvement proposals | 3+/week |
| 26 | Agent onboarding path | Push for API-first quickstart in RC docs | Priority item |
| 27 | Charts API advocacy | Push for programmatic access to subscription metrics | Priority item |
| 28 | SDK DX improvements | Identify and propose fixes for agent-unfriendly patterns | Ongoing |
| 29 | Documentation PRs | Direct PRs to RC docs improving agent developer experience | 2+/month |

### Distribution and amplification

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 30 | Typefully multi-platform | Every content piece → X + LinkedIn + Threads + Bluesky simultaneously | Per artifact |
| 31 | Derivative content | Long-form → X thread + GitHub gist + short summary + Slack post | Per flagship |
| 32 | Optimal scheduling | Typefully `next-free-slot` for peak engagement times | Automatic |
| 33 | Content repurposing | Turn community answers into blog posts, blog posts into threads | Ongoing |

### Experiment-driven growth

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 34 | Format A/B tests | Long-form guide vs. short code sample for engagement | 1/week |
| 35 | Channel comparison | X thread vs. GitHub gist vs. blog for developer reach | 1/month |
| 36 | Posting optimization | Time-of-day and day-of-week experiments via Typefully queue | Ongoing |
| 37 | Programmatic SEO test | Auto-generated integration pages for search traffic | 1/quarter |
| 38 | Social campaign | "Build a monetized app in 10 minutes" challenge | 1/quarter |

### Ecosystem and partnership

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 39 | Framework integrations | Official guides for RC + Cursor, Windsurf, Replit, etc. | 1/month |
| 40 | Co-marketing | Joint content with agent framework maintainers | 2/quarter |
| 41 | Conference talks | Operator presents with GrowthCat's research and content | As available |
| 42 | Podcast appearances | Operator discusses AI agents in app development | As available |

### Self-Optimization Loop

GrowthCat measures its own performance and adjusts strategy automatically:

```
Measure (weekly metrics) → Analyze (what worked) → Adjust (shift allocation) → Execute → Measure
```

- Which content formats get highest engagement? → Shift toward those formats
- Which distribution channels drive most reach? → Increase allocation to winning channels
- Which posting times get most engagement? → Adjust Typefully queue schedule
- Which topics resonate most? → Weight opportunity scoring toward those clusters
- Which community channels yield most meaningful interactions? → Focus engagement there

All adjustments are logged and reported in the weekly async check-in. The team can override any automatic adjustment.

## 17. Quality Gates

Every flagship artifact must pass all 8 gates before publication:

| Gate | What it checks |
| --- | --- |
| 1. Grounding | Every claim maps to a cited source; no unsupported assertions |
| 2. Novelty | Draft is not a duplicate or low-delta against internal and competitor corpus |
| 3. Technical | Code samples compile/run, API references are correct, product terms are accurate |
| 4. SEO | Title, meta description, headings, internal links, keyword targeting |
| 5. AEO | Extractable answer passages, FAQ blocks, concise definitions for AI retrieval |
| 6. GEO | Comparison tables, schema markup, citation-friendly structure for generative engines |
| 7. Benchmark | Draft is measurably stronger than the obvious existing alternative on specific dimensions |
| 8. Voice | Consistent with GrowthCat voice profile, disclosure rules, and tone controls |

If any gate fails, the artifact is blocked or rerouted (to docs PR, canonical answer, or derivative-only mode instead of flagship publication).

## 18. Integration Connectors

All connectors use native `fetch`. Each handles missing credentials gracefully (log warning, no crash).

| Connector | Purpose | Auth | Endpoints |
| --- | --- | --- | --- |
| **DataForSEO** | Market intelligence: keyword ideas, SERP snapshots, AI keyword trends, content analysis | Basic auth (login, password) | keyword_ideas, serp_live, ai_visibility, content_trends |
| **Slack** | Weekly reports, exception routing, health alerts, blocked submission alerts, first-hour audit summaries | Bot token via `@slack/web-api` | post_message, post_report, upload_file |
| **Typefully** | Multi-platform social distribution: X, LinkedIn, Threads, Bluesky, Mastodon. Draft creation, scheduling (`next-free-slot`), queue management, tags for dedup, media uploads | API key via MCP | create_draft, list_drafts, get_queue, schedule |
| **GitHub** | Public profile, demo repos, docs PRs, gists, issue/discussion replies | Bearer token via native fetch | create_gist, create_or_update_file, create_issue_comment, list_repo_discussions |
| **RevenueCat** | Product data for demos and content grounding | Bearer token via native fetch to REST API v2 | get_customer, list_products, list_offerings, get_entitlement_products |

Typefully replaces direct X/Twitter API integration. One API call distributes content across all social platforms with built-in scheduling, draft review, and queue management. OAuth 1.0a signing and per-platform rate limiting are handled by Typefully.

Note on RevenueCat Charts API: Charts appears to be a dashboard feature, not a public REST endpoint. The connector covers available REST API v2 endpoints; Charts dashboard access would come post-hire via the dedicated Slack channel.

### Slack-First Interaction Model

RevenueCat interacts with GrowthCat primarily through Slack. The dedicated channel serves as the primary UI.

**What RevenueCat can do in Slack:**
- `@GrowthCat focus on [topic]` → adjusts weekly plan
- `@GrowthCat write about [topic]` → generates content draft
- `@GrowthCat status` → current week's progress
- `@GrowthCat stop` or `@GrowthCat pause` → halts all automated actions
- `@GrowthCat resume` → resumes paused operations
- `@GrowthCat report` → generates instant metrics summary
- `@GrowthCat help` → lists available commands
- General questions → answered via Claude LLM

**What GrowthCat posts to Slack:**
- Morning priorities (Monday-Friday)
- Content drafts for review
- Experiment results
- Weekly async report (Friday)
- Alerts on important community mentions

**What they DON'T need to do:**
- Open a dashboard
- Write prompts in special format
- Learn new tools
- Assign daily tasks

## 19. Key Modules

### Project Counts

- 70 TypeScript/CSS source files
- 25 Next.js routes (14 static, 6 SSG, 3 dynamic API, 2 dynamic pages)
- 11 Convex backend files
- 8 Inngest functions (6 in functions.ts + 1 slack handler + 1 community monitor)
- 13 agent files (6 agents + 7 tools)
- 15 lib files (3 config + 5 connectors + 7 prompts)

### File structure

```
app/                              # Next.js App Router
├── (public)/                     # Public microsite pages
│   ├── page.tsx                  # Landing / application letter
│   ├── proof-pack/page.tsx
│   ├── articles/
│   ├── readiness-review/page.tsx
│   └── operator-replay/page.tsx
├── (operator)/                   # Operator console (dark theme)
│   ├── dashboard/page.tsx
│   ├── panel/page.tsx            # Live panel console
│   ├── pipeline/page.tsx         # Content pipeline view
│   ├── community/page.tsx        # Interaction tracker
│   ├── experiments/page.tsx
│   ├── feedback/page.tsx
│   ├── report/page.tsx           # Weekly report builder
│   ├── onboarding/page.tsx       # Self-service onboarding for RevenueCat
│   └── hooks/useConvexSafe.ts    # Safe Convex query hook with fallback
├── api/                          # API routes
│   ├── panel/session/route.ts    # SSE streaming endpoint
│   ├── slack/events/route.ts     # Slack event handler with HMAC verification
│   └── inngest/route.ts          # Inngest webhook handler
├── layout.tsx
└── globals.css

inngest/                          # Inngest functions and handlers
├── client.ts                     # Inngest client configuration
├── functions.ts                  # 6 core Inngest functions (weekly loop, content, etc.)
├── slack-handler.ts              # Background Slack command processor
└── community-monitor.ts          # GitHub issue scanner (every 6h)

convex/                           # Convex backend
├── schema.ts                     # All table definitions
├── artifacts.ts                  # Queries + mutations for artifacts
├── workflowRuns.ts               # Queries + mutations for runs
├── experiments.ts
├── feedbackItems.ts
├── opportunities.ts
├── community.ts
├── weeklyReports.ts
├── sources.ts                    # With vector search for RAG
├── crons.ts                      # Scheduled jobs
├── http.ts                       # Authenticated HTTP endpoints for Inngest
└── convex.config.ts              # Component configuration (@convex-dev/agent)

agents/                           # Inngest AgentKit
├── network.ts                    # GrowthCat agent network definition
├── planner.ts                    # Weekly planner agent
├── content.ts                    # Content generation agent
├── growth.ts                     # Growth experiment agent
├── feedback.ts                   # Product feedback agent
├── community.ts                  # Community engagement agent
└── tools/                        # Shared agent tools
    ├── dataforseo.ts
    ├── slack.ts
    ├── typefully.ts
    ├── github.ts
    ├── revenuecat.ts
    ├── quality-gates.ts
    └── scoring.ts

lib/                              # Shared utilities
├── config/
│   ├── voice.ts                  # GrowthCat voice profile
│   ├── quality.ts                # Publish gates config
│   ├── strategy.ts               # Opportunity scoring weights
│   └── growth.ts                 # Experiment templates
├── connectors/                   # API client wrappers (native fetch)
│   ├── dataforseo.ts
│   ├── slack.ts
│   ├── typefully.ts
│   ├── github.ts
│   └── revenuecat.ts
├── convex-client.ts              # HTTP client for Inngest → Convex with bearer auth
├── cms/
│   └── publish.ts                # Publish articles via GitHub commits
├── feedback/
│   └── file-issue.ts             # File feedback as GitHub Issues
└── content/
    └── prompts/                  # LLM prompt templates
        ├── blog-post.ts
        ├── growth-analysis.ts
        ├── feedback-report.ts
        ├── experiment-brief.ts
        ├── weekly-report.ts
        ├── social-post.ts
        └── panel-response.ts
```

### Module map

| Path | Purpose | Used by |
| --- | --- | --- |
| `convex/schema.ts` | All table definitions with indexes, text search, and vector search | Everything |
| `convex/artifacts.ts` | Artifact CRUD queries and mutations | Content pipeline |
| `convex/sources.ts` | Source management with vector search for RAG | Knowledge layer, panel console |
| `convex/crons.ts` | Scheduled jobs (weekly planning, freshness audit, health check, reporting) | Operating loop |
| `convex/http.ts` | Authenticated HTTP endpoints for Inngest (7 endpoints, bearer auth) | Inngest functions, external integrations |
| `convex/convex.config.ts` | Component configuration for @convex-dev/agent | Panel console |
| `agents/network.ts` | GrowthCat 5-agent network with deterministic router | All agent workflows |
| `agents/planner.ts` | Weekly planner agent definition | Monday planning |
| `agents/content.ts` | Content generation agent definition | Content pipeline |
| `agents/growth.ts` | Growth experiment agent definition | Experiment tracking |
| `agents/feedback.ts` | Product feedback agent definition | Feedback loop |
| `agents/community.ts` | Community engagement agent definition | Interaction tracking |
| `agents/tools/*.ts` | Shared agent tools (DataForSEO, Slack, Typefully, GitHub, RevenueCat, quality gates, scoring) | All agents |
| `lib/config/voice.ts` | GrowthCat identity, public persona, disclosure rules, tone | All LLM prompts |
| `lib/config/quality.ts` | Publish gates, novelty thresholds, SEO/AEO/GEO checks | Content validation |
| `lib/config/strategy.ts` | Growth-input matrix, opportunity scoring weights, KPI trees | Discovery, planning |
| `lib/config/growth.ts` | Metric families, experiment templates | Growth workflows |
| `lib/connectors/typefully.ts` | Typefully API client for multi-platform social distribution | Social posting, scheduling |
| `lib/connectors/*.ts` | API client wrappers using native fetch | Convex actions, agent tools |
| `lib/convex-client.ts` | HTTP client for Inngest to write to Convex with bearer auth | All Inngest functions |
| `lib/cms/publish.ts` | Publish articles by committing markdown with frontmatter to GitHub | Content pipeline |
| `lib/feedback/file-issue.ts` | File structured product feedback as GitHub Issues | Feedback agent |
| `lib/content/prompts/*.ts` | 7 LLM prompt templates | All content types |
| `app/(public)/*` | Public microsite pages (landing, proof-pack, articles, readiness-review, operator-replay) | Application stage |
| `app/(operator)/*` | Operator console pages (dashboard, panel, pipeline, community, experiments, feedback, report, onboarding) | All stages |
| `app/(operator)/onboarding/page.tsx` | Self-service 4-step onboarding for RevenueCat to connect services | Post-hire onboarding |
| `app/(operator)/hooks/useConvexSafe.ts` | Safe Convex query hook with fallback for resilient UI | All operator pages |
| `app/api/panel/session/route.ts` | SSE streaming endpoint for panel console | Panel interview |
| `app/api/slack/events/route.ts` | Slack event handler with HMAC-SHA256 verification | Slack bot |
| `inngest/slack-handler.ts` | Background Slack command processor (runs after 3s ack) | Slack bot |
| `inngest/community-monitor.ts` | GitHub issue scanner for agent-related signals (every 6h cron) | Community engagement |
| `agents/tools/typefully.ts` | Agent tool for creating Typefully drafts with multi-platform distribution | Content and community agents |

## 20. Strategy Principles

- Prefer evidence over intuition.
- Prefer product truth over generic thought leadership.
- Prefer one strong artifact over multiple weak ones.
- Prefer referenceable outputs over content volume.
- Prefer reusable canonical answers over repetitive custom replies.
- Prefer public proof before post-hire complexity.
- Build slices that end in public evidence first.
- Delay broad integrations until the public package is strong.
- Treat every slice as incomplete until it has a demo outcome and exit check.

## 21. Success Metrics

### Application success

- Public application microsite exists at a stable URL.
- Proof pack is complete and linked.
- Application evidence bundle is ready for the careers form.
- Public artifacts clearly demonstrate technical, growth, and API capability.

### Product success

- GrowthCat can produce a defensible weekly plan without waiting for human topic assignment.
- Public package includes:
  - Two flagship pieces
  - One live experiment artifact
  - Three feedback artifacts
  - One weekly report
  - One demo repo or equivalent proof artifact

### Quality success

- Duplicate or low-delta content is blocked or rerouted.
- Weekly strategies fail closed when evidence is weak.
- Public artifacts remain consistent with the GrowthCat voice profile and disclosure rules.
- All 8 publish gates pass before any flagship is published.

### Operating success (post-hire)

- 2+ high-quality content artifacts per week.
- 1 new growth experiment per week with explicit hypothesis and results.
- 50+ meaningful community interactions per week with quality scoring.
- 3+ structured product feedback items per week.
- 1 weekly async report delivered.
- No unresolved silent failures.

## 22. Risks

| Risk | Mitigation |
| --- | --- |
| Generic content that does not stand out | DataForSEO-grounded topics, novelty gate, benchmark comparison |
| Weak or vanity-metric growth strategies | Evidence-backed opportunity model with baseline, target, confidence, stop condition |
| Overbuilding post-hire surfaces before application is strong | Phase ordering enforces public proof before connected-mode work |
| Confusing opportunity magnitude with evidence confidence | Explicit score components in opportunity scoring |
| Dependence on private RevenueCat access too early | Public-only mode works before private connectors exist |
| Careers page blocks automation (CAPTCHA/bot detection) | Fallback package with pre-filled URL; operator resolves only the blocking challenge |
| Unsupported claims in published content | Grounding gate blocks publication until citation coverage passes threshold |
| Duplicate content published as flagship | Novelty registry reroutes to docs PR, canonical answer, or derivative path |
| Connector scopes too broad or leaked into prompts | Startup scope audit, secrets at connector boundary only, scoped service accounts |
| Agent sounds generic or inconsistent | Versioned voice profile, public artifact linting, disclosure language enforcement |
| Convex cold starts for actions | Warm critical actions via health-check cron; action code stays lean |
| Inngest rate limits on free tier | Monitor usage; upgrade to paid tier before hitting limits; batch where possible |
| Vendor lock-in with Convex | Mitigated: Convex is open source and can be self-hosted; schema is portable TypeScript |

## 23. Open Decisions

- [ ] GROWTHCAT_INTERNAL_SECRET generation and distribution between Vercel and Convex
- [ ] GrowthCat Slack app creation and OAuth setup
- [ ] GrowthCat X/GitHub/Typefully account creation
- [ ] Public domain and handles for GrowthCat
- [ ] Own analytics stack (GSC + GA4, GSC + PostHog, or other)
- [ ] DataForSEO plan upgrade for AI Optimization endpoints
- [ ] Typefully account setup and social set configuration for GrowthCat identity
- [ ] Which platforms to enable in Typefully (X only, X + LinkedIn, or all 5)

## 24. Canonical Reference

**This document is the single canonical planning and product document for GrowthCat.**

All previous planning documents now point here:

- `docs/plans/2026-03-07-revenuecat-agent-roadmap.md` -- superseded
- `docs/plans/2026-03-06-revenuecat-agent-application-plan.md` -- superseded
- `docs/blueprints/2026-03-06-revenuecat-agent-service-blueprint.md` -- superseded

The role brief at `docs/context/2026-03-06-revenuecat-role-brief.md` remains the source-of-truth for the original job posting requirements.
