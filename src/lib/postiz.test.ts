import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPostizCreatePostBody,
  checkPostizConnection,
  listPostizIntegrations,
} from "./postiz";

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    POSTIZ_API_KEY: "postiz-key",
    ...overrides,
  } as unknown as Env;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Postiz connector", () => {
  it("builds a multi-integration create post payload", () => {
    expect(
      buildPostizCreatePostBody({
        type: "schedule",
        date: "2026-05-08T10:00:00.000Z",
        content: "RevenueCat agent-builder note",
        targets: [
          {
            integrationId: "x-1",
            provider: "x",
            settings: { who_can_reply_post: "everyone" },
            media: [{ id: "img-1", path: "https://uploads.postiz.com/img.png" }],
          },
          {
            integrationId: "bsky-1",
            provider: "bluesky",
          },
        ],
      }),
    ).toEqual({
      type: "schedule",
      date: "2026-05-08T10:00:00.000Z",
      shortLink: false,
      tags: [],
      posts: [
        {
          integration: { id: "x-1" },
          value: [
            {
              content: "RevenueCat agent-builder note",
              image: [
                {
                  id: "img-1",
                  path: "https://uploads.postiz.com/img.png",
                },
              ],
            },
          ],
          settings: { __type: "x", who_can_reply_post: "everyone" },
        },
        {
          integration: { id: "bsky-1" },
          value: [{ content: "RevenueCat agent-builder note", image: [] }],
          settings: { __type: "bluesky" },
        },
      ],
    });
  });

  it("checks connection and lists integrations with the Postiz API key", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("Authorization")).toBe("postiz-key");
      if (String(url).endsWith("/is-connected")) {
        return Response.json({ connected: true });
      }
      return Response.json([
        {
          id: "x-1",
          name: "GrowthRat",
          identifier: "x",
          disabled: false,
        },
      ]);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkPostizConnection(makeEnv())).resolves.toEqual({
      connected: true,
    });
    await expect(listPostizIntegrations(makeEnv())).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails closed when the Postiz API key is missing", async () => {
    await expect(
      checkPostizConnection(makeEnv({ POSTIZ_API_KEY: "" })),
    ).rejects.toThrow("POSTIZ_API_KEY is required");
  });
});
