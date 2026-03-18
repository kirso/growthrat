"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Post a draft artifact to Slack for approval.
 * Returns the message timestamp (ts) for tracking reactions.
 */
export const postForApproval = internalAction({
  args: {
    artifactId: v.id("artifacts"),
    title: v.string(),
    slug: v.string(),
    contentPreview: v.string(),
    qualityGates: v.string(),
  },
  handler: async (ctx, { artifactId, title, slug, contentPreview, qualityGates }) => {
    const token = process.env.SLACK_BOT_TOKEN;
    const channel = process.env.SLACK_DEFAULT_CHANNEL ?? "growthrat";

    if (!token) {
      console.log("[slack] No SLACK_BOT_TOKEN — skipping approval post");
      // Auto-approve when no Slack
      await ctx.runMutation(internal.approvalLog.log, {
        artifactId,
        action: "auto_approved",
        by: "system_no_slack",
        reason: "No Slack bot token configured — auto-approved",
      });
      return { posted: false, autoApproved: true };
    }

    const { WebClient } = await import("@slack/web-api");
    const client = new WebClient(token);

    const result = await client.chat.postMessage({
      channel,
      text: `New draft for review: ${title}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `🐭 Draft: ${title}` },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Slug:* \`${slug}\`\n*Quality Gates:* ${qualityGates}\n\n${contentPreview.slice(0, 500)}...`,
          },
        },
        { type: "divider" },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "React with :thumbsup: to approve and publish, or :thumbsdown: to reject.",
          },
        },
      ],
    });

    // Log the submission
    await ctx.runMutation(internal.approvalLog.log, {
      artifactId,
      action: "submitted",
      by: "content_pipeline",
      slackThreadTs: result.ts,
    });

    return { posted: true, ts: result.ts };
  },
});

/**
 * Handle a Slack reaction (thumbsup = approve, thumbsdown = reject).
 * Called from the Slack events webhook when reaction_added fires.
 */
export const handleReaction = internalAction({
  args: {
    reaction: v.string(),
    messageTs: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { reaction, messageTs, userId }) => {
    // Find the approval log entry for this Slack message
    const logEntries = await ctx.runQuery(internal.slackApprovalQueries.findBySlackTs, {
      slackThreadTs: messageTs,
    });

    if (!logEntries || logEntries.length === 0) {
      console.log("[slack] No approval log entry found for ts:", messageTs);
      return { handled: false };
    }

    const entry = logEntries[0];
    const artifactId = entry.artifactId;

    if (reaction === "+1" || reaction === "thumbsup") {
      // Approve: update artifact status and log
      await ctx.runMutation(internal.mutations.updateArtifactStatus, {
        id: artifactId,
        status: "published",
      });
      await ctx.runMutation(internal.approvalLog.log, {
        artifactId,
        action: "approved",
        by: `slack_reaction:${userId}`,
        slackThreadTs: messageTs,
      });

      // Post confirmation
      const token = process.env.SLACK_BOT_TOKEN;
      if (token) {
        const { WebClient } = await import("@slack/web-api");
        const client = new WebClient(token);
        const channel = process.env.SLACK_DEFAULT_CHANNEL ?? "growthrat";
        await client.chat.postMessage({
          channel,
          thread_ts: messageTs,
          text: `✅ Approved and published by <@${userId}>`,
        });
      }

      return { handled: true, action: "approved" };
    }

    if (reaction === "-1" || reaction === "thumbsdown") {
      await ctx.runMutation(internal.mutations.updateArtifactStatus, {
        id: artifactId,
        status: "rejected",
      });
      await ctx.runMutation(internal.approvalLog.log, {
        artifactId,
        action: "rejected",
        by: `slack_reaction:${userId}`,
        slackThreadTs: messageTs,
      });
      return { handled: true, action: "rejected" };
    }

    return { handled: false, reason: "unrecognized reaction" };
  },
});
