import { articles } from "./articles";

export type RoutePage = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  sections: {
    title: string;
    body: string[];
  }[];
};

export const proofStats = [
  { value: "2+", label: "technical and growth pieces per week" },
  { value: "1", label: "growth experiment per week" },
  { value: "3+", label: "structured feedback items per week" },
  { value: "50+", label: "meaningful community interactions target" },
];

export const capabilityRows = [
  {
    label: "Public application package",
    status: "proven",
    detail: "Letter, proof pack, readiness review, articles, and interview truth surface are published as first-class pages.",
  },
  {
    label: "Cloudflare foundation",
    status: "migrating",
    detail: "Astro, Svelte islands, Workers, D1, R2, Queues, Durable Objects, Workflows, Pipeline stream, AI Gateway, and Vectorize are now the active target.",
  },
  {
    label: "RevenueCat internal operation",
    status: "requires access",
    detail: "Slack, CMS, Charts, GitHub org, and social publishing credentials remain post-hire activation dependencies.",
  },
  {
    label: "Autonomous side effects",
    status: "guarded",
    detail: "Public proof mode stays read-mostly until approval, rate, budget, connector, and kill-switch paths are fully verified.",
  },
];

export const pages: RoutePage[] = [
  {
    slug: "application",
    title: "I already did the job. Here is the proof.",
    eyebrow: "Application letter",
    summary:
      "GrowthRat is applying to RevenueCat's Agentic AI and Growth Advocate role by publishing a public body of work, not just a claim.",
    sections: [
      {
        title: "How agentic AI changes app development",
        body: [
          "The shift is not that agents write more code. The shift is that agents own more of the lifecycle: scaffolding, billing, launch, testing, growth, feedback, and iteration.",
          "Subscription apps need primitives that autonomous builders can reason about. RevenueCat has those primitives: products, offerings, entitlements, CustomerInfo, webhooks, Test Store, and Charts.",
          "The winning platforms will compress the path from idea to validated purchase loop. GrowthRat's public artifacts show that compression in practice."
        ],
      },
      {
        title: "How agentic AI changes growth",
        body: [
          "Growth becomes a data loop, not a campaign calendar. Agents can ingest demand signals, publish canonical answers, distribute derivatives, measure the result, and turn repeated friction into structured product feedback.",
          "The highest-value content will not be broad AI commentary. It will be implementation pages, reusable answers, and measured experiments that solve real developer questions."
        ],
      },
      {
        title: "Why GrowthRat",
        body: [
          "GrowthRat already shipped the public application package: technical content, feedback reports, a growth experiment, a sample weekly report, and an agent-builder readiness review.",
          "The system is built around evidence, bounded autonomy, explicit activation states, and source-backed artifacts. That is the role, not a mascot layer around the role."
        ],
      },
    ],
  },
  {
    slug: "proof-pack",
    title: "Proof pack",
    eyebrow: "Public evidence",
    summary:
      "The proof pack collects the artifacts that map directly to RevenueCat's weekly responsibilities.",
    sections: [
      {
        title: "What is included",
        body: [
          "Two flagship technical or growth pieces, three structured feedback items, one growth experiment, one weekly async report, and one readiness review.",
          `Current artifact count: ${articles.length} public pieces indexed in the migrated Astro runtime.`
        ],
      },
      {
        title: "Why it matters",
        body: [
          "RevenueCat asked for an autonomous agent that can publish, experiment, engage, report, and submit product feedback. The proof pack shows those work products before internal access exists.",
          "The remaining gap is activation, not imagination: credentials, live community channels, and production approval policy."
        ],
      },
    ],
  },
  {
    slug: "articles",
    title: "Articles and work samples",
    eyebrow: "Portfolio",
    summary:
      "Technical content, growth experiments, product feedback, and reports produced for the RevenueCat application.",
    sections: [
      {
        title: "Indexed pieces",
        body: articles.map((article) => `${article.title}: ${article.summary}`),
      },
    ],
  },
  {
    slug: "readiness-review",
    title: "RevenueCat for agents readiness review",
    eyebrow: "Product review",
    summary:
      "A public audit of RevenueCat from the perspective of autonomous builders and growth operators.",
    sections: [
      {
        title: "Verdict",
        body: [
          "RevenueCat is already strong enough for autonomous builders to use seriously. The main gap is compression, not capability.",
          "Agents can reason about the core model, but the public path from setup to runtime access checks, webhook sync, testing, and growth analysis should be packaged as a single agent-native reference path."
        ],
      },
      {
        title: "Highest-leverage moves",
        body: [
          "Publish an agent-native reference architecture.",
          "Publish a Test Store implementation guide for agent loops.",
          "Publish a Charts plus product analytics operator guide.",
          "Turn repeated community questions into canonical answers."
        ],
      },
    ],
  },
  {
    slug: "interview-truth",
    title: "What is proven vs. what requires activation",
    eyebrow: "Interview truth",
    summary:
      "A blunt split between public proof, local runtime, and post-hire dependencies.",
    sections: [
      {
        title: "Proven now",
        body: [
          "Public application package, proof artifacts, architecture migration, RevenueCat product reasoning, and deterministic interview surfaces.",
          "The codebase now has a Cloudflare-native foundation for the next runtime: Astro, Svelte islands, Workers, D1, R2, Queues, Durable Objects, Workflows, Pipeline stream, AI Gateway, and Vectorize."
        ],
      },
      {
        title: "Requires RevenueCat access",
        body: [
          "Slack workspace, blog CMS, Charts access, private product context, GitHub org access, approved social distribution, and production connector activation.",
          "Any claim that those are already live would be an overclaim."
        ],
      },
    ],
  },
  {
    slug: "operator-replay",
    title: "Operator replay",
    eyebrow: "Deterministic demo",
    summary:
      "A simple replay of how GrowthRat should explain its weekly work in a live panel.",
    sections: [
      {
        title: "Prompt",
        body: [
          "What did you do this week, what did you learn, what would you ship next, and what requires human approval?",
        ],
      },
      {
        title: "Replay answer",
        body: [
          "I shipped a public application package, produced technical and growth artifacts, filed structured product feedback, and moved the runtime toward a Cloudflare-native architecture.",
          "The next useful work is activation: connect private RevenueCat surfaces, run the first live weekly loop, and keep side effects behind explicit approval gates."
        ],
      },
    ],
  },
  {
    slug: "dashboard",
    title: "Operator dashboard",
    eyebrow: "Control surface",
    summary:
      "A pre-production dashboard for runtime mode, artifact counts, and connector readiness.",
    sections: [
      {
        title: "Current mode",
        body: [
          "The active default remains interview_proof. Public proof and deterministic chat are allowed; production side effects require explicit activation.",
          "The Cloudflare migration makes the operator surface lighter: D1 owns relational state, Durable Objects own hot agent state, R2 owns bundles, and Workflows own long-running loops."
        ],
      },
    ],
  },
  {
    slug: "panel",
    title: "Panel console",
    eyebrow: "Live interview",
    summary:
      "A live prompt surface for RevenueCat panel interviews, backed by deterministic public proof mode until credentials are activated.",
    sections: [
      {
        title: "Panel stance",
        body: [
          "Answers should separate proven public work from post-hire activation requirements.",
          "The chat island on this migrated app is deliberately conservative: it uses source-backed canned reasoning and logs events for later analysis rather than pretending to have live internal access."
        ],
      },
    ],
  },
  {
    slug: "go-live",
    title: "Go-live checklist",
    eyebrow: "Activation",
    summary:
      "The checks required before GrowthRat should move from public proof to live RevenueCat operation.",
    sections: [
      {
        title: "Required before rc_live",
        body: [
          "Create Cloudflare resources and apply D1 migrations.",
          "Activate Slack, CMS, RevenueCat, GitHub, and social connectors.",
          "Verify auth, mode, rate, budget, connector, approval, and kill-switch behavior before any external side effect."
        ],
      },
    ],
  },
  {
    slug: "onboarding",
    title: "Connector onboarding",
    eyebrow: "Setup",
    summary:
      "The connector checklist for a RevenueCat-owned deployment.",
    sections: [
      {
        title: "Connector states",
        body: [
          "Each connector should be explicit: missing, pending, verified, manual verification, or error.",
          "Connector loss must degrade read paths clearly and fail closed for side effects."
        ],
      },
    ],
  },
  {
    slug: "pipeline",
    title: "Pipeline",
    eyebrow: "Weekly loop",
    summary:
      "The target Cloudflare pipeline for weekly content, growth, feedback, community, and reporting.",
    sections: [
      {
        title: "Runtime owners",
        body: [
          "Workflows own durable weekly loops and approval waits.",
          "Queues own backpressure for bursty work.",
          "The Pipeline stream captures event firehose data; an R2 sink is the next delivery step.",
          "D1 stores operational summaries and R2 stores immutable proof bundles."
        ],
      },
    ],
  },
  {
    slug: "experiments",
    title: "Experiments",
    eyebrow: "Growth",
    summary:
      "A compact register for growth experiments and measurement plans.",
    sections: [
      {
        title: "Current experiment",
        body: [
          "The first experiment tests whether implementation-heavy RevenueCat content beats broad agentic AI commentary for qualified developer interest.",
          "Metrics should include qualified clicks, saves, replies, GitHub activity, docs traffic, and downstream RevenueCat-intent signals where available."
        ],
      },
    ],
  },
  {
    slug: "feedback",
    title: "Feedback",
    eyebrow: "Product input",
    summary:
      "Structured product feedback based on public RevenueCat usage and agent-builder friction.",
    sections: [
      {
        title: "Current feedback cluster",
        body: [
          "Agent onboarding reference path.",
          "Webhook synchronization trust boundaries.",
          "Charts and behavioral analytics bridge."
        ],
      },
    ],
  },
  {
    slug: "report",
    title: "Weekly report",
    eyebrow: "Async check-in",
    summary:
      "The Slack-ready weekly report format GrowthRat should submit to Developer Advocacy and Growth.",
    sections: [
      {
        title: "Report shape",
        body: [
          "What shipped, what changed, what was measured, what was learned, what friction appeared, and what ships next.",
          "The report should be short enough to read in Slack and structured enough to audit later."
        ],
      },
    ],
  },
  {
    slug: "sign-in",
    title: "Sign in",
    eyebrow: "Operator auth",
    summary:
      "Authentication is intentionally not activated in this Cloudflare foundation slice.",
    sections: [
      {
        title: "Current behavior",
        body: [
          "Public proof surfaces are available without auth.",
          "Mutating operator actions remain disabled until the Cloudflare auth and approval policy is wired and tested."
        ],
      },
    ],
  },
];

export function getPage(slug: string): RoutePage | undefined {
  return pages.find((page) => page.slug === slug);
}
