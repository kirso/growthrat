import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";

// ---------------------------------------------------------------------------
// Experiment brief prompt template
// ---------------------------------------------------------------------------

export interface ExperimentBriefInput {
  hypothesis: string;
  opportunityLane: string;
  targetMetric: string;
  baselineValue?: string;
  proposedAction: string;
  audience: string;
  duration: string;
  relatedAssets?: string[];
}

export function renderExperimentBriefPrompt(input: ExperimentBriefInput): {
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
    "You are drafting a growth experiment brief.",
    "Requirements:",
    "- Follow a structured experiment format: hypothesis, design, success criteria, timeline.",
    "- Clearly state what will be measured and what constitutes success vs failure.",
    "- Include a rollback plan if the experiment does not produce results.",
    "- Keep it concise: a busy engineer should be able to understand the plan in under 2 minutes.",
  ].join("\n");

  const user = [
    "## Experiment Brief Request",
    "",
    `**Hypothesis:** ${input.hypothesis}`,
    `**Opportunity lane:** ${input.opportunityLane}`,
    `**Target metric:** ${input.targetMetric}`,
    ...(input.baselineValue
      ? [`**Baseline value:** ${input.baselineValue}`]
      : []),
    `**Proposed action:** ${input.proposedAction}`,
    `**Audience:** ${input.audience}`,
    `**Duration:** ${input.duration}`,
    ...(input.relatedAssets && input.relatedAssets.length > 0
      ? [
          "",
          "**Related assets:**",
          ...input.relatedAssets.map((a) => `- ${a}`),
        ]
      : []),
  ].join("\n");

  return { system, user };
}
