import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function GET() {
  return Response.json({ error: "method not allowed" }, { status: 405 });
}

export async function POST({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  if (String(env.APP_MODE) === "dormant") {
    return Response.json(
      { error: "workflow dry run is disabled in dormant mode" },
      { status: 423 },
    );
  }

  const instance = await env.WEEKLY_LOOP.create({
    params: {
      trigger: "manual",
      dryRun: true,
    },
  });
  const status = await instance.status();

  await recordEvent(env, {
    type: "weekly_dry_run_created",
    path: "/api/workflows/weekly-dry-run",
    detail: {
      workflowId: instance.id,
      mode: env.APP_MODE,
    },
  });

  return Response.json({
    ok: true,
    workflowId: instance.id,
    status,
  });
}
