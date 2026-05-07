import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { recordEvent } from "@/lib/runtime";
import {
  ingestRevenueCatDocsBatch,
  ingestSourceDocuments,
} from "@/lib/sources";

export const prerender = false;

async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return {};
  }

  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export async function POST({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  try {
    const body = await readBody(request);
    const corpus =
      body.corpus === "revenuecat_docs" ? "revenuecat_docs" : "seed";
    const receipt =
      corpus === "revenuecat_docs"
        ? await ingestRevenueCatDocsBatch(env, {
            cursor: numberValue(body.cursor),
            batchSize: numberValue(body.batchSize),
            includeIndexOnlyFallback: body.includeIndexOnlyFallback !== false,
          })
        : await ingestSourceDocuments(env);

    await recordEvent(env, {
      type: "source_ingest_completed",
      path: "/api/sources/ingest",
      detail: {
        corpus,
        documents: receipt.documents,
        chunks: receipt.chunks,
        nextCursor: "nextCursor" in receipt ? receipt.nextCursor : null,
      },
    });

    return Response.json({ ok: true, receipt }, { status: 201 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    await recordEvent(env, {
      type: "source_ingest_failed",
      path: "/api/sources/ingest",
      detail: { detail },
    }).catch(() => undefined);

    return Response.json(
      {
        error: "source ingest failed",
        detail,
      },
      { status: 500 },
    );
  }
}
