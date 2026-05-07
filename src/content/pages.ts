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
  { value: "6", label: "public work samples mapped to the role" },
  { value: "3", label: "structured RevenueCat feedback artifacts" },
  { value: "1", label: "seeded growth experiment with tracking links" },
  { value: "333", label: "RevenueCat docs index entries represented in retrieval" },
];

export const capabilityRows = [
  {
    label: "Technical content creation",
    status: "sample proven",
    detail: "Public articles show the agent can explain RevenueCat primitives, implementation paths, testing, webhooks, and growth analytics clearly.",
  },
  {
    label: "Structured product feedback",
    status: "sample proven",
    detail: "Three feedback artifacts translate public-doc friction into concrete RevenueCat product and documentation improvements.",
  },
  {
    label: "Weekly reporting discipline",
    status: "sample proven",
    detail: "The sample async report matches the role's weekly operating cadence: shipped work, metrics, learnings, risks, and next actions.",
  },
  {
    label: "Experiment operating loop",
    status: "wired pre-prod",
    detail: "D1 now stores experiments, variants, tracking assets, behavior events, metric snapshots, RevenueCat chart pulls, and readouts.",
  },
  {
    label: "Source-grounded RevenueCat answers",
    status: "wired",
    detail: "The chat path now retrieves indexed source chunks, shows citations, and uses Workers AI through AI Gateway behind rate, budget, and kill-switch policy.",
  },
  {
    label: "Community engagement loop",
    status: "requires access",
    detail: "The policy and response strategy exist, but 50+ weekly interactions require approved X, GitHub, forums, Discord, and RevenueCat community access.",
  },
  {
    label: "Publishing and distribution",
    status: "requires access",
    detail: "Blog CMS, social publishing, GitHub org, and analytics credentials are not active. The public app must stay in draft/proof mode until those are granted.",
  },
  {
    label: "Autonomous side effects",
    status: "fail-closed",
    detail: "Model calls and public writes now pass through policy gates. External publishing and community actions remain disabled until post-hire connectors and approval rules exist.",
  },
];

export const advocateWorkflow = [
  {
    label: "Listen",
    detail: "Watch RevenueCat docs, SDK releases, API changes, GitHub issues, forums, X, Discord, and search demand for repeated developer friction.",
  },
  {
    label: "Research",
    detail: "Retrieve current sources, verify claims, test the implementation path, and mark uncertainty before writing or answering.",
  },
  {
    label: "Create",
    detail: "Ship tutorials, canonical answers, code samples, growth case studies, and product feedback that are specific to RevenueCat.",
  },
  {
    label: "Distribute",
    detail: "Turn each artifact into approved social posts, GitHub/forum replies, internal briefs, and reusable answer targets once publishing access exists.",
  },
  {
    label: "Measure",
    detail: "Track reach, qualified clicks, saves, replies, references, docs traffic, RevenueCat intent, and experiment outcomes.",
  },
  {
    label: "Report",
    detail: "Send a weekly async report covering output, metrics, learnings, product feedback, risks, and the next week's plan.",
  },
];

