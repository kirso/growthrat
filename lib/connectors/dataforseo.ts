// ---------------------------------------------------------------------------
// DataForSEO REST API v3 client – uses native fetch
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://api.dataforseo.com/v3";
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export interface DataForSEOResponse<T = unknown> {
  version: string;
  statusCode: number;
  statusMessage: string;
  time: string;
  cost: number;
  tasksCount: number;
  tasksError: number;
  tasks: T[];
}

export class DataForSEOClient {
  private readonly authHeader: string;
  private readonly baseUrl: string;

  constructor(login: string, password: string, baseUrl?: string) {
    this.authHeader = `Basic ${btoa(login + ":" + password)}`;
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private async request<T = unknown>(
    path: string,
    body: unknown,
  ): Promise<DataForSEOResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: {
            Authorization: this.authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (res.status === 429) {
          const delay = INITIAL_BACKOFF_MS * 2 ** attempt;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `DataForSEO ${res.status}: ${text.slice(0, 500)}`,
          );
        }

        return (await res.json()) as DataForSEOResponse<T>;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Only retry on 429 (handled above); other errors throw immediately
        if (
          !(
            lastError.message.includes("429") ||
            lastError.message.includes("rate")
          )
        ) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error("DataForSEO request failed after retries");
  }

  // -----------------------------------------------------------------------
  // Public API methods
  // -----------------------------------------------------------------------

  /**
   * Fetch keyword ideas from DataForSEO Labs.
   * Endpoint: /dataforseo_labs/google/keyword_ideas/live
   */
  async fetchKeywordIdeas(
    keywords: string[],
    locationCode = 2840,
    languageCode = "en",
  ) {
    const payload = [
      {
        keywords,
        location_code: locationCode,
        language_code: languageCode,
        include_seed_keyword: true,
        limit: 100,
      },
    ];
    return this.request(
      "/dataforseo_labs/google/keyword_ideas/live",
      payload,
    );
  }

  /**
   * Fetch a live SERP snapshot for a single keyword.
   * Endpoint: /serp/google/organic/live/advanced
   */
  async fetchSerpSnapshot(
    keyword: string,
    locationCode = 2840,
    languageCode = "en",
  ) {
    const payload = [
      {
        keyword,
        location_code: locationCode,
        language_code: languageCode,
        device: "desktop",
        os: "windows",
      },
    ];
    return this.request(
      "/serp/google/organic/live/advanced",
      payload,
    );
  }

  /**
   * Fetch AI keyword / LLM-mention data.
   * Endpoint: /dataforseo_labs/google/keyword_ideas/live (with AI optimization filters)
   */
  async fetchAiKeywordSnapshot(
    keywords: string[],
    locationCode = 2840,
    languageCode = "en",
  ) {
    const payload = [
      {
        keywords,
        location_code: locationCode,
        language_code: languageCode,
        limit: 100,
        include_seed_keyword: true,
        filters: ["keyword_info.search_volume", ">", 0],
      },
    ];
    return this.request(
      "/dataforseo_labs/google/keyword_ideas/live",
      payload,
    );
  }

  /**
   * Fetch content / phrase trend analysis.
   * Endpoint: /content_analysis/search/live
   */
  async fetchContentTrends(
    keywords: string[],
    pageSize = 20,
  ) {
    const payload = [
      {
        keyword: keywords.join(" "),
        page_size: pageSize,
        search_mode: "as_is",
      },
    ];
    return this.request(
      "/content_analysis/search/live",
      payload,
    );
  }
}
