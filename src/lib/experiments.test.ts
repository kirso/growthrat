import { describe, expect, it } from "vitest";
import { extractRevenueCatMetricValue } from "./revenuecat";
import {
  buildExperimentReadoutSuggestion,
  normalizeEventType,
  slugify,
  type ExperimentDetail,
} from "./experiments";

function experimentWithSignals(
  input: Pick<ExperimentDetail, "eventTotals" | "metricTotals">,
): ExperimentDetail {
  return {
    id: "exp_1",
    slug: "agent-growth",
    title: "Agent growth loop",
    hypothesis: "A concrete RevenueCat agent hook will create intent.",
    status: "running",
    metrics_json: "{}",
    audience: "agent developers",
    channel: "owned site",
    decision_rule: "Use qualified signal before scaling.",
    started_at: "2026-05-07T00:00:00.000Z",
    ended_at: null,
    owner: "GrowthRat",
    source_doc: null,
    created_at: "2026-05-07T00:00:00.000Z",
    updated_at: "2026-05-07T00:00:00.000Z",
    variants: [],
    assets: [],
    latestMetrics: [],
    readouts: [],
    ...input,
  };
}

describe("experiment helpers", () => {
  it("normalizes unsafe event types to manual signal", () => {
    expect(normalizeEventType("cta_click")).toBe("cta_click");
    expect(normalizeEventType("unsupported-event")).toBe("manual_signal");
    expect(normalizeEventType(null)).toBe("manual_signal");
  });

  it("creates stable URL-safe slugs", () => {
    expect(slugify("RevenueCat Charts + Agent Growth!")).toBe(
      "revenuecat-charts-agent-growth",
    );
  });

  it("extracts numeric RevenueCat summary values", () => {
    expect(
      extractRevenueCatMetricValue({
        summary: {
          total: 42,
        },
      }),
    ).toBe(42);
  });

  it("suggests a funnel iteration when intent exists without monetization", () => {
    const readout = buildExperimentReadoutSuggestion(
      experimentWithSignals({
        eventTotals: [
          { event_type: "qualified_click", count: 4 },
          { event_type: "paywall_view", count: 2 },
        ],
        metricTotals: [],
      }),
    );

    expect(readout.status).toBe("completed");
    expect(readout.decision).toBe("iterate_funnel");
    expect(readout.nextAction).toContain("RevenueCat");
  });

  it("keeps an experiment open when no signal has been captured", () => {
    const readout = buildExperimentReadoutSuggestion(
      experimentWithSignals({
        eventTotals: [],
        metricTotals: [],
      }),
    );

    expect(readout.status).toBe("draft");
    expect(readout.decision).toBe("keep_running");
  });
});
