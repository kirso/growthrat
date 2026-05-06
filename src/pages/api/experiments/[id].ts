import { env } from "cloudflare:workers";
import { getExperimentDetail } from "@/lib/experiments";

export const prerender = false;

export async function GET({ params }: { params: { id?: string } }) {
  const id = params.id ?? "";
  const experiment = await getExperimentDetail(env, id);

  if (!experiment) {
    return Response.json({ error: "experiment not found" }, { status: 404 });
  }

  return Response.json({
    generatedAt: new Date().toISOString(),
    experiment,
  });
}
