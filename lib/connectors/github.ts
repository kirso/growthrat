// ---------------------------------------------------------------------------
// GitHub REST API connector – native fetch
// ---------------------------------------------------------------------------

const API_BASE = "https://api.github.com";

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Gists
// ---------------------------------------------------------------------------

export interface GistFile {
  filename: string;
  content: string;
}

export interface GistResponse {
  id: string;
  html_url: string;
  [key: string]: unknown;
}

export async function createGist(
  description: string,
  files: GistFile[],
  token: string,
  isPublic = true,
): Promise<GistResponse> {
  const filesPayload: Record<string, { content: string }> = {};
  for (const f of files) {
    filesPayload[f.filename] = { content: f.content };
  }

  const res = await fetch(`${API_BASE}/gists`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      description,
      public: isPublic,
      files: filesPayload,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub gist ${res.status}: ${text.slice(0, 500)}`);
  }

  return (await res.json()) as GistResponse;
}

// ---------------------------------------------------------------------------
// Repository file create / update
// ---------------------------------------------------------------------------

export interface FileResponse {
  content: { path: string; sha: string; html_url: string };
  commit: { sha: string };
  [key: string]: unknown;
}

/**
 * Create or update a single file in a repository.
 * If the file already exists, pass its current SHA to update it.
 */
export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  token: string,
  sha?: string,
  branch?: string,
): Promise<FileResponse> {
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
  };
  if (sha) body.sha = sha;
  if (branch) body.branch = branch;

  const res = await fetch(
    `${API_BASE}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub file ${res.status}: ${text.slice(0, 500)}`);
  }

  return (await res.json()) as FileResponse;
}

// ---------------------------------------------------------------------------
// Issue / PR comments
// ---------------------------------------------------------------------------

export interface CommentResponse {
  id: number;
  html_url: string;
  [key: string]: unknown;
}

export async function createIssueComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
  token: string,
): Promise<CommentResponse> {
  const res = await fetch(
    `${API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ body }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub comment ${res.status}: ${text.slice(0, 500)}`);
  }

  return (await res.json()) as CommentResponse;
}
