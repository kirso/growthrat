import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { inngest } from "@/inngest/client";

// ---------------------------------------------------------------------------
// Slack Event Handler — receives events when someone mentions @GrowthCat
//
// Pattern: respond to Slack within 3 seconds, then process the command
// asynchronously via Inngest. This keeps the Slack API happy while
// allowing arbitrarily complex background work.
// ---------------------------------------------------------------------------

function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean {
  // Reject requests older than 5 minutes to prevent replay attacks
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp, 10) < fiveMinutesAgo) return false;

  const baseString = `v0:${timestamp}:${body}`;
  const computed =
    "v0=" +
    crypto.createHmac("sha256", secret).update(baseString).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(computed, "utf8"),
    Buffer.from(signature, "utf8"),
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // -----------------------------------------------------------------------
  // 1. Handle Slack URL verification challenge (required during app setup)
  // -----------------------------------------------------------------------
  if (parsed.type === "url_verification") {
    return NextResponse.json({ challenge: parsed.challenge });
  }

  // -----------------------------------------------------------------------
  // 2. Verify request authenticity via SLACK_SIGNING_SECRET
  // -----------------------------------------------------------------------
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (signingSecret) {
    const timestamp = req.headers.get("x-slack-request-timestamp") ?? "";
    const slackSig = req.headers.get("x-slack-signature") ?? "";

    if (!verifySlackSignature(body, timestamp, slackSig, signingSecret)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  // -----------------------------------------------------------------------
  // 3. Handle event callbacks
  // -----------------------------------------------------------------------
  if (parsed.type === "event_callback") {
    const event = parsed.event as Record<string, string> | undefined;
    if (!event) {
      return NextResponse.json({ ok: true });
    }

    // Ignore bot messages to avoid infinite loops
    if (event.bot_id || event.subtype === "bot_message") {
      return NextResponse.json({ ok: true });
    }

    // Handle app_mention events — someone @-mentioned GrowthCat
    if (event.type === "app_mention") {
      // Strip the @mention tag, leaving only the command text
      const text = (event.text ?? "")
        .replace(/<@[^>]+>/g, "")
        .trim()
        .toLowerCase();
      const channel = event.channel;
      const threadTs = event.thread_ts ?? event.ts;

      // Fire-and-forget: send the command to Inngest for background processing
      await inngest.send({
        name: "growthcat/slack.command",
        data: { command: text, channel, threadTs },
      });
    }

    // Handle direct messages
    if (event.type === "message" && event.channel_type === "im") {
      const text = (event.text ?? "").trim().toLowerCase();
      const channel = event.channel;
      const threadTs = event.thread_ts ?? event.ts;

      await inngest.send({
        name: "growthcat/slack.command",
        data: { command: text, channel, threadTs },
      });
    }
  }

  // Respond immediately — Slack requires acknowledgement within 3 seconds
  return NextResponse.json({ ok: true });
}
