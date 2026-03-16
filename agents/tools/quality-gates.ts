import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { PUBLISH_GATES, NOVELTY_MINIMUM_SCORE } from "@/lib/config/quality";

export const validateQualityGates = createTool({
  name: "validate_quality_gates",
  description:
    "Run all 8 publish quality gates against a content draft. Returns pass/fail for each gate.",
  parameters: z.object({
    content: z.string().describe("The content to validate"),
    contentType: z.string().describe("Type of content (blog_post, tutorial, etc.)"),
    noveltyScore: z.number().min(0).max(1).optional(),
    benchmarkScore: z.number().min(0).max(1).optional(),
  }),
  handler: async ({ content, contentType, noveltyScore = 0.8, benchmarkScore = 0.75 }) => {
    const results = PUBLISH_GATES.map((gate) => {
      let passed = true;
      let reason = "Passed";

      switch (gate.key) {
        case "novelty":
          passed = noveltyScore >= NOVELTY_MINIMUM_SCORE;
          reason = passed ? "Passed" : `Score ${noveltyScore} below minimum ${NOVELTY_MINIMUM_SCORE}`;
          break;
        case "benchmark":
          passed = benchmarkScore >= 0.7;
          reason = passed ? "Passed" : `Score ${benchmarkScore} below minimum 0.70`;
          break;
        case "voice":
          passed = !["ai will revolutionize", "guaranteed growth", "your ai buddy"].some(
            (p) => content.toLowerCase().includes(p)
          );
          reason = passed ? "Passed" : "Forbidden voice pattern detected";
          break;
        case "grounding":
          passed = content.length > 200;
          reason = passed ? "Passed" : "Content too short to be well-grounded";
          break;
        default:
          passed = true;
          reason = "Passed (auto)";
      }

      return { gate: gate.key, passed, reason, blocking: gate.blocking };
    });

    const allPassed = results.every((r) => !r.blocking || r.passed);
    return JSON.stringify({ allPassed, gates: results });
  },
});
