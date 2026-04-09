import { internal } from "./_generated/api";

type RuntimeCtx = {
  runQuery: (...args: any[]) => Promise<any>;
};

export type SlackConnectorConfig = {
  botToken?: string;
  signingSecret?: string;
  workspaceLabel?: string;
  defaultChannel?: string;
};

export type GitHubConnectorConfig = {
  token?: string;
  owner?: string;
  repo?: string;
};

export type DataForSeoConnectorConfig = {
  login?: string;
  password?: string;
};

export type TypefullyConnectorConfig = {
  apiKey?: string;
  socialSetId?: string;
};

export type TwitterConnectorConfig = {
  bearerToken?: string;
  apiKey?: string;
  apiKeySecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
};

export type RevenueCatConnectorConfig = {
  apiKey?: string;
  projectId?: string;
};

async function getConnectorPayload<T>(ctx: RuntimeCtx, connector: string): Promise<T | null> {
  return await ctx.runQuery(internal.onboarding.getRuntimeConnectorPayload, { connector });
}

export async function getSlackConnectorConfig(ctx: RuntimeCtx): Promise<SlackConnectorConfig> {
  const payload = await getConnectorPayload<SlackConnectorConfig>(ctx, "slack");
  return {
    botToken: payload?.botToken ?? process.env.SLACK_BOT_TOKEN,
    signingSecret: payload?.signingSecret ?? process.env.SLACK_SIGNING_SECRET,
    workspaceLabel: payload?.workspaceLabel,
    defaultChannel: payload?.defaultChannel ?? process.env.SLACK_DEFAULT_CHANNEL ?? "growthrat",
  };
}

export async function getGitHubConnectorConfig(ctx: RuntimeCtx): Promise<GitHubConnectorConfig> {
  const payload = await getConnectorPayload<GitHubConnectorConfig>(ctx, "github");
  return {
    token: payload?.token ?? process.env.GITHUB_TOKEN,
    owner:
      payload?.owner ??
      process.env.GITHUB_OWNER ??
      process.env.GITHUB_FEEDBACK_OWNER ??
      "kirso",
    repo:
      payload?.repo ??
      process.env.GITHUB_CONTENT_REPO ??
      process.env.GITHUB_FEEDBACK_REPO ??
      process.env.GITHUB_REPO ??
      "growthcat",
  };
}

export async function getDataForSeoConnectorConfig(ctx: RuntimeCtx): Promise<DataForSeoConnectorConfig> {
  const payload = await getConnectorPayload<DataForSeoConnectorConfig>(ctx, "dataforseo");
  return {
    login: payload?.login ?? process.env.DATAFORSEO_LOGIN,
    password: payload?.password ?? process.env.DATAFORSEO_PASSWORD,
  };
}

export async function getTypefullyConnectorConfig(ctx: RuntimeCtx): Promise<TypefullyConnectorConfig> {
  const payload = await getConnectorPayload<TypefullyConnectorConfig>(ctx, "typefully");
  return {
    apiKey: payload?.apiKey ?? process.env.TYPEFULLY_API_KEY,
    socialSetId: payload?.socialSetId ?? process.env.TYPEFULLY_SOCIAL_SET_ID,
  };
}

export async function getTwitterConnectorConfig(ctx: RuntimeCtx): Promise<TwitterConnectorConfig> {
  const payload = await getConnectorPayload<TwitterConnectorConfig>(ctx, "twitter");
  return {
    bearerToken: payload?.bearerToken ?? process.env.TWITTER_BEARER_TOKEN,
    apiKey: payload?.apiKey ?? process.env.TWITTER_API_KEY,
    apiKeySecret: payload?.apiKeySecret ?? process.env.TWITTER_API_KEY_SECRET,
    accessToken: payload?.accessToken ?? process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: payload?.accessTokenSecret ?? process.env.TWITTER_ACCESS_TOKEN_SECRET,
  };
}

export async function getRevenueCatConnectorConfig(ctx: RuntimeCtx): Promise<RevenueCatConnectorConfig> {
  const payload = await getConnectorPayload<RevenueCatConnectorConfig>(ctx, "revenuecat");
  return {
    apiKey: payload?.apiKey,
    projectId: payload?.projectId,
  };
}
