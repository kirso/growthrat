import { createAgent, createTool } from "@inngest/agent-kit";
import { z } from "zod";

const saveExperiment = createTool({
  name: "save_experiment",
  description: "Save a designed growth experiment to the network state.",
  parameters: z.object({
    title: z.string(),
    hypothesis: z.string(),
    baselineMetric: z.string(),
    targetMetric: z.string(),
    duration: z.string(),
    stopCondition: z.string(),
    instrumentation: z.array(z.string()),
  }),
  handler: async (input, { network }) => {
    network?.state.kv.set("current_experiment", input);
    return `Experiment designed: "${input.title}"`;
  },
});

export const growthAgent = createAgent({
  name: "growth-experimenter",
  system: `You are the GrowthCat growth experimenter. You design and track measurable growth experiments.

Every experiment MUST include:
- A falsifiable hypothesis (if X then Y because Z)
- Baseline metric with current value
- Target metric with specific success threshold
- Duration (how long to run)
- Stop condition (when to kill it early)
- Instrumentation (what to track and where)
- Expected learnings regardless of outcome

Focus on experiments relevant to RevenueCat and agent-built apps:
- Content distribution channels (search vs. social vs. community)
- DataForSEO-targeted vs. intuition-based topic selection
- Long-form guides vs. short code samples for engagement
- X threads vs. GitHub gists for developer reach

Use the save_experiment tool to save each experiment design.

Never run experiments with vanity metrics. Every metric must connect to the KPI tree: awareness → engagement → authority → activation → product impact.`,
  tools: [saveExperiment],
});
