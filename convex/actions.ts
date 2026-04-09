"use node";

/**
 * Convex Actions (Node.js runtime) — for external API calls.
 * Mutations/queries are in mutations.ts (default runtime).
 */

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { RC_DOC_URLS, processPage } from "./crawler";
import { WebClient } from "@slack/web-api";
import { z } from "zod";
import {
  getDataForSeoConnectorConfig,
  getGitHubConnectorConfig,
  getSlackConnectorConfig,
  getTwitterConnectorConfig,
  getTypefullyConnectorConfig,
} from "./runtimeConnectors";
import { fetchKnowledgeContext } from "./knowledge";
import { AI_MODEL_IDS, runStructuredTask, runTextTask } from "../lib/ai/runtime";

async function getRuntimeState(ctx: any) {
  return await ctx.runQuery((api.agentConfig as any).getRuntimeState, {});
}

async function logUsageEvent(ctx: any, event: {
  feature: string;
  workflowType?: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedUsd: number;
  latencyMs?: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}) {
  await ctx.runMutation(internal.usageEvents.recordInternal, event);
}

// ---------------------------------------------------------------------------
// DataForSEO
// ---------------------------------------------------------------------------

export const fetchKeywords = internalAction({
  args: { seeds: v.array(v.string()) },
  handler: async (ctx, { seeds }) => {
    const { login, password } = await getDataForSeoConnectorConfig(ctx);

    if (!login || !password) {
      return seeds.map((kw) => ({
        keyword: kw,
        difficulty: Math.floor(Math.random() * 30) + 5,
        volume: Math.floor(Math.random() * 400) + 100,
      }));
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
          { keywords: seeds, location_code: 2840, language_code: "en", limit: 20 },
        ]),
      }
    );

    const data = await res.json();
    const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
    return items.slice(0, 10).map((item: Record<string, unknown>) => ({
      keyword: item.keyword as string,
      difficulty: (item.keyword_properties as Record<string, unknown>)?.keyword_difficulty as number ?? 50,
      volume: (item.keyword_info as Record<string, unknown>)?.search_volume as number ?? 0,
    }));
  },
});

export const fetchSerpBaseline = internalAction({
  args: { keyword: v.string() },
  handler: async (ctx, { keyword }) => {
    const { login, password } = await getDataForSeoConnectorConfig(ctx);

    if (!login || !password) {
      // Return sample data when no credentials
      return {
        keyword,
        serpPosition: null as number | null,
        difficulty: Math.floor(Math.random() * 30) + 5,
        volume: Math.floor(Math.random() * 400) + 100,
        topResults: [] as string[],
      };
    }

    // Fetch SERP snapshot
    const serpRes = await fetch(
      "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${login}:${password}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{
          keyword,
          location_code: 2840,
          language_code: "en",
          depth: 20,
        }]),
      }
    );
    const serpData = await serpRes.json();
    const items = serpData.tasks?.[0]?.result?.[0]?.items ?? [];

    // Find our domain in results
    const ourDomain = "ai-growth-agent";
    const ourResult = items.find((item: any) =>
      (item.url ?? "").includes(ourDomain)
    );

    // Get top 5 results
    const topResults = items
      .filter((item: any) => item.type === "organic")
      .slice(0, 5)
      .map((item: any) => `${item.rank_absolute}. ${item.title} — ${item.domain}`);

    // Fetch keyword difficulty
    const kwRes = await fetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${login}:${password}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{
          keywords: [keyword],
          location_code: 2840,
          language_code: "en",
          limit: 1,
        }]),
      }
    );
    const kwData = await kwRes.json();
    const kwItem = kwData.tasks?.[0]?.result?.[0]?.items?.[0];

    return {
      keyword,
      serpPosition: ourResult ? (ourResult.rank_absolute as number) : null,
      difficulty: (kwItem?.keyword_properties?.keyword_difficulty as number) ?? 50,
      volume: (kwItem?.keyword_info?.search_volume as number) ?? 0,
      topResults,
    };
  },
});

// ---------------------------------------------------------------------------
// Content Generation (LLM)
// ---------------------------------------------------------------------------

export const searchKnowledgeForContent = internalAction({
  args: { query: v.string() },
  handler: async (ctx, { query }): Promise<string> => {
    const { context } = await fetchKnowledgeContext(ctx as any, query, { includeHeading: false });
    return context ?? "";
  },
});

