type RevenueCatConfig = {
  apiKey: string;
  projectId: string;
};

export type RevenueCatChartSnapshotInput = {
  chartName?: unknown;
  metricKey?: unknown;
  aggregate?: unknown;
  filters?: unknown;
  selectors?: unknown;
  realtime?: unknown;
};

export type RevenueCatChartSnapshot = {
  source: "revenuecat";
  metricKey: string;
  metricValue: number;
  requestUrl: string;
  payload: unknown;
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function bool(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
}

function getRevenueCatConfig(env: Env): RevenueCatConfig | null {
  const values = env as Partial<
    Record<"REVENUECAT_API_KEY" | "REVENUECAT_PROJECT_ID", string>
  >;
  const apiKey = values.REVENUECAT_API_KEY?.trim();
  const projectId = values.REVENUECAT_PROJECT_ID?.trim();

  if (!apiKey || !projectId) return null;
  return { apiKey, projectId };
}

function extractFirstNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const next = extractFirstNumber(item);
      if (next !== null) return next;
    }
    return null;
  }

  for (const item of Object.values(value)) {
    const next = extractFirstNumber(item);
    if (next !== null) return next;
  }

  return null;
}

export function extractRevenueCatMetricValue(payload: unknown) {
  if (!payload || typeof payload !== "object") return 0;
  const record = payload as Record<string, unknown>;

  const summaryValue = extractFirstNumber(record.summary);
  if (summaryValue !== null) return summaryValue;

  const metricsValue = extractFirstNumber(record.metrics);
  if (metricsValue !== null) return metricsValue;

  const valuesValue = extractFirstNumber(record.values);
  if (valuesValue !== null) return valuesValue;

  return 0;
}

export async function fetchRevenueCatChartSnapshot(
  env: Env,
  input: RevenueCatChartSnapshotInput,
): Promise<RevenueCatChartSnapshot> {
  const config = getRevenueCatConfig(env);
  if (!config) {
    throw new Error(
      "RevenueCat API key and project id are required for live chart snapshots",
    );
  }

  const chartName = text(input.chartName, "conversion_to_paying");
  const metricKey = text(input.metricKey, chartName);
  const aggregate = text(input.aggregate, "total");
  const url = new URL(
    `https://api.revenuecat.com/v2/projects/${encodeURIComponent(
      config.projectId,
    )}/charts/${encodeURIComponent(chartName)}`,
  );

  url.searchParams.set("realtime", String(bool(input.realtime, true)));
  if (aggregate) url.searchParams.set("aggregate", aggregate);
  if (typeof input.filters === "string" && input.filters.trim()) {
    url.searchParams.set("filters", input.filters.trim());
  }
  if (typeof input.selectors === "string" && input.selectors.trim()) {
    url.searchParams.set("selectors", input.selectors.trim());
  }

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      accept: "application/json",
    },
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;
  if (!response.ok) {
    throw new Error(`RevenueCat chart request failed with ${response.status}`);
  }

  return {
    source: "revenuecat",
    metricKey,
    metricValue: extractRevenueCatMetricValue(payload),
    requestUrl: url.toString(),
    payload,
  };
}
