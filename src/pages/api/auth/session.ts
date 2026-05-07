import { env } from "cloudflare:workers";
import { getRcSessionFromRequest } from "@/lib/auth";

export const prerender = false;

export async function GET({ request }: { request: Request }) {
  const session = await getRcSessionFromRequest(request, env);

  return Response.json({
    authenticated: Boolean(session),
    session,
  });
}
