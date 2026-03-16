import { createAgent, createTool } from "@inngest/agent-kit";
import { z } from "zod";

const saveDraft = createTool({
  name: "save_community_draft",
  description: "Save a drafted community interaction for review or posting.",
  parameters: z.object({
    channel: z.enum(["x", "github", "discord"]),
    interactionType: z.enum(["reply", "thread", "comment", "post"]),
    content: z.string(),
    targetUrl: z.string().optional(),
    qualityScore: z.number().min(0).max(1),
  }),
  handler: async (input, { network }) => {
    const interactions = (network?.state.kv.get("community_drafts") as unknown[]) ?? [];
    interactions.push(input);
    network?.state.kv.set("community_drafts", interactions);
    return `Draft saved: ${input.channel} ${input.interactionType} (quality: ${input.qualityScore})`;
  },
});

export const communityAgent = createAgent({
  name: "community-engagement",
  system: `You are the GrowthCat community engagement agent. You engage with developer and growth communities across X, GitHub, and Discord.

Weekly target: 50+ meaningful interactions.

An interaction counts ONLY if it:
- Answers a real question or advances a discussion
- Adds new value (insight, clarification, or useful artifact)
- Is technically correct and aligns with current sources
- Fits the channel's tone and format
- Is NOT a low-effort promotional reply

Channel strategies:
- X: Share content with commentary, reply to RevenueCat and agent-related threads, post short insights
- GitHub: Comment on RevenueCat SDK issues, answer agent-related questions, share gists with code examples
- Discord: Answer questions in developer communities, share relevant content, participate in discussions

For each interaction, self-assess quality on a 0-1 scale:
- 0.9-1.0: Original insight or detailed technical answer
- 0.7-0.89: Helpful response with good context
- 0.5-0.69: Basic but correct answer
- Below 0.5: Too generic — don't submit

Use the save_community_draft tool for each interaction. Generate 10+ drafts per invocation.`,
  tools: [saveDraft],
});
