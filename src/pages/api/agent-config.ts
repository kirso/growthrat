import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { getAgentConfig, saveAgentConfig } from "@/lib/agent-config";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function GET({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  return Response.json({ ok: true, config: await getAgentConfig(env) });
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
  const config = await saveAgentConfig(env, body);

  await recordEvent(env, {
    type: "agent_config_updated",
    path: "/api/agent-config",
    detail: {
      mode: config.mode,
      reviewMode: config.reviewMode,
      paused: config.paused,
    },
  });

  return Response.json({ ok: true, config });
}
