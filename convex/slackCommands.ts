"use node";

/**
 * Slack Command Processor — handles @GrowthRat mentions.
 *
 * Commands:
 *   @GrowthRat plan              → trigger weekly planning
 *   @GrowthRat write about X     → generate content about X
 *   @GrowthRat status            → current week metrics
 *   @GrowthRat report            → trigger weekly report
 *   @GrowthRat stop              → pause all workflows
 *   @GrowthRat resume            → resume workflows
 *   @GrowthRat help              → list commands
 *   @GrowthRat [anything else]   → answer via chat (RAG-grounded)
 */

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { WebClient } from "@slack/web-api";
import { getSlackConnectorConfig } from "./runtimeConnectors";

export const handleCommand = internalAction({
  args: {
    command: v.string(),
    channel: v.string(),
    threadTs: v.string(),
  },
  handler: async (ctx, { command, channel, threadTs }) => {
    const { botToken } = await getSlackConnectorConfig(ctx);
    const token = botToken;
    if (!token) return;
    const runtime = await ctx.runQuery((api.agentConfig as any).getRuntimeState, {});

    const client = new WebClient(token);
    const cmd = command.toLowerCase().trim();

    const reply = async (text: string) => {
      await client.chat.postMessage({
        channel,
        thread_ts: threadTs || undefined,
        text,
      });
    };

    // ── plan ──
    if (cmd === "plan" || cmd === "run plan" || cmd.startsWith("plan")) {
      if (!runtime.isActive) {
        await reply("🐭 I’m dormant right now. Interview-proof or RC-live mode must be enabled before I can run planning.");
        return;
      }
      await reply("🐭 Starting weekly planning...");
      await ctx.runMutation(internal.mutations.startWeeklyPlan, {});
      return;
    }

    // ── write about X ──
    if (cmd.startsWith("write about ") || cmd.startsWith("write ")) {
      if (!runtime.isActive) {
        await reply("🐭 I’m dormant right now. Enable interview-proof or RC-live mode before I can generate content.");
        return;
      }
      const topic = cmd.replace(/^write (about )?/, "").trim();
      if (!topic) {
        await reply("Usage: `@GrowthRat write about [topic]`");
        return;
      }
      await reply(`🐭 Generating content about "${topic}"...`);
      await ctx.runMutation(internal.mutations.startContentGen, {
        topic,
        targetKeyword: topic,
      });
      return;
    }

    // ── status ──
    if (cmd === "status" || cmd === "metrics") {
      const metrics = await ctx.runQuery(internal.mutations.gatherWeeklyMetrics, {});
      await reply(
        `🐭 *Week Status*\n` +
        `• Content published: ${metrics.contentCount}\n` +
        `• Experiments running: ${metrics.experimentCount}\n` +
        `• Feedback filed: ${metrics.feedbackCount}\n` +
        `• Community interactions: ${metrics.interactionCount} (${metrics.meaningfulCount} meaningful)`
      );
      return;
    }

    // ── report ──
    if (cmd === "report" || cmd === "weekly report") {
      if (!runtime.isActive) {
        await reply("🐭 I’m dormant right now. Enable interview-proof or RC-live mode before I can generate reports.");
        return;
      }
      await reply("🐭 Generating weekly report...");
      await ctx.runMutation(internal.mutations.startWeeklyReport, {});
      return;
    }

    // ── stop ──
    if (cmd === "stop" || cmd === "pause") {
      // Set paused flag in agentConfig
      const config = await ctx.runQuery(internal.slackCommandQueries.getAgentConfig, {});
      if (config) {
        await ctx.runMutation(internal.slackCommandMutations.pauseAgent, { paused: true });
        await reply("🐭 *Paused.* All scheduled workflows will skip until resumed. If the agent is dormant, set Operating Mode to interview-proof or RC-live in onboarding.");
      } else {
        await reply("🐭 No agent configuration found. Run onboarding first.");
      }
      return;
    }

    // ── resume ──
    if (cmd === "resume" || cmd === "start") {
      const config = await ctx.runQuery(internal.slackCommandQueries.getAgentConfig, {});
      if (config) {
        await ctx.runMutation(internal.slackCommandMutations.pauseAgent, { paused: false });
        if (runtime.mode === "dormant") {
          await reply("🐭 *Resumed.* Paused workflows can run again, but the agent is still dormant. Set Operating Mode to interview-proof or RC-live in onboarding to activate automation.");
        } else {
          await reply("🐭 *Resumed.* Workflows are active again.");
        }
      } else {
        await reply("🐭 No agent configuration found. Run onboarding first.");
      }
      return;
    }

    // ── help ──
    if (cmd === "help" || cmd === "commands" || cmd === "?") {
      await reply(
        "🐭 *GrowthRat Commands*\n\n" +
        "• `plan` — Run weekly planning (keyword research + topic selection)\n" +
        "• `write about [topic]` — Generate content about a specific topic\n" +
        "• `status` — Show this week's metrics\n" +
        "• `report` — Generate and post weekly report\n" +
        "• `stop` — Pause all scheduled workflows\n" +
        "• `resume` — Resume workflows\n" +
        "• `help` — Show this message\n" +
        "• _Anything else_ — I'll answer using my RevenueCat knowledge base"
      );
      return;
    }

    // ── fallback: answer from knowledge base ──
    try {
      if (!runtime.isActive) {
        await reply("🐭 I’m dormant right now. Enable interview-proof or RC-live mode before I answer open-ended questions.");
        return;
      }

      const { generateText } = await import("ai");
      const { anthropic } = await import("@ai-sdk/anthropic");

      const result = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: "You are GrowthRat, an autonomous developer advocacy agent for RevenueCat. Answer concisely in Slack format. Use *bold* for emphasis. Be helpful and specific.",
        prompt: command,
        maxOutputTokens: 500,
        temperature: 0.4,
      });

      await reply(`🐭 ${result.text}`);
    } catch {
      await reply("🐭 I couldn't process that. Try `@GrowthRat help` for available commands.");
    }
  },
});
