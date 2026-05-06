import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { getRuntimePolicySnapshot, setRuntimeFlag } from "@/lib/policy";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function GET() {
  const policy = await getRuntimePolicySnapshot(env);
  return Response.json({
    generatedAt: new Date().toISOString(),
    policy,
  });
}

export async function POST({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const flag = body.flag;
  const value = body.value;
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : "operator update";

  if (
    (flag !== "kill_switch" && flag !== "model_chat_enabled") ||
    typeof value !== "boolean"
  ) {
    return Response.json(
      {
        error:
          "body must include flag ('kill_switch' or 'model_chat_enabled') and boolean value",
      },
      { status: 400 },
    );
  }

  await setRuntimeFlag(env, flag, value, reason);

  await recordEvent(env, {
    type: "runtime_policy_updated",
    path: "/api/policy",
    detail: {
      flag,
      value,
    },
  });

  return Response.json({
    ok: true,
    policy: await getRuntimePolicySnapshot(env),
  });
}
