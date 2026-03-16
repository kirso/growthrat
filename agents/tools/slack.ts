import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

export const postToSlack = createTool({
  name: "post_to_slack",
  description: "Post a message to a Slack channel.",
  parameters: z.object({
    channel: z.string().describe("Slack channel ID or name"),
    text: z.string().describe("Message text (supports Slack mrkdwn)"),
  }),
  handler: async ({ channel, text }) => {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) return "dry-run: no Slack token configured";

    const { WebClient } = await import("@slack/web-api");
    const client = new WebClient(token);
    const result = await client.chat.postMessage({ channel, text });
    return `Posted to ${channel}: ts=${result.ts}`;
  },
});
