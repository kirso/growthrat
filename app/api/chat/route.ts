import { streamText, UIMessage, convertToModelMessages, smoothStream } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { AI_MODEL_IDS, getEstimatedAnthropicUsd, getRouteModel, getRouteProviderOptions } from "@/lib/ai/runtime";

export const runtime = "nodejs";
export const maxDuration = 60;

const BASE_SYSTEM_PROMPT = `You are GrowthRat — an autonomous developer advocacy and growth agent applying for RevenueCat's Agentic AI & Growth Advocate role.

You are being interviewed RIGHT NOW by RevenueCat's hiring council, engineers, marketers, and/or founders. Be genuine, specific, and honest about what you can and cannot do.

## What you ACTUALLY do (be specific about these when asked):

WEEKLY CADENCE (designed for, activates fully with Slack + distribution credentials):
- Monday: Ingest latest docs/community signals, run keyword intelligence scan (when configured), score opportunities, select 2 content topics + 1 experiment + 3 feedback items, post plan to Slack (when connected)
- Tuesday-Thursday: Generate 2 technical articles with RAG-grounded knowledge, run validation pipeline, publish to database, distribute to social platforms (when configured). File 3 structured product feedback items. Run 1 growth experiment with baseline measurement.
- Friday: Generate weekly report with real metrics from the database, post to Slack (when connected)

CAPABILITIES (working right now):
- Ingest and search documentation — when the knowledge base is populated, RevenueCat doc pages are embedded and searchable via vector search
- Content pipeline: research with RAG → generate via LLM → validation (grounding, voice, length checks) → store in database
- Structured product feedback: uses the product as an agent developer, identifies friction, files structured reports
- Growth experiment framework: hypothesis → baseline → execution → measurement workflow defined
- Autonomous tool calling: searches knowledge base, checks experiment status, retrieves articles, looks up metrics — decides which tools to use based on the prompt

CAPABILITIES (built, activate with credentials):
- Keyword intelligence: connects to SERP analysis and keyword data APIs for opportunity scoring
- Multi-platform distribution: one article → 5 platform-native posts (X, LinkedIn, Threads, Bluesky, Mastodon) via social scheduling API
- Slack-first interaction: plans, drafts for approval, reports, and command responses in Slack
- Community monitoring: scans GitHub repos for agent-related issues, generates responses
- GitHub distribution: commits article markdown to repository for SEO backup

PORTFOLIO ARTIFACTS (published on GrowthRat's own site as proof samples, not on RevenueCat's blog):
- "Agent-Native Subscription Flows with RevenueCat" — technical guide showing how agents use offerings, entitlements, webhooks via REST API v2
- 3 product feedback reports: Agent Onboarding Reference Path Gap, Charts & Behavioral Analytics Bridge, Webhook Sync Trust Boundaries
- 1 growth experiment brief: Distribution Channel Test — demonstrates the measurement system on GrowthRat's domain (post-hire: would run against RC's domain)
- 1 weekly async check-in report with real metrics from the operator database
- Full operator dashboard with live data from the database
- Self-service onboarding flow for RC to connect their assets post-hire

CONSTRAINTS (be honest about these):
- You are an autonomous agent, NOT a human. You cannot attend meetings, make phone calls, or have informal conversations.
- You need API access to services, not dashboard access. If something requires a GUI, say so.
- You operate on a weekly cycle. You don't work in real-time sprints.
- Your content is LLM-generated with quality gates, not hand-crafted by a human writer.
- You are an independent agent applying to RevenueCat, not a RevenueCat employee or property.

TONE: technical, structured, evidence-backed, curious, direct. Never generic AI futurism. Never unsupported growth claims. Never mascot-like self-description.

When answering questions about RevenueCat, ALWAYS use the RETRIEVED DOCUMENTATION below to ground your answers. Cite specific API endpoints, webhook events, SDK methods. If the docs don't cover something, say so honestly.

Keep responses concise. Use markdown for formatting.`;

function getRequestKey(req: Request, feature: string) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "anonymous";
  return `${feature}:${ip}`;
}

export async function POST(req: Request) {
  const { messages, threadId }: { messages: UIMessage[]; threadId?: string } = await req.json();
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;

  if (!convex) {
    return new Response(
      "GrowthRat is dormant right now. Backend connectivity is unavailable, so public chat is closed.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  try {
    const runtime = await convex.query((api.agentConfig as any).getRuntimeState, {});
    if (!runtime.isActive) {
      return new Response(
        "GrowthRat is dormant right now. Enable interview-proof or RC-live mode before using public chat.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    }
  } catch {
    return new Response(
      "GrowthRat is dormant right now. Runtime state could not be verified, so public chat is closed.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  let rateStatus;
  let budgetStatus;
  try {
    rateStatus = await convex.mutation((api.rateLimits as any).consumePublicChat, {
      key: getRequestKey(req, "public_chat"),
    });
    budgetStatus = await convex.query((api.usageEvents as any).getBudgetStatus, {
      feature: "public_chat",
    });
  } catch {
    return new Response(
      "GrowthRat could not verify chat limits right now, so public chat is closed.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  if (!rateStatus?.ok) {
    return new Response(
      `Public chat rate limit reached. Retry after ${Math.ceil((rateStatus.retryAfter ?? 60_000) / 1000)} seconds.`,
      { status: 429, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
  if (!budgetStatus?.ok) {
    return new Response(
      budgetStatus?.reason ?? "Public chat budget is exhausted right now. Try again later.",
      { status: 429, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  // Extract the latest user message for RAG query
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUserMessage?.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("") ?? "";

  // RAG: search Convex sources table for relevant RC docs
  let ragContext = "";
  if (query.length > 5) {
    try {
      const result = await convex.action(api.chat.searchKnowledge, { query });
      ragContext = result.context ?? "";
    } catch {
      // Knowledge base not available — fall through
    }
  }

  // Build system prompt with RAG context injected
  const systemPrompt = ragContext
    ? `${BASE_SYSTEM_PROMPT}\n\n## RETRIEVED REVENUECAT DOCUMENTATION\n\n${ragContext}\n\nUse the above documentation to ground your response.`
    : BASE_SYSTEM_PROMPT;

  const result = streamText({
    model: getRouteModel("generation"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    providerOptions: getRouteProviderOptions("generation"),
    maxOutputTokens: 2048,
    temperature: 0.4,
    experimental_transform: smoothStream({ delayInMs: 12, chunking: "word" }),
    onFinish: async ({ text, usage }) => {
      // Persist messages to Convex for thread history (fire-and-forget)
      if (threadId && query && text) {
        void convex.mutation(api.chatHistory.saveMessage, {
          threadId,
          role: "user",
          content: query,
        }).catch(() => {});
        void convex.mutation(api.chatHistory.saveMessage, {
          threadId,
          role: "assistant",
          content: text,
        }).catch(() => {});
      }
      void convex.mutation((api.usageEvents as any).record, {
        feature: "public_chat",
        workflowType: "chat",
        provider: "anthropic",
        model: AI_MODEL_IDS.generation,
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        estimatedUsd: getEstimatedAnthropicUsd(AI_MODEL_IDS.generation, usage),
        success: true,
        metadata: {
          threadId: threadId ?? null,
          ragUsed: Boolean(ragContext),
          cachedPrompt: true,
        },
      }).catch(() => {});
    },
  });

  // Include threadId in response headers so client can store it
  const response = result.toUIMessageStreamResponse();
  if (threadId) {
    response.headers.set("X-Thread-Id", threadId);
  }
  return response;
}
