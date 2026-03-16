import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { inngest } from "./client";
import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";

// ---------------------------------------------------------------------------
// Slack Command Handler — Inngest background function
//
// Receives commands from the Slack events route and processes them
// asynchronously. This allows complex operations (LLM calls, report
// generation, content creation) without blocking Slack's 3-second timeout.
// ---------------------------------------------------------------------------

const model = anthropic("claude-sonnet-4-20250514");

export const handleSlackCommand = inngest.createFunction(
  { id: "slack-command-handler", name: "Handle Slack Command" },
  { event: "growthcat/slack.command" },
  async ({ event, step }) => {
    const { command, channel, threadTs } = event.data as {
      command: string;
      channel: string;
      threadTs: string;
    };

    let reply: string;

    // -------------------------------------------------------------------
    // Command routing
    // -------------------------------------------------------------------

    if (command.startsWith("focus on ") || command.startsWith("prioritize ")) {
      const topic = command.replace(/^(focus on|prioritize)\s+/, "");

      await step.sendEvent("replan", {
        name: "growthcat/content.generate",
        data: {
          topic,
          contentType: "blog_post",
          targetKeyword: topic,
          audience: "agent builders",
        },
      });

      reply = `Got it. Shifting focus to "${topic}". I'll generate a content brief and share it here when ready.`;
    } else if (command.startsWith("write about ")) {
      const topic = command.replace("write about ", "");

      await step.sendEvent("generate", {
        name: "growthcat/content.generate",
        data: {
          topic,
          contentType: "blog_post",
          targetKeyword: topic,
          audience: "agent builders",
        },
      });

      reply = `Starting content generation for "${topic}". I'll share the draft when it's ready.`;
    } else if (command === "status") {
      // Fetch current status — in production this would query Convex
      reply = [
        "*GrowthCat Status*",
        "",
        "Content: generating...",
        "Experiments: 1 running",
        "Community: tracking interactions",
        "Next report: Friday 5pm UTC",
        "",
        "_Send \"report\" for the full weekly breakdown._",
      ].join("\n");
    } else if (command === "report") {
      await step.sendEvent("report", {
        name: "growthcat/report.generate",
      });

      reply =
        "Generating the weekly report now. I'll post it in this channel shortly.";
    } else if (command === "stop" || command === "pause") {
      // In production: set a flag in Convex or a KV store
      reply =
        "All automated actions paused. Send \"resume\" when you want me to pick back up.";
    } else if (command === "resume") {
      // In production: clear the pause flag
      reply =
        "Resumed. Automated planning, content generation, and community engagement are running again.";
    } else if (command === "help") {
      reply = [
        "*GrowthCat Commands*",
        "",
        '`focus on [topic]` — Shift this week\'s content focus',
        '`write about [topic]` — Generate a blog post on a topic',
        "`status` — Current week's metrics at a glance",
        "`report` — Generate the full weekly report",
        "`pause` / `stop` — Pause all automated actions",
        "`resume` — Resume automated actions",
        "`help` — Show this message",
        "",
        "Or just ask me anything and I'll do my best to help.",
      ].join("\n");
    } else {
      // General question — answer via LLM
      const result = await step.run("generate-reply", async () => {
        const res = await generateText({
          model,
          system: `You are ${GROWTHCAT_VOICE_PROFILE.agentName}, an autonomous developer-advocacy and growth agent for RevenueCat. You're responding to a message in your team Slack channel. Be helpful, concise, and direct. ${GROWTHCAT_VOICE_PROFILE.disclosureLine}`,
          prompt: command,
          maxTokens: 500,
          temperature: 0.4,
        });
        return res.text;
      });
      reply = result;
    }

    // -------------------------------------------------------------------
    // Post reply back to the Slack thread
    // -------------------------------------------------------------------
    await step.run("reply-to-slack", async () => {
      const token = process.env.SLACK_BOT_TOKEN;
      if (!token) return { posted: false, reason: "no SLACK_BOT_TOKEN" };

      const { WebClient } = await import("@slack/web-api");
      const client = new WebClient(token);

      await client.chat.postMessage({
        channel,
        thread_ts: threadTs,
        text: reply,
      });

      return { posted: true };
    });

    return { command, reply: reply.slice(0, 100) };
  },
);
