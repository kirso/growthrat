import { describe, expect, it } from "vitest";
import {
  extractRevenueCatMetricValue,
} from "./revenuecat";
import { normalizeEventType, slugify } from "./experiments";

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
});
