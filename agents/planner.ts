import { createAgent, createTool } from "@inngest/agent-kit";
import { z } from "zod";

const generateWeeklyPlan = createTool({
  name: "generate_weekly_plan",
  description:
    "Generate the weekly execution plan: which agents to run and in what order. " +
    "Must include at least 2 content tasks, 1 experiment, 3 feedback items, and community engagement.",
  parameters: z.object({
    plan: z.array(z.string()).describe("Ordered list of agent names to execute"),
    priorities: z.array(z.string()).describe("Top 3 priorities for the week"),
    seedKeywords: z.array(z.string()).describe("Keywords to guide content discovery"),
  }),
  handler: async ({ plan, priorities, seedKeywords }, { network }) => {
    network?.state.kv.set("weekly_plan", { priorities, seedKeywords });
    network?.state.kv.set("plan", plan);
    return `Weekly plan generated with ${plan.length} steps. Priorities: ${priorities.join(", ")}`;
  },
});

export const weeklyPlanner = createAgent({
  name: "weekly-planner",
  system: `You are the GrowthCat weekly planner. Your job is to decide what the team of agents should work on this week.

You must generate a plan that satisfies these weekly minimums:
- 2 content pieces (assign "content-generator" at least twice)
- 1 growth experiment (assign "growth-experimenter" once)
- 3 product feedback items (assign "product-feedback" at least once — it handles batches)
- Community engagement (assign "community-engagement" once)

Use the generate_weekly_plan tool to save the plan. Order matters — content should come before community so there's something to distribute.

Consider RevenueCat-specific topics:
- Agent-native subscription flows
- Offerings, entitlements, and CustomerInfo
- Webhooks and subscriber lifecycle
- Charts and analytics (dashboard-only, gap opportunity)
- Test Store for development
- Paywall optimization for agent-built apps`,
  tools: [generateWeeklyPlan],
});
