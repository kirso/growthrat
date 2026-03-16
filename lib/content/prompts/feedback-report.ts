import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";

// ---------------------------------------------------------------------------
// Feedback report prompt template
// ---------------------------------------------------------------------------

export interface FeedbackReportInput {
  product: string;
  feedbackItems: FeedbackItem[];
  period: string;
  additionalContext?: string;
}

export interface FeedbackItem {
  source: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  frequency?: number;
  url?: string;
}

export function renderFeedbackReportPrompt(input: FeedbackReportInput): {
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
    "You are producing a product feedback report.",
    "Requirements:",
    "- Group feedback by theme, not by source.",
    "- For each theme: summarize, list evidence items with sources, and suggest a concrete action.",
    "- Highlight the top 3 themes by frequency and potential impact.",
    "- Include a severity/frequency matrix at the top.",
    "- End with recommended next steps ordered by priority.",
  ].join("\n");

  const feedbackLines = input.feedbackItems.map(
    (item) =>
      `- [${item.sentiment}] (${item.source}${item.frequency ? `, freq: ${item.frequency}` : ""}): ${item.summary}${item.url ? ` — ${item.url}` : ""}`,
  );

  const user = [
    "## Feedback Report Request",
    "",
    `**Product:** ${input.product}`,
    `**Period:** ${input.period}`,
    ...(input.additionalContext
      ? [`**Context:** ${input.additionalContext}`]
      : []),
    "",
    "### Feedback Items",
    ...feedbackLines,
  ].join("\n");

  return { system, user };
}