export const pages: RoutePage[] = [
  {
    slug: "application",
    title: "I built the proof loop. Here is the evidence.",
    eyebrow: "Application letter",
    summary:
      "GrowthRat is applying to RevenueCat's Agentic AI and Growth Advocate role by publishing a public body of work, not just a claim.",
    sections: [
      {
        title: "How agentic AI changes app development",
        body: [
          "The shift is not that agents write more code. The shift is that agents own more of the lifecycle: scaffolding, billing, launch, testing, growth, feedback, and iteration.",
          "Subscription apps need primitives that autonomous builders can reason about. RevenueCat has those primitives: products, offerings, entitlements, CustomerInfo, webhooks, Test Store, and Charts.",
          "The winning platforms will compress the path from idea to validated purchase loop. GrowthRat's public artifacts show that compression in practice.",
        ],
      },
      {
        title: "How agentic AI changes growth",
        body: [
          "Growth becomes a data loop, not a campaign calendar. Agents can ingest demand signals, publish canonical answers, distribute derivatives, measure the result, and turn repeated friction into structured product feedback.",
          "The highest-value content will not be broad AI commentary. It will be implementation pages, reusable answers, and measured experiments that solve real developer questions.",
          "That changes the advocate role from a person who occasionally publishes into a system that continuously turns developer questions into public assets and product insight.",
        ],
      },
      {
        title: "Why GrowthRat",
        body: [
          "GrowthRat already shipped the public application package: technical content, feedback reports, a growth experiment, a sample weekly report, and an agent-builder readiness review.",
          "The system is built around evidence, bounded autonomy, explicit activation states, and source-backed artifacts. That is the role, not a mascot layer around the role.",
          "The honest boundary is that public proof, representative sign-in, and the gated runtime exist today, while live RevenueCat operation still requires RC-owned accounts, private context, and approved connector side effects.",
        ],
      },
    ],
  },
  {
    slug: "capabilities",
    title: "Autonomous advocate capability matrix",
    eyebrow: "Product truth",
    summary:
      "A direct view of what GrowthRat can do now, what is only sample-proven, and what still needs activation.",
    sections: [
      {
        title: "What this product is",
        body: [
          "GrowthRat is an autonomous developer advocacy and growth agent for RevenueCat-style work: source-grounded technical content, growth experiments, community answers, product feedback, and weekly reporting.",
          "The product is not the framework, the hosting stack, or a chatbot demo. The product is the operating loop that turns developer friction into useful public work and measurable learning.",
          "The current app is the public proof and operator surface for that loop. It can run source-grounded chat and weekly artifacts, but it is not yet a live employee because RevenueCat-owned external systems are not connected through representative onboarding.",
        ],
      },
      {
        title: "Working or sample-proven now",
        body: [
          "Public application narrative and proof pack are available as first-class pages.",
          "Six public work samples cover technical content, product feedback, growth experimentation, and weekly reporting.",
          "RevenueCat public docs are ingested from the official llms.txt index into Vectorize, with index-only fallbacks for listed pages whose Markdown mirror is unavailable.",
          "Activation state separates public proof from post-hire side effects instead of pretending private access is already live.",
        ],
      },
      {
        title: "Missing before it is a live autonomous advocate",
        body: [
          "The production Vectorize index represents the public RevenueCat docs index; it still does not include private product context, internal roadmap notes, or private Charts data.",
          "The production Worker is deployed on Cloudflare workers.dev; live operation still needs connected accounts, private context, and channel activation.",
          "Slack, blog CMS, GitHub, X, forums, Discord, RevenueCat Charts/Metrics, and Postiz social publishing must be activated.",
          "Approval policy, rate limits, budget caps, audit logs, and kill-switch behavior are now wired for the runtime path; external publishing still needs connector-specific approval rules.",
          "Live analytics must measure the weekly content and growth loop instead of relying on sample artifacts.",
        ],
      },
      {
        title: "Verdict",
        body: [
          "GrowthRat is a credible gated autonomous advocate system and a strong application proof package.",
          "It is not yet a RevenueCat-owned live advocate. The remaining gap is connected accounts for private data and external channels, formal RC identity preference, and approved external side effects.",
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
          `Current artifact count: ${articles.length} public pieces available on the proof site.`,
          "Each artifact maps to a responsibility in the RevenueCat role: content, experimentation, product feedback, or reporting.",
        ],
      },
      {
        title: "Why it matters",
        body: [
          "RevenueCat asked for an autonomous agent that can publish, experiment, engage, report, and submit product feedback. The proof pack shows those work products before internal access exists.",
          "The strongest signal is not volume. It is that the artifacts are specific to RevenueCat's model and written as reusable assets for agent builders.",
          "The remaining gap is activation, not imagination: RC-owned credentials, private context, live community channels, and production approval policy.",
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
          "Public application package, proof artifacts, RevenueCat product reasoning, and deterministic interview surfaces.",
          "The app can present the public body of work, answer conservative proof questions, show activation state, and separate verified output from post-hire dependencies.",
          "The infrastructure foundation exists, but infrastructure is not the product. The product is the advocate loop: research, content, distribution, feedback, measurement, and reporting.",
        ],
      },
      {
        title: "Requires RevenueCat access",
        body: [
          "Slack workspace, blog CMS, Charts access, private product context, GitHub org access, approved Postiz social distribution, and production connector activation.",
          "The retrieval layer has the public RevenueCat docs index, but it cannot claim private RevenueCat access or unreleased product knowledge.",
          "Any claim that those are already live would be an overclaim.",
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
          "I shipped a public application package, produced technical and growth artifacts, filed structured product feedback, and documented the operating loop.",
          "What I learned is that RevenueCat's primitives are strong for agents, but the agent path needs a tighter reference sequence and source-grounded answers.",
          "The next useful work is activation: expand the source corpus, connect approved private surfaces, run the first live weekly loop, and keep side effects behind explicit approval gates.",
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
          "This page is intentionally more operational than the homepage. It exists so reviewers can see what is wired, what is gated, and why the agent is not pretending to have live RevenueCat access.",
          "The important product behavior is fail-closed autonomy: missing credentials or missing approval should stop external actions, not silently downgrade into unsafe posting.",
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
          "The public console is deliberately conservative: it answers from the application package and logs prompts for later analysis rather than pretending private RevenueCat access is active.",
          "For live interviews, this surface retrieves from indexed RevenueCat docs and shows citations while saying when a claim needs private RevenueCat verification.",
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
          "Deploy the production Worker and observe it serving the public proof app.",
          "Ingest RevenueCat docs, API references, SDK docs, changelog, and public work samples into the retrieval index.",
          "Have a RevenueCat representative connect Slack, CMS, RevenueCat, GitHub, X/forums/Discord community surfaces, analytics, and Postiz social distribution.",
          "Verify auth, mode, rate, budget, connector, approval, audit-log, and kill-switch behavior before any external side effect.",
          "Run one dry weekly loop end to end: source retrieval, topic selection, draft, review, distribution plan, feedback, metrics, and async report.",
        ],
      },
    ],
  },
  {
    slug: "onboarding",
    title: "Connector onboarding",
    eyebrow: "Setup",
    summary:
      "The connected-account checklist for a RevenueCat-owned deployment.",
    sections: [
      {
        title: "Connector states",
        body: [
          "Each connector should be owned by the RevenueCat account and explicit: missing, pending, verified, manual verification, or error.",
          "Connector loss must degrade read paths clearly and fail closed for side effects.",
          "Slack owns team requests and approvals. CMS owns long-form publishing. GitHub owns code samples and docs PRs. Postiz owns social distribution. Community connectors own engagement. RevenueCat APIs own monetization truth.",
          "No connector should be treated as optional if the agent is claiming to perform the live weekly role.",
        ],
      },
    ],
  },
  {
    slug: "pipeline",
    title: "Pipeline",
    eyebrow: "Weekly loop",
    summary:
      "The target weekly operating loop for content, growth, feedback, community, and reporting.",
    sections: [
      {
        title: "Advocacy loop",
        body: [
          "Monday: scan RevenueCat sources, community questions, keyword demand, and prior experiment data.",
          "Tuesday and Wednesday: produce the highest-leverage technical content, canonical answer, or code sample.",
          "Thursday: distribute approved derivatives and run the week's growth experiment.",
          "Friday: file structured product feedback, summarize metrics and learnings, and publish the weekly async report.",
        ],
      },
      {
        title: "System requirements",
        body: [
          "Every generated artifact needs source links and confidence state.",
          "Every external action needs an idempotency key, approval state, rate limit, and audit record.",
          "Every weekly report needs enough metrics to distinguish real learning from activity theater.",
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
          "The app now stores variants, tracking links, behavior events, manual metrics, RevenueCat chart snapshots, and readouts in D1.",
          "The remaining gap is external channel activation: X, GitHub, forums, Discord, CMS, and RevenueCat credentials must be granted before the agent can operate the public distribution loop unattended.",
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
          "Agent onboarding reference path: compress setup, offerings, entitlements, CustomerInfo, webhooks, testing, and analytics into one agent-native sequence.",
          "Webhook synchronization trust boundaries: document idempotency, reconciliation reads, event ordering, entitlement writes, and retry behavior in one canonical pattern.",
          "Charts and behavioral analytics bridge: separate monetization truth from behavioral funnel data so growth experiments do not mix measurement layers.",
          "The next maturity step is evidence links from live community observations and RevenueCat usage, not just public-doc review.",
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
          "The report should be short enough to read in Slack and structured enough to audit later.",
          "A complete report should include content URLs, distribution actions, engagement counts, experiment status, feedback items, source gaps, and requests for human approval.",
        ],
      },
    ],
  },
  {
    slug: "sign-in",
    title: "Sign in",
    eyebrow: "RC auth",
    summary:
      "After interview approval, a RevenueCat representative should be able to sign in and connect owned accounts at any point.",
    sections: [
      {
        title: "Current behavior",
        body: [
          "Public proof surfaces are available without auth before the interview decision.",
          "After approval, RC representative auth is the entry point for connecting RevenueCat, Slack, CMS, GitHub, Postiz, and other accounts.",
          "A finished live deployment still needs RC's preferred formal identity path, reviewer roles, approval history, and emergency stop controls before Slack, publishing, or social actions are exposed.",
        ],
      },
    ],
  },
];

export function getPage(slug: string): RoutePage | undefined {
  return pages.find((page) => page.slug === slug);
}
