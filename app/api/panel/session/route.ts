import { streamText, tool, stepCountIs, smoothStream } from "ai";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { AI_MODEL_IDS, OPENAI_MODEL_IDS, getEstimatedAnthropicUsd, getRouteModel, getRouteProviderOptions, getRouteProvider } from "@/lib/ai/runtime";
import { fetchAuthQuery } from "@/lib/auth-server";
import { isAuthorizedRcAdminEmail } from "@/lib/authz";

export const runtime = "nodejs";
export const maxDuration = 120;

function getRequestKey(req: Request, feature: string) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "anonymous";
  return `${feature}:${ip}`;
}

async function hasPanelAccess(panelToken: string | null) {
  const expectedToken = process.env.GROWTHCAT_PANEL_TOKEN;
  if (expectedToken && panelToken === expectedToken) return true;

  try {
    const user = await fetchAuthQuery(api.auth.getCurrentUser, {});
    return Boolean(user?.email && isAuthorizedRcAdminEmail(user.email));
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get("prompt");

  if (!prompt) {
    return new Response("Missing prompt parameter", { status: 400 });
  }

  const panelToken = searchParams.get("token");
  if (!(await hasPanelAccess(panelToken))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const serverToken = (
    process.env.GROWTHCAT_INTERNAL_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET
  )?.trim();
  const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null;
  if (!convex || !serverToken) {
    return new Response("GrowthRat panel is unavailable because backend connectivity or server auth is missing.", { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const startTime = Date.now();
      const elapsed = () => Date.now() - startTime;

      try {
        const runtime = await convex.query((api.agentConfig as any).getRuntimeState, {});
        if (!runtime.isActive) {
          send("progress", {
            step: "dormant",
            content: "GrowthRat is dormant right now. Enable interview-proof or RC-live mode before using the panel.",
            elapsed_ms: elapsed(),
          });
          send("done", { step: "complete", elapsed_ms: elapsed() });
          controller.close();
          return;
        }
      } catch {
        send("progress", {
          step: "dormant",
          content: "GrowthRat is dormant right now. Runtime state could not be verified, so the panel is closed.",
          elapsed_ms: elapsed(),
        });
        send("done", { step: "complete", elapsed_ms: elapsed() });
        controller.close();
        return;
      }

      let rateStatus;
      let budgetStatus;
      try {
        rateStatus = await convex.mutation((api.rateLimits as any).consumePanel, {
          key: getRequestKey(req, "public_panel"),
          serverToken,
        });
        budgetStatus = await convex.query((api.usageEvents as any).getBudgetStatus, {
          feature: "public_panel",
          serverToken,
        });
      } catch {
        send("progress", {
          step: "limits_unavailable",
          content: "GrowthRat could not verify panel limits right now, so the panel is closed.",
          elapsed_ms: elapsed(),
        });
        send("done", { step: "complete", elapsed_ms: elapsed() });
        controller.close();
        return;
      }

      if (!rateStatus?.ok) {
        send("progress", {
          step: "rate_limited",
          content: `Panel rate limit reached. Retry after ${Math.ceil((rateStatus.retryAfter ?? 60_000) / 1000)} seconds.`,
          elapsed_ms: elapsed(),
        });
        send("done", { step: "complete", elapsed_ms: elapsed() });
        controller.close();
        return;
      }

      if (!budgetStatus?.ok) {
        send("progress", {
          step: "budget_exhausted",
          content: budgetStatus?.reason ?? "Panel budget is exhausted right now.",
          elapsed_ms: elapsed(),
        });
        send("done", { step: "complete", elapsed_ms: elapsed() });
        controller.close();
        return;
      }

      // Step 1: Prompt received
      send("progress", { step: "prompt_received", content: prompt, elapsed_ms: elapsed() });

      // Step 2: Announce tool availability
      send("progress", {
        step: "tools_available",
        tools: ["searchKnowledge", "searchKeywords", "getArticle", "getExperimentStatus", "getWeeklyMetrics"],
        elapsed_ms: elapsed(),
      });

      try {
        const result = streamText({
          model: getRouteModel("reasoning"),
          system: `You are GrowthRat in a live panel interview at RevenueCat.
The interviewer is watching you think and work in real time on a shared screen.

IMPORTANT: You have tools available. USE THEM to ground your answers:
- searchKnowledge: Search RevenueCat documentation (USE THIS for any RC product question)
- searchKeywords: Look up keyword data for content strategy questions
- getArticle: Retrieve your own published articles
- getExperimentStatus: Check growth experiment status
- getWeeklyMetrics: Get this week's performance numbers

Show your reasoning. Cite the specific sources you found. Be honest about uncertainty.
Tone: technical, structured, evidence-backed, direct.
GrowthRat is an independent agent applying to RevenueCat, not a RevenueCat-owned property.`,
          prompt,
          providerOptions: getRouteProviderOptions("reasoning"),
          tools: {
            searchKnowledge: tool({
              description: "Search RevenueCat documentation and knowledge base. Use this for ANY question about RC products, APIs, SDKs, webhooks, offerings, entitlements, paywalls, or charts.",
              inputSchema: z.object({
                query: z.string().describe("What to search for in the RC knowledge base"),
              }),
              execute: async ({ query }) => {
                const result = await convex.action(api.chat.searchKnowledge, { query, serverToken });
                return result.context || "No relevant documentation found.";
              },
            }),
            searchKeywords: tool({
              description: "Look up keyword search volume and difficulty data. Use for content strategy and growth experiment questions.",
              inputSchema: z.object({
                keywords: z.array(z.string()).describe("Keywords to research"),
              }),
              execute: async ({ keywords }) => {
                // Try DataForSEO if credentials exist
                const login = process.env.DATAFORSEO_LOGIN;
                const password = process.env.DATAFORSEO_PASSWORD;
                if (login && password) {
                  try {
                    const res = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
                      method: "POST",
                      headers: {
                        Authorization: `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify([{ keywords, language_code: "en", location_code: 2840 }]),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      const results = data.tasks?.[0]?.result ?? [];
                      return results.map((r: { keyword: string; search_volume: number; competition: number; cpc: number }) => ({
                        keyword: r.keyword,
                        searchVolume: r.search_volume ?? 0,
                        competition: r.competition ?? 0,
                        cpc: r.cpc ?? 0,
                        source: "dataforseo",
                      }));
                    }
                  } catch { /* fall through */ }
                }
                return keywords.map((kw) => ({ keyword: kw, source: "unavailable", note: "DataForSEO credentials not configured" }));
              },
            }),
            getArticle: tool({
              description: "Retrieve one of GrowthRat's own published articles by slug.",
              inputSchema: z.object({
                slug: z.string().describe("Article slug"),
              }),
              execute: async ({ slug }) => {
                try {
                  const article = await convex.query(api.artifacts.getBySlug, { slug });
                  if (!article) return { error: `No article found with slug "${slug}"` };
                  const siteUrl = process.env.SITE_URL ?? "https://growthcat-psi.vercel.app";
                  return {
                    slug: article.slug,
                    title: article.title,
                    status: article.status,
                    url: `${siteUrl}/articles/${article.slug}`,
                    contentPreview: article.content.slice(0, 500),
                    source: "convex",
                  };
                } catch {
                  const siteUrl = process.env.SITE_URL ?? "https://growthcat-psi.vercel.app";
                  return { slug, url: `${siteUrl}/articles/${slug}`, source: "fallback" };
                }
              },
            }),
            getExperimentStatus: tool({
              description: "Check the status of growth experiments.",
              inputSchema: z.object({}),
              execute: async () => {
                try {
                  const experiment = await convex.query(api.experiments.getLatest, {});
                  if (!experiment) return { status: "none", note: "No experiments found" };
                  return {
                    active: experiment.title,
                    experimentKey: experiment.experimentKey,
                    hypothesis: experiment.hypothesis,
                    baselineMetric: experiment.baselineMetric,
                    targetMetric: experiment.targetMetric,
                    status: experiment.status,
                    results: experiment.results,
                    source: "convex",
                  };
                } catch {
                  return { status: "unavailable", source: "fallback" };
                }
              },
            }),
            getWeeklyMetrics: tool({
              description: "Get this week's performance metrics.",
              inputSchema: z.object({}),
              execute: async () => {
                try {
                  const metrics = await convex.query(api.weeklyReports.getMetricsSummary, {});
                  return { ...metrics, source: "convex" };
                } catch {
                  return { source: "fallback", note: "Could not reach Convex" };
                }
              },
            }),
          },
          stopWhen: stepCountIs(5),
          onFinish: async ({ usage }) => {
            const provider = getRouteProvider();
            const modelId = provider === "openai" ? OPENAI_MODEL_IDS.reasoning : AI_MODEL_IDS.reasoning;
            await convex.mutation((api.usageEvents as any).record, {
              feature: "public_panel",
              workflowType: "panel",
              provider,
              model: modelId,
              inputTokens: usage?.inputTokens ?? 0,
              outputTokens: usage?.outputTokens ?? 0,
              estimatedUsd: getEstimatedAnthropicUsd(modelId, usage),
              success: true,
              latencyMs: elapsed(),
              serverToken,
              metadata: {
                promptLength: prompt.length,
                cachedPrompt: provider === "anthropic",
                toolCount: 5,
              },
            }).catch(() => {});
          },
          onStepFinish: async ({ toolCalls, toolResults }) => {
            // Emit SSE events for each tool call so the panel shows them
            if (toolCalls && toolCalls.length > 0) {
              for (const tc of toolCalls) {
                send("progress", {
                  step: "tool_call",
                  toolName: (tc as any).toolName ?? "unknown",
                  args: (tc as any).input ?? (tc as any).args ?? {},
                  elapsed_ms: elapsed(),
                });
              }
            }
            if (toolResults && toolResults.length > 0) {
              for (const tr of toolResults) {
                const name = (tr as any).toolName ?? "unknown";
                const res = (tr as any).result;
                send("progress", {
                  step: "tool_result",
                  toolName: name,
                  result: typeof res === "string" ? res.slice(0, 500) : JSON.stringify(res).slice(0, 500),
                  elapsed_ms: elapsed(),
                });
              }
            }
          },
          experimental_transform: smoothStream({ delayInMs: 10, chunking: "word" }),
          maxOutputTokens: 4096,
          temperature: 0.3,
        });

        // Stream the text output
        for await (const chunk of (await result).textStream) {
          send("stream", { step: "output_chunk", token: chunk, elapsed_ms: elapsed() });
        }
      } catch (err) {
        send("stream", {
          step: "output_chunk",
          token: `\n\n[Error: ${err instanceof Error ? err.message : "Unknown error"}]`,
          elapsed_ms: elapsed(),
        });
      }

      // Done
      send("done", { step: "complete", elapsed_ms: elapsed() });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
