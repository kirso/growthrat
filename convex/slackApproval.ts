"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getSlackConnectorConfig } from "./runtimeConnectors";

type ReactionHandlerResult = {
  handled: boolean;
  action?: "already_published" | "approved" | "approved_not_published" | "rejected";
  reason?: string;
};

type ApprovalLogLookupEntry = {
  artifactId: Id<"artifacts">;
  slackThreadTs?: string;
};

type PublishResult = {
  published: boolean;
};

type GitHubDistributionResult = {
  committed: boolean;
};

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
    const { botToken, defaultChannel } = await getSlackConnectorConfig(ctx);
    const token = botToken;
    const channel = defaultChannel ?? "growthrat";

    if (!token) {
      console.log("[slack] No SLACK_BOT_TOKEN — approval required but Slack is unavailable");
      await ctx.runMutation(internal.approvalLog.log, {
        artifactId,
        action: "approval_blocked",
        by: "system_no_slack",
        reason: "No Slack bot token configured; artifact remains pending approval",
      });
      return { posted: false, autoApproved: false, approvalBlocked: true };
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
  handler: async (ctx, { reaction, messageTs, userId }): Promise<ReactionHandlerResult> => {
    // Find the approval log entry for this Slack message
    const logEntries = await ctx.runQuery(internal.slackApprovalQueries.findBySlackTs, {
      slackThreadTs: messageTs,
    }) as ApprovalLogLookupEntry[];

    if (!logEntries || logEntries.length === 0) {
      console.log("[slack] No approval log entry found for ts:", messageTs);
      return { handled: false };
    }

    const entry: ApprovalLogLookupEntry = logEntries[0]!;
    const artifactId: Id<"artifacts"> = entry.artifactId;

    // Idempotency: check if artifact is already published (prevents double-processing)
    const artifact = await ctx.runQuery(internal.agentQueries.getArtifactById, { id: artifactId });
    if (artifact?.status === "published") {
      console.log("[slack] Artifact already published, skipping:", artifactId);
      return { handled: true, action: "already_published" };
    }

    if (reaction === "+1" || reaction === "thumbsup") {
      // Trigger distribution (CMS, Typefully, GitHub)
      const publishResult = await ctx.runAction(internal.actions.publishToCMS, { artifactId }) as PublishResult;
      let githubResult: GitHubDistributionResult | null = null;
      if (artifact) {
        await ctx.runAction(internal.actions.distributeViaTypefully, {
          artifactId,
          topic: artifact.title,
        });
        githubResult = await ctx.runAction(internal.actions.distributeViaGitHub, {
          artifactId,
          title: artifact.title,
          slug: artifact.slug,
          content: artifact.content,
        }) as GitHubDistributionResult;
      }

      const published: boolean = publishResult.published || Boolean(githubResult?.committed);
      if (published) {
        await ctx.runMutation(internal.mutations.updateArtifactStatus, {
          id: artifactId,
          status: "published",
        });
      }
      await ctx.runMutation(internal.approvalLog.log, {
        artifactId,
        action: "approved",
        by: `slack_reaction:${userId}`,
        slackThreadTs: messageTs,
        reason: published ? undefined : "Approved, but no publish target succeeded",
      });

      // Post confirmation
      const { botToken, defaultChannel } = await getSlackConnectorConfig(ctx);
      const token = botToken;
      if (token) {
        const { WebClient } = await import("@slack/web-api");
        const client = new WebClient(token);
        const channel = defaultChannel ?? "growthrat";
        await client.chat.postMessage({
          channel,
          thread_ts: messageTs,
          text: published
            ? `✅ Approved and published by <@${userId}>`
            : `✅ Approved by <@${userId}>, but no publish target succeeded. The artifact remains validated until a publish target is connected.`,
        });
      }

      return { handled: true, action: published ? "approved" : "approved_not_published" };
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
