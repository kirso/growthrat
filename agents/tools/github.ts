import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

export const createGist = createTool({
  name: "create_github_gist",
  description: "Create a public GitHub Gist with code examples or content snippets.",
  parameters: z.object({
    description: z.string(),
    filename: z.string(),
    content: z.string(),
  }),
  handler: async ({ description, filename, content }) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return "dry-run: no GitHub token configured";

    const res = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        description,
        public: true,
        files: { [filename]: { content } },
      }),
    });

    const data = await res.json();
    return `Gist created: ${data.html_url ?? "unknown"}`;
  },
});
