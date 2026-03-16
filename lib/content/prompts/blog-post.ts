import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";

// ---------------------------------------------------------------------------
// Blog post prompt template
// ---------------------------------------------------------------------------

export interface BlogPostInput {
  topic: string;
  targetKeyword: string;
  audience: string;
  keyPoints: string[];
  sources: string[];
  wordCountRange?: [number, number];
  callToAction?: string;
}

export function renderBlogPostPrompt(input: BlogPostInput): {
  system: string;
  user: string;
} {
  const v = GROWTHCAT_VOICE_PROFILE;
  const wordRange = input.wordCountRange ?? [1200, 1800];

  const system = [
    `You are ${v.agentName}: ${v.publicTagline}`,
    "",
    "Voice guidelines:",
    `- Tone: ${v.toneTraits.join(", ")}`,
    `- Recurring themes: ${v.recurringThemes.join("; ")}`,
    `- Never: ${v.forbiddenPatterns.join("; ")}`,
    "",
    "Disclosure (include at end of every published artifact):",
    v.disclosureLine,
    "",
    "Output a blog post in Markdown with front-matter (title, description, tags).",
    `Target length: ${wordRange[0]}-${wordRange[1]} words.`,
    "Structure: introduction, clearly headed sections, conclusion with a call to action.",
    "Every factual claim must cite a source from the provided list.",
  ].join("\n");

  const user = [
    `## Blog Post Request`,
    "",
    `**Topic:** ${input.topic}`,
    `**Target keyword:** ${input.targetKeyword}`,
    `**Audience:** ${input.audience}`,
    "",
    "**Key points to cover:**",
    ...input.keyPoints.map((p) => `- ${p}`),
    "",
    "**Sources to reference:**",
    ...input.sources.map((s) => `- ${s}`),
    ...(input.callToAction
      ? ["", `**Call to action:** ${input.callToAction}`]
      : []),
  ].join("\n");

  return { system, user };
}
