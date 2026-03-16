import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

export const fetchKeywordData = createTool({
  name: "fetch_keyword_data",
  description: "Fetch keyword ideas and search volume from DataForSEO for content planning.",
  parameters: z.object({
    keywords: z.array(z.string()).describe("Seed keywords to research"),
  }),
  handler: async ({ keywords }) => {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    if (!login || !password) {
      return JSON.stringify({
        source: "sample_data",
        keywords: keywords.map((kw) => ({
          keyword: kw,
          searchVolume: Math.floor(Math.random() * 500) + 50,
          keywordDifficulty: Math.floor(Math.random() * 40) + 10,
          competition: Math.random() * 0.5,
        })),
      });
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
          { keywords, location_code: 2840, language_code: "en", limit: 20 },
        ]),
      }
    );

    const data = await res.json();
    const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
    return JSON.stringify({
      source: "dataforseo_live",
      keywords: items.slice(0, 10).map((item: Record<string, unknown>) => ({
        keyword: item.keyword,
        searchVolume: item.search_volume ?? 0,
        keywordDifficulty: item.keyword_difficulty ?? 0,
        competition: item.competition ?? 0,
      })),
    });
  },
});
