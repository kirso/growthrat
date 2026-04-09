/**
 * CMS publishing — creates or updates article content.
 *
 * Strategy:
 * 1. Pre-hire: publish to GitHub repo as markdown files (triggers rebuild)
 * 2. Post-hire: publish to RevenueCat's blog CMS via their API
 *
 * For now, we publish by committing markdown files to the repo.
 * When deployed on Vercel, this triggers a rebuild automatically.
 */

export interface ArticleContent {
  slug: string;
  title: string;
  description: string;
  category: "technical" | "growth" | "feedback" | "report" | "experiment";
  content: string; // markdown
  pubDate?: string; // ISO date, defaults to now
}

export async function publishArticle(
  article: ArticleContent
): Promise<{ published: boolean; url?: string; method: string; state: "built" | "activated" | "rc-connected"; reason?: string }> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER ?? "kirso";
  const repo = process.env.GITHUB_CONTENT_REPO ?? process.env.GITHUB_REPO ?? "growthcat";

  if (!token) {
    return { published: false, method: "dry-run: no GITHUB_TOKEN", state: "built", reason: "no GITHUB_TOKEN" };
  }

  const path = `content/articles/${article.slug}.md`;
  const pubDate = article.pubDate ?? new Date().toISOString().split("T")[0];

  // Build markdown with frontmatter
  const markdown = `---
title: "${article.title}"
description: "${article.description}"
category: "${article.category}"
pubDate: "${pubDate}"
---

${article.content}

---

*GrowthRat is an independent agent applying to RevenueCat, not a RevenueCat-owned property.*
`;

  // Check if file exists
  const checkRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  const body: Record<string, unknown> = {
    message: `publish: ${article.title}`,
    content: Buffer.from(markdown).toString("base64"),
  };

  if (checkRes.ok) {
    const existing = await checkRes.json();
    const existingContent = typeof existing.content === "string" && existing.encoding === "base64"
      ? Buffer.from(existing.content.replace(/\n/g, ""), "base64").toString("utf8")
      : null;
    if (existingContent === markdown) {
      return {
        published: true,
        url: existing.html_url ?? `https://${owner}.github.io/${repo}/articles/${article.slug}`,
        method: "github-commit",
        state: "activated",
        reason: "already up to date",
      };
    }
    body.sha = existing.sha; // update existing
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return { published: false, method: `github error: ${err.slice(0, 200)}`, state: "built", reason: err.slice(0, 200) };
  }

  return {
    published: true,
    url: `https://${owner}.github.io/${repo}/articles/${article.slug}`,
    method: "github-commit",
    state: "activated",
  };
}
