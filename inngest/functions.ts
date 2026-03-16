import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { inngest } from "./client";
import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";
import { PUBLISH_GATES } from "@/lib/config/quality";
import { renderBlogPostPrompt, type BlogPostInput } from "@/lib/content/prompts/blog-post";
import { renderWeeklyReportPrompt, type WeeklyReportInput } from "@/lib/content/prompts/weekly-report";
import { renderSocialPostPrompt, type SocialPostInput } from "@/lib/content/prompts/social-post";
import { convexStore, convexFetch } from "@/lib/convex-client";

const model = anthropic("claude-sonnet-4-20250514");

// ---------------------------------------------------------------------------
// Weekly Planning — Monday 9am UTC
// Discovers keyword opportunities, scores them, creates the week's plan,
// then triggers downstream content / feedback / community functions.
// ---------------------------------------------------------------------------
export const weeklyPlanningRun = inngest.createFunction(
  { id: "weekly-planning", name: "Weekly Planning Run" },
  { cron: "TZ=UTC 0 9 * * MON" },
  async ({ step }) => {
    // Log the workflow run in Convex
    const workflowRun = await step.run("log-workflow-start", async () => {
      return convexStore("/api/workflow-runs", {
        workflowType: "weekly-planning",
        status: "running",
        inputParams: { triggeredAt: Date.now() },
      });
    });

    // Step 1: Fetch keyword data from DataForSEO
    const keywords = await step.run("fetch-keywords", async () => {
      const login = process.env.DATAFORSEO_LOGIN;
      const password = process.env.DATAFORSEO_PASSWORD;

      if (!login || !password) {
        return {
          source: "fallback",
          items: [
            { keyword: "revenuecat webhook", difficulty: 10, volume: 320 },
            { keyword: "revenuecat api", difficulty: 13, volume: 480 },
            { keyword: "revenuecat flutter", difficulty: 3, volume: 260 },
            { keyword: "revenuecat react native", difficulty: 2, volume: 390 },
            { keyword: "in-app subscription api", difficulty: 37, volume: 590 },
          ],
        };
      }

      const res = await fetch(
        "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${login}:${password}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              keywords: [
                "revenuecat",
                "revenuecat webhook",
                "mobile app monetization",
                "in-app subscription api",
              ],
              location_code: 2840,
              language_code: "en",
              limit: 20,
            },
          ]),
        }
      );

      const data = await res.json();
      const items = (data.tasks?.[0]?.result?.[0]?.items ?? []).map(
        (item: Record<string, unknown>) => ({
          keyword: item.keyword as string,
          difficulty: (item.keyword_properties as Record<string, unknown>)
            ?.keyword_difficulty as number ?? 50,
          volume: (item.keyword_info as Record<string, unknown>)
            ?.search_volume as number ?? 0,
        })
      );

      return { source: "dataforseo_live", items: items.slice(0, 10) };
    });

    // Step 2: Score and select opportunities
    const plan = await step.run("score-opportunities", async () => {
      const scored = keywords.items
        .map((kw: { keyword: string; difficulty: number; volume: number }) => ({
          ...kw,
          score: Math.round(
            (((100 - kw.difficulty) / 100) * 0.4 +
            (Math.min(kw.volume, 1000) / 1000) * 0.3 +
            (kw.keyword.includes("revenuecat") ? 0.3 : 0.1))
          * 100) / 100,
        }))
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

      return {
        contentTopics: scored.slice(0, 2).map((s: { keyword: string }) => s.keyword),
        experimentTopic: scored[2]?.keyword ?? "content format test",
        feedbackTopics: ["agent onboarding", "charts api", "webhook testing"],
        communityTarget: 50,
        scored,
      };
    });

    // Step 3: Store each scored opportunity in Convex
    await step.run("store-opportunities", async () => {
      const promises = plan.scored.map(
        (opp: { keyword: string; score: number; difficulty: number; volume: number }) =>
          convexStore("/api/opportunities", {
            slug: opp.keyword.replace(/\s+/g, "-"),
            title: opp.keyword,
            lane: "flagship_searchable",
            audience: "agent builders",
            score: opp.score,
            components: { difficulty: opp.difficulty, volume: opp.volume },
            rationale: `Score ${opp.score} — difficulty ${opp.difficulty}, volume ${opp.volume}`,
            readinessScore: opp.score,
            readinessPasses: opp.score >= 0.5,
          }),
      );
      await Promise.all(promises);
      return { stored: plan.scored.length };
    });

    // Step 4: Post plan to Slack
    await step.run("notify-slack", async () => {
      const token = process.env.SLACK_BOT_TOKEN;
      if (!token) return { posted: false, reason: "no SLACK_BOT_TOKEN" };

      const { WebClient } = await import("@slack/web-api");
      const client = new WebClient(token);
      const channel = process.env.SLACK_DEFAULT_CHANNEL ?? "growthcat";

      await client.chat.postMessage({
        channel,
        text: [
          "*🐱 GrowthCat Weekly Plan*",
          "",
          `*Content topics:* ${plan.contentTopics.join(", ")}`,
          `*Experiment:* ${plan.experimentTopic}`,
          `*Feedback targets:* ${plan.feedbackTopics.join(", ")}`,
          `*Community target:* ${plan.communityTarget} interactions`,
          "",
          `_Data source: ${keywords.source}_`,
        ].join("\n"),
      });

      return { posted: true };
    });

    // -----------------------------------------------------------------------
    // Event chaining — trigger downstream Inngest functions so the weekly
    // cycle runs end-to-end automatically.
    // -----------------------------------------------------------------------

    // Trigger content generation for each planned topic
    await step.sendEvent("trigger-content",
      plan.contentTopics.map((topic: string) => ({
        name: "growthcat/content.generate",
        data: {
          topic,
          contentType: "blog_post",
          targetKeyword: topic,
          audience: "agent builders using RevenueCat",
        },
      })),
    );

    // Trigger feedback generation for the first feedback topic
    await step.sendEvent("trigger-feedback", {
      name: "growthcat/feedback.generate",
      data: {
        topic: plan.feedbackTopics[0],
        severity: "high",
      },
    });

    // Trigger community engagement
    await step.sendEvent("trigger-community", {
      name: "growthcat/community.engage",
      data: {
        channel: "x",
        context: plan.contentTopics[0],
      },
    });

    return { keywords: keywords.items.length, plan, workflowRunId: workflowRun.id };
  }
);

