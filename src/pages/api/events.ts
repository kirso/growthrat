import { env } from "cloudflare:workers";
import { recordExperimentEvent } from "@/lib/experiments";
import { enforcePublicEventPolicy } from "@/lib/policy";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8192) {
    return Response.json({ error: "request body is too large" }, { status: 413 });
  }

  const policy = await enforcePublicEventPolicy(env, request);
  if (!policy.ok) {
    return Response.json(
      { error: policy.error, detail: policy.detail },
      { status: policy.status },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const referrer = request.headers.get("referer") ?? undefined;

  const result = await recordExperimentEvent(env, {
    ...body,
    userAgent,
    referrer,
  });

  await recordEvent(env, {
    type: "public_experiment_event",
    path: "/api/events",
    detail: {
      eventType: body.eventType,
      experimentId: result.experimentId,
      variantId: result.variantId,
      assetId: result.assetId,
    },
  });

  return Response.json(result, { status: 202 });
}
