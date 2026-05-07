import { resolveConnectorCredentials } from "./connected-accounts";

export type KeywordIdea = {
  keyword: string;
  difficulty: number | null;
  volume: number | null;
  cpc: number | null;
  unavailable?: boolean;
  reason?: string;
};

export type SerpBaseline = {
  keyword: string;
  serpPosition: number | null;
  difficulty: number | null;
  volume: number | null;
  topResults: string[];
  unavailable?: boolean;
  reason?: string;
};

async function getCredentials(env: Env) {
  const credentials = await resolveConnectorCredentials(env, "dataforseo");
  return {
    login: credentials?.login ?? credentials?.DATAFORSEO_LOGIN,
    password: credentials?.password ?? credentials?.DATAFORSEO_PASSWORD,
  };
}

function authHeader(login: string, password: string) {
  return `Basic ${btoa(`${login}:${password}`)}`;
}

export async function fetchKeywordIdeas(
  env: Env,
  seeds: string[],
): Promise<KeywordIdea[]> {
  const { login, password } = await getCredentials(env);
  const cleanSeeds = seeds.map((seed) => seed.trim()).filter(Boolean).slice(0, 20);
  if (!login || !password) {
    return cleanSeeds.map((keyword) => ({
      keyword,
      difficulty: 100,
      volume: 0,
      cpc: null,
      unavailable: true,
      reason: "DataForSEO connector is not active",
    }));
  }

  const response = await fetch(
    "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live",
    {
      method: "POST",
      headers: {
        Authorization: authHeader(login, password),
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          keywords: cleanSeeds,
          location_code: 2840,
          language_code: "en",
          limit: 30,
        },
      ]),
    },
  );
  const payload = (await response.json().catch(() => ({}))) as {
    tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }>;
    status_message?: string;
  };

  if (!response.ok) {
    return cleanSeeds.map((keyword) => ({
      keyword,
      difficulty: null,
      volume: null,
      cpc: null,
      unavailable: true,
      reason: payload.status_message ?? `DataForSEO returned ${response.status}`,
    }));
  }

  const items = payload.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.slice(0, 20).map((item) => {
    const keywordInfo = item.keyword_info as Record<string, unknown> | undefined;
    const keywordProps = item.keyword_properties as
      | Record<string, unknown>
      | undefined;
    return {
      keyword: String(item.keyword ?? ""),
      difficulty:
        typeof keywordProps?.keyword_difficulty === "number"
          ? keywordProps.keyword_difficulty
          : null,
      volume:
        typeof keywordInfo?.search_volume === "number"
          ? keywordInfo.search_volume
          : null,
      cpc: typeof keywordInfo?.cpc === "number" ? keywordInfo.cpc : null,
    };
  });
}

export async function fetchSerpBaseline(
  env: Env,
  keyword: string,
): Promise<SerpBaseline> {
  const { login, password } = await getCredentials(env);
  const cleanKeyword = keyword.trim();
  if (!login || !password) {
    return {
      keyword: cleanKeyword,
      serpPosition: null,
      difficulty: null,
      volume: null,
      topResults: [],
      unavailable: true,
      reason: "DataForSEO connector is not active",
    };
  }

  const response = await fetch(
    "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
    {
      method: "POST",
      headers: {
        Authorization: authHeader(login, password),
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          keyword: cleanKeyword,
          location_code: 2840,
          language_code: "en",
          depth: 20,
        },
      ]),
    },
  );
  const payload = (await response.json().catch(() => ({}))) as {
    tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }>;
    status_message?: string;
  };

  if (!response.ok) {
    return {
      keyword: cleanKeyword,
      serpPosition: null,
      difficulty: null,
      volume: null,
      topResults: [],
      unavailable: true,
      reason: payload.status_message ?? `DataForSEO returned ${response.status}`,
    };
  }

  const items = payload.tasks?.[0]?.result?.[0]?.items ?? [];
  const siteUrl = String(env.PUBLIC_SITE_URL || "");
  const host = siteUrl ? new URL(siteUrl).hostname : "growthrat";
  const organic = items.filter((item) => item.type === "organic");
  const ownResult = organic.find((item) => String(item.url ?? "").includes(host));

  return {
    keyword: cleanKeyword,
    serpPosition:
      typeof ownResult?.rank_absolute === "number"
        ? ownResult.rank_absolute
        : null,
    difficulty: null,
    volume: null,
    topResults: organic.slice(0, 5).map((item) => {
      const rank = item.rank_absolute ?? "?";
      const title = item.title ?? "Untitled";
      const domain = item.domain ?? item.url ?? "unknown";
      return `${rank}. ${title} - ${domain}`;
    }),
  };
}
