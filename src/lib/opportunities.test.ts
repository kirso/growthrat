import { describe, expect, it } from "vitest";
import { scoreOpportunity } from "./opportunities";

describe("scoreOpportunity", () => {
  it("rewards high RevenueCat fit, pain, depth, and measurable outcomes", () => {
    const strong = scoreOpportunity({
      developerPain: 95,
      revenueCatFit: 98,
      technicalDepth: 90,
      demandSignal: 80,
      measurableOutcome: 92,
      freshness: 88,
      confidence: 85,
      effortPenalty: 12,
      riskPenalty: 8,
    });

    const weak = scoreOpportunity({
      developerPain: 30,
      revenueCatFit: 20,
      technicalDepth: 25,
      demandSignal: 20,
      measurableOutcome: 20,
      freshness: 30,
      confidence: 40,
      effortPenalty: 40,
      riskPenalty: 45,
    });

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.score).toBeGreaterThan(50);
    expect(weak.score).toBe(0);
  });

  it("clamps invalid component values into the scoring range", () => {
    const scored = scoreOpportunity({
      developerPain: 999,
      revenueCatFit: -10,
      effortPenalty: Number.NaN,
    });

    expect(scored.components.developerPain).toBe(100);
    expect(scored.components.revenueCatFit).toBe(0);
    expect(scored.components.effortPenalty).toBe(15);
    expect(scored.score).toBeGreaterThanOrEqual(0);
  });
});
