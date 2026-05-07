import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { generateExperimentReadout } from "@/lib/experiments";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { id?: string };
}) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const id = params.id ?? "";
  const experiment = await generateExperimentReadout(env, id);

  if (!experiment) {
    return Response.json({ error: "experiment not found" }, { status: 404 });
  }

  await recordEvent(env, {
    type: "experiment_auto_readout_created",
    path: `/api/experiments/${id}/auto-readout`,
    detail: {
      experimentId: experiment.id,
      latestReadout: experiment.readouts[0]?.id ?? null,
    },
  });

  return Response.json({ ok: true, experiment }, { status: 201 });
}
