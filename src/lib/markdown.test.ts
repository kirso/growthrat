import { describe, expect, it } from "vitest";
import { markdownToHtml } from "./markdown";

describe("markdownToHtml", () => {
  it("renders headings, links, inline code, bullets, and tables safely", () => {
    const html = markdownToHtml([
      "# Title",
      "",
      "Use `CustomerInfo` and [RevenueCat](/articles/revenuecat-for-agent-built-apps).",
      "",
      "- Products",
      "- Entitlements",
      "",
      "| Gate | Evidence |",
      "| --- | --- |",
      "| Safety | No secret <leaks> |",
    ].join("\n"));

    expect(html).toContain('<h1 id="title">Title</h1>');
    expect(html).toContain("<code>CustomerInfo</code>");
    expect(html).toContain(
      '<a href="/articles/revenuecat-for-agent-built-apps">RevenueCat</a>',
    );
    expect(html).toContain("<li>Products</li>");
    expect(html).toContain("<td>No secret &lt;leaks&gt;</td>");
  });
});
