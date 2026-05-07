import { describe, expect, it } from "vitest";
import {
  createRcSessionCookie,
  getRcSessionFromRequest,
  registerRcRepresentative,
} from "./auth";
import { authorizeInternalRequest } from "./activation";

function makeDb() {
  return {
    prepare(sql: string) {
      return {
        bind() {
          return {
            async first() {
              if (sql.includes("allowed_domains_json")) {
                return { allowed_domains_json: '["revenuecat.com"]' };
              }
              return null;
            },
            async run() {
              return { success: true };
            },
          };
        },
      };
    },
  };
}

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    APP_MODE: "interview_proof",
    GROWTHRAT_INTERNAL_SECRET: "secret",
    DB: makeDb(),
    ...overrides,
  } as unknown as Env;
}

describe("RevenueCat representative auth", () => {
  it("rejects non-RevenueCat email registration", async () => {
    const result = await registerRcRepresentative(makeEnv(), {
      email: "operator@example.com",
      activationCode: "secret",
    });

    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "RevenueCat email is required",
    });
  });

  it("issues a signed session cookie accepted by protected endpoints", async () => {
    const env = makeEnv();
    const request = new Request("https://growthrat.test/sign-in");
    const result = await registerRcRepresentative(env, {
      email: "advocate@revenuecat.com",
      fullName: "RevenueCat Advocate",
      activationCode: "secret",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("registration should have succeeded");

    const cookie = await createRcSessionCookie(env, request, result.session);
    const authedRequest = new Request(
      "https://growthrat.test/api/accounts/revenuecat/connectors",
      {
        headers: { cookie },
      },
    );

    await expect(getRcSessionFromRequest(authedRequest, env)).resolves.toMatchObject({
      email: "advocate@revenuecat.com",
      role: "representative",
    });
    await expect(
      authorizeInternalRequest(authedRequest, env),
    ).resolves.toMatchObject({
      ok: true,
      session: {
        email: "advocate@revenuecat.com",
      },
    });
  });
});
