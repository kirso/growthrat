import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { listCommunitySignals, scanCommunitySignals } from "@/lib/community";

export const prerender = false;

export async function GET({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  return Response.json({ ok: true, signals: await listCommunitySignals(env) });
}

export async function POST({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const result = await scanCommunitySignals(env);
  return Response.json({ ok: true, result });
}
