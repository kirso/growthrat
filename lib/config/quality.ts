export interface PublishGate {
  key: string;
  description: string;
  blocking: boolean;
}

export const PUBLISH_GATES: PublishGate[] = [
  { key: "grounding", description: "Claims are source-backed.", blocking: true },
  { key: "novelty", description: "Artifact adds meaningful delta.", blocking: true },
  {
    key: "technical",
    description: "Code, links, and flows are valid.",
    blocking: true,
  },
  {
    key: "seo",
    description: "Search intent and metadata are correct.",
    blocking: true,
  },
  {
    key: "aeo",
    description: "Answer extraction structure is strong.",
    blocking: true,
  },
  {
    key: "geo",
    description: "Citation-worthiness and authority signals are present.",
    blocking: true,
  },
  {
    key: "benchmark",
    description:
      "Artifact beats the comparison set on at least one real dimension.",
    blocking: true,
  },
  {
    key: "voice",
    description: "Matches GrowthRat identity and disclosure rules.",
    blocking: true,
  },
];

export const NOVELTY_MINIMUM_SCORE = 0.65;
export const BENCHMARK_MINIMUM_SCORE = 0.7;

export interface MeaningfulInteractionRule {
  key: string;
  description: string;
}

export const MEANINGFUL_INTERACTION_RULES: MeaningfulInteractionRule[] = [
  {
    key: "answers_real_question",
    description:
      "The interaction responds to a concrete question or thread context.",
  },
  {
    key: "adds_new_value",
    description:
      "The reply adds insight, clarification, or a useful artifact.",
  },
  {
    key: "technically_correct",
    description:
      "The reply does not bluff and aligns with current sources.",
  },
  {
    key: "channel_fit",
    description:
      "Length, tone, and link usage fit the destination channel.",
  },
  {
    key: "non_spammy",
    description:
      "The interaction does not feel promotional or quota-driven.",
  },
];