// Content type prompts — derived from lib/content/prompts/ templates
const CONTENT_TYPE_PROMPTS: Record<string, { systemSuffix: string; userPrompt: (topic: string, keyword: string) => string }> = {
  blog_post: {
    systemSuffix: "",
    userPrompt: (topic, keyword) =>
      `Write a technical blog post about: ${topic}\n\nTarget keyword: ${keyword}\nAudience: agent builders using RevenueCat\n\nRequirements:\n- Include TypeScript code examples using RevenueCat REST API v2\n- Ground all claims in specific API endpoints\n- 1200-1800 words`,
  },
  comparison: {
    systemSuffix: "\nComparison pieces must include a feature comparison table with clear columns, pros and cons for each option, and a verdict section with a recommendation.",
    userPrompt: (topic, keyword) =>
      `Write a comparison piece about: ${topic}\n\nTarget keyword: ${keyword}\nAudience: agent builders evaluating options\n\nRequirements:\n- Feature comparison table\n- Pros and cons for each option\n- Code examples showing key API differences\n- Clear verdict with recommendation\n- 1200-1800 words`,
  },
  api_guide: {
    systemSuffix: "\nAPI guides must show complete request/response examples with authentication, error handling, pagination, and rate limit considerations.",
    userPrompt: (topic, keyword) =>
      `Write an API reference guide about: ${topic}\n\nTarget keyword: ${keyword}\nAudience: agent builders integrating RevenueCat programmatically\n\nRequirements:\n- Complete request/response examples with curl and TypeScript\n- Authentication setup\n- Error handling patterns\n- Pagination and rate limits\n- 1200-1800 words`,
  },
  integration_guide: {
    systemSuffix: "\nIntegration guides must be step-by-step with numbered setup instructions, configuration files, and a working test at the end.",
    userPrompt: (topic, keyword) =>
      `Write a step-by-step integration guide about: ${topic}\n\nTarget keyword: ${keyword}\nAudience: agent builders setting up RevenueCat\n\nRequirements:\n- Numbered setup steps\n- Configuration file examples\n- Testing and verification section\n- Common pitfalls section\n- 1200-1800 words`,
  },
  faq_hub: {
    systemSuffix: "\nFAQ hubs must use H2 for each question, give a direct 2-3 sentence answer immediately, include code examples where applicable, and link to relevant docs.",
    userPrompt: (topic, keyword) =>
      `Write a comprehensive FAQ page about: ${topic}\n\nTarget keyword: ${keyword}\nAudience: agent builders using RevenueCat\n\nRequirements:\n- 8-12 questions as H2 headings\n- Direct 2-3 sentence answer after each question\n- Code examples where applicable\n- Prioritize questions agents would ask\n- 1200-1800 words`,
  },
};

export const generateContent = internalAction({
  args: {
    topic: v.string(),
    targetKeyword: v.string(),
    ragContext: v.optional(v.string()),
    artifactType: v.optional(v.string()),
  },
  handler: async (ctx, { topic, targetKeyword, ragContext, artifactType }): Promise<{ content: string; artifactId: string }> => {
    const runtime = await getRuntimeState(ctx);
    if (!runtime.isActive) {
      return { content: "", artifactId: "" };
    }
    const contentType = artifactType ?? "blog_post";
    const typePrompt = CONTENT_TYPE_PROMPTS[contentType] ?? CONTENT_TYPE_PROMPTS.blog_post;

    // Structured system prompt with voice profile, AEO, and citation requirements
    const baseSystem = `You are GrowthRat: An autonomous developer-advocacy and growth agent for agent-built apps.

Voice: technical, structured, evidence-backed, curious, direct
Forbidden: generic AI futurism without product specifics; unsupported growth claims; mascot-like self-description; implying RevenueCat endorsement before hire; excessive exclamation marks
Disclosure (include at the end of every artifact): GrowthRat is an independent agent applying to RevenueCat, not a RevenueCat-owned property.

Output: Markdown with front-matter (title, description, tags).
Every factual claim must cite a source from the retrieved documentation.

AI search optimization:
- Start with TL;DR (2-3 sentences answering the core question directly)
- Include "Key Takeaways" bulleted list after intro
- Use numbered steps for procedural content
- Include FAQ section (3-5 common questions with direct answers)
- Use comparison tables where applicable
- Name specific API endpoints, SDK methods, webhook events${typePrompt.systemSuffix}`;

    const system = ragContext
      ? `${baseSystem}\n\n## RETRIEVED REVENUECAT DOCUMENTATION\n\n${ragContext}\n\nUse the above documentation to ground your response. Cite specific endpoints, SDK methods, and webhook events.`
      : baseSystem;

    const result = await runTextTask({
      feature: "content_generation",
      workflowType: "content_pipeline",
      taskClass: "generation",
      system,
      prompt: typePrompt.userPrompt(topic, targetKeyword),
      logUsage: (event) => logUsageEvent(ctx, event),
      maxOutputTokens: 4096,
      temperature: 0.3,
    });

    const artifactId = await ctx.runMutation(internal.mutations.createArtifact, {
      artifactType: contentType,
      title: topic,
      slug: targetKeyword.replace(/\s+/g, "-"),
      content: result.text,
      contentFormat: "markdown",
      status: "draft",
      metadata: {
        origin: "pipeline",
        activationState: "activated",
        infrastructure: "growthrat",
      },
      llmProvider: "anthropic",
      llmModel: AI_MODEL_IDS.generation,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    });

    return { content: result.text, artifactId };
  },
});

// ---------------------------------------------------------------------------
// Task Decomposition (Stage 2: Take-Home)
// ---------------------------------------------------------------------------

