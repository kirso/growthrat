import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { enforceSideEffectPolicy } from "@/lib/policy";
import { uploadPostizMediaFromUrl } from "@/lib/postiz";
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

  const policy = await enforceSideEffectPolicy(env, "external_side_effect");
  if (!policy.ok) {
    return Response.json(
      { error: policy.error, detail: policy.detail },
      { status: policy.status },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { url?: string };

  try {
    const media = await uploadPostizMediaFromUrl(env, body.url ?? "");

    await recordEvent(env, {
      type: "postiz_media_uploaded_from_url",
      path: "/api/connectors/postiz/upload-from-url",
      detail: {
        id: media.id,
        path: media.path,
      },
    });

    return Response.json({ ok: true, provider: "postiz", media });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        provider: "postiz",
        error:
          error instanceof Error
            ? error.message
            : "Postiz media upload failed",
      },
      { status: 400 },
    );
  }
}
