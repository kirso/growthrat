// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputSource {
  key: string;
  provider: string;
  sourceClass: string;
  description: string;
  evidenceTier: string;
  preApplyAvailable: boolean;
  connectedModeAvailable: boolean;
}

export interface OpportunityScoreWeights {
  revenucatRelevance: number;
  agentBuilderRelevance: number;
  demandSignal: number;
  noveltyDelta: number;
  artifactPotential: number;
  distributionPotential: number;
  feedbackValue: number;
  easeToExecute: number;
}

export interface WeeklyPortfolioRule {
  key: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Growth Input Matrix
// ---------------------------------------------------------------------------

export const GROWTH_INPUT_MATRIX: InputSource[] = [
  {
    key: "revenuecat_docs",
    provider: "RevenueCat",
    sourceClass: "public_product",
    description: "Public docs and guides for product truth.",
    evidenceTier: "public_product_and_competitor",
    preApplyAvailable: true,
    connectedModeAvailable: true,
  },
  {
    key: "revenuecat_github",
    provider: "RevenueCat",
    sourceClass: "public_product",
    description: "Public SDK repos and sample code.",
    evidenceTier: "public_product_and_competitor",
    preApplyAvailable: true,
    connectedModeAvailable: true,
  },
  {
    key: "revenuecat_blog_and_changelog",
    provider: "RevenueCat",
    sourceClass: "public_product",
    description:
      "Public blog and release updates for freshness and overlap detection.",
    evidenceTier: "public_product_and_competitor",
    preApplyAvailable: true,
    connectedModeAvailable: true,
  },
  {
    key: "public_community_signals",
    provider: "GitHub/X/Forums/Discord",
    sourceClass: "public_demand",
    description: "Repeated questions and discussions from public channels.",
    evidenceTier: "public_product_and_competitor",
    preApplyAvailable: true,
    connectedModeAvailable: true,
  },
  {
    key: "dataforseo_labs",
    provider: "DataForSEO",
    sourceClass: "market_intelligence",
    description:
      "Keyword ideas, ranked keywords, and competitor intersections.",
    evidenceTier: "public_market_intelligence",
    preApplyAvailable: true,
    connectedModeAvailable: true,
  },
  {
    key: "dataforseo_serp",
    provider: "DataForSEO",
    sourceClass: "market_intelligence",
    description: "Live SERP structure and intent validation.",
    evidenceTier: "public_market_intelligence",
    preApplyAvailable: true,
    connectedModeAvailable: true,
  },
  {
    key: "dataforseo_ai_optimization",
    provider: "DataForSEO",
    sourceClass: "market_intelligence",
    description: "AI-keyword opportunity and LLM mention visibility.",
    evidenceTier: "public_market_intelligence",
    preApplyAvailable: true,
    connectedModeAvailable: true,
  },
  {
    key: "dataforseo_content_analysis",
    provider: "DataForSEO",
    sourceClass: "market_intelligence",
    description: "Topic, mention, and phrase trend analysis.",
    evidenceTier: "public_market_intelligence",
    preApplyAvailable: true,
    connectedModeAvailable: true,
  },
  {
    key: "search_console",
    provider: "Google Search Console",
    sourceClass: "connected_search",
    description: "First-party search performance and query data.",
    evidenceTier: "connected_search_and_content",
    preApplyAvailable: false,
    connectedModeAvailable: true,
  },
  {
    key: "ga4",
    provider: "Google Analytics",
    sourceClass: "connected_analytics",
    description: "Site-level engagement and traffic measurement.",
    evidenceTier: "connected_search_and_content",
    preApplyAvailable: false,
    connectedModeAvailable: true,
  },
  {
    key: "posthog",
    provider: "PostHog",
    sourceClass: "connected_analytics",
    description: "Product and content behavioral analytics.",
    evidenceTier: "connected_search_and_content",
    preApplyAvailable: false,
    connectedModeAvailable: true,
  },
  {
    key: "revenuecat_charts",
    provider: "RevenueCat",
    sourceClass: "connected_product",
    description:
      "Receipt-based subscription analytics and monetization metrics.",
    evidenceTier: "connected_first_party",
    preApplyAvailable: false,
    connectedModeAvailable: true,
  },
];

// ---------------------------------------------------------------------------
// Opportunity Scoring Weights
// ---------------------------------------------------------------------------

export const DEFAULT_OPPORTUNITY_SCORE_WEIGHTS: OpportunityScoreWeights = {
  revenucatRelevance: 0.2,
  agentBuilderRelevance: 0.15,
  demandSignal: 0.15,
  noveltyDelta: 0.15,
  artifactPotential: 0.1,
  distributionPotential: 0.1,
  feedbackValue: 0.1,
  easeToExecute: 0.05,
};

/** Canonical key order used by scoreOpportunity. */
const WEIGHT_KEYS: (keyof OpportunityScoreWeights)[] = [
  "revenucatRelevance",
  "agentBuilderRelevance",
  "demandSignal",
  "noveltyDelta",
  "artifactPotential",
  "distributionPotential",
  "feedbackValue",
  "easeToExecute",
];

// ---------------------------------------------------------------------------
// Weekly Portfolio Rules
// ---------------------------------------------------------------------------

export const WEEKLY_PORTFOLIO_RULES: WeeklyPortfolioRule[] = [
  {
    key: "one_searchable_flagship",
    description:
      "Every week must ship at least one searchable flagship artifact.",
  },
  {
    key: "one_shareable_or_referenceable_flagship",
    description:
      "Every week must ship at least one shareable or referenceable flagship artifact.",
  },
  {
    key: "derivatives_for_each_flagship",
    description:
      "Every flagship artifact must produce channel-specific derivatives.",
  },
  {
    key: "one_experiment_linked_to_flagship",
    description:
      "Each week must run one experiment tied to a flagship asset or query cluster.",
  },
];

// ---------------------------------------------------------------------------
// KPI Tree
// ---------------------------------------------------------------------------

export const KPI_TREE: Record<string, string[]> = {
  awareness: [
    "search_visibility",
    "ai_mentions",
    "impressions",
    "inbound_mentions",
  ],
  engagement: ["engaged_sessions", "replies", "saves", "repo_visits"],
  authority: [
    "references",
    "citations",
    "canonical_answer_reuse",
    "linked_mentions",
  ],
  activation: [
    "demo_repo_visits",
    "repo_clones",
    "docs_visits",
    "signup_intent_proxy",
  ],
  product_impact: [
    "feedback_items_acknowledged",
    "docs_prs_merged",
    "product_improvements_influenced",
  ],
};

// ---------------------------------------------------------------------------
// Opportunity Lanes
// ---------------------------------------------------------------------------

export const OPPORTUNITY_LANES = [
  "flagship_searchable",
  "flagship_shareable",
  "experiment",
  "docs_update",
  "canonical_answer",
  "derivative_only",
  "product_feedback",
] as const;

export type OpportunityLane = (typeof OPPORTUNITY_LANES)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getGrowthInputMatrix(
  preApplyOnly = false,
): InputSource[] {
  if (!preApplyOnly) return GROWTH_INPUT_MATRIX;
  return GROWTH_INPUT_MATRIX.filter((s) => s.preApplyAvailable);
}

export function weightsAsRecord(
  weights: OpportunityScoreWeights,
): Record<string, number> {
  const rec: Record<string, number> = {};
  for (const k of WEIGHT_KEYS) {
    rec[k] = weights[k];
  }
  return rec;
}

/**
 * Score an opportunity given per-component scores (0-1) and a weight set.
 * Mirrors the Python `score_opportunity` function exactly.
 */
export function scoreOpportunity(
  components: Record<string, number>,
  weights: OpportunityScoreWeights = DEFAULT_OPPORTUNITY_SCORE_WEIGHTS,
): number {
  const weightMap = weightsAsRecord(weights);

  const missing = Object.keys(weightMap)
    .filter((k) => !(k in components))
    .sort();
  if (missing.length > 0) {
    throw new Error(`Missing score components: ${missing.join(", ")}`);
  }

  let total = 0;
  for (const [key, weight] of Object.entries(weightMap)) {
    const value = components[key];
    if (value < 0 || value > 1) {
      throw new Error(`Component ${key} must be between 0.0 and 1.0`);
    }
    total += value * weight;
  }

  return Math.round(total * 1e6) / 1e6;
}
