import { env } from "cloudflare:workers";
import {
  getSlackConfig,
  handleSlackEventPayload,
  verifySlackRequest,
} from "@/lib/slack";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const rawBody = await request.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  if (payload.type === "url_verification") {
    return Response.json({ challenge: payload.challenge });
  }

  const config = await getSlackConfig(env);
  if (!config) {
    return Response.json(
      { error: "Slack connector is not active" },
      { status: 503 },
    );
  }

  const verified = await verifySlackRequest(
    request,
    rawBody,
    config.signingSecret,
  );
  if (!verified) {
    return Response.json({ error: "invalid Slack signature" }, { status: 401 });
  }

  await handleSlackEventPayload(env, payload);
  return Response.json({ ok: true });
}
