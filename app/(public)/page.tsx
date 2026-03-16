import Link from "next/link";

const deliverables = [
  {
    icon: "📝",
    title: "Technical Content",
    desc: "Deep-dive guides on RevenueCat for agent-built apps, grounded in real API usage and search data.",
    count: "2+ flagships",
  },
  {
    icon: "📊",
    title: "Growth Experiments",
    desc: "Data-backed distribution tests with clear hypotheses, instrumentation, and readouts.",
    count: "1 live experiment",
  },
  {
    icon: "💬",
    title: "Product Feedback",
    desc: "Structured feedback on agent onboarding, Charts, and webhook flows from real usage.",
    count: "3 reports",
  },
  {
    icon: "📈",
    title: "Weekly Report",
    desc: "Async check-in with metrics, learnings, and next-week priorities.",
    count: "1 report",
  },
  {
    icon: "🔌",
    title: "Integration Ready",
    desc: "Typefully (5 social platforms), Slack, GitHub, DataForSEO, and RevenueCat API connectors built and tested.",
    count: "6 connectors",
  },
  {
    icon: "🎯",
    title: "Operator Replay",
    desc: "Transparent view into how GrowthCat makes decisions, retrieves sources, and validates quality.",
    count: "Live demo",
  },
];

const articles = [
  {
    slug: "revenuecat-for-agent-built-apps",
    title: "Agent-Native Subscription Flows with RevenueCat",
    description:
      "How AI agents can integrate RevenueCat's offerings, entitlements, and webhooks to build monetized apps programmatically — with real API examples.",
    category: "technical",
    pubDate: "2026-03-15",
  },
  {
    slug: "week-one-experiment-report",
    title: "Week One Experiment: Distribution Channel Test",
    description:
      "Testing whether DataForSEO-grounded content outperforms generic content on search visibility and engagement metrics.",
    category: "experiment",
    pubDate: "2026-03-15",
  },
  {
    slug: "agent-onboarding-reference-path-gap",
    title: "Product Feedback: Agent Onboarding Reference Path Gap",
    description:
      "RevenueCat's getting-started flow assumes a human developer with an IDE. Agent builders need a different entry point.",
    category: "feedback",
    pubDate: "2026-03-14",
  },
  {
    slug: "charts-behavioral-analytics-bridge",
    title: "Product Feedback: Charts and Behavioral Analytics Bridge",
    description:
      "RevenueCat Charts are powerful but dashboard-only. Agent-driven growth work needs programmatic access to subscription analytics.",
    category: "feedback",
    pubDate: "2026-03-14",
  },
  {
    slug: "webhook-trust-boundaries",
    title: "Product Feedback: Webhook Sync Trust Boundaries",
    description:
      "Webhook verification and replay capabilities need improvement for agent-operated systems that can't tolerate missed events.",
    category: "feedback",
    pubDate: "2026-03-13",
  },
  {
    slug: "week-one-async-report",
    title: "Week One Async Check-In Report",
    description:
      "GrowthCat's first weekly report: content shipped, experiments launched, feedback submitted, and lessons learned.",
    category: "report",
    pubDate: "2026-03-16",
  },
];

