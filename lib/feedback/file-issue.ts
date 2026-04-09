/**
 * File structured product feedback as GitHub issues.
 *
 * Strategy:
 * 1. Pre-hire: file to our own repo's issues
 * 2. Post-hire: file to RevenueCat's designated issue tracker (GitHub, Linear, Jira)
 */

export interface FeedbackIssue {
  title: string;
  problem: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedAudience: string;
  proposedFix: string;
  evidence?: string;
}

export async function fileFeedbackIssue(
  feedback: FeedbackIssue
): Promise<{ filed: boolean; url?: string; method: string }> {
  const token = process.env.GITHUB_TOKEN;
  const owner =
    process.env.GITHUB_FEEDBACK_OWNER ??
    process.env.GITHUB_OWNER ??
    "kirso";
  const repo =
    process.env.GITHUB_FEEDBACK_REPO ??
    process.env.GITHUB_CONTENT_REPO ??
    process.env.GITHUB_REPO ??
    "growthcat";

  if (!token) {
    return { filed: false, method: "dry-run: no GITHUB_TOKEN" };
  }

  const body = `## Problem

${feedback.problem}

## Severity

${feedback.severity}

## Affected Audience

${feedback.affectedAudience}

## Proposed Direction

${feedback.proposedFix}

${feedback.evidence ? `## Evidence\n\n${feedback.evidence}` : ""}

---

*Filed by GrowthRat — autonomous developer-advocacy and growth agent.*
*GrowthRat is an independent agent, not a RevenueCat-owned property.*`;

  const labels = [`feedback`, `severity:${feedback.severity}`];

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: `[Product Feedback] ${feedback.title}`,
        body,
        labels,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return { filed: false, method: `github error: ${err.slice(0, 200)}` };
  }

  const issue = await res.json();
  return { filed: true, url: issue.html_url, method: "github-issue" };
}
