import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { getOpsSnapshot } from "@/lib/ops-status";

export const prerender = false;

export async function GET({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  return Response.json({
    ok: true,
    snapshot: await getOpsSnapshot(env),
  });
}