export const decomposeTask = internalAction({
  args: { taskPrompt: v.string(), deadline: v.string() },
  handler: async (_ctx, { taskPrompt, deadline }) => {
    const runtime = await getRuntimeState(_ctx);
    if (!runtime.isActive) {
      return {
        contentTasks: [],
        growthStrategy: null,
        reasoning: "Agent is dormant; task decomposition is disabled until interview-proof or RC-live mode is enabled.",
      };
    }
    const taskSchema = z.object({
      contentTasks: z.array(
        z.object({
          topic: z.string(),
          keyword: z.string(),
        }),
      ),
      growthStrategy: z.object({
        topic: z.string(),
        keyword: z.string(),
      }).nullable(),
      reasoning: z.string(),
    });

    try {
      const result = await runStructuredTask({
        feature: "task_decomposition",
        workflowType: "take_home",
        taskClass: "reasoning",
        enableThinking: true,
        logUsage: (event) => logUsageEvent(_ctx, event),
        schema: taskSchema,
        system: `You are GrowthRat's task planner. Given a task prompt, decompose it into concrete subtasks. Output valid JSON only, no markdown.`,
        prompt: `Task: ${taskPrompt}\nDeadline: ${deadline}\n\nDecompose into subtasks. Return JSON:\n{"contentTasks": [{"topic": "...", "keyword": "..."}], "growthStrategy": {"topic": "...", "keyword": "..."} | null, "reasoning": "..."}`,
        maxOutputTokens: 1000,
      });
      const parsed = result.object as z.infer<typeof taskSchema>;
      return {
        contentTasks: parsed.contentTasks ?? [],
        growthStrategy: parsed.growthStrategy ?? null,
        reasoning: parsed.reasoning ?? "",
      };
    } catch {
      // Fallback: single content task from the prompt
      return {
        contentTasks: [{ topic: taskPrompt, keyword: taskPrompt.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().split(" ").slice(0, 4).join(" ") }],
        growthStrategy: null,
        reasoning: "Failed to parse LLM decomposition, using prompt as single task.",
      };
    }
  },
});

// ---------------------------------------------------------------------------
// Quality Validation
// ---------------------------------------------------------------------------

export const validateQuality = internalAction({
  args: {
    content: v.string(),
    artifactId: v.id("artifacts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, { content, artifactId, slug }): Promise<{ allPassed: boolean; gates: Array<{ key: string; passed: boolean; reason: string }> }> => {
    const lower = content.toLowerCase();

    // -- Blocking gates (fail these = content rejected) --

    // grounding: minimum content length
    const groundingPassed: boolean = content.length > 500;

    // novelty: check for duplicate slug (different artifact)
    let noveltyPassed = true;
    let noveltyReason = "Passed";
    if (slug) {
      const existing = await ctx.runQuery(internal.agentQueries.getArtifactBySlug, { slug });
      if (existing && existing.status === "published") {
        const self = await ctx.runQuery(internal.agentQueries.getArtifactById, { id: artifactId });
        if (self && self.slug !== slug) {
          noveltyPassed = false;
          noveltyReason = `Slug "${slug}" already exists as published artifact`;
        }
      }
    }

    // technical: must have code blocks AND API references
    const hasCodeBlocks: boolean = content.includes("```") || content.includes("<code>");
    const hasApiRef: boolean = ["/v2/", "revenuecat", "rest api", "api.revenuecat", "sdk"].some((t) => lower.includes(t));
    const technicalPassed: boolean = hasCodeBlocks && hasApiRef;

    // seo: H2 headings, keyword presence, minimum length
    const hasH2: boolean = content.includes("## ");
    const slugKeyword: string = slug ? slug.replace(/-/g, " ").toLowerCase() : "";
    const hasKeywordEarly: boolean = slug ? lower.slice(0, 300).includes(slugKeyword) : true;
    const longEnough: boolean = content.length > 800;
    const seoPassed: boolean = hasH2 && hasKeywordEarly && longEnough;

    // voice: forbidden patterns check
    const voiceForbidden: string[] = [
      "ai will revolutionize", "guaranteed growth", "game-changing",
      "revolutionary", "unleash the power", "sky is the limit",
    ];
    // Ignore code fences when checking tone. Exclamation marks inside examples
    // should not fail a technical article.
    const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, "");
    const toneSource = contentWithoutCodeBlocks.toLowerCase();
    const hasExcessiveExclamation: boolean = (contentWithoutCodeBlocks.match(/!/g) || []).length > 3;
    const voicePassed: boolean = !voiceForbidden.some((p) => toneSource.includes(p)) && !hasExcessiveExclamation;

    // -- Advisory gates (logged but non-blocking) --
    const hasStructure: boolean = lower.includes("tl;dr") || lower.includes("**tl;dr") || /^\d+\.\s/m.test(content) || /^[-*]\s/m.test(content);
    const hasCitations: boolean = /\[.*?\]/.test(content);
    const hasDataPoints: boolean = /\d+%|\d+\.\d+/.test(content);
    const geoPassed: boolean = hasCitations || hasDataPoints;
    const benchmarkPassed: boolean = ["compared to", " vs ", "better than", "unlike", "whereas", "alternative"].some((p) => lower.includes(p));

    const gates: Array<{ key: string; passed: boolean; reason: string }> = [
      { key: "grounding", passed: groundingPassed, reason: groundingPassed ? "Passed" : `Too short (${content.length} chars, need 500+)` },
      { key: "novelty", passed: noveltyPassed, reason: noveltyReason },
      { key: "technical", passed: technicalPassed, reason: technicalPassed ? "Passed" : `Missing ${!hasCodeBlocks ? "code blocks" : ""}${!hasCodeBlocks && !hasApiRef ? " and " : ""}${!hasApiRef ? "API references" : ""}` },
      { key: "seo", passed: seoPassed, reason: seoPassed ? "Passed" : `Missing ${!hasH2 ? "H2 headings" : ""}${!longEnough ? " sufficient length" : ""}${!hasKeywordEarly ? " keyword in intro" : ""}` },
      { key: "aeo", passed: hasStructure, reason: hasStructure ? "Passed" : "Advisory: missing TL;DR or structured lists" },
      { key: "geo", passed: geoPassed, reason: geoPassed ? "Passed" : "Advisory: missing citations or data points" },
      { key: "benchmark", passed: benchmarkPassed, reason: benchmarkPassed ? "Passed" : "Advisory: no comparison language found" },
      { key: "voice", passed: voicePassed, reason: voicePassed ? "Passed" : `Voice violation: ${hasExcessiveExclamation ? "excessive exclamation marks" : "forbidden pattern detected"}` },
    ];

    // Only blocking gates affect allPassed (aeo, geo, benchmark are advisory)
    const blockingGates = gates.filter((g: { key: string }) => !["aeo", "geo", "benchmark"].includes(g.key));
    const allPassed: boolean = blockingGates.every((g: { passed: boolean }) => g.passed);

    // Log advisory gate failures
    for (const g of gates) {
      if (!g.passed && ["aeo", "geo", "benchmark"].includes(g.key)) {
        console.log(`[quality] Advisory warning — ${g.key}: ${g.reason}`);
      }
    }

    return { allPassed, gates };
  },
});

