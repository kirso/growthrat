/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as agent from "../agent.js";
import type * as agentActions from "../agentActions.js";
import type * as agentConfig from "../agentConfig.js";
import type * as agentQueries from "../agentQueries.js";
import type * as approvalLog from "../approvalLog.js";
import type * as artifacts from "../artifacts.js";
import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as chat from "../chat.js";
import type * as chatHistory from "../chatHistory.js";
import type * as community from "../community.js";
import type * as crawler from "../crawler.js";
import type * as crons from "../crons.js";
import type * as experiments from "../experiments.js";
import type * as feedbackItems from "../feedbackItems.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as ingestInternal from "../ingestInternal.js";
import type * as knowledge from "../knowledge.js";
import type * as mutations from "../mutations.js";
import type * as onboarding from "../onboarding.js";
import type * as opportunities from "../opportunities.js";
import type * as rateLimits from "../rateLimits.js";
import type * as runtimeConnectors from "../runtimeConnectors.js";
import type * as seed from "../seed.js";
import type * as slackApproval from "../slackApproval.js";
import type * as slackApprovalQueries from "../slackApprovalQueries.js";
import type * as slackCommandMutations from "../slackCommandMutations.js";
import type * as slackCommandQueries from "../slackCommandQueries.js";
import type * as slackCommands from "../slackCommands.js";
import type * as sources from "../sources.js";
import type * as usageEvents from "../usageEvents.js";
import type * as weeklyReports from "../weeklyReports.js";
import type * as workflowRuns from "../workflowRuns.js";
import type * as workflows_experimentRunner from "../workflows/experimentRunner.js";
import type * as workflows_index from "../workflows/index.js";
import type * as workflows_taskExecution from "../workflows/taskExecution.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  agent: typeof agent;
  agentActions: typeof agentActions;
  agentConfig: typeof agentConfig;
  agentQueries: typeof agentQueries;
  approvalLog: typeof approvalLog;
  artifacts: typeof artifacts;
  auth: typeof auth;
  authz: typeof authz;
  chat: typeof chat;
  chatHistory: typeof chatHistory;
  community: typeof community;
  crawler: typeof crawler;
  crons: typeof crons;
  experiments: typeof experiments;
  feedbackItems: typeof feedbackItems;
  http: typeof http;
  ingest: typeof ingest;
  ingestInternal: typeof ingestInternal;
  knowledge: typeof knowledge;
  mutations: typeof mutations;
  onboarding: typeof onboarding;
  opportunities: typeof opportunities;
  rateLimits: typeof rateLimits;
  runtimeConnectors: typeof runtimeConnectors;
  seed: typeof seed;
  slackApproval: typeof slackApproval;
  slackApprovalQueries: typeof slackApprovalQueries;
  slackCommandMutations: typeof slackCommandMutations;
  slackCommandQueries: typeof slackCommandQueries;
  slackCommands: typeof slackCommands;
  sources: typeof sources;
  usageEvents: typeof usageEvents;
  weeklyReports: typeof weeklyReports;
  workflowRuns: typeof workflowRuns;
  "workflows/experimentRunner": typeof workflows_experimentRunner;
  "workflows/index": typeof workflows_index;
  "workflows/taskExecution": typeof workflows_taskExecution;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
