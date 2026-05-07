import { clearRcSessionCookie } from "@/lib/auth";

export const prerender = false;

export async function POST() {
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearRcSessionCookie(),
      },
    },
  );
}
