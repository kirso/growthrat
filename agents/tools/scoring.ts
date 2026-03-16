import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

const WEIGHTS = {
  revenuecatRelevance: 0.2,
  agentBuilderRelevance: 0.15,
  demandSignal: 0.15,
  noveltyDelta: 0.15,
  artifactPotential: 0.1,
  distributionPotential: 0.1,
  feedbackValue: 0.1,
  easeToExecute: 0.05,
} as const;

export const scoreOpportunities = createTool({
  name: "score_opportunities",
  description:
    "Score content/experiment opportunities using the 8-dimension weighted scoring model. " +
    "Each component should be between 0 and 1.",
  parameters: z.object({
    opportunities: z.array(
      z.object({
        title: z.string(),
        lane: z.string(),
        components: z.object({
          revenuecatRelevance: z.number().min(0).max(1),
          agentBuilderRelevance: z.number().min(0).max(1),
          demandSignal: z.number().min(0).max(1),
          noveltyDelta: z.number().min(0).max(1),
          artifactPotential: z.number().min(0).max(1),
          distributionPotential: z.number().min(0).max(1),
          feedbackValue: z.number().min(0).max(1),
          easeToExecute: z.number().min(0).max(1),
        }),
      })
    ),
  }),
  handler: async ({ opportunities }) => {
    const scored = opportunities
      .map((opp) => {
        let total = 0;
        for (const [key, weight] of Object.entries(WEIGHTS)) {
          total += (opp.components[key as keyof typeof WEIGHTS] ?? 0) * weight;
        }
        return { ...opp, score: Math.round(total * 1000) / 1000 };
      })
      .sort((a, b) => b.score - a.score);

    return JSON.stringify({ scored });
  },
});
