import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import {
  listTopOpportunities,
  refreshOpportunities,
  type OpportunityLane,
} from "@/lib/opportunities";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

function laneFromUrl(url: URL): OpportunityLane | undefined {
  const lane = url.searchParams.get("lane");
  return lane === "content" ||
    lane === "experiment" ||
    lane === "feedback" ||
    lane === "community"
    ? lane
    : undefined;
}

function limitFromUrl(url: URL) {
  const limit = Number(url.searchParams.get("limit") ?? "10");
  return Number.isFinite(limit) ? limit : 10;
}

export async function GET({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const url = new URL(request.url);
  const opportunities = await listTopOpportunities(env, {
    lane: laneFromUrl(url),
    limit: limitFromUrl(url),
  });

  return Response.json({ ok: true, opportunities });
}

export async function POST({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const opportunities = await refreshOpportunities(env);
  await recordEvent(env, {
    type: "opportunities_refreshed",
    path: "/api/opportunities",
    detail: { count: opportunities.length },
  });

  return Response.json({ ok: true, opportunities });
}
