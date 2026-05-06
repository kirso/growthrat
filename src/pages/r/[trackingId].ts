import { env } from "cloudflare:workers";
import {
  recordExperimentEvent,
  resolveTrackingDestination,
} from "@/lib/experiments";
import { enforcePublicEventPolicy } from "@/lib/policy";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

function withTrackingParams(destination: string, trackingId: string, requestUrl: string) {
  const baseUrl = new URL(requestUrl).origin;
  const url = destination.startsWith("/")
    ? new URL(destination, baseUrl)
    : new URL(destination);

  url.searchParams.set("growthrat_tracking_id", trackingId);
  return url.toString();
}

export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { trackingId?: string };
}) {
  const trackingId = params.trackingId ?? "";
  const resolved = await resolveTrackingDestination(env, trackingId);

  if (!resolved) {
    return Response.redirect(new URL("/experiments", request.url), 302);
  }

  try {
    const policy = await enforcePublicEventPolicy(env, request);
    if (policy.ok) {
      await recordExperimentEvent(env, {
        trackingId,
        eventType: "tracking_click",
        source:
          new URL(request.url).searchParams.get("utm_source") ??
          "tracking_redirect",
        path: new URL(request.url).pathname,
        referrer: request.headers.get("referer"),
        userAgent: request.headers.get("user-agent"),
        detail: resolved.metadata,
      });

      await recordEvent(env, {
        type: "tracking_redirect",
        path: `/r/${trackingId}`,
        detail: {
          trackingId,
          destination: resolved.destination,
        },
      });
    }
  } catch {
    // Tracking should never block the destination redirect.
  }

  return Response.redirect(
    withTrackingParams(resolved.destination, trackingId, request.url),
    302,
  );
}
