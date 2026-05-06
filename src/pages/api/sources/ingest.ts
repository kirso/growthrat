import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { recordEvent } from "@/lib/runtime";
import { ingestSourceDocuments } from "@/lib/sources";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const receipt = await ingestSourceDocuments(env);

  await recordEvent(env, {
    type: "source_ingest_completed",
    path: "/api/sources/ingest",
    detail: {
      documents: receipt.documents,
      chunks: receipt.chunks,
    },
  });

  return Response.json({ ok: true, receipt }, { status: 201 });
}
