import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { authComponent, createAuth, getSiteUrl } from "./auth";
import { getSlackConnectorConfig } from "./runtimeConnectors";

const http = httpRouter();

// Better Auth routes are served from Convex so Next can proxy to them.
authComponent.registerRoutesLazy(http, createAuth, {
  basePath: "/api/auth",
  cors: true,
  trustedOrigins: [getSiteUrl()],
});

// ---------------------------------------------------------------------------
// Auth helper — all mutating endpoints require a bearer token.
// This remains only for service-to-service callers that cannot present a
// request-level signature. User-facing Slack callbacks are verified directly.
// ---------------------------------------------------------------------------
function verifyInternalAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const expected =
    process.env.GROWTHCAT_INTERNAL_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET;

  // If no secret is configured, reject all requests (fail closed)
  if (!expected) return false;

  return token === expected;
}

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function parseSlackCommandPayload(body: Record<string, unknown>): { command: string; channel: string; threadTs: string } | null {
  const directCommand = typeof body.command === "string" ? body.command : null;
  const directChannel = typeof body.channel === "string" ? body.channel : null;
  const directThreadTs = typeof body.threadTs === "string" ? body.threadTs : "";
  if (directCommand && directChannel) {
    return { command: directCommand, channel: directChannel, threadTs: directThreadTs };
  }

  if (body.type === "event_callback") {
    const event = body.event as Record<string, unknown> | undefined;
    if (!event || event.bot_id || event.subtype === "bot_message") return null;

    const text = typeof event.text === "string" ? event.text.replace(/<@[^>]+>/g, "").trim().toLowerCase() : "";
    const channel = typeof event.channel === "string" ? event.channel : "";
    const threadTs = typeof event.thread_ts === "string"
      ? event.thread_ts
      : typeof event.ts === "string"
        ? event.ts
        : "";

    if (event.type === "app_mention" || (event.type === "message" && event.channel_type === "im")) {
      if (!text || !channel) return null;
      return { command: text, channel, threadTs };
    }
  }

  return null;
}

function parseSlackReactionPayload(body: Record<string, unknown>): { reaction: string; messageTs: string; userId: string } | null {
  const reaction = typeof body.reaction === "string" ? body.reaction : null;
  const messageTs = typeof body.messageTs === "string" ? body.messageTs : null;
  const userId = typeof body.userId === "string" ? body.userId : null;
  if (reaction && messageTs && userId) {
    return { reaction, messageTs, userId };
  }

  if (body.type === "event_callback") {
    const event = body.event as Record<string, unknown> | undefined;
    if (!event || event.type !== "reaction_added") return null;
    const evtReaction = typeof event.reaction === "string" ? event.reaction : null;
    const evtMessageTs = typeof event.item === "object" && event.item !== null
      ? typeof (event.item as Record<string, unknown>).ts === "string"
        ? (event.item as Record<string, unknown>).ts as string
        : null
      : null;
    const evtUserId = typeof event.user === "string" ? event.user : null;
    if (evtReaction && evtMessageTs && evtUserId) {
      return { reaction: evtReaction, messageTs: evtMessageTs, userId: evtUserId };
    }
  }

  return null;
}

/**
 * Verify Slack request signature using HMAC-SHA256.
 * Returns the parsed body if valid, null if invalid.
 */
