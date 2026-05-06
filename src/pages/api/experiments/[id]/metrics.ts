import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { addMetricSnapshot } from "@/lib/experiments";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { id?: string };
}) {
  const authorization = authorizeInternalRequest(request, env);
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

  try {
    const experiment = await addMetricSnapshot(env, id, body);
    if (!experiment) {
      return Response.json({ error: "experiment not found" }, { status: 404 });
    }

    await recordEvent(env, {
      type: "experiment_metric_snapshot",
      path: `/api/experiments/${id}/metrics`,
      detail: {
        experimentId: experiment.id,
        metricKey: body.metricKey,
        source: body.source,
      },
    });

    return Response.json({ ok: true, experiment });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "metric snapshot failed",
      },
      { status: 400 },
    );
  }
}