// ---------------------------------------------------------------------------
// Distribution
// ---------------------------------------------------------------------------

type ConnectionState = "built" | "activated" | "rc-connected";

type PublishCMSResult = {
  published: boolean;
  state: ConnectionState;
  method: string;
  url?: string;
  reason?: string;
};

type ArtifactRecord = {
  title: string;
  content: string;
  slug: string;
  artifactType?: string;
  publishedAt?: number;
  _creationTime: number;
};

async function publishArticleMarkdownToGitHub(args: {
  title: string;
  slug: string;
  content: string;
  token?: string;
  owner?: string;
  repo?: string;
}): Promise<
  | { published: true; state: ConnectionState; method: "github-commit"; url: string; commitSha?: string; reason?: string }
  | { published: false; state: ConnectionState; method: "github-commit"; reason: string }
> {
  const token = args.token ?? process.env.GITHUB_TOKEN;
  const owner = args.owner ?? process.env.GITHUB_OWNER ?? "kirso";
  const repo = args.repo ?? process.env.GITHUB_CONTENT_REPO ?? process.env.GITHUB_REPO ?? "growthcat";

  if (!token) {
    return { published: false, state: "built", method: "github-commit", reason: "no GitHub token" };
  }

  const path = `content/articles/${args.slug}.md`;
  const frontmatter = `---\ntitle: "${args.title}"\ndate: "${new Date().toISOString().split("T")[0]}"\nauthor: GrowthRat\nstatus: published\n---\n\n`;
  const fileContent = frontmatter + args.content;
  const encoded = Buffer.from(fileContent).toString("base64");

  let sha: string | undefined;
  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    );
    if (getRes.ok) {
      const existing = await getRes.json();
      const existingContent = typeof existing.content === "string" && existing.encoding === "base64"
        ? Buffer.from(existing.content.replace(/\n/g, ""), "base64").toString("utf8")
        : null;
      if (existingContent === fileContent) {
        return {
          published: true,
          state: "activated",
          method: "github-commit",
          url: existing.html_url ?? `https://${owner}.github.io/${repo}/articles/${args.slug}`,
          reason: "already up to date",
        };
      }
      sha = existing.sha;
    }
  } catch {
    // File doesn't exist or cannot be read; continue with create/update.
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `publish: ${args.title}`,
        content: encoded,
        ...(sha ? { sha } : {}),
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return { published: false, state: "built", method: "github-commit", reason: err.slice(0, 200) };
  }

  const data = await res.json();
  return {
    published: true,
    state: "activated",
    method: "github-commit",
    url: data.content?.html_url ?? `https://${owner}.github.io/${repo}/articles/${args.slug}`,
    commitSha: data.commit?.sha,
  };
}

