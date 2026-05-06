import { env } from "cloudflare:workers";
import { articles } from "@/content/articles";
import { getRuntimeSnapshot } from "@/lib/runtime";

export const prerender = false;

export async function GET() {
  const snapshot = await getRuntimeSnapshot(env);

  return Response.json({
    generatedAt: new Date().toISOString(),
    runtime: snapshot,
    artifacts: articles.map((article) => ({
      slug: article.slug,
      title: article.title,
      type: article.type,
      sourcePath: article.sourcePath,
    })),
  });
}
