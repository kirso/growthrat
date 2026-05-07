import { describe, expect, it } from "vitest";
import { parseRevenueCatDocsIndex } from "./sources";

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
