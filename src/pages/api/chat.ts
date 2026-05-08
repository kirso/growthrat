import { env } from "cloudflare:workers";
import { answerAgentChat } from "@/lib/agent-chat";
import { getRuntimePolicySnapshot } from "@/lib/policy";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return Response.json({ error: "request body is too large" }, { status: 413 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    message?: unknown;
    threadId?: unknown;
  };
  const message = typeof body.message === "string" ? body.message : "";
  const threadId =
    typeof body.threadId === "string" && body.threadId.trim()
      ? body.threadId.trim()
      : crypto.randomUUID();

  if (!message.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const policy = await getRuntimePolicySnapshot(env);
  if (policy.killSwitch || !policy.modelChatEnabled) {
    return Response.json(
      {
        error: "chat is offline",
        detail:
          "GrowthRat chat is offline to avoid model spend. Contact the operator if you need live access.",
      },
      { status: 423 },
    );
  }

  const result = await answerAgentChat(env, request, message, threadId);

  return Response.json(result.body, { status: result.status });
}
