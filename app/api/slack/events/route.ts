import { NextRequest, NextResponse } from "next/server";
// Slack commands are forwarded to Convex, which verifies the Slack signature
// and handles command/reaction routing natively.

// ---------------------------------------------------------------------------
// Slack Event Handler — receives events when someone mentions @GrowthRat
//
// Pattern: respond to Slack within 3 seconds, then forward to Convex
// for async processing. Convex handles signature verification and routing.
// ---------------------------------------------------------------------------

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
  // 2. Forward the raw Slack payload to Convex.
  // Convex verifies Slack signatures and handles event translation.
  // -----------------------------------------------------------------------
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".convex.cloud", ".convex.site");
  const commonHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(req.headers.get("x-slack-request-timestamp")
      ? { "X-Slack-Request-Timestamp": req.headers.get("x-slack-request-timestamp") ?? "" }
      : {}),
    ...(req.headers.get("x-slack-signature")
      ? { "X-Slack-Signature": req.headers.get("x-slack-signature") ?? "" }
      : {}),
  };

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

    // Handle app_mention events — someone @-mentioned GrowthRat
    if (event.type === "app_mention") {
      // Fire-and-forget to Convex; it will translate the raw Slack event into a command.
      if (convexUrl) {
        fetch(`${convexUrl}/api/slack-command`, {
          method: "POST",
          headers: commonHeaders,
          body,
        }).catch((err) => console.error("[slack] Forward failed:", err));
      }
    }

    // Handle reaction_added events — for approval flow
    if (event.type === "reaction_added") {
      const messageTs = (event as any).item?.ts;

      if (messageTs) {
        if (convexUrl) {
          fetch(`${convexUrl}/api/slack-reaction`, {
            method: "POST",
            headers: commonHeaders,
            body,
          }).catch((err) => console.error("[slack] Forward failed:", err));
        }
      }
    }

    // Handle direct messages
    if (event.type === "message" && event.channel_type === "im") {
      if (convexUrl) {
        fetch(`${convexUrl}/api/slack-command`, {
          method: "POST",
          headers: commonHeaders,
          body,
        }).catch((err) => console.error("[slack] Forward failed:", err));
      }
    }
  }

  // Respond immediately — Slack requires acknowledgement within 3 seconds
  return NextResponse.json({ ok: true });
}
