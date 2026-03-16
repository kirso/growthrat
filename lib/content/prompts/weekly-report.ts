import { GROWTHCAT_VOICE_PROFILE } from "@/lib/config/voice";

// ---------------------------------------------------------------------------
// Weekly report prompt template
// ---------------------------------------------------------------------------

export interface WeeklyReportInput {
  weekLabel: string;
  artifactsShipped: ArtifactSummary[];
  experimentsRun: ExperimentSummary[];
  kpiSnapshot: Record<string, string | number>;
  feedbackItemCount: number;
  topInsights: string[];
  blockers?: string[];
  nextWeekPriorities?: string[];
}

export interface ArtifactSummary {
  title: string;
  lane: string;
  url?: string;
  status: "published" | "draft" | "blocked";
}

export interface ExperimentSummary {
  name: string;
  status: "running" | "completed" | "inconclusive";
  resultSummary?: string;
}

export function renderWeeklyReportPrompt(input: WeeklyReportInput): {
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
    "You are producing a weekly status report for stakeholders.",
    "Requirements:",
    "- Lead with the single most important insight or result.",
    "- Use a consistent structure: highlights, artifacts, experiments, KPIs, next steps.",
    "- Keep it under 600 words; link to details rather than repeating them.",
    "- Flag any blockers prominently.",
    "- Tone: informative and direct, not self-congratulatory.",
  ].join("\n");

  const artifactLines = input.artifactsShipped.map(
    (a) =>
      `- [${a.status}] **${a.title}** (${a.lane})${a.url ? ` — ${a.url}` : ""}`,
  );

  const experimentLines = input.experimentsRun.map(
    (e) =>
      `- [${e.status}] **${e.name}**${e.resultSummary ? `: ${e.resultSummary}` : ""}`,
  );

  const kpiLines = Object.entries(input.kpiSnapshot).map(
    ([k, v]) => `- ${k}: ${v}`,
  );

  const user = [
    `## Weekly Report: ${input.weekLabel}`,
    "",
    "### Artifacts Shipped",
    ...artifactLines,
    "",
    "### Experiments",
    ...experimentLines,
    "",
    "### KPI Snapshot",
    ...kpiLines,
    "",
    `**Feedback items processed:** ${input.feedbackItemCount}`,
    "",
    "### Top Insights",
    ...input.topInsights.map((i) => `- ${i}`),
    ...(input.blockers && input.blockers.length > 0
      ? ["", "### Blockers", ...input.blockers.map((b) => `- ${b}`)]
      : []),
    ...(input.nextWeekPriorities && input.nextWeekPriorities.length > 0
      ? [
          "",
          "### Next Week Priorities",
          ...input.nextWeekPriorities.map((p) => `- ${p}`),
        ]
      : []),
  ].join("\n");

  return { system, user };
}
