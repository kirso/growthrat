import { describe, expect, it } from "vitest";
import { authorizeInternalRequest, getActivationSnapshot } from "./activation";

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    APP_MODE: "interview_proof",
    AI_GATEWAY_ID: "growthrat",
    PUBLIC_SITE_URL: "https://growthrat.kirso.workers.dev",
    PRODUCTION_WORKER_OBSERVED: "true",
    REVENUECAT_ROLE: "agentic-ai-growth-advocate",
    ...overrides,
  } as Env;
}

describe("activation snapshot", () => {
  it("keeps public proof ready while rc_live remains gated", async () => {
    const snapshot = await getActivationSnapshot(
      makeEnv({
        ASSETS: {} as Env["ASSETS"],
        ARTIFACT_BUCKET: {} as Env["ARTIFACT_BUCKET"],
        GROWTHRAT_QUEUE: {} as Env["GROWTHRAT_QUEUE"],
        WEEKLY_LOOP: {} as Env["WEEKLY_LOOP"],
        GrowthRatAgent: {} as Env["GrowthRatAgent"],
        EVENT_PIPELINE: {} as Env["EVENT_PIPELINE"],
        DOC_INDEX: {
          describe: async () => ({
            id: "test",
            name: "growthrat-doc-index-bge-base",
            config: { dimensions: 768, metric: "cosine" },
            vectorsCount: 0,
          }),
        } as Env["DOC_INDEX"],
        AI: {} as Env["AI"],
      }),
    );

    expect(snapshot.readyForApplicationReview).toBe(true);
    expect(snapshot.readyForRcLive).toBe(false);
    expect(snapshot.secrets.missing).toContain("GROWTHRAT_INTERNAL_SECRET");
    expect(snapshot.resources.find((item) => item.key === "ai_search")?.status).toBe(
      "gated",
    );
  });

  it("fails internal requests closed when the secret is absent", async () => {
    const request = new Request("https://growthrat.test/api/workflows/weekly-dry-run", {
      method: "POST",
      headers: {
        authorization: "Bearer test",
      },
    });

    await expect(authorizeInternalRequest(request, makeEnv())).resolves.toEqual({
      ok: false,
      status: 503,
      error: "internal secret is not configured",
    });
  });

  it("accepts internal requests with the configured bearer token", async () => {
    const request = new Request("https://growthrat.test/api/workflows/weekly-dry-run", {
      method: "POST",
      headers: {
        authorization: "Bearer secret",
      },
    });

    await expect(
      authorizeInternalRequest(
        request,
        makeEnv({ GROWTHRAT_INTERNAL_SECRET: "secret" }),
      ),
    ).resolves.toEqual({ ok: true });
  });
});
