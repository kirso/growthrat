import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { getRunDetail, listRuns } from "@/lib/run-ledger";

export const prerender = false;

function limitFromUrl(url: URL) {
  const limit = Number(url.searchParams.get("limit") ?? "20");
  return Number.isFinite(limit) ? limit : 20;
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
  const id = url.searchParams.get("id");
  if (id) {
    const run = await getRunDetail(env, id);
    return run
      ? Response.json({ ok: true, run })
      : Response.json({ error: "run not found" }, { status: 404 });
  }

  const runs = await listRuns(env, limitFromUrl(url));
  return Response.json({ ok: true, runs });
}
