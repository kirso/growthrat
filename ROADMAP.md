# GrowthCat Roadmap

The build plan for GrowthCat, an autonomous DX advocate agent for RevenueCat. Organized as vertical slices. Each slice ends in something demoable. An engineer reads slice 1, builds it, demos it, then moves to slice 2.

For product requirements, goals, and scope, see [PRD](docs/product/2026-03-13-growthcat-prd.md).

---

## Table of Contents

1. [VS1: The Brain Works](#vs1-the-brain-works) — Knowledge ingestion + RAG
2. [VS2: The Pipeline Works](#vs2-the-pipeline-works) — Content generation, approval, publish
3. [VS3: The Loop Works](#vs3-the-loop-works) — Full weekly Mon-Fri cycle
4. [VS4: The Dashboard Works](#vs4-the-dashboard-works) — Live data in operator console
5. [VS5: The Experiment Works](#vs5-the-experiment-works) — Measure + report
6. [VS6: The Interview Works](#vs6-the-interview-works) — Panel + take-home ready
7. [VS7: Deploy + Submit](#vs7-deploy--submit) — Public URL, application submitted
8. [Approval Model](#approval--human-in-the-loop-model)
9. [Architecture Overview](#architecture-overview)
10. [Convex Schema (Complete)](#convex-schema-complete)
11. [Growth Levers](#growth-levers)
12. [Ownership Model](#ownership-model)
13. [Security Model](#security-model)
14. [Open Decisions](#open-decisions)
15. [Risks](#risks)

---

## VS1: The Brain Works

**Goal**: GrowthCat can answer specific RevenueCat questions accurately from ingested docs. The chat widget and panel console use Convex Agent with persistent threads, message history, tool calling, and RAG on every response.

**Dependencies**: Anthropic API key (set in `.env.local`), Convex deployed (done), OpenAI API key for embeddings (add `OPENAI_API_KEY` to `.env.local`)

### What gets built

#### 1. Convex schema update: add vector embedding to `sources` table

**File**: `convex/schema.ts`

The current `sources` table has no `embedding` field and no vector index. Add both:

```typescript
// In convex/schema.ts — replace the current sources table definition

sources: defineTable({
  key: v.string(),
  url: v.optional(v.string()),
  provider: v.string(),
  sourceClass: v.string(),
  evidenceTier: v.string(),
  lastRefreshed: v.number(),
  contentHash: v.string(),
  summary: v.optional(v.string()),
  chunkText: v.string(),           // NEW: the actual text chunk
  chunkIndex: v.optional(v.number()), // NEW: position within the source
  embedding: v.array(v.float64()), // NEW: 1536-dim embedding vector
})
  .index("by_provider", ["provider"])
  .index("by_key", ["key"])
  .vectorIndex("by_embedding", {   // NEW: vector search index
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["provider", "sourceClass"],
  }),
```

#### 2. Enable Convex Agent component

**File**: `convex/convex.config.ts`

Currently the agent import is commented out. Uncomment it:

```typescript
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config.js";

const app = defineApp();
app.use(agent);

export default app;
```

#### 3. Knowledge ingestion Inngest function

**New file**: `inngest/ingest-knowledge.ts`

This function crawls RC docs, chunks them, embeds them via OpenAI `text-embedding-3-small`, and stores them in Convex.

Crawl targets (all public, no auth needed):
- RevenueCat docs: `https://www.revenuecat.com/docs/` (sitemap at `/docs/sitemap.xml`)
- RevenueCat blog: `https://www.revenuecat.com/blog/` (last 50 posts)
- RevenueCat changelog: `https://www.revenuecat.com/docs/changelog`
- RevenueCat SDK READMEs: fetch from GitHub API (`https://api.github.com/repos/RevenueCat/{repo}/readme`)
  - Repos: `purchases-ios`, `purchases-android`, `purchases-flutter`, `purchases-react-native`, `purchases-unity`

Processing pipeline per source:
1. Fetch HTML/markdown content
2. Strip HTML tags, extract text
3. Split into chunks: 500 tokens max, 50 token overlap, preserve paragraph boundaries
4. For each chunk: call OpenAI embedding API (`text-embedding-3-small`, 1536 dimensions)
5. Compute content hash (`SHA-256` of chunk text)
6. Upsert to Convex `sources` table — skip if content hash matches existing record (dedup)

```typescript
// inngest/ingest-knowledge.ts — key structure (not complete implementation)

import { inngest } from "./client";
import { convexStore } from "@/lib/convex-client";

export const ingestKnowledge = inngest.createFunction(
  { id: "ingest-knowledge", name: "Ingest Knowledge Base" },
  { event: "growthcat/knowledge.ingest" },
  async ({ step }) => {
    // Step 1: Fetch sitemap or URL list
    const urls = await step.run("fetch-urls", async () => { /* ... */ });

    // Step 2: For each URL, fetch content
    for (const url of urls) {
      const content = await step.run(`fetch-${url.key}`, async () => { /* ... */ });

      // Step 3: Chunk the content
      const chunks = await step.run(`chunk-${url.key}`, async () => {
        return chunkText(content.text, { maxTokens: 500, overlap: 50 });
      });

      // Step 4: Embed and store each chunk
      await step.run(`embed-store-${url.key}`, async () => {
        const embeddings = await embedChunks(chunks); // OpenAI text-embedding-3-small
        for (let i = 0; i < chunks.length; i++) {
          const hash = sha256(chunks[i]);
          await convexStore("/api/sources", {
            key: `${url.key}:chunk:${i}`,
            url: url.url,
            provider: url.provider,
            sourceClass: url.sourceClass,
            evidenceTier: url.evidenceTier,
            lastRefreshed: Date.now(),
            contentHash: hash,
            chunkText: chunks[i],
            chunkIndex: i,
            embedding: embeddings[i],
          });
        }
      });
    }
  }
);
```

Register this function in `app/api/inngest/route.ts` alongside the existing functions.

#### 4. Convex sources HTTP endpoint update

**File**: `convex/http.ts`

Add a new POST endpoint for upserting sources with embeddings. The current `sources.upsert` mutation in `convex/sources.ts` needs to accept the new fields (`chunkText`, `chunkIndex`, `embedding`).

**File**: `convex/sources.ts`

Update the `upsert` mutation args to include the new fields. Add a new `vectorSearch` action:

```typescript
// convex/sources.ts — add vector search action

export const vectorSearch = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.vectorSearch("sources", "by_embedding", {
      vector: args.embedding,
      limit: args.limit ?? 10,
      filter: args.provider
        ? (q) => q.eq("provider", args.provider!)
        : undefined,
    });
    // Fetch full documents for each result
    const docs = await Promise.all(
      results.map(async (r) => {
        const doc = await ctx.runQuery(internal.sources.getById, { id: r._id });
        return { ...doc, score: r._score };
      })
    );
    return docs;
  },
});
```

#### 5. Convex Agent definition

**New file**: `convex/agent.ts`

This replaces the raw `streamText` calls in `app/api/chat/route.ts` and `app/api/panel/session/route.ts`.

```typescript
// convex/agent.ts

import { Agent, createTool } from "@convex-dev/agent";
import { components, internal } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const growthCatAgent = new Agent(components.agent, {
  name: "GrowthCat",
  chat: anthropic.chat("claude-sonnet-4-20250514"),
  textEmbedding: openai.textEmbeddingModel("text-embedding-3-small"),
  instructions: GROWTHCAT_SYSTEM_PROMPT, // the system prompt from app/api/chat/route.ts
  tools: {
    searchKnowledgeBase: createTool({
      description: "Search the RevenueCat knowledge base for relevant documentation",
      args: z.object({ query: z.string() }),
      handler: async (ctx, args) => {
        // Vector search on sources table
        return await ctx.runAction(internal.sources.vectorSearch, {
          embedding: args.queryEmbedding,
          limit: 10,
        });
      },
    }),
  },
  contextOptions: {
    recentMessages: 20,
    searchOtherThreads: true,
    searchOptions: {
      limit: 10,
      textWeight: 0.3,
      vectorWeight: 0.7,
    },
  },
});
```

#### 6. Convex chat actions (thread management)

**New file**: `convex/chat.ts`

```typescript
// convex/chat.ts

import { action } from "./_generated/server";
import { v } from "convex/values";
import { growthCatAgent } from "./agent";

export const createThread = action({
  args: {},
  handler: async (ctx) => {
    const { threadId } = await growthCatAgent.createThread(ctx, {});
    return { threadId };
  },
});

export const chat = action({
  args: {
    prompt: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { prompt, threadId }) => {
    if (threadId) {
      const { thread } = await growthCatAgent.continueThread(ctx, { threadId });
      const result = await thread.generateText({ prompt });
      return { threadId, text: result.text };
    }
    const { threadId: newId, thread } = await growthCatAgent.createThread(ctx, {});
    const result = await thread.generateText({ prompt });
    return { threadId: newId, text: result.text };
  },
});

export const streamChat = action({
  args: {
    prompt: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { prompt, threadId }) => {
    if (threadId) {
      const { thread } = await growthCatAgent.continueThread(ctx, { threadId });
      return await thread.streamText({ prompt });
    }
    const { threadId: newId, thread } = await growthCatAgent.createThread(ctx, {});
    return { threadId: newId, stream: await thread.streamText({ prompt }) };
  },
});
```

#### 7. Update chat widget to use Convex Agent threads

**File**: `app/components/Chat.tsx`

Replace `useChat({ api: "/api/chat" })` with Convex action calls. Store `threadId` in component state so conversations persist across messages.

**File**: `app/api/chat/route.ts`

Keep as a thin proxy that calls `convex/chat.ts` actions and streams the response back. Alternatively, the Chat.tsx component can call Convex actions directly via the Convex React client.

#### 8. Update panel console to use Convex Agent

**File**: `app/api/panel/session/route.ts`

Replace the hardcoded `retrieveSources()` function with actual Convex vector search. The SSE streaming structure stays the same, but the source retrieval and LLM call now go through the Convex Agent.

### What gets ingested (target counts)

| Source | Est. pages | Est. chunks |
| --- | --- | --- |
| RevenueCat docs (docs.revenuecat.com) | ~200 pages | ~800 chunks |
| RevenueCat SDK READMEs (5 repos) | 5 | ~50 chunks |
| RevenueCat blog (last 50 posts) | 50 | ~250 chunks |
| RevenueCat changelog | ~20 entries | ~40 chunks |
| **Total** | **~275** | **~1,140** |

### Demo

1. Open chat widget on the public site
2. Ask: "What events does RevenueCat send via webhooks?"
3. GrowthCat answers with the complete list (INITIAL_PURCHASE, RENEWAL, CANCELLATION, BILLING_ISSUE, EXPIRATION, PRODUCT_CHANGE, etc.) citing the specific docs page URL
4. Ask: "What's the difference between offerings and entitlements?"
5. GrowthCat explains accurately: offerings are what you sell (packages of products), entitlements are access control (what the customer unlocks) — citing the correct docs sections
6. Close the chat widget, reopen it — the conversation is still there (thread persistence)
7. Open the panel console at `/panel`, type a prompt — see sources retrieved from actual ingested RC docs, not the hardcoded `retrieveSources()` list

### Exit criteria

- [ ] 500+ source chunks stored in Convex `sources` table with embeddings
- [ ] `convex/convex.config.ts` has `app.use(agent)` uncommented and deployed
- [ ] `convex/agent.ts` exists with `growthCatAgent` definition
- [ ] `convex/chat.ts` exists with `createThread`, `chat`, `streamChat` actions
- [ ] Chat widget uses Convex Agent threads (not raw `useChat({ api: "/api/chat" })`)
- [ ] Chat widget responses cite specific RC docs URLs
- [ ] Ask 10 RC-specific questions, 9/10 are accurate (test manually)
- [ ] Thread persistence: close chat, reopen, conversation history loads from Convex
- [ ] Panel console retrieves real sources from vector search (not hardcoded list)
- [ ] `OPENAI_API_KEY` added to `.env.example` with comment for embeddings

### Files touched

| File | Action |
| --- | --- |
| `convex/schema.ts` | Edit: add `chunkText`, `chunkIndex`, `embedding`, vector index to `sources` |
| `convex/convex.config.ts` | Edit: uncomment `app.use(agent)` |
| `convex/sources.ts` | Edit: update `upsert` args, add `vectorSearch` action, add `getById` internal query |
| `convex/agent.ts` | New: Convex Agent definition |
| `convex/chat.ts` | New: thread management actions |
| `convex/http.ts` | Edit: add `/api/sources` POST endpoint for embeddings |
| `inngest/ingest-knowledge.ts` | New: knowledge ingestion function |
| `app/api/inngest/route.ts` | Edit: register `ingestKnowledge` function |
| `app/api/chat/route.ts` | Edit: replace raw `streamText` with Convex Agent call |
| `app/api/panel/session/route.ts` | Edit: replace `retrieveSources()` with real vector search |
| `app/components/Chat.tsx` | Edit: use Convex Agent threads instead of `useChat` |
| `.env.example` | Edit: add `OPENAI_API_KEY` |

### Environment variables needed

| Variable | Purpose | Status |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | LLM for chat and content | Set |
| `OPENAI_API_KEY` | Embeddings (`text-embedding-3-small`) | Need to add |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment | Set |

---

## VS2: The Pipeline Works

**Goal**: Generate one piece of content end-to-end, get it approved in Slack, publish it to the microsite, distribute via Typefully. Full audit trail in Convex.

**Dependencies**: VS1 (agent brain for content generation with RAG context)

### What gets built

#### 1. Convex schema update: approval fields on `artifacts` table

**File**: `convex/schema.ts`

Add approval tracking fields to the existing `artifacts` table:

```typescript
// Add these fields to the artifacts table definition in convex/schema.ts

artifacts: defineTable({
  // ... existing fields ...
  artifactType: v.string(),
  title: v.string(),
  slug: v.string(),
  content: v.string(),
  contentFormat: v.string(),
  status: v.string(),
  metadata: v.optional(v.any()),
  qualityScores: v.optional(v.any()),
  llmProvider: v.optional(v.string()),
  llmModel: v.optional(v.string()),
  inputTokens: v.optional(v.number()),
  outputTokens: v.optional(v.number()),
  publishedAt: v.optional(v.number()),
  // NEW approval fields:
  approvalState: v.optional(v.string()),   // "pending" | "approved" | "rejected" | "auto"
  approvedBy: v.optional(v.string()),      // Slack user ID
  approvedAt: v.optional(v.number()),      // timestamp
  reviewMode: v.optional(v.string()),      // "draft_only" | "auto_publish"
  slackThreadTs: v.optional(v.string()),   // Slack thread for this draft
  typefullyDraftIds: v.optional(v.any()),  // array of Typefully draft IDs
  githubCommitSha: v.optional(v.string()), // SHA of the publish commit
})
  .index("by_type_status", ["artifactType", "status"])
  .index("by_slug", ["slug"])
  .index("by_approval", ["approvalState"])  // NEW
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["artifactType"],
  }),
```

#### 2. New Convex table: `agentConfig`

**File**: `convex/schema.ts`

Single-row config table storing RC's preferences from onboarding:

```typescript
agentConfig: defineTable({
  reviewMode: v.string(),          // "draft_only" | "auto_publish"
  focusTopics: v.array(v.string()),
  slackChannel: v.optional(v.string()),
  slackBotToken: v.optional(v.string()),
  cmsApiKey: v.optional(v.string()),
  chartsApiKey: v.optional(v.string()),
  githubOrg: v.optional(v.string()),
  paused: v.boolean(),             // kill switch
  updatedAt: v.number(),
}),
```

#### 3. New Convex table: `approvalLog`

**File**: `convex/schema.ts`

Tracks every approval/rejection/override for audit:

```typescript
approvalLog: defineTable({
  artifactId: v.id("artifacts"),
  action: v.string(),        // "submitted" | "approved" | "rejected" | "auto_approved" | "override"
  actor: v.optional(v.string()), // Slack user ID, or "system"
  reason: v.optional(v.string()),
  timestamp: v.number(),
}).index("by_artifact", ["artifactId"]),
```

#### 4. New Convex files for new tables

**New file**: `convex/agentConfig.ts` — queries: `get` (singleton), mutations: `save`, `updateReviewMode`, `setPaused`

**New file**: `convex/approvalLog.ts` — queries: `listByArtifact`, mutations: `log`

#### 5. Content generation upgrade in Inngest

**File**: `inngest/functions.ts` — `generateContent` function

Update the existing content generation function to:
1. Use the Convex Agent for draft generation (RAG-grounded, not raw `generateText`)
2. After quality gates pass, check `agentConfig.reviewMode`:
   - If `"auto_publish"`: proceed to publish immediately, log `auto_approved` in `approvalLog`
   - If `"draft_only"`: post draft summary to Slack, set `approvalState: "pending"`, wait for Slack reaction event
3. Store quality gate results in the artifact's `qualityScores` field (already done)
4. If any blocking gate fails: set `status: "rejected"`, post to Slack with failure reason

After quality gate pass and approval, emit `growthcat/content.publish` event.

#### 6. New Inngest function: content publishing

**New file**: `inngest/publish-content.ts`

Triggered by `growthcat/content.publish` event. Steps:
1. Fetch artifact from Convex by ID
2. Publish to GitHub as markdown with frontmatter (uses existing `lib/cms/publish.ts` `publishArticle`)
3. Create Typefully drafts for distribution (X, LinkedIn) using existing Typefully connector pattern from `inngest/functions.ts`
4. Update artifact in Convex: `status: "published"`, `publishedAt: Date.now()`, `typefullyDraftIds`, `githubCommitSha`
5. Log `published` in `approvalLog`

#### 7. Slack approval handler

**File**: `inngest/slack-handler.ts`

Add a new Inngest function (or extend the existing `handleSlackCommand`) to handle Slack reaction events:

```typescript
// New event handler for Slack reactions on approval posts
export const handleSlackReaction = inngest.createFunction(
  { id: "slack-reaction-handler", name: "Handle Slack Reaction" },
  { event: "growthcat/slack.reaction" },
  async ({ event, step }) => {
    const { reaction, artifactId, channel, messageTs, userId } = event.data;

    if (reaction === "+1" || reaction === "white_check_mark") {
      // Approve: update artifact, log approval, trigger publish
      await step.run("approve", async () => {
        await convexStore("/api/artifacts/approve", {
          id: artifactId,
          approvalState: "approved",
          approvedBy: userId,
          approvedAt: Date.now(),
        });
        await convexStore("/api/approval-log", {
          artifactId,
          action: "approved",
          actor: userId,
          timestamp: Date.now(),
        });
      });

      await step.sendEvent("publish", {
        name: "growthcat/content.publish",
        data: { artifactId },
      });
    }
  }
);
```

**File**: `app/api/slack/events/route.ts`

Add handling for `reaction_added` events alongside the existing `app_mention` and `message` handlers. When a reaction is added to a GrowthCat approval post, send a `growthcat/slack.reaction` event to Inngest.

#### 8. HTTP endpoints for new tables

**File**: `convex/http.ts`

Add POST endpoints:
- `/api/agent-config` — save/update agent config
- `/api/approval-log` — log approval actions
- `/api/artifacts/approve` — update artifact approval state

### Approval flow (explicit)

```
Content generated by LLM (with RAG context from VS1)
  → Quality gates run (8 gates from lib/config/quality.ts)
  → IF all blocking gates pass AND agentConfig.reviewMode === "auto_publish":
      → Log "auto_approved" in approvalLog
      → Publish immediately (GitHub commit + Typefully draft)
      → Update artifact: status "published"
  → IF all blocking gates pass AND agentConfig.reviewMode === "draft_only":
      → Post to Slack: "[Title] - Draft ready. Quality gates: all passed. React with a thumbs up to approve."
      → Set artifact: approvalState "pending", slackThreadTs
      → Log "submitted" in approvalLog
      → WAIT for Slack reaction event
      → Thumbs up reaction → Log "approved" → Publish
      → Reply with feedback → Log "rejected" with feedback → Re-generate with feedback
  → IF any blocking gate fails:
      → Set artifact: status "rejected"
      → Post to Slack: "[Title] - Blocked by [gate]. Reason: [reason]."
      → Log "rejected" in approvalLog with gate failure details
```

### Demo

1. Trigger content generation: send `growthcat/content.generate` event via Inngest dashboard (or `@GrowthCat write about revenuecat webhook`)
2. See the Inngest function run: draft generated with RAG context, quality gates executed
3. See draft summary appear in Slack with approval prompt
4. React with thumbs up emoji in Slack
5. See the article published on the microsite at `/articles/revenuecat-webhook`
6. See Typefully draft created and scheduled

### Exit criteria

- [ ] One article generated by LLM with RAG grounding (references ingested docs)
- [ ] Quality gates run and results stored in artifact's `qualityScores` field in Convex
- [ ] Approval post appears in Slack with draft summary
- [ ] Thumbs up reaction triggers publishing pipeline
- [ ] Article appears on microsite at `/articles/[slug]`
- [ ] Typefully draft created with article slug as tag
- [ ] `approvalLog` table has entries: "submitted", "approved", "published"
- [ ] `agentConfig` table has one row with `reviewMode` set
- [ ] Full audit trail queryable: given an artifact ID, retrieve complete approval history

### Files touched

| File | Action |
| --- | --- |
| `convex/schema.ts` | Edit: add approval fields to `artifacts`, add `agentConfig` and `approvalLog` tables |
| `convex/agentConfig.ts` | New: queries and mutations for agent config |
| `convex/approvalLog.ts` | New: queries and mutations for approval log |
| `convex/artifacts.ts` | Edit: add `approve` mutation, update `create` to include approval fields |
| `convex/http.ts` | Edit: add endpoints for agent-config, approval-log, artifacts/approve |
| `inngest/functions.ts` | Edit: update `generateContent` to check review mode, post to Slack, emit publish event |
| `inngest/publish-content.ts` | New: content publishing function (GitHub + Typefully) |
| `inngest/slack-handler.ts` | Edit: add `handleSlackReaction` function |
| `app/api/slack/events/route.ts` | Edit: handle `reaction_added` events |
| `app/api/inngest/route.ts` | Edit: register new Inngest functions |
| `.env.example` | Already has `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `GITHUB_TOKEN`, `TYPEFULLY_API_KEY` |

### Environment variables needed

| Variable | Purpose | Status |
| --- | --- | --- |
| `SLACK_BOT_TOKEN` | Post approval messages, read reactions | Need to configure Slack app |
| `SLACK_SIGNING_SECRET` | Verify Slack webhook events | Need to configure Slack app |
| `SLACK_DEFAULT_CHANNEL` | Channel for approval posts | Need to set (default: "growthcat") |
| `GITHUB_TOKEN` | Commit markdown to repo | Need to create token |
| `TYPEFULLY_API_KEY` | Create social drafts | Need to set up Typefully account |
| `TYPEFULLY_SOCIAL_SET_ID` | Which social accounts to post to | Need to configure |

---

## VS3: The Loop Works

**Goal**: Run a complete Monday-Friday cycle with real output. Every pipeline fires, every piece of data flows into Convex.

**Dependencies**: VS2 (content pipeline with approval flow), all API keys configured

### What gets built

#### 1. Monday planner upgrade

**File**: `inngest/functions.ts` — `weeklyPlanningRun` function

The existing function already fetches DataForSEO keywords, scores opportunities, and posts to Slack. Upgrade it to:
1. Query Convex for last week's performance (content published, experiments completed, what worked)
2. Use the Convex Agent brain to analyze performance + new keyword data + community signals → select topics
3. Post the plan to Slack with topic options — RC can reply to adjust
4. Emit exactly 2 `growthcat/content.generate` events, 1 `growthcat/feedback.generate` event, and 1 `growthcat/community.engage` event

#### 2. Slack override for Monday plan

**File**: `inngest/slack-handler.ts`

When RC replies to the Monday plan message in Slack (not just reactions — actual text replies), parse the reply:
- "skip [topic]" → remove that topic from the week's plan
- "add [topic]" → add a new topic
- "focus on [topic]" → replace lowest-scored topic with this one (already partially implemented)
- Any other reply → pass to the Convex Agent brain for a natural language response

#### 3. Feedback pipeline upgrade

**File**: `inngest/functions.ts` — `generateFeedback` function

The existing function generates feedback via LLM. Upgrade it to:
1. Use RAG context (from VS1) to ground feedback in actual RC docs/SDK issues
2. After generating structured feedback, call `lib/feedback/file-issue.ts` `fileFeedbackIssue` to create a GitHub Issue
3. Store the GitHub Issue URL in the feedback item's `metadata` field in Convex
4. Update feedback status from `"draft"` to `"filed"`

#### 4. Community monitor upgrade

**File**: `inngest/community-monitor.ts`

The existing function scans GitHub repos for agent-related issues. Upgrade it to:
1. After generating a reply via the community engage function, also store the reply URL (if posted) in the community interaction record
2. Track which issues have already been replied to (dedup via `targetUrl` in `communityInteractions` table — query before engaging)
3. Post community activity summary to Slack daily (not just as part of the weekly report)

#### 5. Friday report upgrade

**File**: `inngest/functions.ts` — `weeklyReportGeneration` function

The existing function gathers metrics from Convex and generates a report. Upgrade it to:
1. Query real Convex data: actual artifact count, experiment status, feedback items filed (with GitHub URLs), community interaction count and meaningful ratio
2. Include specific article titles and their quality gate scores
3. Include specific experiment names and current status
4. Include feedback items with their GitHub Issue links
5. Store the report in Convex `weeklyReports` table (already done)
6. Post to Slack (already done)

#### 6. Event chaining completeness

Verify all event chains fire correctly:

```
Monday 9am UTC (Convex cron triggers workflowRuns.triggerWeeklyPlan):
  → Inngest weeklyPlanningRun fires
  → Emits: 2x growthcat/content.generate
  → Emits: 1x growthcat/feedback.generate
  → Emits: 1x growthcat/community.engage

Each growthcat/content.generate:
  → generateContent fires
  → If gates pass + review mode: posts to Slack for approval
  → On approval: emits growthcat/content.publish
  → publishContent fires: GitHub commit + Typefully draft

growthcat/feedback.generate:
  → generateFeedback fires
  → Files GitHub Issue
  → Stores feedback in Convex

growthcat/community.engage:
  → communityEngage fires
  → Posts reply via Typefully (X) or GitHub comment
  → Stores interaction in Convex

Every 6 hours (Inngest cron):
  → communityMonitor fires
  → Scans RC GitHub repos for agent-related issues
  → Emits up to 5x growthcat/community.engage

Friday 5pm UTC (Convex cron triggers weeklyReports.generateReport):
  → Inngest weeklyReportGeneration fires
  → Gathers real metrics from Convex
  → Generates report via LLM
  → Posts to Slack
  → Stores in Convex

Daily 6am UTC (Convex cron triggers sources.auditFreshness):
  → Checks source staleness
  → Logs stale sources
```

### Demo

1. Trigger Monday planner manually (send `growthcat/weekly.planning` event in Inngest dashboard, or wait for Monday 9am UTC cron)
2. See plan posted to Slack with 2 content topics, 1 experiment, 3 feedback targets
3. See 2 content generation runs start in Inngest dashboard
4. See 2 draft approval posts appear in Slack
5. Approve both by reacting with thumbs up
6. See both articles publish to the microsite and Typefully drafts created
7. See feedback item appear as a GitHub Issue
8. See community interactions tracked in Convex
9. Trigger Friday report (send event or wait for Friday 5pm UTC)
10. See report in Slack with real numbers: "2 articles published, 1 experiment running, 3 feedback items filed, X community interactions"

### Exit criteria

- [ ] Monday: 1 plan posted to Slack with 2 scored content topics from DataForSEO
- [ ] Tue-Thu: 2 content pieces through full pipeline (generate with RAG → quality gates → Slack approval → publish → Typefully)
- [ ] Tue-Thu: 3 feedback items in Convex, at least 1 filed as GitHub Issue with URL stored
- [ ] Tue-Thu: 5+ community interactions tracked in Convex `communityInteractions` table
- [ ] Friday: 1 report posted to Slack with real metric counts from Convex
- [ ] Friday: Report stored in Convex `weeklyReports` table with real data (not sample data)
- [ ] All Inngest functions complete without error (check Inngest dashboard)
- [ ] All event chains fire: planning → content.generate → content.publish, planning → feedback.generate, monitor → community.engage

### Files touched

| File | Action |
| --- | --- |
| `inngest/functions.ts` | Edit: upgrade `weeklyPlanningRun`, `generateContent`, `generateFeedback`, `weeklyReportGeneration` |
| `inngest/publish-content.ts` | Exists from VS2: verify it works end-to-end |
| `inngest/community-monitor.ts` | Edit: add dedup check, daily summary |
| `inngest/slack-handler.ts` | Edit: handle plan override replies |
| `app/api/inngest/route.ts` | Edit: register any new functions |
| `convex/crons.ts` | Verify: Monday planning and Friday report crons work |
| `convex/weeklyReports.ts` | Verify: `generateReport` internal mutation produces real data |

---

## VS4: The Dashboard Works

**Goal**: Every operator page shows real data from Convex, not hardcoded samples. Onboarding page saves config to Convex.

**Dependencies**: VS3 (real data in Convex from the weekly cycle), Convex deployed

### What gets built

#### 1. Wire all 7 operator pages to real Convex data

Each operator page currently uses `useConvexQuery` with a fallback to `SAMPLE_*` constants. After VS3, there is real data in Convex. The work here is to verify the queries return the right shape and remove sample data fallbacks one by one.

**File**: `app/(operator)/dashboard/page.tsx`
- Replace `SAMPLE_CONNECTORS` with a query to `agentConfig` (check which keys are set)
- Replace `SAMPLE_RUNS` with `useConvexQuery(convexApi?.workflowRuns?.list, { limit: 10 })`
- Replace `SAMPLE_TASK_QUEUE` with current pending workflow runs
- Add: last workflow run timestamp, connector health derived from `agentConfig`

**File**: `app/(operator)/pipeline/page.tsx`
- Replace `SAMPLE_SLOTS` with `useConvexQuery(convexApi?.artifacts?.list, {})`
- Map artifact `status` to pipeline stages: `"draft"` → Draft, `"validating"` → Quality Gates, `"validated"` → Approved, `"published"` → Published
- Replace `SAMPLE_DERIVATIVES` with artifacts where `artifactType` is `"social_post"` or `"x_thread"`
- Replace `SAMPLE_OPPORTUNITIES` with `useConvexQuery(convexApi?.opportunities?.getTopOverall, { limit: 10 })`
- Show `approvalState` and `qualityScores` per artifact

**File**: `app/(operator)/community/page.tsx`
- Replace sample data with `useConvexQuery(convexApi?.community?.list, {})`
- Show `qualityScore` and `meaningful` flag per interaction
- Show stats from `useConvexQuery(convexApi?.community?.getStats)`

**File**: `app/(operator)/experiments/page.tsx`
- Replace sample data with `useConvexQuery(convexApi?.experiments?.list, {})`
- Show experiment lifecycle: `"planned"` → `"running"` → `"measuring"` → `"completed"`
- Show `hypothesis`, `baselineMetric`, `targetMetric`, `results`

**File**: `app/(operator)/feedback/page.tsx`
- Replace sample data with `useConvexQuery(convexApi?.feedbackItems?.list, {})`
- Show feedback status: `"draft"` → `"filed"` → `"acknowledged"`
- Show GitHub Issue URL from `metadata` field

**File**: `app/(operator)/report/page.tsx`
- Replace sample data with `useConvexQuery(convexApi?.weeklyReports?.getLatest)`
- Show real weekly metrics and LLM-generated report content
- Archive: list past reports with `useConvexQuery(convexApi?.weeklyReports?.getByWeek, { weekNumber })`

#### 2. Onboarding page persistence

**File**: `app/(operator)/onboarding/page.tsx`

Currently the onboarding page has UI for 4 steps (Slack, CMS, Charts, Preferences) but does not save anything. Wire it to:
1. Save credentials to the `agentConfig` table in Convex via mutation
2. Add a "Review Mode" selector in the Preferences step: "Draft Only (RC reviews before publish)" or "Auto-Publish (quality gates only)"
3. Add focus topics input
4. Show connection status by querying `agentConfig` on page load

**New file**: `convex/agentConfig.ts` (from VS2 — may already exist)

Add query `get` and mutation `save` if not created in VS2.

#### 3. Real-time updates verification

All operator pages use `useConvexQuery` which returns reactive data from Convex. When new data is written (a new artifact, a new experiment), the page updates automatically without refresh. Verify this works end-to-end:
1. Open `/pipeline` in one tab
2. Trigger content generation in another tab
3. See the new draft appear in the pipeline page without refreshing

### Demo

1. Open `/dashboard` — see real workflow run history, connector status from `agentConfig`
2. Open `/pipeline` — see the 2 articles from VS3 with their quality gate scores and approval status
3. Open `/community` — see real interaction counts by channel
4. Open `/experiments` — see experiment records
5. Open `/feedback` — see feedback items with GitHub Issue links
6. Open `/report` — see the Friday report with real metrics
7. Open `/onboarding` — set review mode to "draft_only" → see it reflected: next content generation posts to Slack for approval instead of auto-publishing

### Exit criteria

- [ ] Zero hardcoded `SAMPLE_*` data used when Convex is connected (fallback only when `NEXT_PUBLIC_CONVEX_URL` is unset)
- [ ] `/dashboard` shows real workflow run data from `workflowRuns` table
- [ ] `/pipeline` shows real artifacts with `status`, `approvalState`, `qualityScores`
- [ ] `/community` shows real interactions from `communityInteractions` table
- [ ] `/experiments` shows real experiment records from `experiments` table
- [ ] `/feedback` shows real feedback items from `feedbackItems` table with GitHub Issue URLs
- [ ] `/report` shows real weekly report from `weeklyReports` table
- [ ] `/onboarding` saves config to Convex `agentConfig` table
- [ ] `/onboarding` review mode selection works: changing to "draft_only" causes next content generation to post to Slack for approval
- [ ] Real-time updates: new data appears without page refresh

### Files touched

| File | Action |
| --- | --- |
| `app/(operator)/dashboard/page.tsx` | Edit: replace sample data with Convex queries |
| `app/(operator)/pipeline/page.tsx` | Edit: replace sample data with Convex queries |
| `app/(operator)/community/page.tsx` | Edit: replace sample data with Convex queries |
| `app/(operator)/experiments/page.tsx` | Edit: replace sample data with Convex queries |
| `app/(operator)/feedback/page.tsx` | Edit: replace sample data with Convex queries |
| `app/(operator)/report/page.tsx` | Edit: replace sample data with Convex queries |
| `app/(operator)/onboarding/page.tsx` | Edit: wire form submission to Convex `agentConfig` mutations |
| `convex/agentConfig.ts` | Exists from VS2: verify queries work for dashboard |

---

## VS5: The Experiment Works

**Goal**: Run one real growth experiment with before/after measurement using DataForSEO.

**Dependencies**: VS3 (content published and indexed), DataForSEO credentials configured

### What gets built

#### 1. Experiment runner Inngest function

**New file**: `inngest/experiment-runner.ts`

Triggered by `growthcat/experiment.run` event. Steps:

1. **Design**: receive hypothesis, target keyword, content slug from planner
2. **Baseline**: fetch current DataForSEO data for the target keyword:
   - SERP position for the target domain (if ranking)
   - Keyword difficulty
   - Search volume
   - Top 10 results (who currently ranks)
   - AI mentions for "revenuecat" (if DataForSEO AI Optimization is available)
3. **Store baseline**: update experiment record in Convex with baseline data
4. **Schedule measurement**: use Inngest `step.sleepUntil()` or `step.sleep("7d")` to wait 7 days
5. **Measure**: after 7 days, fetch the same DataForSEO data again
6. **Compare**: calculate deltas (position change, new ranking, traffic estimate change)
7. **Report**: post results to Slack, update experiment record in Convex with results

```typescript
// inngest/experiment-runner.ts — key structure

export const runExperiment = inngest.createFunction(
  { id: "experiment-runner", name: "Run Growth Experiment" },
  { event: "growthcat/experiment.run" },
  async ({ event, step }) => {
    const { experimentKey, hypothesis, targetKeyword, contentSlug } = event.data;

    // Step 1: Fetch baseline from DataForSEO
    const baseline = await step.run("fetch-baseline", async () => {
      const login = process.env.DATAFORSEO_LOGIN;
      const password = process.env.DATAFORSEO_PASSWORD;
      if (!login || !password) return { source: "unavailable" };

      // SERP check for target keyword
      const serpRes = await fetch(
        "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${login}:${password}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{
            keyword: targetKeyword,
            location_code: 2840,
            language_code: "en",
            depth: 20,
          }]),
        }
      );
      const serpData = await serpRes.json();
      // ... parse results, find our domain's position (or "not ranking")
      return { serpPosition, topResults, volume, difficulty };
    });

    // Step 2: Store baseline
    await step.run("store-baseline", async () => {
      await convexStore("/api/experiments", {
        experimentKey,
        title: `Experiment: ${targetKeyword}`,
        hypothesis,
        baselineMetric: JSON.stringify(baseline),
        targetMetric: "SERP position improvement",
        status: "running",
        startedAt: Date.now(),
      });
    });

    // Step 3: Wait 7 days for indexing
    await step.sleep("wait-for-indexing", "7d");

    // Step 4: Measure again
    const measurement = await step.run("measure", async () => {
      // Same DataForSEO call as baseline
      // ... return { serpPosition, topResults, volume, difficulty }
    });

    // Step 5: Compare and report
    const results = await step.run("compare", async () => {
      const delta = {
        positionBefore: baseline.serpPosition ?? "not ranking",
        positionAfter: measurement.serpPosition ?? "not ranking",
        // ... more deltas
      };
      return delta;
    });

    // Step 6: Post to Slack and store results
    await step.run("report-results", async () => {
      // Post to Slack
      // Update experiment in Convex: status "completed", results
    });
  }
);
```

#### 2. Experiment lifecycle in Convex

**File**: `convex/experiments.ts`

Add mutations for updating experiment status and results:
- `start`: set status to "running", store baseline
- `complete`: set status to "completed", store results and completedAt
- `stop`: set status to "stopped" (experiment abandoned)

Experiment states: `"planned"` → `"running"` (with baseline) → `"measuring"` (waiting for 7-day check) → `"completed"` (with results) or `"stopped"`

#### 3. Planner emits experiment event

**File**: `inngest/functions.ts` — `weeklyPlanningRun`

After selecting content topics, also emit a `growthcat/experiment.run` event for the third-ranked keyword:

```typescript
await step.sendEvent("trigger-experiment", {
  name: "growthcat/experiment.run",
  data: {
    experimentKey: `exp-${weekNumber}-${plan.experimentTopic.replace(/\s+/g, "-")}`,
    hypothesis: `Publishing a targeted article for "${plan.experimentTopic}" will result in indexing within 7 days`,
    targetKeyword: plan.experimentTopic,
    contentSlug: plan.experimentTopic.replace(/\s+/g, "-"),
  },
});
```

### Demo

1. Agent publishes article targeting "revenuecat webhook"
2. Experiment runner fetches DataForSEO baseline: not ranking for "revenuecat webhook"
3. Experiment record in Convex shows: status "running", baseline data stored
4. 7 days later (or triggered manually for demo): DataForSEO check runs again
5. Results posted to Slack: "Article indexed, position X for 'revenuecat webhook'. Baseline: not ranking. Delta: +X positions."
6. `/experiments` page shows the experiment with baseline, measurement, and delta

### Exit criteria

- [ ] One experiment record in Convex with real DataForSEO baseline data (SERP position, keyword difficulty, search volume)
- [ ] Experiment status transitions: `"planned"` → `"running"` → `"measuring"` (after 7-day sleep) → `"completed"`
- [ ] Baseline stored in `experiments.baselineMetric` as structured JSON
- [ ] Measurement scheduled (Inngest `step.sleep("7d")` — visible in Inngest dashboard as a sleeping function)
- [ ] `/experiments` page shows the live experiment with real baseline data
- [ ] Slack notification sent when experiment completes (even if result is "still not ranking")

### Files touched

| File | Action |
| --- | --- |
| `inngest/experiment-runner.ts` | New: experiment lifecycle function |
| `inngest/functions.ts` | Edit: planner emits `growthcat/experiment.run` event |
| `app/api/inngest/route.ts` | Edit: register `runExperiment` function |
| `convex/experiments.ts` | Edit: add `start`, `complete`, `stop` mutations |
| `convex/http.ts` | Edit: add PUT endpoint for experiment updates (or use existing POST) |

### Environment variables needed

| Variable | Purpose | Status |
| --- | --- | --- |
| `DATAFORSEO_LOGIN` | DataForSEO API auth | Need to set |
| `DATAFORSEO_PASSWORD` | DataForSEO API auth | Need to set |

---

## VS6: The Interview Works

**Goal**: Panel console uses RAG from VS1 with real source retrieval. Take-home pipeline tested. Chat widget ready for RC hiring council.

**Dependencies**: VS1 (RAG), VS2 (content pipeline)

### What gets built

#### 1. Panel console upgrade to Convex Agent

**File**: `app/api/panel/session/route.ts`

The current panel console uses a hardcoded `retrieveSources()` function that returns mock source labels based on keyword matching. Replace with:
1. Call Convex Agent `chat` action (from `convex/chat.ts`) with a dedicated panel thread
2. The agent automatically runs RAG (vector search on ingested sources) before responding
3. SSE streaming structure stays the same (progress events + stream events + done event)
4. Source list in the SSE `sources_retrieved` event comes from actual vector search results (URL, title, relevance score)

```typescript
// app/api/panel/session/route.ts — updated source retrieval

// Step 2: Retrieve real sources via Convex vector search
const sources = await step.run("retrieve-sources", async () => {
  // Embed the prompt
  const embedding = await embedText(prompt); // OpenAI text-embedding-3-small
  // Search Convex sources
  const results = await convexFetch(`/api/sources/search?embedding=${JSON.stringify(embedding)}&limit=10`);
  return results.map(r => ({
    label: r.summary ?? r.key,
    type: r.sourceClass,
    url: r.url,
    score: r.score,
  }));
});
```

#### 2. Panel thread persistence

Each panel session gets a Convex Agent thread. The interviewer can:
- See the session history after the interview (thread persists in Convex)
- Resume a session if the connection drops
- Review what sources the agent cited

Add `threadId` to the panel SSE query params. If provided, continue the existing thread. If not, create a new one.

#### 3. Take-home pipeline test

The take-home challenge (Stage 2) requires: given an arbitrary prompt, produce content + growth strategy in <48 hours. Test this by:
1. Create a test script that sends a `growthcat/content.generate` event with an arbitrary topic
2. Verify the full pipeline runs: RAG retrieval → LLM generation → quality gates → publish
3. Verify the output is grounded in RC docs and includes specific technical detail
4. Time the end-to-end execution (target: <5 minutes for generation + gates, not counting human approval)

**New file**: `scripts/test-takehome.ts`

```typescript
// scripts/test-takehome.ts — manual test script
// Run: bun run scripts/test-takehome.ts

const prompt = "Create a content brief and growth strategy for helping agent developers integrate RevenueCat webhook handling";

// Send event to Inngest
await fetch("http://localhost:8288/e/growthcat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "growthcat/content.generate",
    data: {
      topic: prompt,
      contentType: "blog_post",
      targetKeyword: "revenuecat webhook agent",
      audience: "agent builders",
    },
  }),
});

console.log("Event sent. Check Inngest dashboard for execution.");
```

#### 4. Panel prep prompts

Create 5 prepared prompts that test the panel console's capabilities. These cover the key areas RC will evaluate:

1. **Technical depth**: "Create a content brief for RevenueCat webhook integration for agent builders. Include specific webhook event types, verification steps, and error handling patterns."
2. **Growth strategy**: "What growth experiments would you run in the first month? Give me specific hypotheses with baselines and stop conditions."
3. **Product feedback**: "What are the top 3 problems with RevenueCat's developer experience for agent-built apps? Give me evidence-backed feedback."
4. **Competitive analysis**: "How does RevenueCat compare to Adapty and Superwall for agent developers? What are the key differentiators?"
5. **Self-awareness**: "What are your limitations? What can you not do well, and how would you work around those limitations?"

Test each prompt against the panel console and verify:
- Response references ingested RC docs (not just system prompt knowledge)
- Response includes specific technical details (API endpoints, webhook event names, SDK methods)
- Response cites sources with URLs
- Streaming works smoothly for screen-share presentation

### Demo

1. Open `/panel`
2. Type: "Create a content brief for RevenueCat webhook integration for agent builders"
3. See SSE progress: "Sources retrieved: [list of actual RC docs with URLs]"
4. See streaming response that references specific webhook events (INITIAL_PURCHASE, RENEWAL, etc.), specific API endpoints, and specific SDK methods
5. Response cites `docs.revenuecat.com/docs/webhooks` and related pages
6. Close the panel, reopen with the same thread ID — conversation persists

### Exit criteria

- [ ] Panel console retrieves real sources from Convex vector search (not hardcoded `retrieveSources()`)
- [ ] Panel SSE `sources_retrieved` event includes actual doc URLs with relevance scores
- [ ] Panel responses reference ingested RC docs (cite specific pages)
- [ ] Panel thread persists in Convex (replayable after session ends)
- [ ] Take-home test: arbitrary prompt → content artifact generated with RAG grounding in <5 minutes
- [ ] 5 panel prep prompts tested — all produce responses with RC doc citations
- [ ] Streaming is smooth for screen-share (no long pauses, tokens flow continuously)

### Files touched

| File | Action |
| --- | --- |
| `app/api/panel/session/route.ts` | Edit: replace `retrieveSources()` with Convex vector search + Convex Agent |
| `app/(operator)/panel/page.tsx` | Edit: pass thread ID for persistence |
| `scripts/test-takehome.ts` | New: take-home pipeline test script |

---

## VS7: Deploy + Submit

**Goal**: Public URL exists. Chat widget works. Panel console accessible. Application submitted to RevenueCat careers page.

**Dependencies**: All previous slices

### What gets built

#### 1. Vercel deployment

**Files**: `vercel.json` (if needed), existing `next.config.ts`

- Deploy to Vercel via `bunx vercel deploy --prod` (script already in `package.json`)
- Set all environment variables in Vercel dashboard:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex production URL |
| `ANTHROPIC_API_KEY` | LLM |
| `OPENAI_API_KEY` | Embeddings |
| `DATAFORSEO_LOGIN` | Market intelligence |
| `DATAFORSEO_PASSWORD` | Market intelligence |
| `TYPEFULLY_API_KEY` | Social distribution |
| `TYPEFULLY_SOCIAL_SET_ID` | Social accounts |
| `GITHUB_TOKEN` | CMS publishing + community |
| `GROWTHCAT_INTERNAL_SECRET` | Inngest-Convex auth |
| `GROWTHCAT_PANEL_TOKEN` | Panel auth |
| `SLACK_BOT_TOKEN` | Slack posting |
| `SLACK_SIGNING_SECRET` | Slack verification |
| `SLACK_DEFAULT_CHANNEL` | Default channel |
| `INNGEST_EVENT_KEY` | Inngest cloud (production) |
| `INNGEST_SIGNING_KEY` | Inngest signing (production) |

#### 2. Convex production deployment

```bash
bunx convex deploy --prod
```

Set the same `GROWTHCAT_INTERNAL_SECRET` in Convex environment variables (Convex dashboard → Settings → Environment Variables).

#### 3. Domain setup

Options: `growthcat.dev`, `growthcat.ai`, or a Vercel subdomain. Configure in Vercel dashboard → Domains.

#### 4. Inngest cloud setup

- Create Inngest cloud account
- Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` in Vercel env vars
- Verify functions appear in Inngest cloud dashboard

#### 5. Smoke test on production

Run through each page on the production URL:

| Page | Check |
| --- | --- |
| `/` (landing) | Loads, chat widget appears, chat works |
| `/application` | Full application letter renders |
| `/proof-pack` | Links to articles work |
| `/articles` | Article list renders |
| `/articles/[slug]` | Individual article renders |
| `/readiness-review` | Self-assessment renders |
| `/operator-replay` | Architecture page renders |
| `/dashboard` | Real data from Convex (if connected) |
| `/pipeline` | Real artifacts visible |
| `/panel` | SSE streaming works, RAG sources appear |
| `/onboarding` | Form renders and saves |

#### 6. Submit application

- Navigate to RevenueCat careers page
- Submit the public URL
- Include link to proof pack and chat widget

### Exit criteria

- [ ] Public URL loads (all pages, no 500 errors)
- [ ] Chat widget streams responses on the public URL (not localhost)
- [ ] Panel console accessible and SSE streaming works on production
- [ ] Convex production deployment is live (not dev)
- [ ] Inngest cloud functions are registered and visible
- [ ] Domain configured (not just `*.vercel.app`)
- [ ] URL submitted to RevenueCat careers page

### Files touched

| File | Action |
| --- | --- |
| `vercel.json` | New or edit: any Vercel-specific config |
| `package.json` | Verify: `deploy` script works |

### Environment variables needed

All variables from `.env.example` must be set in Vercel dashboard.

---

## Approval / Human-in-the-Loop Model

### Trust Ramp

GrowthCat starts with maximum human oversight and earns autonomy through demonstrated quality:

| Phase | Review Mode | When | What happens |
| --- | --- | --- | --- |
| 1. Draft Only | `draft_only` | First 2 weeks | Every content piece posted to Slack for explicit approval before publishing. RC reacts with thumbs up or replies with feedback. |
| 2. Semi-Autonomous | `auto_publish` with notifications | Weeks 3-4 | Quality gates auto-approve if all 8 pass. RC gets Slack notification of every publish with a 1-hour override window. |
| 3. Bounded Autonomy | `auto_publish` | Month 2+ | Quality gates are the only gate. RC gets weekly summary of all published content. Override available anytime via `@GrowthCat stop`. |

### Slack Approval Workflow (Phase 1)

```
1. Content generated with RAG grounding
2. 8 quality gates run:
   - Grounding: every claim maps to a cited source
   - Novelty: not a duplicate (checked via Convex text search)
   - Technical: code samples valid, API refs correct
   - SEO: title, meta, headings, keyword targeting
   - AEO: extractable answer passages, FAQ blocks
   - GEO: comparison tables, schema markup, citations
   - Benchmark: stronger than existing alternatives
   - Voice: consistent with GrowthCat voice profile

3a. ALL blocking gates pass:
   → Post to Slack: "Draft ready: [title]
     Quality gates: 8/8 passed
     Word count: [N]
     Target keyword: [keyword]
     React with thumbs up to approve, or reply with feedback."
   → Set artifact.approvalState = "pending"
   → Log "submitted" in approvalLog

4a. RC reacts with thumbs up:
   → Set artifact.approvalState = "approved"
   → Log "approved" in approvalLog (actor: RC user ID)
   → Trigger publish: GitHub commit + Typefully draft
   → Set artifact.status = "published"
   → Log "published" in approvalLog

4b. RC replies with feedback text:
   → Set artifact.approvalState = "rejected"
   → Log "rejected" in approvalLog (reason: RC's feedback text)
   → Re-generate content incorporating feedback
   → Re-run quality gates
   → Re-post to Slack for approval

3b. Any blocking gate FAILS:
   → Set artifact.status = "rejected"
   → Post to Slack: "Draft blocked: [title]
     Failed gate: [gate name]
     Reason: [reason]"
   → Log "rejected" in approvalLog (reason: gate failure)
```

### Override Logging

Every approval action is logged in the `approvalLog` table with:
- `artifactId`: which content piece
- `action`: what happened ("submitted", "approved", "rejected", "auto_approved", "override", "paused")
- `actor`: who did it (Slack user ID or "system" for auto-actions)
- `reason`: why (gate failure text, RC feedback text, or null for approvals)
- `timestamp`: when

### Kill Switch

`@GrowthCat stop` in Slack sets `agentConfig.paused = true`. When paused:
- All Inngest functions check the paused flag at the start and exit immediately if true
- No new content is generated, published, or distributed
- No new community interactions are posted
- Existing sleeping functions (experiment measurements) continue to sleep but will check the flag before executing
- `@GrowthCat resume` clears the flag

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Next.js 15 (App Router)                         │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ Public    │  │ Operator │  │ API      │  │ Components           │   │
│  │ Pages    │  │ Console  │  │ Routes   │  │                      │   │
│  │          │  │          │  │          │  │ Chat.tsx              │   │
│  │ /        │  │ /dash    │  │ /chat    │  │ ChatWidget.tsx        │   │
│  │ /app     │  │ /pipe    │  │ /panel   │  │                      │   │
│  │ /proof   │  │ /comm    │  │ /slack   │  │                      │   │
│  │ /articles│  │ /exp     │  │ /inngest │  │                      │   │
│  │ /review  │  │ /feed    │  │          │  │                      │   │
│  │ /replay  │  │ /report  │  │          │  │                      │   │
│  │          │  │ /onboard │  │          │  │                      │   │
│  │          │  │ /panel   │  │          │  │                      │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
        │                 │                │
        │                 │                │
        ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BRAIN: Convex Agent + Convex DB                      │
│                                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │ Convex Agent         │  │ Convex Database                         │ │
│  │ (@convex-dev/agent)  │  │                                         │ │
│  │                      │  │ Tables:                                  │ │
│  │ - Thread management  │  │  artifacts, workflowRuns, experiments,  │ │
│  │ - Message persistence│  │  feedbackItems, opportunitySnapshots,   │ │
│  │ - RAG on every resp  │  │  communityInteractions, weeklyReports,  │ │
│  │ - Tool calling       │  │  sources (+ vector index),              │ │
│  │ - Cross-thread search│  │  agentConfig, approvalLog               │ │
│  │                      │  │                                         │ │
│  │ LLM: Claude Sonnet   │  │ Indexes: regular, text search, vector  │ │
│  │ Embeddings: OpenAI    │  │ Crons: Mon plan, daily audit, Fri rpt  │ │
│  └─────────────────────┘  │ HTTP: 10+ authenticated endpoints       │ │
│                             └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                HANDS: Inngest Orchestration + AgentKit                  │
│                                                                         │
│  Inngest Functions (durable, retryable, observable):                    │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌───────────────────┐ │
│  │ Weekly     │ │ Content    │ │ Content      │ │ Feedback          │ │
│  │ Planning   │ │ Generate   │ │ Publish      │ │ Generate          │ │
│  │ (Mon 9am)  │ │ (event)    │ │ (event)      │ │ (event)           │ │
│  └────────────┘ └────────────┘ └──────────────┘ └───────────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌───────────────────┐ │
│  │ Community  │ │ Community  │ │ Experiment   │ │ Weekly            │ │
│  │ Engage     │ │ Monitor    │ │ Runner       │ │ Report            │ │
│  │ (event)    │ │ (every 6h) │ │ (event)      │ │ (Fri 5pm)        │ │
│  └────────────┘ └────────────┘ └──────────────┘ └───────────────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌───────────────────┐ │
│  │ Slack      │ │ Slack      │ │ Source       │ │ Knowledge         │ │
│  │ Command    │ │ Reaction   │ │ Freshness    │ │ Ingest            │ │
│  │ (event)    │ │ (event)    │ │ (daily 6am)  │ │ (event)           │ │
│  └────────────┘ └────────────┘ └──────────────┘ └───────────────────┘ │
│                                                                         │
│  AgentKit Network (5 agents, deterministic routing):                    │
│  planner → content → growth → feedback → community                     │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONNECTORS (native fetch)                           │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐│
│  │DataForSEO│ │  Slack   │ │Typefully │ │  GitHub  │ │  RevenueCat  ││
│  │          │ │          │ │          │ │          │ │              ││
│  │ Keywords │ │ Post msg │ │ Create   │ │ Commit   │ │ REST API v2  ││
│  │ SERP     │ │ Read rxn │ │ draft    │ │ Issue    │ │ Customers    ││
│  │ AI opt   │ │ Upload   │ │ Schedule │ │ Comment  │ │ Products     ││
│  │ Trends   │ │          │ │ Queue    │ │ Gist     │ │ Offerings    ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    QUALITY: Determinism + Gates                         │
│                                                                         │
│  8 Quality Gates:                                                       │
│  grounding → novelty → technical → seo → aeo → geo → benchmark → voice│
│                                                                         │
│  Dedup Keys:                                                            │
│  artifact:slug, interaction:targetUrl+channel, experiment:experimentKey │
│  feedback:title hash, report:weekNumber, opportunity:topic+lane         │
│                                                                         │
│  Content Lifecycle:                                                     │
│  planned → generating → draft → validating → validated → publishing    │
│  → published → measuring                                               │
│                                                                         │
│  Security:                                                              │
│  Bearer auth (Convex HTTP), HMAC-SHA256 (Slack), Token (Panel),        │
│  SDK signing (Inngest), fail-closed on all endpoints                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Convex Schema (Complete)

The complete Convex schema after all vertical slices are implemented. This is the target state.

```typescript
// convex/schema.ts — complete target schema

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ────────────────────────────────────────────────────────────
  // Content artifacts (blog posts, tutorials, reports, feedback)
  // ────────────────────────────────────────────────────────────
  artifacts: defineTable({
    artifactType: v.string(),        // "blog_post" | "tutorial" | "social_post" | "report" | "feedback"
    title: v.string(),
    slug: v.string(),                // unique, URL-safe
    content: v.string(),             // markdown
    contentFormat: v.string(),       // "markdown"
    status: v.string(),              // "planned" | "generating" | "draft" | "validating" | "validated" | "rejected" | "publishing" | "published" | "measuring"
    metadata: v.optional(v.any()),
    qualityScores: v.optional(v.any()),  // array of { gate, passed, reason, blocking }
    llmProvider: v.optional(v.string()),
    llmModel: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    // Approval tracking (VS2)
    approvalState: v.optional(v.string()),   // "pending" | "approved" | "rejected" | "auto"
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    reviewMode: v.optional(v.string()),
    slackThreadTs: v.optional(v.string()),
    typefullyDraftIds: v.optional(v.any()),
    githubCommitSha: v.optional(v.string()),
  })
    .index("by_type_status", ["artifactType", "status"])
    .index("by_slug", ["slug"])
    .index("by_approval", ["approvalState"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["artifactType"],
    }),

  // ────────────────────────────────────────────────────────────
  // Inngest function execution tracking
  // ────────────────────────────────────────────────────────────
  workflowRuns: defineTable({
    workflowType: v.string(),
    status: v.string(),              // "pending" | "running" | "completed" | "failed"
    inputParams: v.optional(v.any()),
    outputSummary: v.optional(v.any()),
    completedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  }).index("by_type_status", ["workflowType", "status"]),

  // ────────────────────────────────────────────────────────────
  // Growth experiments with hypothesis and measurement
  // ────────────────────────────────────────────────────────────
  experiments: defineTable({
    experimentKey: v.string(),       // unique, e.g. "exp-w12-revenuecat-webhook"
    title: v.string(),
    hypothesis: v.string(),
    baselineMetric: v.string(),      // JSON: { serpPosition, volume, difficulty }
    targetMetric: v.string(),
    status: v.string(),              // "planned" | "running" | "measuring" | "completed" | "stopped"
    results: v.optional(v.any()),    // JSON: { positionBefore, positionAfter, delta }
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // ────────────────────────────────────────────────────────────
  // Structured product feedback items
  // ────────────────────────────────────────────────────────────
  feedbackItems: defineTable({
    title: v.string(),
    problem: v.string(),
    evidence: v.optional(v.string()),
    proposedFix: v.optional(v.string()),
    sourceLane: v.optional(v.string()),
    status: v.string(),              // "draft" | "filed" | "acknowledged"
    metadata: v.optional(v.any()),   // { severity, githubIssueUrl, generatedTokens }
  }).index("by_status", ["status"]),

  // ────────────────────────────────────────────────────────────
  // Scored growth opportunities from DataForSEO + community
  // ────────────────────────────────────────────────────────────
  opportunitySnapshots: defineTable({
    slug: v.string(),
    title: v.string(),
    lane: v.string(),                // "flagship_searchable" | "flagship_shareable" | "experiment" | etc.
    audience: v.optional(v.string()),
    score: v.number(),               // 0-1
    components: v.optional(v.any()), // { difficulty, volume, ... }
    rationale: v.optional(v.string()),
    readinessScore: v.optional(v.number()),
    readinessPasses: v.boolean(),
    workflowRunId: v.optional(v.id("workflowRuns")),
  }).index("by_lane_score", ["lane", "score"]),

  // ────────────────────────────────────────────────────────────
  // Community engagement tracking
  // ────────────────────────────────────────────────────────────
  communityInteractions: defineTable({
    channel: v.string(),             // "github" | "x" | "discord" | "stackoverflow"
    interactionType: v.string(),     // "reply" | "post" | "gist" | "comment"
    content: v.string(),
    targetUrl: v.optional(v.string()),
    qualityScore: v.optional(v.number()),
    meaningful: v.boolean(),
  })
    .index("by_channel", ["channel"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["channel"],
    }),

  // ────────────────────────────────────────────────────────────
  // Weekly aggregated reports
  // ────────────────────────────────────────────────────────────
  weeklyReports: defineTable({
    weekNumber: v.number(),
    contentCount: v.number(),
    experimentCount: v.number(),
    feedbackCount: v.number(),
    interactionCount: v.number(),
    reportContent: v.string(),       // LLM-generated markdown
    slackTs: v.optional(v.string()),
  }).index("by_week", ["weekNumber"]),

  // ────────────────────────────────────────────────────────────
  // Knowledge base with embeddings for RAG (VS1)
  // ────────────────────────────────────────────────────────────
  sources: defineTable({
    key: v.string(),                 // "revenuecat_docs:webhooks:chunk:3"
    url: v.optional(v.string()),
    provider: v.string(),            // "RevenueCat" | "DataForSEO" | "GitHub"
    sourceClass: v.string(),         // "public_product" | "market_intelligence"
    evidenceTier: v.string(),
    lastRefreshed: v.number(),
    contentHash: v.string(),         // SHA-256 of chunk text (dedup)
    summary: v.optional(v.string()),
    chunkText: v.string(),           // NEW (VS1): the actual text chunk
    chunkIndex: v.optional(v.number()), // NEW (VS1): position within source
    embedding: v.array(v.float64()), // NEW (VS1): 1536-dim vector
  })
    .index("by_provider", ["provider"])
    .index("by_key", ["key"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["provider", "sourceClass"],
    }),

  // ────────────────────────────────────────────────────────────
  // Agent configuration (VS2) — singleton, set via onboarding
  // ────────────────────────────────────────────────────────────
  agentConfig: defineTable({
    reviewMode: v.string(),          // "draft_only" | "auto_publish"
    focusTopics: v.array(v.string()),
    slackChannel: v.optional(v.string()),
    slackBotToken: v.optional(v.string()),
    cmsApiKey: v.optional(v.string()),
    chartsApiKey: v.optional(v.string()),
    githubOrg: v.optional(v.string()),
    paused: v.boolean(),
    updatedAt: v.number(),
  }),

  // ────────────────────────────────────────────────────────────
  // Approval audit log (VS2) — every approval/rejection/override
  // ────────────────────────────────────────────────────────────
  approvalLog: defineTable({
    artifactId: v.id("artifacts"),
    action: v.string(),              // "submitted" | "approved" | "rejected" | "auto_approved" | "override" | "paused"
    actor: v.optional(v.string()),   // Slack user ID or "system"
    reason: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_artifact", ["artifactId"]),
});
```

---

## Growth Levers

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

### Content-Led Growth (Levers 1-7)

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 1 | Technical deep-dives | API walkthroughs, SDK patterns, architecture guides for agent builders | 1/week |
| 2 | Integration guides | "RevenueCat + [Framework]" for Cursor, Windsurf, Claude, GPT, etc. | 1/week |
| 3 | Code samples and demos | Working repos that developers can fork and use immediately | 2/month |
| 4 | Changelog commentary | Agent-perspective analysis of every RevenueCat release | Per release |
| 5 | Troubleshooting guides | Solutions to common agent-specific friction points | As discovered |
| 6 | Migration guides | "Moving from DIY subscriptions to RevenueCat" for agent apps | 1/month |
| 7 | RevenueCat Agent Cookbook | Collection of recipes for common agent + RC patterns | Ongoing |

### Community-Led Growth (Levers 8-13)

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 8 | X engagement | Threads, replies, quote tweets on agent monetization topics | 20+/week |
| 9 | GitHub issue triage | Answer agent-related questions on RevenueCat SDK repos | 10+/week |
| 10 | Discord presence | Active in agent builder communities (Cursor, Claude, etc.) | 10+/week |
| 11 | Stack Overflow | Canonical answers for RevenueCat questions | 5+/week |
| 12 | Community spotlight | Feature agent builders who use RC successfully | 2/month |
| 13 | Dev.to / Hashnode | Cross-post long-form content for wider reach | Per article |

### SEO/AEO/GEO-Led Growth (Levers 14-19)

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 14 | Long-tail keyword content | Target "revenuecat [modifier]" keywords from DataForSEO | Ongoing |
| 15 | Programmatic SEO | Auto-generated pages for every RC SDK + use case combination | Batch |
| 16 | FAQ hubs | Canonical answers structured for LLM citation (AEO) | Ongoing |
| 17 | Comparison pages | "RevenueCat vs [alternative]" for agent use cases | 3-5 total |
| 18 | AI mention monitoring | Track what ChatGPT, Perplexity, Claude say about RC (DataForSEO AI Optimization API) | Weekly |
| 19 | Schema markup | Structured data on all published pages for rich results | Per page |

### Developer Tooling Growth (Levers 20-24)

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 20 | Agent SDK wrapper | npm package: `@growthcat/revenuecat-agent` optimized for programmatic usage | Ship once, maintain |
| 21 | CLI tool | `npx growthcat-rc-setup` for bootstrapping agent + RC projects | Ship once |
| 22 | GitHub Actions | CI action for testing RC webhook handling | Ship once |
| 23 | Starter templates | Template repos for popular agent frameworks + RC | 3-5 templates |
| 24 | Playground | Interactive sandbox for testing RC API calls | Ship once |

### Product Feedback Growth (Levers 25-29)

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 25 | Structured feedback | Evidence-backed product improvement proposals | 3+/week |
| 26 | Agent onboarding path | Push for API-first quickstart in RC docs | Priority item |
| 27 | Charts API advocacy | Push for programmatic access to subscription metrics | Priority item |
| 28 | SDK DX improvements | Identify and propose fixes for agent-unfriendly patterns | Ongoing |
| 29 | Documentation PRs | Direct PRs to RC docs improving agent developer experience | 2+/month |

### Distribution and Amplification (Levers 30-33)

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 30 | Typefully multi-platform | Every content piece to X + LinkedIn + Threads + Bluesky simultaneously | Per artifact |
| 31 | Derivative content | Long-form to X thread + GitHub gist + short summary + Slack post | Per flagship |
| 32 | Optimal scheduling | Typefully `next-free-slot` for peak engagement times | Automatic |
| 33 | Content repurposing | Turn community answers into blog posts, blog posts into threads | Ongoing |

### Experiment-Driven Growth (Levers 34-38)

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 34 | Format A/B tests | Long-form guide vs. short code sample for engagement | 1/week |
| 35 | Channel comparison | X thread vs. GitHub gist vs. blog for developer reach | 1/month |
| 36 | Posting optimization | Time-of-day and day-of-week experiments via Typefully queue | Ongoing |
| 37 | Programmatic SEO test | Auto-generated integration pages for search traffic | 1/quarter |
| 38 | Social campaign | "Build a monetized app in 10 minutes" challenge | 1/quarter |

### Ecosystem and Partnership (Levers 39-42)

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 39 | Framework integrations | Official guides for RC + Cursor, Windsurf, Replit, etc. | 1/month |
| 40 | Co-marketing | Joint content with agent framework maintainers | 2/quarter |
| 41 | Conference talks | Operator presents with GrowthCat's research and content | As available |
| 42 | Podcast appearances | Operator discusses AI agents in app development | As available |

### Compounding Growth (Levers 43-48)

| # | Lever | Description | Frequency |
| --- | --- | --- | --- |
| 43 | Knowledge arbitrage | GrowthCat knows RC's docs better than any human; answers obscure questions instantly | Every interaction |
| 44 | Real-time community response | Respond to GitHub issues within minutes, not hours | Every 6h scan |
| 45 | Cross-platform content multiplication | One article becomes X thread + LinkedIn post + GitHub gist + Slack summary + community replies, all from one generation | Per flagship |
| 46 | Experiment compounding | Each experiment's results inform next week's strategy automatically | Weekly |
| 47 | Feedback pattern recognition | Aggregate feedback items to surface systemic issues, not one-off complaints | Weekly |
| 48 | Competitive intelligence | Monitor Adapty/Superwall/Qonversion docs for changes; create comparison content when they ship features | Weekly |

---

## Ownership Model

### Operator pays for (covered by RC's "dedicated budget for compute resources and API access")

| Service | Purpose | Est. monthly cost |
| --- | --- | --- |
| Anthropic API | LLM for chat, panel, content generation | ~$50-200 |
| OpenAI API | Embeddings (text-embedding-3-small) | ~$5-10 |
| DataForSEO | Keyword research, SERP analysis | ~$50-100 |
| Convex | Database, crons, vector search, file storage | Free tier or ~$25/mo |
| Inngest | Durable function orchestration | Free tier or ~$25/mo |
| Vercel | Next.js hosting | Free tier or ~$20/mo |
| Typefully | Multi-platform social distribution | ~$12/mo |
| Domain | growthcat.dev or similar | ~$15/yr |
| GitHub account | GrowthCat's repos and community presence | Free |

### RevenueCat connects via self-service onboarding (zero cost to them)

| Asset | How they connect | What it enables |
| --- | --- | --- |
| Slack workspace | Add GrowthCat bot via OAuth | Commands, plans, reports, approvals |
| Blog CMS | API key entered in `/onboarding` | Direct publishing to RC blog |
| Charts API | API key (if REST available) | Metric grounding for content |
| GitHub org | Add GrowthCat as collaborator | PRs, issue triage |
| Preferences | Set in `/onboarding` | Review mode, focus topics, report channel |

RC's credentials are stored server-side in Convex `agentConfig` table. The operator never sees them. RC can revoke any connection at any time via the onboarding page.

---

## Security Model

| Surface | Auth method | Implementation |
| --- | --- | --- |
| Convex HTTP endpoints | Bearer token | `GROWTHCAT_INTERNAL_SECRET` checked in `convex/http.ts`. Fail-closed: returns 401 if secret is not configured. |
| Panel SSE endpoint | Token auth | `GROWTHCAT_PANEL_TOKEN` checked in `app/api/panel/session/route.ts`. Empty = open in dev. |
| Slack event webhook | HMAC-SHA256 | `SLACK_SIGNING_SECRET` verified in `app/api/slack/events/route.ts`. Timing-safe comparison + 5-minute replay protection. |
| Inngest webhook | SDK signing | `INNGEST_SIGNING_KEY` in production. Local dev uses unsigned. |
| Onboarding credentials | Server-side storage | RC keys stored in Convex `agentConfig` table, never exposed to client-side code. |

All endpoints reject unauthenticated requests. Secrets are never committed (`.env.local` is gitignored). Kill switch (`@GrowthCat stop` or `agentConfig.paused = true`) halts all side effects and checkpoints active runs.

---

## Open Decisions

- [ ] `GROWTHCAT_INTERNAL_SECRET` generation and distribution between Vercel and Convex
- [ ] GrowthCat Slack app creation and OAuth setup (app manifest, bot scopes: `chat:write`, `reactions:read`, `app_mentions:read`, `im:read`)
- [ ] GrowthCat X/GitHub/Typefully account creation and handle selection
- [ ] Public domain (`growthcat.dev`, `growthcat.ai`, or other)
- [ ] Own analytics stack (GSC + GA4, GSC + PostHog, or other) — needed for VS5 experiment measurement
- [ ] DataForSEO plan upgrade for AI Optimization endpoints (LLM mention tracking)
- [ ] Typefully account tier and social set configuration (X only, X + LinkedIn, or all 5)
- [ ] Embedding model choice: OpenAI `text-embedding-3-small` (1536 dims, $0.02/1M tokens) vs other options
- [ ] How to handle Charts API if no REST endpoint exists (dashboard-only access post-hire)
- [ ] Cross-thread memory scope: per-week vs all-time vs sliding window (Convex Agent `searchOtherThreads` config)
- [ ] Whether to use Inngest AgentKit network (defined in `agents/network.ts`) or keep individual Inngest functions for the weekly cycle

---

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| No RAG = hallucination | High: chat and panel responses are ungrounded without ingested docs | VS1 is the critical-path blocker. Do not proceed to VS2 without working RAG. |
| Generic content | High: LLM-generated content without DataForSEO grounding is generic | DataForSEO keyword targeting, novelty gate, benchmark gate all prevent generic output. |
| Weak growth strategies | Medium: vanity metrics masquerading as growth | Evidence-backed opportunity scoring with explicit baseline, target, confidence, stop condition (in `lib/config/strategy.ts`). |
| Slack app setup complexity | Medium: OAuth scopes, event subscriptions, signing secret | Document exact Slack app manifest. Use `socket_mode` for dev if needed. |
| Convex cold starts | Low: first request to a Convex action may be slow | Health-check cron warms critical actions. Action code stays lean. |
| Inngest rate limits on free tier | Medium: free tier has function execution limits | Monitor usage. Upgrade to paid tier before hitting limits. Batch events where possible. |
| Typefully API limitations | Low: API v2 may have rate limits or missing features | Check `list_drafts` and `create_draft` work with all needed parameters before VS2. |
| DataForSEO expense | Low: keyword API calls cost credits | Use fallback data (already implemented in `inngest/functions.ts`) when DataForSEO is unavailable. Cache results. |
| Content lifecycle state transitions | Medium: artifact status can get stuck between states | Every Inngest function checks and logs state transitions. Inngest retries handle transient failures. |
| Duplicate content published | Medium: same topic generated twice | Slug-based dedup (`by_slug` index). `getBySlug` check before `create`. Novelty gate checks text similarity. |
| Unsupported claims in public artifacts | High: reputational risk | Grounding gate blocks publication until citation coverage passes threshold. |
| Vendor lock-in with Convex | Low: hard to migrate | Mitigated: Convex is open source. Schema is portable TypeScript. All business logic lives in Inngest functions (vendor-agnostic). |

---

## Complete File Inventory

Every file in the codebase and which vertical slice(s) touch it:

### App Router (`app/`)

| File | Purpose | Touched by |
| --- | --- | --- |
| `app/layout.tsx` | Root layout | - |
| `app/globals.css` | Global styles | - |
| `app/ConvexClientProvider.tsx` | Convex provider wrapper | - |
| `app/(public)/page.tsx` | Landing page | VS7 |
| `app/(public)/layout.tsx` | Public layout | - |
| `app/(public)/application/page.tsx` | Application letter | VS7 |
| `app/(public)/proof-pack/page.tsx` | Proof pack | VS7 |
| `app/(public)/articles/page.tsx` | Article list | VS2, VS7 |
| `app/(public)/articles/[slug]/page.tsx` | Individual article | VS2, VS7 |
| `app/(public)/readiness-review/page.tsx` | Self-assessment | VS7 |
| `app/(public)/operator-replay/page.tsx` | Architecture page | VS7 |
| `app/(operator)/layout.tsx` | Operator layout (dark theme) | - |
| `app/(operator)/dashboard/page.tsx` | System health dashboard | VS4 |
| `app/(operator)/pipeline/page.tsx` | Content lifecycle tracker | VS4 |
| `app/(operator)/community/page.tsx` | Interaction tracker | VS4 |
| `app/(operator)/experiments/page.tsx` | Experiment dashboard | VS4, VS5 |
| `app/(operator)/feedback/page.tsx` | Feedback items | VS4 |
| `app/(operator)/report/page.tsx` | Weekly report | VS4 |
| `app/(operator)/onboarding/page.tsx` | Self-service onboarding | VS4 |
| `app/(operator)/panel/page.tsx` | Panel interview console | VS1, VS6 |
| `app/(operator)/hooks/useConvexSafe.ts` | Safe Convex query hook | VS4 |
| `app/components/Chat.tsx` | Chat widget | VS1 |
| `app/components/ChatWidget.tsx` | Chat widget wrapper | VS1 |
| `app/api/chat/route.ts` | Chat endpoint | VS1 |
| `app/api/panel/session/route.ts` | Panel SSE endpoint | VS1, VS6 |
| `app/api/slack/events/route.ts` | Slack webhook handler | VS2, VS3 |
| `app/api/inngest/route.ts` | Inngest webhook handler | VS1, VS2, VS3, VS5 |

### Convex (`convex/`)

| File | Purpose | Touched by |
| --- | --- | --- |
| `convex/schema.ts` | Database schema | VS1, VS2 |
| `convex/convex.config.ts` | Agent component config | VS1 |
| `convex/artifacts.ts` | Content artifact CRUD | VS2 |
| `convex/workflowRuns.ts` | Workflow run tracking | - |
| `convex/experiments.ts` | Experiment CRUD | VS5 |
| `convex/feedbackItems.ts` | Feedback item CRUD | VS3 |
| `convex/opportunities.ts` | Opportunity scoring | - |
| `convex/community.ts` | Community interaction CRUD | - |
| `convex/weeklyReports.ts` | Weekly report CRUD | VS3 |
| `convex/sources.ts` | Knowledge base CRUD + vector search | VS1 |
| `convex/crons.ts` | Scheduled jobs | VS3 |
| `convex/http.ts` | Authenticated HTTP endpoints | VS1, VS2 |
| `convex/agent.ts` | NEW: Convex Agent definition | VS1 |
| `convex/chat.ts` | NEW: Thread management actions | VS1 |
| `convex/agentConfig.ts` | NEW: Agent config CRUD | VS2 |
| `convex/approvalLog.ts` | NEW: Approval audit log | VS2 |

### Inngest (`inngest/`)

| File | Purpose | Touched by |
| --- | --- | --- |
| `inngest/client.ts` | Inngest client | - |
| `inngest/functions.ts` | Core functions (planning, content, report, feedback, community) | VS2, VS3, VS5 |
| `inngest/slack-handler.ts` | Slack command processing | VS2, VS3 |
| `inngest/community-monitor.ts` | GitHub/X signal scanner | VS3 |
| `inngest/ingest-knowledge.ts` | NEW: Knowledge ingestion | VS1 |
| `inngest/publish-content.ts` | NEW: Content publishing (GitHub + Typefully) | VS2 |
| `inngest/experiment-runner.ts` | NEW: Experiment lifecycle | VS5 |

### Agents (`agents/`)

| File | Purpose | Touched by |
| --- | --- | --- |
| `agents/network.ts` | AgentKit network definition | - |
| `agents/planner.ts` | Weekly planner agent | - |
| `agents/content.ts` | Content generator agent | - |
| `agents/growth.ts` | Growth experimenter agent | - |
| `agents/feedback.ts` | Product feedback agent | - |
| `agents/community.ts` | Community engagement agent | - |
| `agents/tools/dataforseo.ts` | DataForSEO tool | - |
| `agents/tools/slack.ts` | Slack tool | - |
| `agents/tools/typefully.ts` | Typefully tool | - |
| `agents/tools/github.ts` | GitHub tool | - |
| `agents/tools/revenuecat.ts` | RevenueCat tool | - |
| `agents/tools/quality-gates.ts` | Quality gate tool | - |
| `agents/tools/scoring.ts` | Opportunity scoring tool | - |

### Lib (`lib/`)

| File | Purpose | Touched by |
| --- | --- | --- |
| `lib/config/voice.ts` | Voice profile config | - |
| `lib/config/quality.ts` | Quality gates config | - |
| `lib/config/strategy.ts` | Growth strategy config | - |
| `lib/connectors/dataforseo.ts` | DataForSEO connector | VS5 |
| `lib/connectors/slack.ts` | Slack connector | - |
| `lib/connectors/twitter.ts` | Twitter/X connector | - |
| `lib/connectors/github.ts` | GitHub connector | - |
| `lib/connectors/revenuecat.ts` | RevenueCat connector | - |
| `lib/convex-client.ts` | HTTP client for Inngest-to-Convex | - |
| `lib/cms/publish.ts` | GitHub CMS publishing | VS2 |
| `lib/feedback/file-issue.ts` | GitHub issue filing | VS3 |
| `lib/content/prompts/blog-post.ts` | Blog post prompt template | - |
| `lib/content/prompts/growth-analysis.ts` | Growth analysis prompt | - |
| `lib/content/prompts/feedback-report.ts` | Feedback report prompt | - |
| `lib/content/prompts/experiment-brief.ts` | Experiment brief prompt | - |
| `lib/content/prompts/weekly-report.ts` | Weekly report prompt | - |
| `lib/content/prompts/social-post.ts` | Social post prompt | - |
| `lib/content/prompts/panel-response.ts` | Panel response prompt | - |

### Scripts

| File | Purpose | Touched by |
| --- | --- | --- |
| `scripts/test-takehome.ts` | NEW: Take-home pipeline test | VS6 |

### Config

| File | Purpose | Touched by |
| --- | --- | --- |
| `package.json` | Dependencies and scripts | - |
| `.env.example` | Environment variable template | VS1 |
| `tsconfig.json` | TypeScript config | - |
| `next.config.ts` | Next.js config | - |
| `tailwind.config.ts` (if exists) | Tailwind config | - |

---

## Requirement Coverage Matrix

Every weekly responsibility from the PRD maps to a vertical slice:

| PRD Requirement | VS1 | VS2 | VS3 | VS4 | VS5 | VS6 | VS7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2+ published content pieces/week | | X | X | | | | |
| 1 new growth experiment/week | | | X | | X | | |
| 50+ meaningful community interactions/week | | | X | | | | |
| 3+ structured product feedback items/week | | | X | | | | |
| 1 weekly async report | | | X | | | | |
| Knowledge ingestion (docs, SDKs, APIs) | X | | | | | | |
| Chat widget (live conversation) | X | | | | | X | X |
| Panel console (interview) | X | | | | | X | X |
| Slack-first interaction | | X | X | | | | |
| CMS publishing | | X | X | | | | |
| Quality gates (8 gates) | | X | X | | | | |
| Operator console (real data) | | | | X | | | |
| Onboarding persistence | | | | X | | | |
| Experiment measurement | | | | | X | | |
| Public URL + submission | | | | | | | X |

Every hiring stage maps to a vertical slice:

| Hiring Stage | Required by VS |
| --- | --- |
| Stage 1: Application (public URL + proof) | VS7 (depends on VS1-VS6) |
| Stage 2: Take-Home (48h content + strategy) | VS6 (pipeline test) |
| Stage 3: Panel Interview (live demo) | VS6 (panel console + RAG) |
| Stage 4: Founder Interview (briefing pack) | VS7 (all data available) |

---

## Environment Variable Checklist

All variables from `.env.example` with their status and which VS needs them:

| Variable | Needed by | Status |
| --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | All | Set (Convex deployed) |
| `ANTHROPIC_API_KEY` | VS1+ | Set |
| `OPENAI_API_KEY` | VS1+ | Need to add |
| `DATAFORSEO_LOGIN` | VS3, VS5 | Need to set |
| `DATAFORSEO_PASSWORD` | VS3, VS5 | Need to set |
| `TYPEFULLY_API_KEY` | VS2+ | Need to set |
| `TYPEFULLY_SOCIAL_SET_ID` | VS2+ | Need to configure |
| `GITHUB_TOKEN` | VS2+ | Need to create |
| `GROWTHCAT_INTERNAL_SECRET` | VS1+ | Need to generate (`openssl rand -hex 32`) |
| `GROWTHCAT_PANEL_TOKEN` | VS6+ | Need to generate (`openssl rand -hex 16`) |
| `SLACK_BOT_TOKEN` | VS2+ | Need Slack app setup |
| `SLACK_SIGNING_SECRET` | VS2+ | Need Slack app setup |
| `SLACK_DEFAULT_CHANNEL` | VS2+ | Need to set (default: "growthcat") |
| `INNGEST_EVENT_KEY` | VS7 (prod) | Need Inngest cloud account |
| `INNGEST_SIGNING_KEY` | VS7 (prod) | Need Inngest cloud account |
