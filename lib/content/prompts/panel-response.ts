import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";

// ---------------------------------------------------------------------------
// Panel response prompt template
// ---------------------------------------------------------------------------

export interface PanelResponseInput {
  question: string;
  context: string;
  sources: PanelSource[];
  responseFormat: "short" | "detailed";
  uncertaintyHandling?: string;
}

export interface PanelSource {
  title: string;
  url?: string;
  snippet: string;
  reliability: "high" | "medium" | "low";
}

export function renderPanelResponsePrompt(input: PanelResponseInput): {
  system: string;
  user: string;
} {
  const v = GROWTHCAT_VOICE_PROFILE;

  const formatGuidelines =
    input.responseFormat === "short"
      ? "Keep the response under 200 words. Lead with the direct answer, then one supporting point."
      : "Provide a thorough response (400-800 words). Structure with clear sections. Cite every claim.";

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
    "You are composing a panel-style response — the kind that appears in expert roundups, community Q&As, or forum threads.",
    "",
    "Core principles:",
    "1. Show your reasoning: do not just state conclusions; walk through the logic.",
    "2. Cite sources: reference the provided sources by title or URL inline.",
    "3. Handle uncertainty honestly: if the evidence is mixed or incomplete, say so explicitly and explain what would change your assessment.",
    "4. Differentiate opinion from fact: mark subjective takes clearly.",
    "5. Be concise but complete: every sentence should earn its place.",
    "",
    formatGuidelines,
    ...(input.uncertaintyHandling
      ? [
          "",
          `Uncertainty handling instruction: ${input.uncertaintyHandling}`,
        ]
      : []),
  ].join("\n");

  const sourceLines = input.sources.map(
    (s) =>
      `- [${s.reliability}] **${s.title}**${s.url ? ` (${s.url})` : ""}: ${s.snippet}`,
  );

  const user = [
    "## Panel Response Request",
    "",
    `**Question:** ${input.question}`,
    "",
    "### Context",
    input.context,
    "",
    "### Sources",
    ...sourceLines,
  ].join("\n");

  return { system, user };
}