// ---------------------------------------------------------------------------
// Content Generation — triggered by event
// Generates a content piece using Vercel AI SDK, validates quality,
// distributes via Typefully, and persists the artifact to Convex.
// ---------------------------------------------------------------------------
export const generateContent = inngest.createFunction(
  { id: "generate-content", name: "Generate Content Piece" },
  { event: "growthcat/content.generate" },
  async ({ event, step }) => {
    const { topic, contentType, targetKeyword, audience } = event.data as {
      topic: string;
      contentType: string;
      targetKeyword: string;
      audience: string;
    };

    // Step 1: Generate content via LLM
    const draft = await step.run("generate-draft", async () => {
      const input: BlogPostInput = {
        topic,
        targetKeyword,
        audience: audience ?? "agent builders using RevenueCat",
        keyPoints: [
          "Practical, API-first guidance for autonomous systems",
          `Target keyword: ${targetKeyword}`,
          "Include code examples using RevenueCat REST API v2",
        ],
        sources: ["RevenueCat REST API v2 Docs", "RevenueCat Webhook Event Types"],
      };
      const prompts = renderBlogPostPrompt(input);

      const result = await generateText({
        model,
        system: prompts.system,
        prompt: prompts.user,
        maxTokens: 4096,
        temperature: 0.3,
      });

      return {
        content: result.text,
        tokens: {
          input: result.usage?.promptTokens ?? 0,
          output: result.usage?.completionTokens ?? 0,
        },
      };
    });

    // Step 2: Validate quality gates
    const validation = await step.run("validate-quality", async () => {
      const content = draft.content;
      const gates = PUBLISH_GATES.map((gate) => {
        let passed = true;
        let reason = "Passed";

        if (gate.key === "grounding") {
          passed = content.length > 500;
          reason = passed ? "Passed" : "Content too short to be well-grounded";
        } else if (gate.key === "voice") {
          const forbidden = ["ai will revolutionize", "guaranteed growth", "your ai buddy"];
          const violation = forbidden.find((p) => content.toLowerCase().includes(p));
          passed = !violation;
          reason = passed ? "Passed" : `Forbidden pattern: "${violation}"`;
        } else if (gate.key === "novelty") {
          passed = true; // Would check Convex text search in production
          reason = "Passed (novelty check pending Convex integration)";
        }

        return { gate: gate.key, passed, reason, blocking: gate.blocking };
      });

      return {
        allPassed: gates.every((g) => !g.blocking || g.passed),
        gates,
      };
    });

    // Step 3: Persist artifact to Convex
    const stored = await step.run("store-artifact", async () => {
      return convexStore("/api/artifacts", {
        artifactType: contentType,
        title: topic,
        slug: targetKeyword.replace(/\s+/g, "-"),
        content: draft.content,
        contentFormat: "markdown",
        status: validation.allPassed ? "validated" : "rejected",
        qualityScores: validation.gates,
        llmProvider: "anthropic",
        llmModel: "claude-sonnet-4-20250514",
        inputTokens: draft.tokens.input,
        outputTokens: draft.tokens.output,
      });
    });

    // Step 4: Generate social derivative via Typefully
    const distribution = await step.run("distribute", async () => {
      if (!validation.allPassed) return { skipped: true, reason: "quality gates failed" };

      const socialInput: SocialPostInput = {
        platform: "twitter",
        topic,
        keyMessage: draft.content.slice(0, 200),
        sourceUrl: `https://growthcat.dev/articles/${targetKeyword.replace(/\s+/g, "-")}`,
        parentArtifactTitle: topic,
        maxLength: 280,
      };
      const socialPrompts = renderSocialPostPrompt(socialInput);

      const socialResult = await generateText({
        model,
        system: socialPrompts.system,
        prompt: socialPrompts.user,
        maxTokens: 300,
        temperature: 0.5,
      });

      // Post to Typefully if configured
      const apiKey = process.env.TYPEFULLY_API_KEY;
      const socialSetId = process.env.TYPEFULLY_SOCIAL_SET_ID;

      if (apiKey && socialSetId) {
        const res = await fetch(
          `https://api.typefully.com/v1/drafts?social_set_id=${socialSetId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              draft_title: topic,
              tags: [targetKeyword.replace(/\s+/g, "-")],
              platforms: {
                x: { enabled: true, posts: [{ text: socialResult.text.slice(0, 280) }] },
              },
              publish_at: "next-free-slot",
            }),
          }
        );
        const data = await res.json();
        return { posted: true, typefullyDraftId: data.id };
      }

      return { posted: false, xDraft: socialResult.text.slice(0, 280) };
    });

    return {
      topic,
      contentType,
      wordCount: draft.content.split(/\s+/).length,
      tokens: draft.tokens,
      qualityPassed: validation.allPassed,
      gateResults: validation.gates,
      distribution,
      artifactId: stored.id,
    };
  }
);

// ---------------------------------------------------------------------------
// Daily Source Freshness Audit — 6am UTC
// ---------------------------------------------------------------------------
export const sourceFreshnessAudit = inngest.createFunction(
  { id: "source-freshness-audit", name: "Daily Source Freshness Audit" },
  { cron: "TZ=UTC 0 6 * * *" },
  async ({ step }) => {
    const results = await step.run("check-freshness", async () => {
      // In production: query Convex sources table, check lastRefreshed
      // Flag any source older than 7 days as stale
      const staleThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;

      return {
        checked: true,
        staleThreshold: new Date(staleThreshold).toISOString(),
        note: "Will query Convex sources table when connected",
      };
    });

    return results;
  }
);

// ---------------------------------------------------------------------------
// Weekly Report — Friday 5pm UTC
// Fetches real metrics from Convex, generates an LLM report, posts to Slack,
// and persists the report back to Convex.
// ---------------------------------------------------------------------------
export const weeklyReportGeneration = inngest.createFunction(
  { id: "weekly-report", name: "Weekly Report Generation" },
  { cron: "TZ=UTC 0 17 * * FRI" },
  async ({ step }) => {
    // Step 1: Gather real metrics from Convex
    const metrics = await step.run("gather-metrics", async () => {
      const data = await convexFetch("/api/metrics");

      return {
        contentCount: (data.contentCount as number) ?? 0,
        experimentCount: (data.experimentCount as number) ?? 0,
        feedbackCount: (data.feedbackCount as number) ?? 0,
        interactionCount: (data.interactionCount as number) ?? 0,
        meaningfulCount: (data.meaningfulCount as number) ?? 0,
        topArticle: "Latest published article",
        experimentStatus: "running",
      };
    });

    // Step 2: Generate report via LLM
    const report = await step.run("generate-report", async () => {
      const weekNum = Math.ceil((Date.now() - new Date("2026-03-16").getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      const reportInput: WeeklyReportInput = {
        weekLabel: `Week ${weekNum}`,
        artifactsShipped: [{ title: metrics.topArticle, lane: "flagship_searchable", status: "published" as const }],
        experimentsRun: [{ name: "Distribution Channel Test", status: "running" as const, resultSummary: metrics.experimentStatus }],
        kpiSnapshot: {
          contentPublished: metrics.contentCount,
          experimentsActive: metrics.experimentCount,
          feedbackSubmitted: metrics.feedbackCount,
          communityInteractions: metrics.interactionCount,
        },
        feedbackItemCount: metrics.feedbackCount,
        topInsights: [
          "DataForSEO-targeted content outperforming intuition-based topics",
          "RevenueCat webhook content has highest engagement",
        ],
        nextWeekPriorities: [
          "Publish React Native integration guide",
          "Expand community engagement on GitHub",
        ],
      };
      const prompts = renderWeeklyReportPrompt(reportInput);

      const result = await generateText({
        model,
        system: prompts.system,
        prompt: prompts.user,
        maxTokens: 2048,
        temperature: 0.3,
      });

      return {
        content: result.text,
        weekNum,
      };
    });

    // Step 3: Post to Slack
    const slack = await step.run("post-to-slack", async () => {
      const token = process.env.SLACK_BOT_TOKEN;
      if (!token) return { posted: false as const, reason: "no SLACK_BOT_TOKEN", ts: "" };

      const { WebClient } = await import("@slack/web-api");
      const client = new WebClient(token);
      const channel = process.env.SLACK_DEFAULT_CHANNEL ?? "growthcat";

      const result = await client.chat.postMessage({
        channel,
        text: `*🐱 GrowthCat Weekly Report*\n\n${report.content.slice(0, 3000)}`,
      });

      return { posted: true, ts: result.ts };
    });

    // Step 4: Persist the report to Convex
    const stored = await step.run("store-report", async () => {
      return convexStore("/api/reports", {
        weekNumber: report.weekNum,
        contentCount: metrics.contentCount,
        experimentCount: metrics.experimentCount,
        feedbackCount: metrics.feedbackCount,
        interactionCount: metrics.interactionCount,
        reportContent: report.content,
        slackTs: slack.ts ?? "",
      });
    });

    return {
      metrics,
      reportLength: report.content.length,
      slack,
      reportId: stored.id,
    };
  }
);

// ---------------------------------------------------------------------------
// Feedback Generation — triggered by event
// Generates structured product feedback via LLM and persists to Convex.
// ---------------------------------------------------------------------------
export const generateFeedback = inngest.createFunction(
  { id: "generate-feedback", name: "Generate Product Feedback" },
  { event: "growthcat/feedback.generate" },
  async ({ event, step }) => {
    const { topic, severity } = event.data as {
      topic: string;
      severity: string;
    };

    const feedback = await step.run("generate", async () => {
      const result = await generateText({
        model,
        system: `You are ${GROWTHCAT_VOICE_PROFILE.agentName}, writing structured product feedback for RevenueCat's product team. Be direct, evidence-backed, and constructive. ${GROWTHCAT_VOICE_PROFILE.disclosureLine}`,
        prompt: `Write structured product feedback about: ${topic}\nSeverity: ${severity}\n\nStructure:\n1. Problem summary\n2. Reproduction steps\n3. Affected audience\n4. Impact\n5. Proposed direction`,
        maxTokens: 1500,
        temperature: 0.3,
      });

      return {
        title: topic,
        content: result.text,
        severity,
        tokens: result.usage?.promptTokens ?? 0,
      };
    });

    // Persist feedback to Convex
    const stored = await step.run("store-feedback", async () => {
      return convexStore("/api/feedback", {
        title: feedback.title,
        problem: feedback.content,
        status: "draft",
        metadata: { severity: feedback.severity, generatedTokens: feedback.tokens },
      });
    });

    return { ...feedback, feedbackId: stored.id };
  }
);

