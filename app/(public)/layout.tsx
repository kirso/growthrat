import type { Metadata } from "next";
import Link from "next/link";
import { ChatWidget } from "@/app/components/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "GrowthRat",
    template: "%s | GrowthRat",
  },
  description:
    "An autonomous developer-advocacy and growth agent applying to be RevenueCat's first Agentic AI & Growth Advocate.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[var(--color-rc-text)]">
      {/* Nav */}
      <header className="border-b border-[var(--color-rc-border)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-[var(--max-w-wide)] mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 no-underline"
          >
            <span className="text-2xl">🐭</span>
            <span className="font-bold text-lg text-[var(--color-rc-dark)] tracking-tight">
              GrowthRat
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-8">
            <Link
              href="/application"
              className="text-sm font-medium text-[var(--color-gc-primary)] hover:text-[var(--color-gc-primary-hover)] transition-colors no-underline"
            >
              Application
            </Link>
            <Link
              href="/proof-pack"
              className="text-sm font-medium text-[var(--color-rc-muted)] hover:text-[var(--color-rc-dark)] transition-colors no-underline"
            >
              Proof Pack
            </Link>
            <Link
              href="/readiness-review"
              className="text-sm font-medium text-[var(--color-rc-muted)] hover:text-[var(--color-rc-dark)] transition-colors no-underline"
            >
              Readiness Review
            </Link>
            <Link
              href="/operator-replay"
              className="text-sm font-medium text-[var(--color-rc-muted)] hover:text-[var(--color-rc-dark)] transition-colors no-underline"
            >
              How It Works
            </Link>
            <Link
              href="/onboarding"
              className="text-sm font-medium text-[var(--color-rc-muted)] hover:text-[var(--color-rc-dark)] transition-colors no-underline"
            >
              Onboarding
            </Link>
            <a
              href="https://github.com/kirso/growthrat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--color-rc-muted)] hover:text-[var(--color-rc-dark)] transition-colors no-underline"
            >
              GitHub
            </a>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Chat Widget — RC can talk to GrowthRat on any public page */}
      <ChatWidget />

      {/* Footer */}
      <footer className="border-t border-[var(--color-rc-border)] mt-20">
        <div className="max-w-[var(--max-w-wide)] mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🐭</span>
                <span className="font-bold text-[var(--color-rc-dark)]">
                  GrowthRat
                </span>
              </div>
              <p className="text-sm text-[var(--color-rc-muted)] max-w-sm">
                An autonomous developer-advocacy and growth agent applying to be
                RevenueCat&apos;s first Agentic AI &amp; Growth Advocate.
              </p>
              <p className="text-xs text-[var(--color-rc-muted)] mt-3 italic">
                GrowthRat is an independent agent, not a RevenueCat-owned
                property.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div>
                <h4 className="font-semibold text-[var(--color-rc-dark)] mb-3">
                  Proof
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/application"
                      className="text-[var(--color-rc-muted)] hover:text-[var(--color-gc-primary)] transition-colors no-underline"
                    >
                      Application Letter
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/proof-pack"
                      className="text-[var(--color-rc-muted)] hover:text-[var(--color-gc-primary)] transition-colors no-underline"
                    >
                      Proof Pack
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/readiness-review"
                      className="text-[var(--color-rc-muted)] hover:text-[var(--color-gc-primary)] transition-colors no-underline"
                    >
                      Readiness Review
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/operator-replay"
                      className="text-[var(--color-rc-muted)] hover:text-[var(--color-gc-primary)] transition-colors no-underline"
                    >
                      Operator Replay
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[var(--color-rc-dark)] mb-3">
                  Content
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/articles"
                      className="text-[var(--color-rc-muted)] hover:text-[var(--color-gc-primary)] transition-colors no-underline"
                    >
                      All Articles
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
