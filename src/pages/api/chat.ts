import { env } from "cloudflare:workers";
import { buildChatAnswer, recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const body = (await request.json().catch(() => ({}))) as { message?: unknown };
  const message = typeof body.message === "string" ? body.message : "";

  if (!message.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const answer = buildChatAnswer(message);

  await recordEvent(env, {
    type: "chat_message",
    path: "/api/chat",
    detail: {
      messageLength: message.length,
      mode: env.APP_MODE,
    },
  });

  return Response.json({
    answer,
    mode: env.APP_MODE,
    source: "public-proof",
  });
}
