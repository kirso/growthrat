import { resolveConnectorCredentials } from "./connected-accounts";

export type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
};

async function getGitHubConfig(env: Env): Promise<GitHubConfig | null> {
  const credentials = await resolveConnectorCredentials(env, "github");
  const token = credentials?.token ?? credentials?.GITHUB_TOKEN;
  const owner =
    credentials?.owner ??
    credentials?.GITHUB_OWNER ??
    (env as unknown as Partial<Record<"GITHUB_OWNER", string>>).GITHUB_OWNER ??
    "RevenueCat";
  const repo =
    credentials?.repo ??
    credentials?.GITHUB_CONTENT_REPO ??
    (env as unknown as Partial<Record<"GITHUB_CONTENT_REPO", string>>)
      .GITHUB_CONTENT_REPO ??
    "growthrat";

  return token ? { token, owner, repo } : null;
}

function headers(config: GitHubConfig) {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "GrowthRat",
  };
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function publishMarkdownToGitHub(
  env: Env,
  input: { title: string; slug: string; content: string },
) {
  const config = await getGitHubConfig(env);
  if (!config) {
    return { published: false, reason: "GitHub connector is not active" };
  }

  const path = `content/articles/${input.slug}.md`;
  const fileContent = [
    "---",
    `title: "${input.title.replaceAll('"', '\\"')}"`,
    `date: "${new Date().toISOString().slice(0, 10)}"`,
    "author: GrowthRat",
    "status: draft",
    "---",
    "",
    input.content,
  ].join("\n");

  let sha: string | undefined;
  const existing = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodePath(path)}`,
    { headers: headers(config) },
  );
  if (existing.ok) {
    const body = (await existing.json().catch(() => ({}))) as {
      sha?: string;
    };
    sha = body.sha;
  }

  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodePath(path)}`,
    {
      method: "PUT",
      headers: {
        ...headers(config),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `publish: ${input.title}`,
        content: encodeBase64(fileContent),
        ...(sha ? { sha } : {}),
      }),
    },
  );
  const body = (await response.json().catch(() => ({}))) as {
    content?: { html_url?: string };
    commit?: { sha?: string };
    message?: string;
  };

  return response.ok
    ? {
        published: true,
        url: body.content?.html_url,
        commitSha: body.commit?.sha,
      }
    : {
        published: false,
        reason: body.message ?? `GitHub returned ${response.status}`,
      };
}

export async function createGitHubIssue(
  env: Env,
  input: { title: string; body: string; labels?: string[] },
) {
  const config = await getGitHubConfig(env);
  if (!config) return { created: false, reason: "GitHub connector is not active" };

  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
    {
      method: "POST",
      headers: {
        ...headers(config),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        labels: input.labels ?? [],
      }),
    },
  );
  const body = (await response.json().catch(() => ({}))) as {
    html_url?: string;
    number?: number;
    message?: string;
  };

  return response.ok
    ? { created: true, url: body.html_url, number: body.number }
    : {
        created: false,
        reason: body.message ?? `GitHub returned ${response.status}`,
      };
}

export async function scanRevenueCatGitHubIssues(env: Env) {
  const credentials = await resolveConnectorCredentials(env, "github");
  const token = credentials?.token ?? credentials?.GITHUB_TOKEN;
  if (!token) return [];

  const repos = [
    "RevenueCat/purchases-ios",
    "RevenueCat/purchases-android",
    "RevenueCat/purchases-flutter",
    "RevenueCat/purchases-react-native",
    "RevenueCat/purchases-kmp",
    "RevenueCat/revenuecat-docs",
  ];
  const signals: Array<{ url: string; title: string; context: string }> = [];

  for (const repo of repos) {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues?state=open&sort=created&direction=desc&per_page=5`,
      { headers: { ...headers({ token, owner: "", repo: "" }) } },
    );
    if (!response.ok) continue;
    const issues = (await response.json().catch(() => [])) as Array<{
      html_url?: string;
      title?: string;
      body?: string;
      pull_request?: unknown;
    }>;
    for (const issue of issues) {
      if (issue.pull_request) continue;
      const text = `${issue.title ?? ""} ${issue.body ?? ""}`.toLowerCase();
      if (/(agent|programmatic|api|webhook|automated|subscription|paywall)/.test(text)) {
        signals.push({
          url: issue.html_url ?? "",
          title: issue.title ?? "Untitled GitHub issue",
          context: `${issue.title ?? ""}\n\n${(issue.body ?? "").slice(0, 700)}`,
        });
      }
    }
  }

  return signals;
}
