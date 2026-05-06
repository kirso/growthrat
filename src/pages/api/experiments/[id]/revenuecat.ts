import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { addMetricSnapshot } from "@/lib/experiments";
import { fetchRevenueCatChartSnapshot } from "@/lib/revenuecat";
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

  try {
    const snapshot = await fetchRevenueCatChartSnapshot(env, body);
    const experiment = await addMetricSnapshot(env, id, {
      ...body,
      source: snapshot.source,
      metricKey: snapshot.metricKey,
      value: snapshot.metricValue,
      detail: {
        requestUrl: snapshot.requestUrl,
        payload: snapshot.payload,
      },
    });

    if (!experiment) {
      return Response.json({ error: "experiment not found" }, { status: 404 });
    }

    await recordEvent(env, {
      type: "revenuecat_metric_snapshot",
      path: `/api/experiments/${id}/revenuecat`,
      detail: {
        experimentId: experiment.id,
        metricKey: snapshot.metricKey,
      },
    });

    return Response.json({ ok: true, snapshot, experiment });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "RevenueCat snapshot failed",
      },
      { status: 503 },
    );
  }
}
