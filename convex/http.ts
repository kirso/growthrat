import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// ---------------------------------------------------------------------------
// Auth helper — all mutating endpoints require a bearer token.
// The token is GROWTHCAT_INTERNAL_SECRET, shared between Inngest and Convex.
// This prevents anyone with the Convex URL from writing arbitrary data.
// ---------------------------------------------------------------------------
function verifyInternalAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const expected = process.env.GROWTHCAT_INTERNAL_SECRET;

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
// Vector search endpoint — used by the chat API for RAG
// Public (read-only, returns only summaries, no secrets)
// ---------------------------------------------------------------------------

http.route({
  path: "/api/vector-search",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
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
    const docs = await Promise.all(
      results.map(async (r) => {
        const doc = await ctx.runQuery(api.sources.getById, { id: r._id });
        return doc;
      })
    );

    return new Response(
      JSON.stringify({
        docs: docs.filter((d): d is NonNullable<typeof d> => d !== null).map((d) => ({
          provider: d.provider,
          key: d.key,
          summary: d.summary ?? "",
          score: results.find((r) => r._id === d._id)?._score ?? 0,
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
// Chat history persistence — saves messages from the chat widget
// ---------------------------------------------------------------------------

http.route({
  path: "/api/chat-history",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const threadId = url.searchParams.get("threadId");

    if (!threadId) {
      return new Response(JSON.stringify({ messages: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const messages = await ctx.runQuery(api.chatHistory.getThread, { threadId });

    return new Response(JSON.stringify({ messages: messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })) }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }),
});

http.route({
  path: "/api/chat-history",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { threadId, role, content } = body;

    if (!threadId || !role || !content) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runMutation(api.chatHistory.saveMessage, { threadId, role, content });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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
    const body = await request.json();
    const { command, channel, threadTs } = body;

    if (!command || !channel) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runAction(internal.slackCommands.handleCommand, {
      command,
      channel,
      threadTs: threadTs ?? "",
    });

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
    const body = await request.json();
    const { reaction, messageTs, userId } = body;

    if (!reaction || !messageTs || !userId) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ctx.runAction(internal.slackApproval.handleReaction, {
      reaction,
      messageTs,
      userId,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
