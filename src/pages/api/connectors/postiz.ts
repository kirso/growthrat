import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { enforceSideEffectPolicy } from "@/lib/policy";
import {
  checkPostizConnection,
  createPostizPost,
  listPostizIntegrations,
  type PostizCreatePostInput,
} from "@/lib/postiz";
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

  try {
    const [connection, integrations] = await Promise.all([
      checkPostizConnection(env),
      listPostizIntegrations(env),
    ]);

    return Response.json({
      ok: true,
      provider: "postiz",
      connected: connection.connected,
      integrations,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        provider: "postiz",
        error:
          error instanceof Error
            ? error.message
            : "Postiz connector check failed",
      },
      { status: 503 },
    );
  }
}

export async function POST({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const policy = await enforceSideEffectPolicy(env, "external_side_effect");
  if (!policy.ok) {
    return Response.json(
      { error: policy.error, detail: policy.detail },
      { status: policy.status },
    );
  }

  const body = (await request.json().catch(() => ({}))) as PostizCreatePostInput;

  try {
    const result = await createPostizPost(env, body);

    await recordEvent(env, {
      type: "postiz_post_created",
      path: "/api/connectors/postiz",
      detail: {
        type: body.type ?? "draft",
        targetCount: body.targets?.length ?? 0,
        posts: result,
      },
    });

    return Response.json({ ok: true, provider: "postiz", result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        provider: "postiz",
        error:
          error instanceof Error
            ? error.message
            : "Postiz post creation failed",
      },
      { status: 400 },
    );
  }
}
