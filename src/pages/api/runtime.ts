import { env } from "cloudflare:workers";
import { getRuntimeSnapshot, recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function GET() {
  const snapshot = await getRuntimeSnapshot(env);

  await recordEvent(env, {
    type: "runtime_snapshot",
    path: "/api/runtime",
    detail: {
      source: snapshot.source,
      mode: snapshot.mode,
    },
  });

  return Response.json(snapshot);
}
