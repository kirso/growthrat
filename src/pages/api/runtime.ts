import { env } from "cloudflare:workers";
import { getRuntimeSnapshot } from "@/lib/runtime";

export const prerender = false;

export async function GET() {
  const snapshot = await getRuntimeSnapshot(env);

  return Response.json(snapshot);
}
