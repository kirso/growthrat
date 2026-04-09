import { anthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";

export type AiTaskClass = "reasoning" | "generation" | "fast";

export const AI_MODEL_IDS = {
  reasoning: process.env.ANTHROPIC_REASONING_MODEL ?? "claude-opus-4-20250514",
  generation: process.env.ANTHROPIC_GENERATION_MODEL ?? "claude-sonnet-4-20250514",
  fast: process.env.ANTHROPIC_FAST_MODEL ?? "claude-3-5-haiku-20241022",
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

function getModelId(taskClass: AiTaskClass) {
  return AI_MODEL_IDS[taskClass];
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

function estimateAnthropicUsd(model: string, usage?: UsageShape | null) {
  const pricing = PRICING_PER_MILLION[model];
  if (!pricing) return 0;
  const inputTokens = usage?.inputTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? 0;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
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
    estimatedUsd: estimateAnthropicUsd(base.model, usage),
    success,
    ...(errorCode ? { errorCode } : {}),
  });
}

export async function runTextTask(args: TextTaskArgs) {
  const modelId = getModelId(args.taskClass);
  const startedAt = Date.now();

  try {
    const result = await generateText({
      model: anthropic(modelId),
      ...(args.system ? { system: args.system } : {}),
      prompt: args.prompt,
      maxOutputTokens: args.maxOutputTokens ?? 2048,
      ...(args.enableThinking ? {} : { temperature: args.temperature ?? 0.3 }),
      providerOptions: getAnthropicOptions(args.taskClass, args.enableThinking),
    });

    await logResultUsage(args.logUsage, {
      feature: args.feature,
      workflowType: args.workflowType,
      provider: "anthropic",
      model: modelId,
      latencyMs: Date.now() - startedAt,
      metadata: {
        taskClass: args.taskClass,
        thinkingEnabled: Boolean(args.enableThinking),
        cacheEnabled: true,
        ...(args.metadata ?? {}),
      },
    }, result.usage, true);

    return result;
  } catch (error) {
    await logResultUsage(args.logUsage, {
      feature: args.feature,
      workflowType: args.workflowType,
      provider: "anthropic",
      model: modelId,
      latencyMs: Date.now() - startedAt,
      metadata: {
        taskClass: args.taskClass,
        thinkingEnabled: Boolean(args.enableThinking),
        cacheEnabled: true,
        ...(args.metadata ?? {}),
      },
    }, undefined, false, error instanceof Error ? error.name : "unknown_error");
    throw error;
  }
}

export async function runStructuredTask<TSchema>(args: StructuredTaskArgs<TSchema>) {
  const modelId = getModelId(args.taskClass);
  const startedAt = Date.now();

  try {
    const result = await generateObject({
      model: anthropic(modelId),
      schema: args.schema as any,
      ...(args.system ? { system: args.system } : {}),
      prompt: args.prompt,
      maxOutputTokens: args.maxOutputTokens ?? 1500,
      ...(args.enableThinking ? {} : { temperature: args.temperature ?? 0.2 }),
      providerOptions: getAnthropicOptions(args.taskClass, args.enableThinking),
    });

    await logResultUsage(args.logUsage, {
      feature: args.feature,
      workflowType: args.workflowType,
      provider: "anthropic",
      model: modelId,
      latencyMs: Date.now() - startedAt,
      metadata: {
        taskClass: args.taskClass,
        structured: true,
        thinkingEnabled: Boolean(args.enableThinking),
        cacheEnabled: true,
        ...(args.metadata ?? {}),
      },
    }, result.usage, true);

    return result;
  } catch (error) {
    await logResultUsage(args.logUsage, {
      feature: args.feature,
      workflowType: args.workflowType,
      provider: "anthropic",
      model: modelId,
      latencyMs: Date.now() - startedAt,
      metadata: {
        taskClass: args.taskClass,
        structured: true,
        thinkingEnabled: Boolean(args.enableThinking),
        cacheEnabled: true,
        ...(args.metadata ?? {}),
      },
    }, undefined, false, error instanceof Error ? error.name : "unknown_error");
    throw error;
  }
}

export function getRouteModel(taskClass: AiTaskClass) {
  return anthropic(getModelId(taskClass));
}

export function getRouteProviderOptions(taskClass: AiTaskClass, enableThinking = false) {
  return getAnthropicOptions(taskClass, enableThinking);
}

export function getEstimatedAnthropicUsd(model: string, usage?: UsageShape | null) {
  return estimateAnthropicUsd(model, usage);
}
