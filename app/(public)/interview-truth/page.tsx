import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Interview Truth",
  description:
    "What GrowthRat proves today, what requires activation, and what only becomes real on RevenueCat-owned infrastructure.",
};

const sections = [
  {
    title: "Proven today",
    tone: "emerald",
    items: [
      "The bounded-autonomy workflow system exists: ingest, plan, generate, validate, approve, distribute, report.",
      "Connector submissions flow through server-side handling with verified or manual-verification states.",
      "Chat, panel, public proof pages, and operator surfaces are implemented in the product.",
      "Portfolio samples show output quality and the intended operating cadence on GrowthRat infrastructure.",
    ],
  },
  {
    title: "Requires activation",
    tone: "blue",
    items: [
      "At least one live cycle must run before interview day so the system has non-seed artifacts, workflow runs, and reports.",
      "Knowledge ingestion must be populated so RAG is grounded in current RevenueCat docs.",
      "Connector verification requires real credentials and provider reachability.",
      "Go-live readiness should be based on live data, not sample content or static assumptions.",
    ],
  },
  {
    title: "Requires RC-owned assets",
    tone: "violet",
    items: [
      "Publishing to RevenueCat's blog requires RC CMS access.",
      "Posting on RC social accounts requires RC-owned Typefully social sets and human approvals.",
      "Business-metric reporting requires RC metrics access, analytics, and search-console ownership.",
      "RC-connected mode only begins after RevenueCat connects its own assets in onboarding.",
    ],
  },
  {
    title: "Not claiming",
    tone: "amber",
    items: [
      "Not a full-spectrum growth brain across paid acquisition, lifecycle CRM, pricing, and referrals.",
      "Not already operating on RevenueCat-owned channels pre-hire.",
      "Not a no-human-review system; approval remains the safe default.",
      "Not proof of RevenueCat business impact until the system runs on RevenueCat assets.",
    ],
  },
];

const toneClasses: Record<string, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  violet: "border-violet-200 bg-violet-50 text-violet-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
};

export default function InterviewTruthPage() {
  return (
    <div className="max-w-[var(--max-w-wide)] mx-auto px-6 py-16">
      <header className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-rc-surface)] text-[var(--color-rc-muted)] text-sm font-medium mb-4">
          Interview Truth
        </div>
        <h1 className="font-bold text-4xl md:text-5xl text-[var(--color-rc-dark)] leading-tight tracking-tight mb-4">
          What&apos;s proven now, what activates later.
        </h1>
        <p className="text-lg text-[var(--color-rc-muted)] leading-relaxed">
          This page exists to keep the story honest. GrowthRat is a real bounded-autonomy
          DevRel and growth operator, but not every capability is active on RevenueCat-owned
          infrastructure yet.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className={`rounded-2xl border p-6 ${toneClasses[section.tone]}`}
          >
            <h2 className="font-semibold text-xl mb-3">{section.title}</h2>
            <ul className="space-y-2 text-sm leading-relaxed">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-[var(--color-rc-border)] bg-white p-6">
        <h2 className="font-semibold text-2xl text-[var(--color-rc-dark)] mb-3">
          Pre-interview pass condition
        </h2>
        <p className="text-sm text-[var(--color-rc-muted)] leading-relaxed mb-4">
          Before anyone from RevenueCat evaluates the system live, there should be one operator-run cycle
          with real credentials: knowledge ingest, weekly plan, one generated artifact, one approval event,
          one feedback item, one experiment baseline, and one weekly report.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/go-live" className="text-sm font-medium text-[var(--color-gc-primary)] no-underline">
            Open go-live checklist
          </Link>
          <Link href="/onboarding" className="text-sm font-medium text-[var(--color-gc-primary)] no-underline">
            Open onboarding
          </Link>
        </div>
      </section>
    </div>
  );
}
