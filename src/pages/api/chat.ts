import { env } from "cloudflare:workers";
import { answerAgentChat } from "@/lib/agent-chat";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) {
    return Response.json({ error: "request body is too large" }, { status: 413 });
  }

  const body = (await request.json().catch(() => ({}))) as { message?: unknown };
  const message = typeof body.message === "string" ? body.message : "";

  if (!message.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const result = await answerAgentChat(env, request, message);

  return Response.json(result.body, { status: result.status });
}
