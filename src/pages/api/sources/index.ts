import { env } from "cloudflare:workers";
import { getSourceStats } from "@/lib/sources";

export const prerender = false;

export async function GET() {
  const stats = await getSourceStats(env);
  return Response.json({
    generatedAt: new Date().toISOString(),
    ...stats,
  });
}
