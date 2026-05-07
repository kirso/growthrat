import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { runWeeklyAdvocateLoop } from "@/lib/pipeline";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    dryRun?: boolean;
    topic?: string;
  };
  const result = await runWeeklyAdvocateLoop(env, {
    trigger: "manual",
    dryRun: body.dryRun ?? String(env.APP_MODE) !== "rc_live",
    topic: body.topic,
  });

  await recordEvent(env, {
    type: "weekly_advocate_loop_created",
    path: "/api/workflows/weekly-run",
    detail: result,
  });

  return Response.json({ ok: true, result });
}
