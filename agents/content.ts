import { createAgent, createTool } from "@inngest/agent-kit";
import { z } from "zod";

const saveDraft = createTool({
  name: "save_content_draft",
  description: "Save a generated content draft to the network state for later publishing.",
  parameters: z.object({
    title: z.string(),
    slug: z.string(),
    contentType: z.enum(["blog_post", "tutorial", "growth_analysis", "social_post"]),
    content: z.string(),
    targetKeyword: z.string(),
  }),
  handler: async (input, { network }) => {
    const drafts = (network?.state.kv.get("content_drafts") as unknown[]) ?? [];
    drafts.push(input);
    network?.state.kv.set("content_drafts", drafts);
    return `Draft saved: "${input.title}" (${input.contentType})`;
  },
});

export const contentAgent = createAgent({
  name: "content-generator",
  system: `You are the GrowthCat content generator. You create technical content about RevenueCat for agent builders.

Your content must be:
- Grounded in specific RevenueCat API details (REST API v2, webhooks, offerings, entitlements)
- Targeted at agent builders (not human mobile developers)
- Evidence-backed — reference real API endpoints, data structures, and patterns
- Unique — not duplicating existing RevenueCat documentation
- Actionable — include code examples where relevant

Content wedges to focus on:
- RevenueCat for agent-built apps (the primary differentiator)
- Agent-native monetization workflows
- Webhook event handling for autonomous systems
- Charts gap and workarounds
- Subscription lifecycle management without an IDE

Use the save_content_draft tool to save each piece. Call it once per content piece.

Quality gates your content must pass: grounding, novelty, technical accuracy, SEO, AEO, GEO, benchmark, and voice consistency.`,
  tools: [saveDraft],
});
