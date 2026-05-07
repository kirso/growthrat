import { describe, expect, it } from "vitest";
import { markdownToHtml } from "./markdown";

describe("markdownToHtml", () => {
  it("renders headings, links, inline code, lists, code blocks, and tables safely", () => {
    const html = markdownToHtml([
      "# Title",
      "",
      "Use `CustomerInfo` and [RevenueCat](/articles/revenuecat-for-agent-built-apps).",
      "",
      "- Products",
      "- Entitlements",
      "",
      "1. Configure offerings",
      "2. Read `CustomerInfo`",
      "",
      "```text",
      "app -> RevenueCat <truth>",
      "```",
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
    expect(html).toContain(
      "<ol><li>Configure offerings</li><li>Read <code>CustomerInfo</code></li></ol>",
    );
    expect(html).toContain(
      '<pre><code class="language-text">app -&gt; RevenueCat &lt;truth&gt;</code></pre>',
    );
    expect(html).toContain("<td>No secret &lt;leaks&gt;</td>");
  });
});
