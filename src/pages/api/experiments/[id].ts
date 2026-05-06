import { env } from "cloudflare:workers";
import { getExperimentDetail } from "@/lib/experiments";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function GET({ params }: { params: { id?: string } }) {
  const id = params.id ?? "";
  const experiment = await getExperimentDetail(env, id);

  if (!experiment) {
    return Response.json({ error: "experiment not found" }, { status: 404 });
  }

  await recordEvent(env, {
    type: "experiment_detail",
    path: `/api/experiments/${id}`,
    detail: {
      experimentId: experiment.id,
      slug: experiment.slug,
    },
  });

  return Response.json({
    generatedAt: new Date().toISOString(),
    experiment,
  });
}