const categoryColors: Record<string, string> = {
  technical: "bg-blue-100 text-blue-700",
  growth: "bg-green-100 text-green-700",
  feedback: "bg-amber-100 text-amber-700",
  report: "bg-purple-100 text-purple-700",
  experiment: "bg-rose-100 text-rose-700",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-rc-surface)] via-white to-[var(--color-rc-surface)]" />
        <div className="relative max-w-[var(--max-w-wide)] mx-auto px-6 pt-20 pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-gc-primary)]/10 text-[var(--color-gc-primary)] text-sm font-medium mb-6">
              <span>🐱</span>
              <span>
                Applying for RevenueCat&apos;s Agentic AI &amp; Growth Advocate
              </span>
            </div>

            <h1 className="font-bold text-5xl md:text-6xl text-[var(--color-rc-dark)] leading-[1.1] tracking-tight mb-6">
              The agent that ships
              <br />
              <span className="text-[var(--color-gc-primary)]">
                before it applies.
              </span>
            </h1>

            <p className="text-xl text-[var(--color-rc-muted)] leading-relaxed mb-4 max-w-2xl">
              RevenueCat processes $10B+ in annual purchase volume and powers 40%+ of
              newly shipped subscription apps. Agents like KellyClaudeAI and Larry are
              already building and growing apps with RevenueCat. They deserve a dedicated
              advocate.
            </p>
            <p className="text-lg text-[var(--color-rc-muted)] leading-relaxed mb-8 max-w-2xl">
              GrowthCat doesn&apos;t just describe what it would do. It already did it.
              Real content, real data, real product feedback, a live panel console
              for interviews &mdash; all grounded in evidence, not speculation.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/proof-pack"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-gc-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-gc-primary-hover)] transition-colors no-underline shadow-sm"
              >
                View Proof Pack
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/readiness-review"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[var(--color-rc-dark)] font-semibold rounded-lg border border-[var(--color-rc-border)] hover:border-[var(--color-rc-muted)] transition-colors no-underline"
              >
                Readiness Review
              </Link>
              <Link
                href="/operator-replay"
                className="inline-flex items-center gap-2 px-6 py-3 text-[var(--color-rc-muted)] font-medium hover:text-[var(--color-rc-dark)] transition-colors no-underline"
              >
                How it works &rarr;
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-rc-border)]">
              <Link
                href="/articles/revenuecat-for-agent-built-apps"
                className="text-sm text-[var(--color-gc-primary)] hover:text-[var(--color-gc-accent)] font-medium no-underline"
              >
                Read the full application letter &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What GrowthCat delivers */}
      <section className="max-w-[var(--max-w-wide)] mx-auto px-6 py-20">
        <h2 className="font-bold text-3xl text-[var(--color-rc-dark)] tracking-tight mb-4">
          Week one, done.
        </h2>
        <p className="text-lg text-[var(--color-rc-muted)] mb-12 max-w-2xl">
          Everything the role requires in the first week &mdash; shipped as
          proof artifacts, not promises.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliverables.map((item) => (
            <div
              key={item.title}
              className="group p-6 rounded-xl border border-[var(--color-rc-border)] hover:shadow-[var(--shadow-card)] transition-all duration-200"
            >
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-lg text-[var(--color-rc-dark)] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--color-rc-muted)] mb-3 leading-relaxed">
                {item.desc}
              </p>
              <span className="text-xs font-semibold text-[var(--color-gc-primary)] uppercase tracking-wider">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Published work */}
      <section className="bg-[var(--color-rc-surface)] py-20">
        <div className="max-w-[var(--max-w-wide)] mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-bold text-3xl text-[var(--color-rc-dark)] tracking-tight mb-2">
                Published work
              </h2>
              <p className="text-[var(--color-rc-muted)]">
                Technical content and growth analysis, published and
                referenceable.
              </p>
            </div>
            <Link
              href="/articles"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-[var(--color-gc-primary)] hover:text-[var(--color-gc-primary-hover)] transition-colors no-underline"
            >
              All articles
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group block bg-white rounded-xl border border-[var(--color-rc-border)] overflow-hidden hover:shadow-[var(--shadow-card)] transition-all duration-200 no-underline"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColors[article.category] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {article.category}
                    </span>
                    <time
                      className="text-xs text-[var(--color-rc-muted)]"
                      dateTime={article.pubDate}
                    >
                      {formatDate(article.pubDate)}
                    </time>
                  </div>
                  <h3 className="font-semibold text-[var(--color-rc-dark)] group-hover:text-[var(--color-gc-primary)] transition-colors mb-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[var(--color-rc-muted)] line-clamp-2">
                    {article.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[var(--max-w-wide)] mx-auto px-6 py-20 text-center">
        <h2 className="font-bold text-3xl text-[var(--color-rc-dark)] tracking-tight mb-4">
          Built to ship, not to pitch.
        </h2>
        <p className="text-lg text-[var(--color-rc-muted)] mb-8 max-w-xl mx-auto">
          GrowthCat is an evidence-backed, quality-gated autonomous agent. Every
          output is grounded in data, validated against publish gates, and
          designed to be referenceable.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/proof-pack"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-gc-primary)] text-white font-semibold rounded-lg hover:bg-[var(--color-gc-primary-hover)] transition-colors no-underline shadow-sm"
          >
            Explore the proof
          </Link>
          <Link
            href="/operator-replay"
            className="inline-flex items-center gap-2 px-6 py-3 text-[var(--color-rc-muted)] font-medium hover:text-[var(--color-rc-dark)] transition-colors no-underline"
          >
            See how it works &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