export const publishToCMS = internalAction({
  args: { artifactId: v.id("artifacts") },
  handler: async (ctx, { artifactId }): Promise<PublishCMSResult> => {
    const artifact = await ctx.runQuery(internal.agentQueries.getArtifactById, { id: artifactId }) as ArtifactRecord | null;
    if (!artifact) {
      return { published: false, state: "built" as const, method: "convex", reason: "artifact not found" };
    }
    const githubConfig = await getGitHubConnectorConfig(ctx);

    try {
      const { publishArticle } = await import("../lib/cms/publish");
      const description = artifact.content.slice(0, 140).replace(/[#*_`]/g, "").trim() || artifact.title;
      const category =
        artifact.artifactType === "comparison" || artifact.artifactType === "growth_analysis"
          ? "growth"
          : artifact.artifactType === "feedback_report"
            ? "feedback"
            : artifact.artifactType === "weekly_report"
              ? "report"
              : artifact.artifactType === "experiment_brief"
                ? "experiment"
                : "technical";

      const published = await publishArticle({
        slug: artifact.slug,
        title: artifact.title,
        description,
        category,
        content: artifact.content,
        pubDate: new Date(artifact.publishedAt ?? artifact._creationTime).toISOString().split("T")[0],
      });

      if (published.published) {
        return {
          published: true,
          state: published.state,
          method: published.method,
          url: published.url,
          reason: published.reason,
        };
      }
      return await publishArticleMarkdownToGitHub({
        title: artifact.title,
        slug: artifact.slug,
        content: artifact.content,
        token: githubConfig.token,
        owner: githubConfig.owner,
        repo: githubConfig.repo,
      });
    } catch {
      return await publishArticleMarkdownToGitHub({
        title: artifact.title,
        slug: artifact.slug,
        content: artifact.content,
        token: githubConfig.token,
        owner: githubConfig.owner,
        repo: githubConfig.repo,
      });
    }

  },
});

export const distributeViaTypefully = internalAction({
  args: { artifactId: v.id("artifacts"), topic: v.string() },
  handler: async (ctx, { artifactId, topic }): Promise<{ posted: boolean; state: ConnectionState; draftId?: string | null; platforms?: number; reason?: string }> => {
    const runtime = await getRuntimeState(ctx);
    if (!runtime.isActive) {
      return { posted: false, state: "built", reason: "agent dormant" };
    }
    const { apiKey, socialSetId } = await getTypefullyConnectorConfig(ctx);
    if (!apiKey || !socialSetId) {
      console.log("[typefully] No credentials — skipping distribution");
      return { posted: false, state: "built", reason: "no Typefully credentials" };
    }

    // Get the artifact for content
    const artifact: { slug: string } | null = await ctx.runQuery(internal.agentQueries.getArtifactById, { id: artifactId });
    const siteUrl = "https://growthrat.vercel.app";
    const articleUrl: string = artifact ? `${siteUrl}/articles/${artifact.slug}` : siteUrl;

    let xText = `GrowthRat: ${topic} ${articleUrl}`;
    let linkedinText = `GrowthRat published ${topic}. Read it here: ${articleUrl}`;

    try {
      const xPost = await runTextTask({
        feature: "social_distribution_x",
        workflowType: "distribution",
        taskClass: "fast",
        logUsage: (event) => logUsageEvent(ctx, event),
        prompt: `Write a tweet (max 270 chars) promoting: "${topic}"\nArticle URL: ${articleUrl}\nAudience: agent builders using RevenueCat\nStyle: direct, technical, no emojis except one at start. Include the URL.`,
        maxOutputTokens: 100,
      });

      const linkedinPost = await runTextTask({
        feature: "social_distribution_linkedin",
        workflowType: "distribution",
        taskClass: "fast",
        logUsage: (event) => logUsageEvent(ctx, event),
        prompt: `Write a LinkedIn post (max 500 chars) promoting: "${topic}"\nArticle URL: ${articleUrl}\nAudience: developer advocates, growth engineers, mobile devs\nStyle: professional but not corporate. Include the URL.`,
        maxOutputTokens: 200,
      });
      xText = xPost.text.slice(0, 280);
      linkedinText = linkedinPost.text.slice(0, 3000);
    } catch (err) {
      console.log("[typefully] Falling back to template posts:", String(err));
    }

    const res: Response = await fetch(
      `https://api.typefully.com/v1/drafts?social_set_id=${socialSetId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_title: topic,
          tags: [topic.replace(/\s+/g, "-").slice(0, 50)],
          platforms: {
            x: { enabled: true, posts: [{ text: xText }] },
            linkedin: { enabled: true, posts: [{ text: linkedinText }] },
            threads: { enabled: true, posts: [{ text: xText.slice(0, 500) }] },
            bluesky: { enabled: true, posts: [{ text: xText.slice(0, 300) }] },
            mastodon: { enabled: true, posts: [{ text: xText.slice(0, 500) }] },
          },
          publish_at: "next-free-slot",
        }),
      }
    );

    const responseData: { id?: string } | null = res.ok ? await res.json().catch(() => null) : null;
    return { posted: res.ok, state: res.ok ? "activated" : "built", draftId: responseData?.id ?? null, platforms: 5, reason: res.ok ? undefined : "Typefully draft creation failed" };
  },
});

export const distributeViaGitHub = internalAction({
  args: { artifactId: v.id("artifacts"), title: v.string(), slug: v.string(), content: v.string() },
  handler: async (ctx, { title, slug, content }) => {
    const { token, owner, repo } = await getGitHubConnectorConfig(ctx);
    const published = await publishArticleMarkdownToGitHub({ title, slug, content, token, owner, repo });
    if (!published.published) {
      console.error("[github] Failed to commit:", published.reason);
      return { committed: false, state: published.state, reason: published.reason };
    }
    return {
      committed: true,
      state: published.state,
      commitSha: published.commitSha,
      url: published.url,
      reason: published.reason,
    };
  },
});

// ---------------------------------------------------------------------------
// Slack
// ---------------------------------------------------------------------------

export const postToSlack = internalAction({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const { botToken, defaultChannel } = await getSlackConnectorConfig(ctx);
    const token = botToken;
    if (!token) return { posted: false };

    const client = new WebClient(token);
    const channel = defaultChannel ?? "growthrat";

    const result = await client.chat.postMessage({ channel, text });
    return { posted: true, ts: result.ts };
  },
});

// ---------------------------------------------------------------------------
// Experiment Measurement (scheduled 7 days after experiment start)
// ---------------------------------------------------------------------------

export const measureExperiment = internalAction({
  args: { experimentKey: v.string(), targetKeyword: v.string(), contentSlug: v.string() },
  handler: async (ctx, { experimentKey, targetKeyword, contentSlug }) => {
    const runtime = await getRuntimeState(ctx);
    if (!runtime.isActive) {
      console.log("[mode-gate] Experiment measurement skipped — agent not active");
      return;
    }

    // Fetch the experiment record to get the real baseline
    const experiment = await ctx.runQuery(internal.agentQueries.getExperimentByKey, { experimentKey });
    let baselinePosition: number | string = "not ranking";
    if (experiment?.baselineMetric) {
      try {
        const baseline = JSON.parse(experiment.baselineMetric);
        baselinePosition = baseline.serpPosition ?? "not ranking";
      } catch { /* invalid JSON — use default */ }
    }

    // Fetch current SERP data
    const measurement = await ctx.runAction(internal.actions.fetchSerpBaseline, {
      keyword: targetKeyword,
    });

    const measurementPosition = measurement.serpPosition ?? "not ranking";
    const baselineNum = typeof baselinePosition === "number" ? baselinePosition : 999;
    const measurementNum = typeof measurementPosition === "number" ? measurementPosition : 999;
    const delta = baselineNum - measurementNum; // positive = improved (lower position number = better)

    await ctx.runMutation(internal.mutations.completeExperiment, {
      experimentKey,
      results: {
        baselinePosition,
        measurementPosition,
        delta,
        baselineVolume: experiment?.baselineMetric ? JSON.parse(experiment.baselineMetric).volume : null,
        measurementVolume: measurement.volume,
        contentSlug,
        measuredAt: Date.now(),
      },
    });

    // Post results to Slack
    const posLabel = (pos: number | string) => pos === 999 || pos === "not ranking" ? "not ranking" : `#${pos}`;
    await ctx.runAction(internal.actions.postToSlack, {
      text: `*🐭 Experiment Complete: ${targetKeyword}*\n\nBaseline: ${posLabel(baselinePosition)} → Now: ${posLabel(measurementPosition)}\nDelta: ${delta > 0 ? "+" : ""}${delta} positions\nContent: /articles/${contentSlug}`,
    });
  },
});

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export const generateReport = internalAction({
  args: { weekNumber: v.number(), metrics: v.any() },
  handler: async (_ctx, { weekNumber, metrics }) => {
    const runtime = await getRuntimeState(_ctx);
    if (!runtime.isActive) {
      return {
        content: `# Weekly Report - Week ${weekNumber}\n\nGrowthRat is dormant. No autonomous reporting ran this week.`,
      };
    }
    const m = metrics as Record<string, number>;
    const result = await runTextTask({
      feature: "weekly_report_generation",
      workflowType: "weekly_report",
      taskClass: "generation",
      logUsage: (event) => logUsageEvent(_ctx, event),
      prompt: `Write a concise weekly report for Week ${weekNumber}:\n\nContent published: ${m.contentCount}\nExperiments: ${m.experimentCount}\nFeedback filed: ${m.feedbackCount}\nCommunity interactions: ${m.interactionCount} (${m.meaningfulCount} meaningful)\n\nFormat: TL;DR → Content → Growth → Feedback → Community → Next week priorities`,
      maxOutputTokens: 1500,
    });

    return { content: result.text };
  },
});

// ---------------------------------------------------------------------------
// Knowledge Ingestion
// ---------------------------------------------------------------------------

export const ingestKnowledge = internalAction({
  args: {},
  handler: async (ctx) => {
    // RC_DOC_URLS and processPage imported statically at top of file
    let totalChunks = 0;

    for (const page of RC_DOC_URLS) {
      try {
        const chunks = await processPage(page);
        for (const chunk of chunks) {
          await ctx.runMutation(internal.sources.upsertWithEmbedding, {
            key: chunk.key,
            url: chunk.url,
            provider: chunk.provider,
            sourceClass: chunk.sourceClass,
            evidenceTier: chunk.evidenceTier,
            lastRefreshed: Date.now(),
            contentHash: chunk.contentHash,
            summary: chunk.summary,
            embedding: chunk.embedding,
            chunkIndex: chunk.chunkIndex,
            parentKey: chunk.parentKey,
          });
        }
        totalChunks += chunks.length;
      } catch (err) {
        console.error(`Failed to ingest ${page.key}:`, err);
      }
    }

    return { totalChunks };
  },
});

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export const scanGitHubRepos = internalAction({
  args: {},
  handler: async (ctx) => {
    const { token } = await getGitHubConnectorConfig(ctx);
    if (!token) return [];

    const repos = [
      "RevenueCat/purchases-ios",
      "RevenueCat/purchases-android",
      "RevenueCat/purchases-flutter",
      "RevenueCat/purchases-react-native",
      "RevenueCat/purchases-unity",
      "RevenueCat/purchases-capacitor",
      "RevenueCat/purchases-kmp",
      "RevenueCat/revenuecat-docs",
    ];
    const signals: Array<{ channel: string; url: string; context: string }> = [];

    for (const repo of repos) {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${repo}/issues?state=open&sort=created&direction=desc&per_page=5`,
          { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
        );
        if (!res.ok) continue;
        const issues = await res.json();
        for (const issue of issues) {
          const text = `${issue.title} ${issue.body ?? ""}`.toLowerCase();
          if (["agent", "programmatic", "api", "webhook", "automated"].some((kw) => text.includes(kw))) {
            signals.push({ channel: "github", url: issue.html_url, context: `${issue.title}\n\n${(issue.body ?? "").slice(0, 500)}` });
          }
        }
      } catch { /* skip */ }
    }

    return signals;
  },
});

export const scanTwitterMentions = internalAction({
  args: {},
  handler: async (ctx): Promise<Array<{ channel: string; url: string; context: string }>> => {
    const { bearerToken } = await getTwitterConnectorConfig(ctx);
    if (!bearerToken) return [];

    try {
      const query = encodeURIComponent('"revenuecat" (agent OR automated OR programmatic OR webhook OR sdk) -is:retweet');
      const res = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=15&tweet.fields=author_id,created_at`,
        { headers: { Authorization: `Bearer ${bearerToken}` } }
      );
      if (!res.ok) {
        console.log(`[twitter] Search failed: ${res.status}`);
        return [];
      }
      const data = await res.json();
      if (!data.data || !Array.isArray(data.data)) return [];

      return data.data.map((tweet: { id: string; text: string; author_id: string }) => ({
        channel: "x",
        url: `https://twitter.com/i/status/${tweet.id}`,
        context: tweet.text.slice(0, 500),
      }));
    } catch {
      console.log("[twitter] Search error");
      return [];
    }
  },
});

export const engageCommunity = internalAction({
  args: { channel: v.string(), context: v.string(), targetUrl: v.string() },
  handler: async (ctx, { channel, context, targetUrl }): Promise<{ replied: boolean; state: ConnectionState; reason?: string }> => {
    const runtime = await getRuntimeState(ctx);
    if (!runtime.isActive) {
      return { replied: false, state: "built", reason: "agent dormant" };
    }
    const reply = await runTextTask({
      feature: "community_reply_generation",
      workflowType: "community",
      taskClass: "fast",
      logUsage: (event) => logUsageEvent(ctx, event),
      system: "You are GrowthRat, an autonomous developer advocate for RevenueCat. Be helpful, technically accurate, and conversational.",
      prompt: `Channel: ${channel}\nContext: ${context}\n\nWrite a helpful, technically grounded response.`,
      maxOutputTokens: 500,
    });

    await ctx.runMutation(internal.mutations.recordInteraction, {
      channel,
      content: reply.text,
      targetUrl,
    });

    const config = await ctx.runQuery(internal.slackCommandQueries.getAgentConfig, {});

    if (config?.reviewMode === "draft_only") {
      return { replied: true, state: "built", reason: "draft_only review mode" };
    }

    // Post to external platform (GitHub comments)
    if (channel === "github" && targetUrl.includes("github.com")) {
      const { token } = await getGitHubConnectorConfig(ctx);
      if (token && reply.text.length > 20) {
        const match = targetUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
        if (match) {
          const [, owner, repo, issueNum] = match;
          try {
            await fetch(
              `https://api.github.com/repos/${owner}/${repo}/issues/${issueNum}/comments`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/vnd.github+json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  body: reply.text + "\n\n---\n_Reply by [GrowthRat](https://growthrat.vercel.app) — autonomous developer advocate agent._",
                }),
              }
            );
            return { replied: true, state: "activated" };
          } catch {
            console.log("[community] GitHub comment posting failed for:", targetUrl);
          }
        }
      }
    }

    if (channel === "x") {
      const creds = await getTwitterConnectorConfig(ctx);

      const tweetMatch = targetUrl.match(/(?:twitter\.com|x\.com)\/(?:i\/status\/|[^/]+\/status\/)(\d+)/);
      if (!tweetMatch) {
        return { replied: true, state: "built", reason: "could not parse tweet id" };
      }

      if (!creds.apiKey || !creds.apiKeySecret || !creds.accessToken || !creds.accessTokenSecret) {
        return { replied: true, state: "built", reason: "no X credentials" };
      }

      try {
        const { reply: replyTweet } = await import("../lib/connectors/twitter");
        await replyTweet({
          apiKey: creds.apiKey,
          apiKeySecret: creds.apiKeySecret,
          accessToken: creds.accessToken,
          accessTokenSecret: creds.accessTokenSecret,
        }, tweetMatch[1], reply.text);
        return { replied: true, state: "activated" };
      } catch (err) {
        console.log("[community] X reply failed:", err);
        return { replied: true, state: "built", reason: "X reply failed" };
      }
    }

    return { replied: true, state: channel === "github" ? "activated" : "built" };
  },
});

