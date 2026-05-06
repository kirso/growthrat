import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText, streamText, type StreamTextResult } from "ai";

export type AiTaskClass = "reasoning" | "generation" | "fast";
type AiProvider = "anthropic" | "openai";

export const AI_MODEL_IDS = {
  reasoning: process.env.ANTHROPIC_REASONING_MODEL ?? "claude-opus-4-20250514",
  generation: process.env.ANTHROPIC_GENERATION_MODEL ?? "claude-sonnet-4-20250514",
  fast: process.env.ANTHROPIC_FAST_MODEL ?? "claude-3-5-haiku-20241022",
} as const;

export const OPENAI_MODEL_IDS = {
  reasoning: process.env.OPENAI_REASONING_MODEL ?? "gpt-4.1",
  generation: process.env.OPENAI_GENERATION_MODEL ?? "gpt-4.1",
  fast: process.env.OPENAI_FAST_MODEL ?? "gpt-4.1-mini",
} as const;

type UsageLoggerInput = {
  feature: string;
  workflowType?: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedUsd: number;
  latencyMs?: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
};

type UsageLogger = (event: UsageLoggerInput) => Promise<unknown> | unknown;

type TextTaskArgs = {
  feature: string;
  workflowType?: string;
  taskClass: AiTaskClass;
  system?: string;
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
  enableThinking?: boolean;
  metadata?: Record<string, unknown>;
  logUsage?: UsageLogger;
};

type StructuredTaskArgs<TSchema> = TextTaskArgs & {
  schema: TSchema;
};

type UsageShape = {
  inputTokens?: number;
  outputTokens?: number;
};

const PRICING_PER_MILLION: Record<string, { input: number; output: number }> = {
  [AI_MODEL_IDS.reasoning]: { input: 15, output: 75 },
  [AI_MODEL_IDS.generation]: { input: 3, output: 15 },
  [AI_MODEL_IDS.fast]: { input: 0.8, output: 4 },
};

function getModelId(taskClass: AiTaskClass, provider: AiProvider) {
  return provider === "openai" ? OPENAI_MODEL_IDS[taskClass] : AI_MODEL_IDS[taskClass];
}

function getPreferredProvider(): AiProvider {
  return process.env.AI_PROVIDER === "openai" ? "openai" : "anthropic";
}

function hasOpenAiFallback() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getModel(taskClass: AiTaskClass, provider: AiProvider) {
  const modelId = getModelId(taskClass, provider);
  return provider === "openai" ? openai(modelId) : anthropic(modelId);
}

function getAnthropicOptions(taskClass: AiTaskClass, enableThinking = false) {
  return {
    anthropic: {
      cacheControl: { type: "ephemeral" as const },
      ...(taskClass === "reasoning" && enableThinking
        ? { thinking: { type: "enabled" as const, budgetTokens: 12_000 } }
        : {}),
    },
  };
}

function getProviderOptions(provider: AiProvider, taskClass: AiTaskClass, enableThinking = false) {
  if (provider === "anthropic") {
    return getAnthropicOptions(taskClass, enableThinking);
  }
  return undefined;
}

function shouldFallbackToOpenAi(error: unknown) {
  if (!hasOpenAiFallback()) return false;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("credit balance is too low")
    || message.includes("plans & billing")
    || message.includes("insufficient credit")
    || message.includes("insufficient_balance");
}

