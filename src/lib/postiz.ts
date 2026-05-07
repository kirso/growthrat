export type PostizIntegration = {
  id: string;
  name: string;
  identifier: string;
  picture?: string;
  disabled?: boolean;
  profile?: string;
  customer?: {
    id?: string;
    name?: string;
  };
};

export type PostizPostTarget = {
  integrationId: string;
  provider: string;
  settings?: Record<string, unknown>;
  media?: PostizMedia[];
};

export type PostizMedia = {
  id: string;
  path: string;
};

export type PostizCreatePostInput = {
  type?: "draft" | "schedule" | "now";
  date?: string;
  content: string;
  targets: PostizPostTarget[];
  shortLink?: boolean;
  tags?: Array<Record<string, unknown>>;
  media?: PostizMedia[];
};

export type PostizCreatePostResult = Array<{
  postId: string;
  integration: string;
}>;

export type PostizUploadedMedia = PostizMedia & {
  name?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PostizAnalyticsPoint = {
  total: string;
  date: string;
};

export type PostizAnalyticsMetric = {
  label: string;
  data: PostizAnalyticsPoint[];
  percentageChange?: number;
};

type PostizConfig = {
  apiKey: string;
  baseUrl: string;
};

const defaultBaseUrl = "https://api.postiz.com/public/v1";

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeMedia(media: PostizMedia[] | undefined) {
  if (!Array.isArray(media)) return [];

  return media.map((item) => {
    const id = text(item.id);
    const path = text(item.path);
    if (!id || !path) {
      throw new Error("Postiz media items require id and path");
    }

    return { id, path };
  });
}

async function getPostizConfig(env: Env): Promise<PostizConfig | null> {
  const connected = await resolveConnectorCredentials(env, "postiz");
  const values = {
    POSTIZ_API_KEY:
      connected?.apiKey ??
      connected?.POSTIZ_API_KEY ??
      (env as unknown as Partial<Record<"POSTIZ_API_KEY", string>>)
        .POSTIZ_API_KEY,
    POSTIZ_API_BASE_URL:
      connected?.baseUrl ??
      connected?.POSTIZ_API_BASE_URL ??
      (env as unknown as Partial<Record<"POSTIZ_API_BASE_URL", string>>)
        .POSTIZ_API_BASE_URL,
  };
  const apiKey = values.POSTIZ_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: (values.POSTIZ_API_BASE_URL?.trim() || defaultBaseUrl).replace(
      /\/+$/,
      "",
    ),
  };
}

async function postizRequest<T>(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = await getPostizConfig(env);
  if (!config) {
    throw new Error("POSTIZ_API_KEY is required for social distribution");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", config.apiKey);
  headers.set("Accept", "application/json");
  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers,
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(`Postiz request failed with ${response.status}`);
  }

  return payload as T;
}

export async function checkPostizConnection(env: Env) {
  return await postizRequest<{ connected: boolean }>(env, "/is-connected");
}

export async function listPostizIntegrations(env: Env) {
  return await postizRequest<PostizIntegration[]>(env, "/integrations");
}

export function buildPostizCreatePostBody(input: PostizCreatePostInput) {
  const content = text(input.content);
  if (!content) throw new Error("Postiz post content is required");
  if (!Array.isArray(input.targets) || input.targets.length === 0) {
    throw new Error("At least one Postiz integration target is required");
  }

  return {
    type: input.type ?? "draft",
    date: input.date ?? new Date().toISOString(),
    shortLink: input.shortLink ?? false,
    tags: input.tags ?? [],
    posts: input.targets.map((target) => {
      const integrationId = text(target.integrationId);
      const provider = text(target.provider);
      if (!integrationId || !provider) {
        throw new Error("Postiz target requires integrationId and provider");
      }

      return {
        integration: { id: integrationId },
        value: [
          {
            content,
            image: normalizeMedia(target.media ?? input.media),
          },
        ],
        settings: {
          __type: provider,
          ...(target.settings ?? {}),
        },
      };
    }),
  };
}

export async function createPostizPost(
  env: Env,
  input: PostizCreatePostInput,
) {
  return await postizRequest<PostizCreatePostResult>(env, "/posts", {
    method: "POST",
    body: JSON.stringify(buildPostizCreatePostBody(input)),
  });
}

export async function uploadPostizMediaFromUrl(env: Env, url: string) {
  const mediaUrl = text(url);
  if (!mediaUrl) throw new Error("Postiz media URL is required");

  return await postizRequest<PostizUploadedMedia>(env, "/upload-from-url", {
    method: "POST",
    body: JSON.stringify({ url: mediaUrl }),
  });
}

export async function listPostizPosts(
  env: Env,
  input: { startDate: string; endDate: string; customer?: string },
) {
  const url = new URL("https://growthrat.internal/posts");
  url.searchParams.set("startDate", input.startDate);
  url.searchParams.set("endDate", input.endDate);
  if (input.customer) url.searchParams.set("customer", input.customer);

  return await postizRequest<{
    posts: Array<{
      id: string;
      content: string;
      publishDate: string;
      releaseURL?: string;
      state: string;
      integration: {
        id: string;
        providerIdentifier: string;
        name: string;
        picture?: string;
      };
    }>;
  }>(env, `/posts?${url.searchParams.toString()}`);
}

export async function fetchPostizPostAnalytics(
  env: Env,
  postId: string,
  days = 7,
) {
  return await postizRequest<PostizAnalyticsMetric[]>(
    env,
    `/analytics/post/${encodeURIComponent(postId)}?date=${days}`,
  );
}

export async function fetchPostizPlatformAnalytics(
  env: Env,
  integrationId: string,
  days = 7,
) {
  return await postizRequest<PostizAnalyticsMetric[]>(
    env,
    `/analytics/${encodeURIComponent(integrationId)}?date=${days}`,
  );
}
import { resolveConnectorCredentials } from "./connected-accounts";
