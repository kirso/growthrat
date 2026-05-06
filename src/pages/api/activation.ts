import { env } from "cloudflare:workers";
import { getActivationSnapshot } from "@/lib/activation";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function GET() {
  const snapshot = await getActivationSnapshot(env);

  await recordEvent(env, {
    type: "activation_snapshot",
    path: "/api/activation",
    detail: {
      mode: snapshot.mode,
      readyForApplicationReview: snapshot.readyForApplicationReview,
      readyForRcLive: snapshot.readyForRcLive,
      blockers: snapshot.blockers.length,
    },
  });

  return Response.json(snapshot);
}
