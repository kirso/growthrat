import { env } from "cloudflare:workers";
import {
  createRcSessionCookie,
  registerRcRepresentative,
} from "@/lib/auth";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    fullName?: string;
    activationCode?: string;
  };

  const result = await registerRcRepresentative(env, {
    email: body.email ?? "",
    fullName: body.fullName,
    activationCode: body.activationCode,
  });

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: result.status },
    );
  }

  await recordEvent(env, {
    type: "rc_representative_signed_in",
    path: "/api/auth/register",
    detail: {
      email: result.session.email,
      role: result.session.role,
    },
  });

  return Response.json(
    { ok: true, session: result.session },
    {
      headers: {
        "Set-Cookie": await createRcSessionCookie(env, request, result.session),
      },
    },
  );
}