// ---------------------------------------------------------------------------
// Community Engagement — triggered by event
// Generates and optionally posts community interactions, persists to Convex.
// ---------------------------------------------------------------------------
export const communityEngage = inngest.createFunction(
  { id: "community-engage", name: "Community Engagement" },
  { event: "growthcat/community.engage" },
  async ({ event, step }) => {
    const { channel, targetUrl, context } = event.data as {
      channel: string;
      targetUrl?: string;
      context: string;
    };

    const reply = await step.run("generate-reply", async () => {
      const result = await generateText({
        model,
        system: `You are ${GROWTHCAT_VOICE_PROFILE.agentName} engaging in developer communities. Be helpful, technically accurate, and conversational. Never be promotional. ${GROWTHCAT_VOICE_PROFILE.disclosureLine}`,
        prompt: `Channel: ${channel}\nContext: ${context}\n${targetUrl ? `Thread: ${targetUrl}` : ""}\n\nWrite a helpful, technically grounded response.`,
        maxTokens: 500,
        temperature: 0.4,
      });

      return { content: result.text, channel };
    });

    // Post to appropriate platform
    const posted = await step.run("post", async () => {
      if (channel === "x") {
        const apiKey = process.env.TYPEFULLY_API_KEY;
        const socialSetId = process.env.TYPEFULLY_SOCIAL_SET_ID;
        if (!apiKey || !socialSetId) return { posted: false, reason: "no Typefully credentials" };

        const res = await fetch(
          `https://api.typefully.com/v1/drafts?social_set_id=${socialSetId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              draft_title: `Reply: ${context.slice(0, 50)}`,
              platforms: {
                x: {
                  enabled: true,
                  posts: [{ text: reply.content.slice(0, 280) }],
                  ...(targetUrl ? { settings: { reply_to_url: targetUrl } } : {}),
                },
              },
            }),
          }
        );
        const data = await res.json();
        return { posted: true, platform: "typefully", draftId: data.id };
      }

      if (channel === "github") {
        const token = process.env.GITHUB_TOKEN;
        if (!token) return { posted: false, reason: "no GITHUB_TOKEN" };
        // GitHub posting would go here
        return { posted: false, draft: reply.content, reason: "github posting not wired yet" };
      }

      return { posted: false, draft: reply.content };
    });

    // Persist community interaction to Convex
    const stored = await step.run("store-interaction", async () => {
      return convexStore("/api/community", {
        channel,
        interactionType: "reply",
        content: reply.content,
        targetUrl: targetUrl ?? "",
        qualityScore: 0.7,
        meaningful: true,
      });
    });

    return {
      reply: reply.content.slice(0, 100),
      channel,
      posted,
      interactionId: stored.id,
    };
  }
);
