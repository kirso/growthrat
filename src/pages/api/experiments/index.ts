import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import { createExperiment, listExperiments } from "@/lib/experiments";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

export async function GET() {
  try {
    const experiments = await listExperiments(env);

    await recordEvent(env, {
      type: "experiments_index",
      path: "/api/experiments",
      detail: {
        experiments: experiments.length,
      },
    });

    return Response.json({
      generatedAt: new Date().toISOString(),
      source: "d1",
      experiments,
    });
  } catch (error) {
    return Response.json({
      generatedAt: new Date().toISOString(),
      source: "unavailable",
      experiments: [],
      error:
        error instanceof Error
          ? error.message
          : "experiment index unavailable",
    });
  }
}

export async function POST({ request }: { request: Request }) {
  const authorization = authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const experiment = await createExperiment(env, body);

  await recordEvent(env, {
    type: "experiment_created",
    path: "/api/experiments",
    detail: {
      experimentId: experiment?.id,
      slug: experiment?.slug,
    },
  });

  return Response.json({ ok: true, experiment }, { status: 201 });
}