function estimateAnthropicUsd(model: string, usage?: UsageShape | null) {
  const pricing = PRICING_PER_MILLION[model];
  if (!pricing) return 0;
  const inputTokens = usage?.inputTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? 0;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

function estimateUsd(provider: AiProvider, model: string, usage?: UsageShape | null) {
  if (provider === "anthropic") {
    return estimateAnthropicUsd(model, usage);
  }
  return 0;
}

async function logResultUsage(
  logUsage: UsageLogger | undefined,
  base: Omit<UsageLoggerInput, "inputTokens" | "outputTokens" | "estimatedUsd" | "success" | "errorCode">,
  usage: UsageShape | undefined,
  success: boolean,
  errorCode?: string,
) {
  if (!logUsage) return;
  const inputTokens = usage?.inputTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? 0;
  await logUsage({
    ...base,
    inputTokens,
    outputTokens,
    estimatedUsd: estimateUsd(base.provider as AiProvider, base.model, usage),
    success,
    ...(errorCode ? { errorCode } : {}),
  });
}

export async function runTextTask(args: TextTaskArgs) {
  const startedAt = Date.now();
  const preferredProvider = getPreferredProvider();

  async function execute(provider: AiProvider) {
    const modelId = getModelId(args.taskClass, provider);
    const result = await generateText({
      model: getModel(args.taskClass, provider),
      ...(args.system ? { system: args.system } : {}),
      prompt: args.prompt,
      maxOutputTokens: args.maxOutputTokens ?? 2048,
      ...(args.enableThinking ? {} : { temperature: args.temperature ?? 0.3 }),
      ...(getProviderOptions(provider, args.taskClass, args.enableThinking)
        ? { providerOptions: getProviderOptions(provider, args.taskClass, args.enableThinking) }
        : {}),
    });
    return { provider, modelId, result };
  }

  try {
    let provider = preferredProvider;
    let modelId = getModelId(args.taskClass, provider);
    let result;
    try {
      ({ provider, modelId, result } = await execute(provider));
    } catch (error) {
      if (provider === "anthropic" && shouldFallbackToOpenAi(error)) {
        ({ provider, modelId, result } = await execute("openai"));
      } else {
        throw error;
      }
    }

    await logResultUsage(args.logUsage, {
      feature: args.feature,
      workflowType: args.workflowType,
      provider,
      model: modelId,
      latencyMs: Date.now() - startedAt,
      metadata: {
        taskClass: args.taskClass,
        thinkingEnabled: Boolean(args.enableThinking),
        cacheEnabled: provider === "anthropic",
        ...(args.metadata ?? {}),
      },
    }, result.usage, true);

    return result;
  } catch (error) {
    const provider = preferredProvider;
    const modelId = getModelId(args.taskClass, provider);
    await logResultUsage(args.logUsage, {
      feature: args.feature,
      workflowType: args.workflowType,
      provider,
      model: modelId,
      latencyMs: Date.now() - startedAt,
      metadata: {
        taskClass: args.taskClass,
        thinkingEnabled: Boolean(args.enableThinking),
        cacheEnabled: provider === "anthropic",
        ...(args.metadata ?? {}),
      },
    }, undefined, false, error instanceof Error ? error.name : "unknown_error");
    throw error;
  }
}

export async function runStructuredTask<TSchema>(args: StructuredTaskArgs<TSchema>) {
  const startedAt = Date.now();
  const preferredProvider = getPreferredProvider();

  async function execute(provider: AiProvider) {
    const modelId = getModelId(args.taskClass, provider);
    const result = await generateObject({
      model: getModel(args.taskClass, provider),
      schema: args.schema as any,
      ...(args.system ? { system: args.system } : {}),
      prompt: args.prompt,
      maxOutputTokens: args.maxOutputTokens ?? 1500,
      ...(args.enableThinking ? {} : { temperature: args.temperature ?? 0.2 }),
      ...(getProviderOptions(provider, args.taskClass, args.enableThinking)
        ? { providerOptions: getProviderOptions(provider, args.taskClass, args.enableThinking) }
        : {}),
    });
    return { provider, modelId, result };
  }

  try {
    let provider = preferredProvider;
    let modelId = getModelId(args.taskClass, provider);
    let result;
    try {
      ({ provider, modelId, result } = await execute(provider));
    } catch (error) {
      if (provider === "anthropic" && shouldFallbackToOpenAi(error)) {
        ({ provider, modelId, result } = await execute("openai"));
      } else {
        throw error;
      }
    }

    await logResultUsage(args.logUsage, {
      feature: args.feature,
      workflowType: args.workflowType,
      provider,
      model: modelId,
      latencyMs: Date.now() - startedAt,
      metadata: {
        taskClass: args.taskClass,
        structured: true,
        thinkingEnabled: Boolean(args.enableThinking),
        cacheEnabled: provider === "anthropic",
        ...(args.metadata ?? {}),
      },
    }, result.usage, true);

    return result;
  } catch (error) {
    const provider = preferredProvider;
    const modelId = getModelId(args.taskClass, provider);
    await logResultUsage(args.logUsage, {
      feature: args.feature,
      workflowType: args.workflowType,
      provider,
      model: modelId,
      latencyMs: Date.now() - startedAt,
      metadata: {
        taskClass: args.taskClass,
        structured: true,
        thinkingEnabled: Boolean(args.enableThinking),
        cacheEnabled: provider === "anthropic",
        ...(args.metadata ?? {}),
      },
    }, undefined, false, error instanceof Error ? error.name : "unknown_error");
    throw error;
  }
}

type StreamTaskArgs = {
  feature: string;
  workflowType?: string;
  taskClass: AiTaskClass;
  system?: string;
  messages: NonNullable<Parameters<typeof streamText>[0]["messages"]>;
  maxOutputTokens?: number;
  temperature?: number;
  enableThinking?: boolean;
  metadata?: Record<string, unknown>;
  logUsage?: UsageLogger;
  experimental_transform?: Parameters<typeof streamText>[0]["experimental_transform"];
  onFinish?: (event: { text: string; usage: UsageShape }) => void | Promise<void>;
};

export function runStreamTask(args: StreamTaskArgs): StreamTextResult<any, any> {
  const startedAt = Date.now();
  const provider = getPreferredProvider();
  const modelId = getModelId(args.taskClass, provider);

  const result = streamText({
    model: getModel(args.taskClass, provider),
    ...(args.system ? { system: args.system } : {}),
    messages: args.messages,
    maxOutputTokens: args.maxOutputTokens ?? 2048,
    temperature: args.temperature ?? 0.4,
    ...(getProviderOptions(provider, args.taskClass, args.enableThinking)
      ? { providerOptions: getProviderOptions(provider, args.taskClass, args.enableThinking) }
      : {}),
    ...(args.experimental_transform ? { experimental_transform: args.experimental_transform } : {}),
    onFinish: async ({ text, usage }) => {
      await logResultUsage(args.logUsage, {
        feature: args.feature,
        workflowType: args.workflowType,
        provider,
        model: modelId,
        latencyMs: Date.now() - startedAt,
        metadata: {
          taskClass: args.taskClass,
          streaming: true,
          ...(args.metadata ?? {}),
        },
      }, usage, true);
      if (args.onFinish) await args.onFinish({ text, usage: usage ?? {} });
    },
    onError: async ({ error }) => {
      // If Anthropic quota exhausted and OpenAI available, log the failure
      // Note: streaming fallback happens at the route level since the stream is already started
      await logResultUsage(args.logUsage, {
        feature: args.feature,
        workflowType: args.workflowType,
        provider,
        model: modelId,
        latencyMs: Date.now() - startedAt,
      }, undefined, false, error instanceof Error ? error.name : "stream_error");
    },
  });

  return result;
}

export function getRouteProvider() {
  return getPreferredProvider();
}

export function getRouteModel(taskClass: AiTaskClass) {
  const provider = getPreferredProvider();
  return getModel(taskClass, provider);
}

export function getRouteProviderOptions(taskClass: AiTaskClass, enableThinking = false) {
  return getProviderOptions(getPreferredProvider(), taskClass, enableThinking);
}

export function getEstimatedAnthropicUsd(model: string, usage?: UsageShape | null) {
  return estimateAnthropicUsd(model, usage);
}
