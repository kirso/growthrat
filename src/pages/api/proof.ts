import { env } from "cloudflare:workers";
import { articles } from "@/content/articles";
import { getRuntimeSnapshot, recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function GET() {
  const snapshot = await getRuntimeSnapshot(env);

  await recordEvent(env, {
    type: "proof_index",
    path: "/api/proof",
    detail: {
      articles: articles.length,
    },
  });

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
