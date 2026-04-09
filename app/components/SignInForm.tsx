"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forbidden = useMemo(
    () => searchParams.get("error") === "forbidden",
    [searchParams]
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (result.error) throw new Error(result.error.message);
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });
        if (result.error) throw new Error(result.error.message);
      }

      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-[var(--color-rc-border)] bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-gc-primary)]">
          Authenticated activation
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--color-rc-dark)]">
          Sign in to connect RevenueCat assets
        </h1>
        <p className="mt-3 text-sm text-[var(--color-rc-muted)]">
          Only approved operator and RevenueCat admin accounts can access onboarding and operator controls.
        </p>
      </div>

      {forbidden && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your account is signed in, but it is not allowlisted for RC activation.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "sign-up" && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--color-rc-dark)]">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-rc-border)] px-4 py-3 text-sm"
              placeholder="RevenueCat Admin"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[var(--color-rc-dark)]">
            Email
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-rc-border)] px-4 py-3 text-sm"
            placeholder="you@revenuecat.com"
            type="email"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-[var(--color-rc-dark)]">
            Password
          </span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-rc-border)] px-4 py-3 text-sm"
            placeholder="••••••••"
            type="password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[var(--color-gc-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-gc-primary-hover)] disabled:opacity-60"
        >
          {submitting ? "Working..." : mode === "sign-up" ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"))}
        className="mt-4 text-sm text-[var(--color-gc-primary)]"
      >
        {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
