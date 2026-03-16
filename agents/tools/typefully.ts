import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

export const distributeContent = createTool({
  name: "distribute_to_social",
  description:
    "Create a Typefully draft for multi-platform distribution across X, LinkedIn, Threads, Bluesky, and Mastodon. " +
    "Can save as draft, schedule to next free slot, or publish immediately.",
  parameters: z.object({
    title: z.string().describe("Internal draft title for organization"),
    xPost: z.string().max(280).describe("X/Twitter post text"),
    linkedinPost: z.string().max(1500).optional().describe("LinkedIn post text"),
    threadsPost: z.string().max(500).optional().describe("Threads post text"),
    blueskyPost: z.string().max(300).optional().describe("Bluesky post text"),
    tags: z.array(z.string()).describe("Tags for dedup and organization"),
    publishAt: z
      .enum(["draft", "next-free-slot", "now"])
      .default("draft")
      .describe("When to publish"),
  }),
  handler: async ({ title, xPost, linkedinPost, threadsPost, blueskyPost, tags, publishAt }) => {
    const apiKey = process.env.TYPEFULLY_API_KEY;
    if (!apiKey) return "dry-run: no TYPEFULLY_API_KEY configured";

    const socialSetId = process.env.TYPEFULLY_SOCIAL_SET_ID;
    if (!socialSetId) return "dry-run: no TYPEFULLY_SOCIAL_SET_ID configured";

    // Build platform configs
    const platforms: Record<string, unknown> = {
      x: { enabled: true, posts: [{ text: xPost }] },
    };

    if (linkedinPost) {
      platforms.linkedin = { enabled: true, posts: [{ text: linkedinPost }] };
    }
    if (threadsPost) {
      platforms.threads = { enabled: true, posts: [{ text: threadsPost }] };
    }
    if (blueskyPost) {
      platforms.bluesky = { enabled: true, posts: [{ text: blueskyPost }] };
    }

    const body: Record<string, unknown> = {
      draft_title: title,
      tags,
      platforms,
    };

    if (publishAt === "now") body.publish_at = "now";
    else if (publishAt === "next-free-slot") body.publish_at = "next-free-slot";
    // "draft" = omit publish_at

    const res = await fetch(
      `https://api.typefully.com/v1/drafts?social_set_id=${socialSetId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return `Typefully error ${res.status}: ${err.slice(0, 200)}`;
    }

    const data = await res.json();
    const enabledPlatforms = Object.entries(platforms)
      .filter(([, v]) => (v as { enabled: boolean }).enabled)
      .map(([k]) => k);

    return `Draft created: ${data.id ?? "ok"}. Platforms: ${enabledPlatforms.join(", ")}. Schedule: ${publishAt}`;
  },
});

export const listDraftsByTag = createTool({
  name: "list_typefully_drafts_by_tag",
  description: "Check if a Typefully draft already exists for a given tag (dedup check).",
  parameters: z.object({
    tag: z.string().describe("Tag to search for (typically artifact slug)"),
  }),
  handler: async ({ tag }) => {
    const apiKey = process.env.TYPEFULLY_API_KEY;
    const socialSetId = process.env.TYPEFULLY_SOCIAL_SET_ID;
    if (!apiKey || !socialSetId) return JSON.stringify({ exists: false, reason: "no credentials" });

    const res = await fetch(
      `https://api.typefully.com/v1/drafts?social_set_id=${socialSetId}&tag=${encodeURIComponent(tag)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) return JSON.stringify({ exists: false, reason: `error ${res.status}` });

    const data = await res.json();
    const results = data.results ?? [];
    return JSON.stringify({ exists: results.length > 0, count: results.length });
  },
});
