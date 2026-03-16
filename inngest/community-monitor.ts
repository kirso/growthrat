import { inngest } from "./client";

// ---------------------------------------------------------------------------
// Community Signal Monitor — every 6 hours
// Scans GitHub issues and X for signals GrowthCat should respond to
// ---------------------------------------------------------------------------
export const communityMonitor = inngest.createFunction(
  { id: "community-monitor", name: "Community Signal Monitor" },
  { cron: "TZ=UTC 0 */6 * * *" },
  async ({ step }) => {
    // 1. Check GitHub issues on RevenueCat repos
    const githubSignals = await step.run("scan-github", async () => {
      const token = process.env.GITHUB_TOKEN;
      if (!token) return [];

      const repos = [
        "RevenueCat/purchases-ios",
        "RevenueCat/purchases-android",
        "RevenueCat/purchases-flutter",
      ];
      const results: {
        channel: string;
        url: string;
        title: string;
        context: string;
      }[] = [];

      for (const repo of repos) {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${repo}/issues?state=open&sort=created&direction=desc&per_page=5`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
              },
            }
          );
          if (!res.ok) continue;
          const issues = await res.json();
          for (const issue of issues) {
            // Only respond to issues that mention agents, programmatic, API, webhook
            const text =
              `${issue.title} ${issue.body ?? ""}`.toLowerCase();
            if (
              ["agent", "programmatic", "api", "webhook", "automated", "script"].some(
                (kw) => text.includes(kw)
              )
            ) {
              results.push({
                channel: "github",
                url: issue.html_url,
                title: issue.title,
                context: issue.body?.slice(0, 500) ?? "",
              });
            }
          }
        } catch {
          /* skip repo */
        }
      }
      return results;
    });

    // 2. Check X/Twitter mentions via search (if we had API access)
    // For now, use Typefully to check recent engagement
    const xSignals = await step.run("scan-x", async () => {
      // In production: search X API for "revenuecat agent" OR "revenuecat webhook" OR "@growthcat"
      // For now, return empty — Typefully handles outbound, not inbound monitoring
      return [] as { channel: string; url: string; title: string; context: string }[];
    });

    // 3. Trigger engagement for each signal
    const allSignals = [...githubSignals, ...xSignals];

    if (allSignals.length > 0) {
      await step.sendEvent(
        "engage-community",
        allSignals.slice(0, 5).map((signal) => ({
          name: "growthcat/community.engage" as const,
          data: {
            channel: signal.channel,
            targetUrl: signal.url,
            context: `${signal.title}\n\n${signal.context}`,
          },
        }))
      );
    }

    return {
      signalsFound: allSignals.length,
      triggered: Math.min(allSignals.length, 5),
    };
  }
);
