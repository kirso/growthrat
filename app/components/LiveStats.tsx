"use client";

import { useContext } from "react";
import { useQuery } from "convex/react";
import { ConvexAvailableContext } from "@/app/ConvexClientProvider";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let convexApi: Record<string, any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  convexApi = require("@/convex/_generated/api").api;
} catch {
  convexApi = null;
}

export function LiveStats() {
  const available = useContext(ConvexAvailableContext);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sources = available ? useQuery(convexApi?.sources?.list ?? ("__skip__" as any), convexApi?.sources?.list ? {} : "skip") : undefined;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const articles = available ? useQuery(convexApi?.artifacts?.listPublished ?? ("__skip__" as any), convexApi?.artifacts?.listPublished ? {} : "skip") : undefined;

  if (!available) {
    return (
      <div className="flex items-center gap-6 text-sm text-[var(--color-rc-muted)]">
        <span>Convex not connected yet.</span>
      </div>
    );
  }

  if (sources === undefined || articles === undefined) {
    return (
      <div className="flex items-center gap-6 text-sm text-[var(--color-rc-muted)]">
        <span>🧠 Loading live stats...</span>
      </div>
    );
  }

  const chunkCount = sources.length;
  const articleCount = articles.length;
  const pipelineCount = articles.filter((article: any) => article.metadata?.origin === "pipeline").length;
  const sampleCount = articles.filter((article: any) => article.metadata?.origin === "seed").length;

  return (
    <div className="flex flex-wrap items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[var(--color-rc-muted)]">
          <strong className="text-[var(--color-rc-dark)]">{chunkCount}</strong> RC doc chunks ingested
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-[var(--color-rc-muted)]">
          <strong className="text-[var(--color-rc-dark)]">{articleCount}</strong> total artifacts
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--color-gc-primary)]" />
        <span className="text-[var(--color-rc-muted)]">
          <strong className="text-[var(--color-rc-dark)]">{pipelineCount}</strong> activated runs /{" "}
          <strong className="text-[var(--color-rc-dark)]">{sampleCount}</strong> portfolio samples
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-violet-500" />
        <span className="text-[var(--color-rc-muted)]">
          <strong className="text-[var(--color-rc-dark)]">5</strong> autonomous tools
        </span>
      </div>
    </div>
  );
}