async function verifySlackRequest(
  ctx: { runQuery: (...args: any[]) => Promise<any> },
  request: Request,
): Promise<Record<string, unknown> | null> {
  const { signingSecret } = await getSlackConnectorConfig(ctx);
  if (!signingSecret) return null; // Fail closed

  const timestamp = request.headers.get("X-Slack-Request-Timestamp");
  const slackSig = request.headers.get("X-Slack-Signature");
  if (!timestamp || !slackSig) return null;

  // Reject if timestamp is >5 minutes old (replay protection)
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return null;

  const rawBody = await request.text();
  const sigBasestring = `v0:${timestamp}:${rawBody}`;

  // HMAC-SHA256 via Web Crypto API (available in Convex default runtime)
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(signingSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(sigBasestring));
  const computed = "v0=" + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

  // Timing-safe comparison (constant-time)
  if (computed.length !== slackSig.length) return null;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ slackSig.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST endpoints — called by Inngest functions to persist results in Convex
// All require Bearer token authentication.
// ---------------------------------------------------------------------------

http.route({
  path: "/api/artifacts",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const body = await request.json();
    const id = await ctx.runMutation(api.artifacts.create, body);
    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/feedback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const body = await request.json();
    const id = await ctx.runMutation(api.feedbackItems.create, body);
    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/community",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const body = await request.json();
    const id = await ctx.runMutation(api.community.record, body);
    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/reports",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const body = await request.json();
    const id = await ctx.runMutation(api.weeklyReports.save, body);
    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/opportunities",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const body = await request.json();
    const id = await ctx.runMutation(api.opportunities.create, body);
    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/workflow-runs",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const body = await request.json();
    const id = await ctx.runMutation(api.workflowRuns.create, body);
    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Store a source chunk with embedding (knowledge ingestion)
http.route({
  path: "/api/sources",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const body = await request.json();
    const id = await ctx.runMutation(internal.sources.upsertWithEmbedding, body);
    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ---------------------------------------------------------------------------
// GET endpoints — read-only, still require auth to prevent data leaks
// ---------------------------------------------------------------------------

http.route({
  path: "/api/metrics",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const [artifacts, experiments, feedback, community, latestReport] =
      await Promise.all([
        ctx.runQuery(api.artifacts.list, { status: "published" }),
        ctx.runQuery(api.experiments.list, { status: "running" }),
        ctx.runQuery(api.feedbackItems.list, {}),
        ctx.runQuery(api.community.getStats),
        ctx.runQuery(api.weeklyReports.getLatest),
      ]);

    return new Response(
      JSON.stringify({
        contentCount: artifacts?.length ?? 0,
        experimentCount: experiments?.length ?? 0,
        feedbackCount: feedback?.length ?? 0,
        interactionCount: community?.total ?? 0,
        meaningfulCount: community?.meaningful ?? 0,
        lastReportWeek: latestReport?.weekNumber ?? 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }),
});

// ---------------------------------------------------------------------------
// Vector search endpoint — used by the chat API route and content gen for RAG
// Requires internal auth to prevent external knowledge base querying
// ---------------------------------------------------------------------------

http.route({
  path: "/api/vector-search",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const body = await request.json();
    const { embedding, limit = 5 } = body;

    if (!embedding || !Array.isArray(embedding)) {
      return new Response(JSON.stringify({ error: "embedding array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = await ctx.vectorSearch("sources", "by_embedding", {
      vector: embedding,
      limit,
    });

    // Fetch full docs for the results
    const docs = await ctx.runQuery(internal.agentQueries.getSourcesByIds, {
      ids: results.map((r) => r._id),
    });

    return new Response(
      JSON.stringify({
        docs: docs.map((d: { provider: string; key: string; summary: string }, index: number) => ({
          provider: d.provider,
          key: d.key,
          summary: d.summary ?? "",
          score: results[index]?._score ?? 0,
        })),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }),
});

// ---------------------------------------------------------------------------
// Chat history persistence — saves messages from the chat widget.
// History is treated as operator data, not public state. Both GET and POST
// require internal auth; the public chat widget remains stateless across reloads.
// ---------------------------------------------------------------------------

http.route({
  path: "/api/chat-history",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const url = new URL(request.url);
    const threadId = url.searchParams.get("threadId");

    if (!threadId) {
      return new Response(JSON.stringify({ messages: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages = await ctx.runQuery(internal.chatHistory.getThread, { threadId });

    return new Response(JSON.stringify({ messages: messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/api/chat-history",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyInternalAuth(request)) return unauthorizedResponse();
    const body = await request.json();
    const { threadId, role, content } = body;

    if (!threadId || !role || !content) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runMutation(internal.chatHistory.saveMessage, { threadId, role, content });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ---------------------------------------------------------------------------
// Slack command handler — processes @GrowthRat mentions
// ---------------------------------------------------------------------------

http.route({
  path: "/api/slack-command",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Accept either internal bearer auth (from Next.js route) or Slack signature (direct from Slack).
    // Check bearer token first (doesn't consume body), then fall back to Slack signature.
    let body: Record<string, unknown> | null = null;
    if (verifyInternalAuth(request)) {
      try { body = await request.json(); } catch { /* invalid json */ }
    } else {
      body = await verifySlackRequest(ctx, request);
    }
    if (!body) return unauthorizedResponse();

    const payload = parseSlackCommandPayload(body);
    if (!payload) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runAction(internal.slackCommands.handleCommand, payload);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ---------------------------------------------------------------------------
// Slack reaction handler — receives approval/rejection reactions from Slack
// ---------------------------------------------------------------------------

http.route({
  path: "/api/slack-reaction",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Accept either internal bearer auth (from Next.js route) or Slack signature
    let body: Record<string, unknown> | null = null;
    if (verifyInternalAuth(request)) {
      try { body = await request.json(); } catch { /* invalid json */ }
    } else {
      body = await verifySlackRequest(ctx, request);
    }
    if (!body) return unauthorizedResponse();
    const payload = parseSlackReactionPayload(body);
    if (!payload) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runAction(internal.slackApproval.handleReaction, {
      reaction: payload.reaction,
      messageTs: payload.messageTs,
      userId: payload.userId,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
