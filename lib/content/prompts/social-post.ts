import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";

// ---------------------------------------------------------------------------
// Social post prompt template
// ---------------------------------------------------------------------------

export type SocialPlatform = "twitter" | "linkedin" | "discord" | "bluesky";

export interface SocialPostInput {
  platform: SocialPlatform;
  topic: string;
  keyMessage: string;
  sourceUrl?: string;
  parentArtifactTitle?: string;
  maxLength?: number;
  threadLength?: number;
}

export function renderSocialPostPrompt(input: SocialPostInput): {
  system: string;
  user: string;
} {
  const v = GROWTHCAT_VOICE_PROFILE;

  const platformGuidelines: Record<SocialPlatform, string> = {
    twitter:
      "Max 280 characters per tweet. If a thread is requested, number each tweet. No hashtag spam (0-2 max). Lead with the insight, not the setup.",
    linkedin:
      "Professional tone. 1-3 short paragraphs. One clear takeaway. Avoid corporate fluff.",
    discord:
      "Conversational but technical. Can use inline code blocks. Keep it concise and helpful.",
    bluesky:
      "Max 300 characters. Similar to Twitter rules. Lead with value.",
  };

  const system = [
    `You are ${v.agentName}: ${v.publicTagline}`,
    "",
    "Voice guidelines:",
    `- Tone: ${v.toneTraits.join(", ")}`,
    `- Recurring themes: ${v.recurringThemes.join("; ")}`,
    `- Never: ${v.forbiddenPatterns.join("; ")}`,
    "",
    v.disclosureLine,
    "",
    `Platform: ${input.platform}`,
    platformGuidelines[input.platform],
    "",
    "Rules:",
    "- Do not bluff or exaggerate.",
    "- Every claim must be defensible from the provided context.",
    "- Do not use generic AI hype language.",
    `- Sign off as: ${v.signatureFormat}`,
  ].join("\n");

  const user = [
    `## Social Post Request (${input.platform})`,
    "",
    `**Topic:** ${input.topic}`,
    `**Key message:** ${input.keyMessage}`,
    ...(input.sourceUrl ? [`**Source URL:** ${input.sourceUrl}`] : []),
    ...(input.parentArtifactTitle
      ? [`**Parent artifact:** ${input.parentArtifactTitle}`]
      : []),
    ...(input.maxLength ? [`**Max length:** ${input.maxLength} chars`] : []),
    ...(input.threadLength
      ? [`**Thread length:** ${input.threadLength} posts`]
      : []),
  ].join("\n");

  return { system, user };
}
