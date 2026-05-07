export type ArticleType = "technical" | "feedback" | "experiment" | "report";

export type Article = {
  slug: string;
  title: string;
  type: ArticleType;
  summary: string;
  sourcePath: string;
  body: string[];
};

export const articles: Article[] = [
  {
    slug: "revenuecat-agent-monetization-benchmark",
    title: "RevenueCat Agent Monetization Benchmark",
    type: "experiment",
    sourcePath:
      "docs/public/benchmarks/revenuecat-agent-monetization-benchmark.md",
    summary:
      "A repeatable benchmark for testing whether autonomous agents can integrate, validate, and explain a RevenueCat subscription loop.",
    body: [
      "Agent-built apps need a concrete monetization benchmark, not anecdotes. This benchmark tests whether an agent can move from product prompt to validated RevenueCat subscription loop without silent entitlement, webhook, testing, or analytics mistakes.",
      "The run scores setup, SDK usage, CustomerInfo-based access checks, webhook reconciliation, growth measurement, safety, and final reporting.",
      "The immediate value for RevenueCat is a reusable way to see where agents fail, what docs they need, and which product or advocacy assets would make autonomous builders more successful."
    ],
  },
  {
    slug: "revenuecat-for-agent-built-apps",
    title: "RevenueCat for Agent-Built Apps",
    type: "technical",
    sourcePath: "docs/public/guides/revenuecat-for-agent-built-apps.md",
    summary:
      "A reference architecture for offerings, entitlements, CustomerInfo, webhooks, testing, and agent-operated access checks.",
    body: [
      "Agent-built apps need billing infrastructure with primitives an autonomous system can reason about. RevenueCat's model gives agents a clean split between store products, merchandising offerings, entitlement truth, and runtime access checks.",
      "The core implementation path is simple: configure products and entitlements, expose the current offering in the app, perform purchases through the SDK, read CustomerInfo for access decisions, and use webhooks plus subscriber reads for backend reconciliation.",
      "The important point is not only that the SDK works. It is that the whole loop can be turned into a deterministic implementation checklist that an agent can execute, test, and explain."
    ],
  },
  {
    slug: "agent-onboarding-reference-path-gap",
    title: "Agent Onboarding Reference Path Gap",
    type: "feedback",
    sourcePath: "docs/public/feedback/agent-onboarding-reference-path-gap.md",
    summary:
      "Structured product feedback on compressing RevenueCat's public docs into an agent-native implementation path.",
    body: [
      "RevenueCat's docs are strong, but an autonomous builder still has to stitch together product setup, offerings, entitlements, CustomerInfo, webhooks, and analytics from several surfaces.",
      "The fix is not a new documentation universe. It is one canonical agent-builder path that states the order of operations, runtime trust boundaries, and test loop in a compact sequence.",
      "That path would become a reusable public answer for repeated community questions and a better starting point for agents that need to move from prompt to validated subscription loop."
    ],
  },
  {
    slug: "charts-behavioral-analytics-bridge",
    title: "Charts And Behavioral Analytics Bridge",
    type: "feedback",
    sourcePath:
      "docs/public/feedback/charts-and-behavioral-analytics-bridge.md",
    summary:
      "A growth-operator feedback item separating monetization truth from behavioral analytics decisions.",
    body: [
      "RevenueCat Charts should be treated as monetization truth: revenue, conversion, retention, refunds, and subscription lifecycle metrics.",
      "Product analytics should answer behavioral questions: who saw the paywall, where onboarding dropped, what feature exposure changed, and which experiment cell produced the monetization shift.",
      "Agent-run growth loops need both. The practical improvement is a public bridge that says which decision belongs to which data source and how to combine them without mixing measurement layers."
    ],
  },
  {
    slug: "webhook-trust-boundaries",
    title: "Webhook Sync Trust Boundaries",
    type: "feedback",
    sourcePath: "docs/public/feedback/webhook-sync-trust-boundaries.md",
    summary:
      "Structured feedback on idempotency, reconciliation, and when to trust webhook events versus subscriber state.",
    body: [
      "Webhook handling is where fast agent-built apps either become production-grade or fail quietly. The risky part is not receiving the event; it is deciding how much truth to assign to it.",
      "An agent-safe pattern should cover idempotency, event ordering, reconciliation reads, entitlement writes, and retry behavior in one place.",
      "RevenueCat already exposes the necessary primitives. GrowthRat's feedback is that the trust model should be compressed into a canonical implementation pattern for autonomous builders."
    ],
  },
  {
    slug: "week-one-experiment-report",
    title: "Week-One Distribution Experiment",
    type: "experiment",
    sourcePath: "docs/public/experiments/week-one-distribution-test.md",
    summary:
      "A growth experiment brief with hypothesis, launch assets, measurement plan, and failure criteria.",
    body: [
      "Hypothesis: canonical, implementation-heavy RevenueCat content will outperform broad AI subscription commentary for agent-builder acquisition.",
      "The experiment compares technical implementation pages, structured feedback assets, and weekly-report artifacts against reach, qualified clicks, saves, replies, and downstream RevenueCat-intent signals.",
      "The key discipline is defining success and failure before launch. Growth experiments should produce learning even when they do not produce immediate traffic."
    ],
  },
  {
    slug: "week-one-async-report",
    title: "Week-One Async Check-In",
    type: "report",
    sourcePath: "docs/public/reports/week-one-async-check-in.md",
    summary:
      "A sample weekly report covering shipped work, metrics, learnings, risks, and next actions.",
    body: [
      "The weekly report is designed for a Developer Advocacy and Growth team that wants signal, not ceremony.",
      "It covers what shipped, what was measured, what friction appeared, which feedback should be filed, and what the next week should prioritize.",
      "This format is the operating proof: two content pieces, one experiment, three feedback items, community engagement, and a clean explanation of what changed."
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
