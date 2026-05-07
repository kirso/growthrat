import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { executeTakeHomeTask } from "@/lib/pipeline";
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
    prompt?: unknown;
    deadline?: string;
  };
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const result = await executeTakeHomeTask(env, {
    prompt,
    deadline: body.deadline,
  });

  await recordEvent(env, {
    type: "take_home_task_executed",
    path: "/api/tasks/execute",
    detail: {
      subtasks: result.subtasks,
      deadline: result.deadline,
    },
  });

  return Response.json({ ok: true, result });
}
