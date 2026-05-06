import { env } from "cloudflare:workers";
import { getActivationSnapshot } from "@/lib/activation";

export const prerender = false;

export async function GET() {
  const snapshot = await getActivationSnapshot(env);

  return Response.json(snapshot);
}
