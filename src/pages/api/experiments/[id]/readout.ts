import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { createExperimentReadout } from "@/lib/experiments";
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
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const experiment = await createExperimentReadout(env, id, body);

  if (!experiment) {
    return Response.json({ error: "experiment not found" }, { status: 404 });
  }

  await recordEvent(env, {
    type: "experiment_readout_created",
    path: `/api/experiments/${id}/readout`,
    detail: {
      experimentId: experiment.id,
      decision: body.decision,
      status: body.status,
    },
  });

  return Response.json({ ok: true, experiment }, { status: 201 });
}