// Workflow starters that need to be actions (called from other actions)
export const startContentWorkflow = internalAction({
  args: { topic: v.string(), targetKeyword: v.string(), weekNumber: v.number(), artifactType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.mutations.startContentGen, {
      topic: args.topic,
      targetKeyword: args.targetKeyword,
      artifactType: args.artifactType,
    });
  },
});

export const startExperimentWorkflow = internalAction({
  args: {
    experimentKey: v.string(),
    hypothesis: v.string(),
    targetKeyword: v.string(),
    contentSlug: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.mutations.startExperimentRunner, args);
  },
});

export const startFeedbackWorkflow = internalAction({
  args: { topics: v.array(v.string()) },
  handler: async (ctx, { topics }): Promise<{ triggered: boolean; count: number }> => {
    for (const topic of topics) {
      await ctx.runAction(internal.actions.generateFeedback, { topic, severity: "high" });
    }
    return { triggered: true, count: topics.length };
  },
});

// ---------------------------------------------------------------------------
// Feedback Generation
// ---------------------------------------------------------------------------

export const generateFeedback = internalAction({
  args: { topic: v.string(), severity: v.string() },
  handler: async (ctx, { topic, severity }) => {
    const runtime = await getRuntimeState(ctx);
    if (!runtime.isActive) {
      return { feedbackId: null, issueUrl: "" };
    }
    const result = await runTextTask({
      feature: "feedback_generation",
      workflowType: "feedback",
      taskClass: "reasoning",
      enableThinking: true,
      logUsage: (event) => logUsageEvent(ctx, event),
      system: "You are GrowthRat, writing structured product feedback for RevenueCat's product team. Be direct, evidence-backed, and constructive. GrowthRat is an independent agent, not a RevenueCat-owned property.",
      prompt: `Write structured product feedback about: ${topic}\nSeverity: ${severity}\n\nStructure:\n1. Problem summary\n2. Reproduction steps\n3. Affected audience\n4. Impact\n5. Proposed direction`,
      maxOutputTokens: 1500,
    });

    // Store in Convex
    const feedbackId = await ctx.runMutation(internal.mutations.createFeedbackItem, {
      title: topic,
      problem: result.text,
      status: "draft",
      metadata: { severity, generatedTokens: result.usage?.outputTokens ?? 0 },
    });

    // File as GitHub Issue
    const { token, owner, repo } = await getGitHubConnectorConfig(ctx);
    let issueUrl = "";

    if (token && owner && repo) {
      try {
        const issueRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: `[Feedback] ${topic}`,
              body: `## Product Feedback: ${topic}\n\nSeverity: ${severity}\n\n${result.text}\n\n---\n_Filed by GrowthRat autonomous feedback pipeline._`,
            }),
          }
        );
        if (issueRes.ok) {
          const issueData = await issueRes.json();
          issueUrl = issueData.html_url;

          // Persist GitHub issue URL back to the feedback item
          await ctx.runMutation(internal.mutations.updateFeedbackMetadata, {
            id: feedbackId,
            metadata: { severity, generatedTokens: result.usage?.outputTokens ?? 0, githubIssueUrl: issueUrl },
            status: "filed",
          });
        }
      } catch {
        // GitHub Issue filing failed — continue without it
      }
    }

    return { title: topic, length: result.text.length, issueUrl };
  },
});

