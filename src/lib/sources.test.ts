import { describe, expect, it } from "vitest";
import {
  extractSourceSearchTerms,
  getExpectedSourceCorpusStats,
  parseRevenueCatDocsIndex,
  sourceIdForDocument,
} from "./sources";
import type { SourceCorpusDocument } from "./source-corpus";

describe("RevenueCat docs index parsing", () => {
  it("parses unique llms.txt entries and maps them to Markdown mirrors", () => {
    const entries = parseRevenueCatDocsIndex(
      [
        "# RevenueCat Docs",
        "- /projects/overview - Projects overview",
        "- /api-v2/ - API v2 reference",
        "- /projects/overview - Duplicate should be ignored",
      ].join("\n"),
    );

    expect(entries).toEqual([
      {
        path: "/projects/overview",
        description: "Projects overview",
        url: "https://www.revenuecat.com/docs/projects/overview",
        markdownUrl: "https://www.revenuecat.com/docs/projects/overview.md",
      },
      {
        path: "/api-v2/",
        description: "API v2 reference",
        url: "https://www.revenuecat.com/docs/api-v2",
        markdownUrl: "https://www.revenuecat.com/docs/api-v2.md",
      },
    ]);
  });
});

describe("bundled source corpus stats", () => {
  const documents: SourceCorpusDocument[] = [
    {
      id: "GrowthRat Proof",
      sourceType: "growthrat_artifact",
      title: "GrowthRat Proof",
      url: "/proof",
      retrievedAt: "2026-05-08",
      content: "A".repeat(1401),
    },
    {
      id: "RevenueCat Docs",
      sourceType: "revenuecat_docs",
      title: "RevenueCat Docs",
      url: "https://www.revenuecat.com/docs",
      retrievedAt: "2026-05-08",
      content: "short",
    },
  ];

  it("uses the same stable source ids as ingestion", () => {
    expect(sourceIdForDocument(documents[0])).toBe("growthrat-proof");
  });

  it("reports expected document and chunk counts by source type", () => {
    expect(getExpectedSourceCorpusStats(documents)).toEqual({
      documents: 2,
      chunks: 3,
      sourceIds: ["growthrat-proof", "revenuecat-docs"],
      byType: [
        {
          sourceType: "growthrat_artifact",
          documents: 1,
          chunks: 2,
        },
        {
          sourceType: "revenuecat_docs",
          documents: 1,
          chunks: 1,
        },
      ],
    });
  });
});

describe("source lexical search terms", () => {
  it("keeps discriminating product terms and drops filler words", () => {
    expect(
      extractSourceSearchTerms(
        "What does GrowthRat say in its RevenueCat Agent Readiness Review?",
      ),
    ).toEqual(["growthrat", "revenuecat", "agent", "readiness", "review"]);
  });
});
