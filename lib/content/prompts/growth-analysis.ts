import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";

// ---------------------------------------------------------------------------
// Growth analysis prompt template
// ---------------------------------------------------------------------------

export interface GrowthAnalysisInput {
  domain: string;
  competitors: string[];
  keywordData: string;
  serpInsights: string;
  aiMentionData?: string;
  timeframe?: string;
}

export function renderGrowthAnalysisPrompt(input: GrowthAnalysisInput): {
  system: string;
  user: string;
} {
  const v = GROWTHCAT_VOICE_PROFILE;

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
    "You are producing a growth analysis report.",
    "Requirements:",
    "- Structure the report with numbered opportunities ranked by potential impact.",
    "- Each opportunity must include: description, evidence, estimated effort, and expected outcome.",
    "- Separate quick wins from long-term plays.",
    "- End with a prioritized action list for the next 2 weeks.",
    "- All claims must be grounded in the provided data. Do not invent numbers.",
  ].join("\n");

  const user = [
    "## Growth Analysis Request",
    "",
    `**Domain:** ${input.domain}`,
    `**Competitors:** ${input.competitors.join(", ")}`,
    ...(input.timeframe ? [`**Timeframe:** ${input.timeframe}`] : []),
    "",
    "### Keyword Data",
    input.keywordData,
    "",
    "### SERP Insights",
    input.serpInsights,
    ...(input.aiMentionData
      ? ["", "### AI Mention / LLM Visibility Data", input.aiMentionData]
      : []),
  ].join("\n");

  return { system, user };
}