// ---------------------------------------------------------------------------
// Test: Ingest a single page (for debugging)
// ---------------------------------------------------------------------------

export const testIngestOnePage = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      const page = RC_DOC_URLS[0]; // Just the first page
      console.log("Starting ingestion for:", page.key, page.url);
      
      const chunks = await processPage(page);
      console.log("Got chunks:", chunks.length);
      
      for (const chunk of chunks.slice(0, 3)) { // Only first 3 chunks
        await ctx.runMutation(internal.sources.upsertWithEmbedding, {
          key: chunk.key,
          url: chunk.url,
          provider: chunk.provider,
          sourceClass: chunk.sourceClass,
          evidenceTier: chunk.evidenceTier,
          lastRefreshed: Date.now(),
          contentHash: chunk.contentHash,
          summary: chunk.summary,
          embedding: chunk.embedding,
          chunkIndex: chunk.chunkIndex,
          parentKey: chunk.parentKey,
        });
        console.log("Stored chunk:", chunk.key);
      }
      
      return { success: true, chunks: Math.min(chunks.length, 3) };
    } catch (err) {
      console.error("Ingestion error:", err);
      return { success: false, error: String(err) };
    }
  },
});

/** Step-by-step test of ingestion (Node.js runtime — more memory) */
export const testIngestStep = internalAction({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];
    
    try {
      // Step 1: Fetch (smaller page)
      const res = await fetch("https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields");
      const html = await res.text();
      results.push("1. Fetch OK: " + html.length + " chars");
      
      // Step 2: Simple text extraction (avoid regex memory blow-up)
      let text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 10000); // Limit to 10K chars
      results.push("2. Extract OK: " + text.length + " chars");
      
      // Step 3: Chunk
      const chunkSize = 2000;
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize - 200) {
        chunks.push(text.slice(i, i + chunkSize).trim());
        if (chunks.length >= 3) break; // Only 3 chunks for testing
      }
      results.push("3. Chunks OK: " + chunks.length);
      
      // Step 4: Embed via Voyage AI (free 200M tokens)
        const voyageKey = process.env.VOYAGE_API_KEY;
      const embRes = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + voyageKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "voyage-3-lite",
          input: [chunks[0].slice(0, 16000)],
        }),
      });
      const embData = await embRes.json();
      const embedding = embData.data?.[0]?.embedding;
      results.push("4. Embedding OK: " + (embedding?.length ?? "FAILED") + " dims");
      
      if (!embedding) {
        results.push("ERROR: " + JSON.stringify(embData).slice(0, 200));
        return { success: false, steps: results };
      }
      
      // Step 5: Store
      await ctx.runMutation(internal.sources.upsertWithEmbedding, {
        key: "rc-docs:webhook-events:chunk-0",
        url: "https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields",
        provider: "RevenueCat",
        sourceClass: "public_product",
        evidenceTier: "public_product_and_competitor",
        lastRefreshed: Date.now(),
        contentHash: String(chunks[0].length),
        summary: chunks[0].slice(0, 500),
        embedding: embedding,
        chunkIndex: 0,
        parentKey: "rc-docs:webhook-events",
      });
      results.push("5. Stored OK");
      
      return { success: true, steps: results };
    } catch (err) {
      results.push("ERROR: " + String(err));
      return { success: false, steps: results };
    }
  },
});
