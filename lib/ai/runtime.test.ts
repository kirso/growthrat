import { describe, expect, it } from "vitest";
import { AI_MODEL_IDS, getEstimatedAnthropicUsd } from "./runtime";

describe("AI runtime pricing helpers", () => {
  it("returns zero when usage is missing", () => {
    expect(getEstimatedAnthropicUsd(AI_MODEL_IDS.generation, undefined)).toBe(0);
  });

  it("estimates Sonnet pricing from token usage", () => {
    const estimated = getEstimatedAnthropicUsd(AI_MODEL_IDS.generation, {
      inputTokens: 1000,
      outputTokens: 500,
    });

    expect(estimated).toBeCloseTo(0.0105, 6);
  });

  it("estimates fast-model pricing separately", () => {
    const estimated = getEstimatedAnthropicUsd(AI_MODEL_IDS.fast, {
      inputTokens: 10_000,
      outputTokens: 1_000,
    });

    expect(estimated).toBeCloseTo(0.012, 6);
  });
});
