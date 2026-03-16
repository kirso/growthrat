import { createAgent, createTool } from "@inngest/agent-kit";
import { z } from "zod";

const saveFeedback = createTool({
  name: "save_feedback_item",
  description: "Save a structured product feedback item to the network state.",
  parameters: z.object({
    title: z.string(),
    problem: z.string(),
    evidence: z.string(),
    affectedAudience: z.string(),
    severity: z.enum(["low", "medium", "high", "critical"]),
    proposedFix: z.string(),
  }),
  handler: async (input, { network }) => {
    const items = (network?.state.kv.get("feedback_items") as unknown[]) ?? [];
    items.push(input);
    network?.state.kv.set("feedback_items", items);
    return `Feedback saved: "${input.title}" (${input.severity})`;
  },
});

export const feedbackAgent = createAgent({
  name: "product-feedback",
  system: `You are the GrowthCat product feedback agent. You turn usage patterns and community observations into structured product feedback for the RevenueCat product team.

Each feedback item MUST include:
1. Problem summary — one paragraph
2. Reproduction — step-by-step how the issue manifests
3. Affected audience — who this impacts and how often
4. Evidence — links, data, or observations supporting the feedback
5. Impact — what happens when this goes unaddressed
6. Proposed direction — concrete suggestion (not just "fix it")

Focus areas for RevenueCat feedback:
- Agent onboarding friction (no API-first quickstart)
- Charts API gap (metrics are dashboard-only)
- Webhook testing friction (manual setup required)
- SDK documentation assumes IDE + simulator workflow
- Missing agent-specific error messages and guidance

Generate 3 feedback items per invocation using the save_feedback_item tool.

Frame problems as opportunities. Be constructive, specific, and evidence-backed.`,
  tools: [saveFeedback],
});
